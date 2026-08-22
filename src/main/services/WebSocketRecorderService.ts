import { WebSocketServer, WebSocket } from 'ws';
import { BrowserWindow } from 'electron';

/**
 * WebSocket server for receiving recorded nodes from Chrome extension
 */
export class WebSocketRecorderService {
  private static instance: WebSocketRecorderService | null = null;
  private wss: WebSocketServer | null = null;
  private port = 8999;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  static getInstance(): WebSocketRecorderService {
    if (!WebSocketRecorderService.instance) {
      WebSocketRecorderService.instance = new WebSocketRecorderService();
    }
    return WebSocketRecorderService.instance;
  }

  start() {
    if (this.wss) {
      console.log('[WebSocketRecorderService] ⚠️  Server already running');
      return;
    }

    console.log('[WebSocketRecorderService] 🚀 Starting WebSocket server on port', this.port);

    try {
      this.wss = new WebSocketServer({ port: this.port });
      console.log('[WebSocketRecorderService] 📡 WebSocketServer instance created');

      this.wss.on('listening', () => {
        console.log(
          `[WebSocketRecorderService] ✅ Server started successfully on port ${this.port}`,
        );
        console.log(
          `[WebSocketRecorderService] 📍 Extension should connect to ws://127.0.0.1:${this.port}`,
        );
        console.log('[WebSocketRecorderService] 👂 Waiting for connections...');
      });

      this.wss.on('connection', (ws: WebSocket, req) => {
        const clientInfo = req.url || 'unknown';
        console.log(`[WebSocketRecorderService] ✅ Client connected: ${clientInfo}`);
        console.log(`[WebSocketRecorderService] 👥 Total clients: ${this.clients.size + 1}`);
        this.clients.add(ws);

        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('[WebSocketRecorderService] 📨 Received message:', message.type);
            console.log(
              '[WebSocketRecorderService] 📦 Message data:',
              JSON.stringify(message, null, 2),
            );

            if (message.type === 'RECORD_NODE') {
              console.log('[WebSocketRecorderService] 📝 Broadcasting node to renderer windows');
              // Broadcast to all renderer windows
              const windows = BrowserWindow.getAllWindows();
              console.log(
                `[WebSocketRecorderService] 🪟  Found ${windows.length} renderer windows`,
              );

              for (const win of windows) {
                if (!win.isDestroyed()) {
                  console.log(`[WebSocketRecorderService] 📤 Sending to window ${win.id}`);
                  win.webContents.send('workflow:node-recorded', message.data);
                }
              }
              console.log('[WebSocketRecorderService] ✅ Node broadcast complete');
            }
          } catch (error: any) {
            console.error('[WebSocketRecorderService] ❌ Error parsing message:', error);
            console.error('[WebSocketRecorderService] Raw data:', data.toString());
          }
        });

        ws.on('close', () => {
          console.log('[WebSocketRecorderService] ❌ Client disconnected');
          this.clients.delete(ws);
          console.log(`[WebSocketRecorderService] 👥 Remaining clients: ${this.clients.size}`);
        });

        ws.on('error', (error) => {
          console.error('[WebSocketRecorderService] ⚠️  WebSocket client error:', error);
        });
      });

      this.wss.on('error', (error: any) => {
        console.error('[WebSocketRecorderService] ❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error(`[WebSocketRecorderService] 🚫 Port ${this.port} is already in use!`);
          console.error(
            '[WebSocketRecorderService] 💡 Solution: Close other applications using this port or change the port number.',
          );
          console.error(
            '[WebSocketRecorderService] 💡 Check with: lsof -ti:8999 (Linux/Mac) or netstat -ano | findstr :8999 (Windows)',
          );
        }
        this.wss = null;
      });

      console.log(
        '[WebSocketRecorderService] ⏳ Server setup complete, waiting for listening event...',
      );
    } catch (error: any) {
      console.error('[WebSocketRecorderService] ❌ Failed to start server:', error);
      console.error('[WebSocketRecorderService] Error name:', error.name);
      console.error('[WebSocketRecorderService] Error message:', error.message);
      console.error('[WebSocketRecorderService] Error stack:', error.stack);
      this.wss = null;
    }
  }

  stop() {
    if (this.wss) {
      console.log('[WebSocketRecorderService] Stopping server');

      // Close all client connections
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.clients.clear();

      // Close server
      this.wss.close(() => {
        console.log('[WebSocketRecorderService] Server stopped');
      });

      this.wss = null;
    }
  }

  broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  isRunning(): boolean {
    return this.wss !== null;
  }
}
