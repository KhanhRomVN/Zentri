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
      return;
    }

    try {
      this.wss = new WebSocketServer({ port: this.port });
      this.wss.on('listening', () => {});

      this.wss.on('connection', (ws: WebSocket) => {
        this.clients.add(ws);

        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'RECORD_NODE') {
              // Broadcast to all renderer windows
              const windows = BrowserWindow.getAllWindows();

              for (const win of windows) {
                if (!win.isDestroyed()) {
                  win.webContents.send('workflow:node-recorded', message.data);
                }
              }
            }
          } catch (error: any) {
            console.error('[WebSocketRecorderService] ❌ Error parsing message:', error);
            console.error('[WebSocketRecorderService] Raw data:', data.toString());
          }
        });

        ws.on('close', () => {
          this.clients.delete(ws);
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
      // Close all client connections
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.clients.clear();

      // Close server
      this.wss.close(() => {});

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
