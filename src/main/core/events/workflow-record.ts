import { ipcMain } from 'electron';
import type { WorkflowNode } from '../../../renderer/src/features/workflow/types';
import { ChromeRecorderLauncher } from '../../services/ChromeRecorderLauncher';

/**
 * IPC Handlers for workflow recording functionality
 * Receives recorded nodes from browser extension and sends to renderer
 */

export function setupWorkflowRecordHandlers() {
  // Handle recorded node from extension
  ipcMain.handle('workflow:record-node', async (event, nodeData: Partial<WorkflowNode>) => {
    try {
      console.log('[WorkflowRecord] Received node from extension:', nodeData);

      // Broadcast to all renderer windows
      const windows = require('electron').BrowserWindow.getAllWindows();
      for (const win of windows) {
        if (!win.isDestroyed()) {
          win.webContents.send('workflow:node-recorded', nodeData);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('[WorkflowRecord] Error handling recorded node:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle start recording request from renderer
  ipcMain.handle('workflow:start-recording', async (event, workflowId: string, url?: string) => {
    try {
      console.log('[WorkflowRecord] Starting recording for workflow:', workflowId, 'URL:', url);

      // Launch Chrome with workflow recorder extension
      const launcher = ChromeRecorderLauncher.getInstance();
      const result = await launcher.launchRecorderBrowser(workflowId, url || 'https://google.com');

      if (!result.success) {
        throw new Error(result.error || 'Failed to launch Chrome');
      }

      return { success: true, workflowId, url, port: result.port };
    } catch (error: any) {
      console.error('[WorkflowRecord] Error starting recording:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle stop recording request from renderer
  ipcMain.handle('workflow:stop-recording', async (event, workflowId: string) => {
    try {
      console.log('[WorkflowRecord] Stopping recording for workflow:', workflowId);

      // Signal to extension to stop recording via WebSocket
      const { WebSocketRecorderService } = require('../../services/WebSocketRecorderService');
      const wsService = WebSocketRecorderService.getInstance();

      if (wsService.isRunning()) {
        wsService.broadcast({ type: 'STOP_RECORDING', workflowId });
      }

      // Close the Chrome browser instance
      const launcher = ChromeRecorderLauncher.getInstance();
      await launcher.closeBrowser(workflowId);

      // Also broadcast to all renderer windows
      const windows = require('electron').BrowserWindow.getAllWindows();
      for (const win of windows) {
        if (!win.isDestroyed()) {
          win.webContents.send('workflow:recording-stopped', workflowId);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('[WorkflowRecord] Error stopping recording:', error);
      return { success: false, error: error.message };
    }
  });
}
