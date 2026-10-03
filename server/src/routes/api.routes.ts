import { Router, Request, Response } from 'express';
import { VpnManagerService } from '../services/vpn-manager.service';
import { logger } from '../logger';

export const createApiRoutes = (vpnManager: VpnManagerService): Router => {
  const router = Router();

  // GET /api/status - Kiểm tra trạng thái VPN hiện tại
  router.get('/status', (req: Request, res: Response) => {
    const status = vpnManager.getStatus();
    res.json(status);
  });

  // POST /api/connect - Kết nối tới VPN
  router.post('/connect', async (req: Request, res: Response) => {
    try {
      const { serverId } = req.body;
      logger.info(`Request to connect to VPN. Preferred server: ${serverId || 'auto'}`);
      
      const status = await vpnManager.connect(serverId);
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error(`Connect failed: ${error}`);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // POST /api/disconnect - Ngắt kết nối VPN
  router.post('/disconnect', async (req: Request, res: Response) => {
    try {
      await vpnManager.disconnect();
      res.json({ success: true, message: 'Disconnected successfully' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // GET /api/servers - Lấy danh sách server khả dụng (Mock)
  router.get('/servers', (req: Request, res: Response) => {
    // Trong thực tế gọi service fetch servers
    res.json([
      { id: 'sg-01', country: 'Singapore', city: 'SG', hostname: 'sg1.provider.com', load: 20 },
      { id: 'us-01', country: 'USA', city: 'NYC', hostname: 'ny1.provider.com', load: 45 },
      { id: 'vn-01', country: 'Vietnam', city: 'HCMC', hostname: 'hcm1.provider.com', load: 10 }
    ]);
  });

  return router;
};