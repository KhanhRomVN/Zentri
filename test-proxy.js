const net = require('net');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const REMOTE_PROXY_HOST = '116.96.50.219';
const REMOTE_PROXY_PORT = 31372;
const PROXY_USER = 'muaproxy69f1b1cdf3181';
const PROXY_PASS = 'trHiLVmcBCkz9f9D';

const LOCAL_BRIDGE_PORT = 9999;

const getDonutPath = () => {
  const homeDir = os.homedir();
  const basePath = path.join(homeDir, '.local/share/DonutBrowser/binaries/wayfern');
  if (!fs.existsSync(basePath)) return null;
  const versions = fs.readdirSync(basePath);
  versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
  if (versions.length === 0) return null;
  return path.join(basePath, versions[0], 'chrome');
};

const server = net.createServer((clientSocket) => {
  console.log('[BRIDGE] New connection');
  
  let remoteSocket = null;
  let bridgeState = 'GREETING';
  let connectRequestBuffer = null;

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
        console.log('[BRIDGE] Received CONNECT request from browser');
        connectRequestBuffer = data; // Lưu lại lệnh kết nối của trình duyệt
        bridgeState = 'TUNNELING';
        
        remoteSocket = net.connect(REMOTE_PROXY_PORT, REMOTE_PROXY_HOST, () => {
          console.log('[BRIDGE] Connected to remote proxy');
          remoteSocket.write(Buffer.from([0x05, 0x01, 0x02])); 
        });

        let remoteState = 'REMOTE_HANDSHAKE';
        remoteSocket.on('data', (remoteData) => {
          if (remoteState === 'REMOTE_HANDSHAKE') {
            if (remoteData[1] === 0x02) {
              console.log('[BRIDGE] Sending credentials...');
              const userBuf = Buffer.from(PROXY_USER);
              const passBuf = Buffer.from(PROXY_PASS);
              const authBuf = Buffer.alloc(3 + userBuf.length + passBuf.length);
              authBuf[0] = 0x01; authBuf[1] = userBuf.length;
              userBuf.copy(authBuf, 2);
              authBuf[2 + userBuf.length] = passBuf.length;
              passBuf.copy(authBuf, 3 + userBuf.length);
              remoteSocket.write(authBuf);
              remoteState = 'REMOTE_AUTH';
            }
          } else if (remoteState === 'REMOTE_AUTH') {
            if (remoteData[1] === 0x00) {
              console.log('[BRIDGE] Remote Auth SUCCESS! Forwarding CONNECT request...');
              remoteSocket.write(connectRequestBuffer); // Gửi lệnh kết nối của trình duyệt tới Proxy thật
              remoteState = 'FORWARDING_RESPONSE';
            } else {
              console.error('[BRIDGE] Remote Auth FAILED');
              clientSocket.end();
            }
          } else if (remoteState === 'FORWARDING_RESPONSE') {
            // Forward phản hồi CONNECT thành công/thất bại từ Proxy thật về trình duyệt
            clientSocket.write(remoteData);
            remoteState = 'ACTIVE_TUNNEL';
            console.log('[BRIDGE] Tunnel established!');
            clientSocket.pipe(remoteSocket);
            remoteSocket.pipe(clientSocket);
          }
        });

        remoteSocket.on('error', (err) => {
          console.error('[BRIDGE] Remote error:', err.message);
          clientSocket.end();
        });
      }
      return;
    }
  });

  clientSocket.on('error', () => {});
});

server.listen(LOCAL_BRIDGE_PORT, '127.0.0.1', () => {
  console.log(`[BRIDGE] Listening at 127.0.0.1:${LOCAL_BRIDGE_PORT}`);
  launchBrowser();
});

function launchBrowser() {
  const executablePath = getDonutPath() || '/usr/bin/google-chrome';
  const userDataDir = path.join(os.tmpdir(), `zentri-bridge-test-${Date.now()}`);
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir);

  const args = [
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-sandbox',
    `--proxy-server=socks5://127.0.0.1:${LOCAL_BRIDGE_PORT}`,
    '--proxy-bypass-list=<-loopback>',
    '--disable-quic',
    '--disable-features=DialMediaRouteProvider,DnsOverHttps,AsyncDns',
    '--enable-logging',
    '--v=1',
    'https://api.ipify.org?format=json'
  ];

  console.log('[LOG] Launching Wayfern...');
  spawn(executablePath, args, { detached: true, stdio: 'inherit' });
}
