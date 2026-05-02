import * as net from 'net';
import { Proxy } from '../../shared/types';

export interface BridgeInfo {
  port: number;
  server: net.Server;
}

export class ProxyBridgeService {
  private static activeBridges: Map<string, BridgeInfo> = new Map();

  /**
   * Starts a local SOCKS5 bridge for a specific proxy
   * Returns the local port the bridge is listening on
   */
  static async startBridge(proxy: Proxy): Promise<number> {
    const bridgeId = `${proxy.host}:${proxy.port}:${proxy.username}`;
    
    // If a bridge for this proxy already exists, reuse it
    if (this.activeBridges.has(bridgeId)) {
      return this.activeBridges.get(bridgeId)!.port;
    }

    return new Promise((resolve, reject) => {
      const server = net.createServer((clientSocket) => {
        let remoteSocket: net.Socket | null = null;
        let bridgeState: 'GREETING' | 'CONNECT' | 'TUNNELING' | 'REMOTE_HANDSHAKE' | 'REMOTE_AUTH' | 'FORWARDING_RESPONSE' | 'ACTIVE_TUNNEL' = 'GREETING';
        let connectRequestBuffer: Buffer | null = null;

        clientSocket.on('data', (data) => {
          if (bridgeState === 'GREETING') {
            if (data[0] === 0x05) {
              clientSocket.write(Buffer.from([0x05, 0x00]));
              bridgeState = 'CONNECT';
            }
            return;
          }

          if (bridgeState === 'CONNECT') {
            if (data[0] === 0x05 && data[1] === 0x01) {
              connectRequestBuffer = data;
              bridgeState = 'TUNNELING';
              
              remoteSocket = net.connect(proxy.port!, proxy.host!, () => {
                remoteSocket?.write(Buffer.from([0x05, 0x01, 0x02])); 
              });

              let remoteState: 'REMOTE_HANDSHAKE' | 'REMOTE_AUTH' | 'FORWARDING_RESPONSE' | 'ACTIVE_TUNNEL' = 'REMOTE_HANDSHAKE';
              
              remoteSocket.on('data', (remoteData) => {
                if (remoteState === 'REMOTE_HANDSHAKE') {
                  if (remoteData[1] === 0x02) {
                    const userBuf = Buffer.from(proxy.username || '');
                    const passBuf = Buffer.from(proxy.password || '');
                    const authBuf = Buffer.alloc(3 + userBuf.length + passBuf.length);
                    authBuf[0] = 0x01; authBuf[1] = userBuf.length;
                    userBuf.copy(authBuf, 2);
                    authBuf[2 + userBuf.length] = passBuf.length;
                    passBuf.copy(authBuf, 3 + userBuf.length);
                    remoteSocket?.write(authBuf);
                    remoteState = 'REMOTE_AUTH';
                  } else if (remoteData[1] === 0x00) {
                     // No auth required by remote
                     remoteSocket?.write(connectRequestBuffer!);
                     remoteState = 'FORWARDING_RESPONSE';
                  }
                } else if (remoteState === 'REMOTE_AUTH') {
                  if (remoteData[1] === 0x00) {
                    remoteSocket?.write(connectRequestBuffer!);
                    remoteState = 'FORWARDING_RESPONSE';
                  } else {
                    clientSocket.end();
                  }
                } else if (remoteState === 'FORWARDING_RESPONSE') {
                  clientSocket.write(remoteData);
                  remoteState = 'ACTIVE_TUNNEL';
                  clientSocket.pipe(remoteSocket!);
                  remoteSocket?.pipe(clientSocket);
                }
              });

              remoteSocket.on('error', () => clientSocket.end());
            }
            return;
          }
        });

        clientSocket.on('error', () => remoteSocket?.end());
      });

      // Find a random free port
      server.listen(0, '127.0.0.1', () => {
        const port = (server.address() as net.AddressInfo).port;
        this.activeBridges.set(bridgeId, { port, server });
        console.log(`[ProxyBridge] Started bridge for ${proxy.host} on port ${port}`);
        resolve(port);
      });

      server.on('error', (err) => {
        console.error('[ProxyBridge] Server error:', err);
        reject(err);
      });
    });
  }

  /**
   * Stops all bridges (call on app exit)
   */
  static stopAll() {
    for (const bridge of this.activeBridges.values()) {
      bridge.server.close();
    }
    this.activeBridges.clear();
  }
}
