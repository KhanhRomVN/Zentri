import { EventEmitter } from 'events';
import { exec } from 'child_process';
import util from 'util';
import { config } from '../config';
import { logger } from '../logger';
import { VpnServer, VpnConnectionStatus, VpnType } from '../types/vpn';

const execAsync = util.promisify(exec);

export class VpnManagerService extends EventEmitter {
  private status: VpnConnectionStatus = { isConnected: false };
  private isConnecting = false;

  constructor() {
    super();
    this.loadInitialServers();
  }

  private async loadInitialServers(): Promise<void> {
    // Trong thực tế, bạn sẽ tải danh sách server từ API của provider hoặc file JSON
    // Ở đây mock một vài server để demo
    logger.info('Loading initial VPN servers...');
  }

  public getStatus(): VpnConnectionStatus {
    return { ...this.status };
  }

  public async connect(serverId?: string): Promise<VpnConnectionStatus> {
    if (this.isConnecting) {
      throw new Error('Already connecting to a VPN server');
    }

    if (this.status.isConnected) {
      await this.disconnect();
    }

    this.isConnecting = true;
    try {
      // Bước 1: Chọn server
      const selectedServer = await this.selectServer(serverId);
      
      // Bước 2: Thiết lập tunnel (OpenVPN/WireGuard)
      await this.setupTunnel(selectedServer);
      
      // Bước 3: Cấu hình Routing & Firewall (Kill Switch)
      await this.configureNetworkLockdown(selectedServer);
      
      this.status = {
        isConnected: true,
        currentServer: selectedServer,
        uptime: Date.now(),
        publicIp: await this.getPublicIp()
      };
      
      this.emit('connected', this.status);
      logger.info(`Connected to VPN server: ${selectedServer.hostname}`);
      return this.getStatus();
    } catch (error) {
      this.status = { isConnected: false, error: String(error) };
      this.emit('disconnected', this.status);
      logger.error(`Failed to connect to VPN: ${error}`);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    logger.info('Disconnecting from VPN...');
    
    // Dọn dẹp routing/firewall rules
    await this.teardownNetworkLockdown();
    
    // Kill process openvpn/wireguard
    await this.killVpnProcess();
    
    this.status = { isConnected: false };
    this.emit('disconnected', this.status);
    logger.info('Disconnected successfully.');
  }

  private async selectServer(preferredId?: string): Promise<VpnServer> {
    // Logic chọn server dựa trên filters trong config
    // Mock trả về 1 server giả định
    return {
      id: preferredId || 'srv-001',
      country: 'Singapore',
      city: 'SG-01',
      hostname: 'sg.vpnprovider.com',
      ip: '1.2.3.4',
      port: parseInt(config.OPENVPN_PORT),
      protocol: config.OPENVPN_PROTOCOL as 'tcp' | 'udp',
      provider: config.VPN_SERVICE_PROVIDER,
      load: 20,
      ping: 50
    };
  }

  private async setupTunnel(server: VpnServer): Promise<void> {
    logger.info(`Setting up ${config.VPN_TYPE} tunnel to ${server.ip}:${server.port}`);
    
    if (config.VPN_TYPE === VpnType.OPENVPN) {
      // Sinh file .ovpn tạm thời
      const ovpnContent = this.generateOvpnConfig(server);
      // Chạy lệnh openvpn background
      // Ví dụ: exec(`openvpn --config /tmp/current.ovpn &`)
      // Cần xử lý stream log để biết khi nào "Initialization Sequence Completed"
    } else if (config.VPN_TYPE === VpnType.WIREGUARD) {
      // Cấu hình wg-quick hoặc ip link add type wireguard
    }
    
    // Mô phỏng delay kết nối
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private generateOvpnConfig(server: VpnServer): string {
    // Template sinh ra nội dung .ovpn tương tự gluetun/internal/provider/utils/openvpn.go
    return `client
dev tun
proto ${server.protocol}
remote ${server.hostname} ${server.port}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA512
verb 3
`;
  }

  private async configureNetworkLockdown(server: VpnServer): Promise<void> {
    if (!config.FIREWALL_ENABLED) {
      logger.warn('Firewall/Kill-switch is disabled in config! Traffic may leak.');
      return;
    }

    logger.info('Applying firewall rules (Kill Switch)...');
    
    // 1. Flush existing rules
    await execAsync('iptables -F').catch(() => {});
    
    // 2. Set default policies to DROP
    await execAsync('iptables -P INPUT DROP');
    await execAsync('iptables -P FORWARD DROP');
    await execAsync('iptables -P OUTPUT DROP');
    
    // 3. Allow loopback
    await execAsync('iptables -A INPUT -i lo -j ACCEPT');
    await execAsync('iptables -A OUTPUT -o lo -j ACCEPT');
    
    // 4. Allow established connections
    await execAsync('iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT');
    await execAsync('iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT');
    
    // 5. Allow traffic TO the VPN server IP (so we can maintain the tunnel)
    await execAsync(`iptables -A OUTPUT -d ${server.ip} -p ${server.protocol} --dport ${server.port} -j ACCEPT`);
    await execAsync(`iptables -A INPUT -s ${server.ip} -p ${server.protocol} --sport ${server.port} -j ACCEPT`);
    
    // 6. Allow traffic OUT via the VPN interface (tun0/wg0)
    await execAsync(`iptables -A OUTPUT -o ${config.VPN_INTERFACE} -j ACCEPT`);
    await execAsync(`iptables -A INPUT -i ${config.VPN_INTERFACE} -j ACCEPT`);
    
    // 7. Allow incoming connections to our Proxy Ports (HTTP/SOCKS5) on LAN interface
    // Giả sử eth0 là interface LAN
    if (config.HTTP_PROXY_ENABLED) {
      await execAsync(`iptables -A INPUT -i eth0 -p tcp --dport ${config.HTTP_PROXY_PORT} -j ACCEPT`);
    }
    if (config.SOCKS5_PROXY_ENABLED) {
      await execAsync(`iptables -A INPUT -i eth0 -p tcp --dport ${config.SOCKS5_PROXY_PORT} -j ACCEPT`);
      await execAsync(`iptables -A INPUT -i eth0 -p udp --dport ${config.SOCKS5_PROXY_PORT} -j ACCEPT`);
    }

    logger.info('Firewall rules applied.');
  }

  private async teardownNetworkLockdown(): Promise<void> {
    logger.info('Removing firewall rules...');
    // Reset iptables về mặc định (ACCEPT)
    await execAsync('iptables -P INPUT ACCEPT').catch(() => {});
    await execAsync('iptables -P FORWARD ACCEPT').catch(() => {});
    await execAsync('iptables -P OUTPUT ACCEPT').catch(() => {});
    await execAsync('iptables -F').catch(() => {});
  }

  private async killVpnProcess(): Promise<void> {
    try {
      await execAsync('killall openvpn || true');
      await execAsync('ip link delete ${config.VPN_INTERFACE} || true');
    } catch (e) {
      // Ignore errors if process doesn't exist
    }
  }

  private async getPublicIp(): Promise<string> {
    try {
      const { stdout } = await execAsync('curl -s https://api.ipify.org || echo "unknown"');
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }
}