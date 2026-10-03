import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { logger } from './logger';
import { VpnManagerService } from './services/vpn-manager.service';
import { createApiRoutes } from './routes/api.routes';

const app = express();
const vpnManager = new VpnManagerService();

// Middleware cơ bản
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api', createApiRoutes(vpnManager));

// Health check endpoint đơn giản
app.get('/health', (req, res) => {
  const status = vpnManager.getStatus();
  res.status(status.isConnected ? 200 : 503).json({
    service: 'vpn-proxy-server',
    vpn_connected: status.isConnected,
    timestamp: new Date().toISOString()
  });
});

// Error handler trung tâm
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.stack || err}`);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = parseInt(config.PORT);

app.listen(PORT, () => {
  logger.info(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  logger.info(`   Provider: ${config.VPN_SERVICE_PROVIDER}, Type: ${config.VPN_TYPE}`);
  
  // Tự động kết nối nếu có cấu hình sẵn (tùy chọn)
  if (process.env.AUTO_CONNECT === 'true') {
    vpnManager.connect().catch(err => logger.error(`Auto-connect failed: ${err}`));
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  await vpnManager.disconnect();
  process.exit(0);
});