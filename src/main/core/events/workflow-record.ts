import { ipcMain, BrowserWindow } from 'electron';
import type { WorkflowNode } from '../../../renderer/src/features/workflow/types';
import { PlaywrightWorkflowExecutor } from '../../services/PlaywrightWorkflowExecutor';
import { ChromeRecorderLauncher } from '../../services/ChromeRecorderLauncher';
import { dbManager } from '../database';
import { randomUUID } from 'crypto';

/**
 * IPC Handlers for workflow recording functionality
 * Receives recorded nodes from browser extension and sends to renderer
 */

// Helper to broadcast log to all renderer windows
function broadcastLog(
  workflowId: string,
  runId: string,
  level: string,
  message: string,
  nodeId?: string,
  instanceId?: string,
  metadata?: any,
) {
  const logEntry = {
    id: randomUUID(),
    runId,
    workflowId,
    timestamp: new Date().toISOString(),
    level,
    message,
    nodeId,
    instanceId,
    metadata,
  };

  // Broadcast to all renderer windows
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('workflow:log', logEntry);
    }
  }

  // Save to database
  dbManager
    .run(
      `INSERT INTO workflow_logs (id, run_id, workflow_id, timestamp, level, message, node_id, instance_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logEntry.id,
        runId,
        workflowId,
        logEntry.timestamp,
        level,
        message,
        nodeId || null,
        instanceId || null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    )
    .catch((err) => console.error('[WorkflowRecord] Failed to save log:', err));

  return logEntry;
}

export function setupWorkflowRecordHandlers() {
  // Handle recorded node from extension
  ipcMain.handle('workflow:record-node', async (event, nodeData: Partial<WorkflowNode>) => {
    try {
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

      return { success: true, workflowId, url };
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
      const windows = BrowserWindow.getAllWindows();
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

  // Handle run workflow request from renderer
  ipcMain.handle(
    'workflow:run',
    async (
      event,
      workflowId: string,
      config: {
        method: 'profile' | 'guest';
        emailIds?: string[];
        count?: number;
        nodes: any[];
        startUrl?: string;
      },
    ) => {
      const runId = randomUUID();
      const startTime = Date.now();

      try {
        // Save workflow run to database
        const snapshot = {
          nodes: config.nodes,
          startUrl: config.startUrl,
          method: config.method,
          timestamp: new Date().toISOString(),
        };

        await dbManager.run(
          `INSERT INTO workflow_runs (id, workflow_id, timestamp, status, method, instance_count, snapshot)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            runId,
            workflowId,
            new Date().toISOString(),
            'running',
            config.method,
            config.method === 'guest' ? config.count || 1 : config.emailIds?.length || 0,
            JSON.stringify(snapshot),
          ],
        );

        broadcastLog(
          workflowId,
          runId,
          'info',
          `Starting workflow execution (${config.method} mode)`,
        );

        const executor = PlaywrightWorkflowExecutor.getInstance();
        const results: any[] = [];

        // Filter out start nodes, keep only action nodes
        const actionNodes = config.nodes.filter((node) => node.type !== 'start');
        broadcastLog(
          workflowId,
          runId,
          'info',
          `Filtered to ${actionNodes.length} action node(s) to execute`,
        );

        if (config.method === 'guest') {
          // Launch multiple guest browser instances
          const count = config.count || 1;
          broadcastLog(workflowId, runId, 'info', `Launching ${count} guest browser instance(s)`);

          // Execute workflows in parallel
          const promises = [];
          for (let i = 0; i < count; i++) {
            const instanceId = `${workflowId}_guest_${i}`;
            broadcastLog(
              workflowId,
              runId,
              'info',
              `Starting execution for instance ${i + 1}/${count}`,
              undefined,
              instanceId,
            );

            const promise = executor
              .executeWorkflow(
                instanceId,
                actionNodes,
                {
                  startUrl: config.startUrl || 'https://google.com',
                  headless: false,
                },
                // Pass log callback
                (level, message, nodeId, metadata) => {
                  broadcastLog(workflowId, runId, level, message, nodeId, instanceId, metadata);
                },
              )
              .then((result) => {
                if (result.success) {
                  broadcastLog(
                    workflowId,
                    runId,
                    'success',
                    `Instance ${i + 1}/${count} completed successfully`,
                    undefined,
                    instanceId,
                  );
                } else {
                  broadcastLog(
                    workflowId,
                    runId,
                    'error',
                    `Instance ${i + 1}/${count} failed: ${result.error}`,
                    undefined,
                    instanceId,
                  );
                }
                return { instanceId, ...result };
              });

            promises.push(promise);
          }

          // Wait for all to complete
          const executionResults = await Promise.all(promises);
          results.push(...executionResults);

          broadcastLog(workflowId, runId, 'info', 'All guest instances completed');
        } else if (config.method === 'profile' && config.emailIds) {
          // Launch browser for each email profile
          const count = config.emailIds.length;
          broadcastLog(
            workflowId,
            runId,
            'info',
            `Launching ${count} browser instance(s) for profiles`,
          );

          // Execute workflows in parallel
          const promises = [];
          for (let i = 0; i < config.emailIds.length; i++) {
            const emailId = config.emailIds[i];
            const instanceId = `${workflowId}_profile_${emailId}`;
            broadcastLog(
              workflowId,
              runId,
              'info',
              `Starting execution for profile ${i + 1}/${count}`,
              undefined,
              instanceId,
            );

            const promise = executor
              .executeWorkflow(
                instanceId,
                actionNodes,
                {
                  startUrl: config.startUrl || 'https://google.com',
                  headless: false,
                },
                // Pass log callback
                (level, message, nodeId, metadata) => {
                  broadcastLog(workflowId, runId, level, message, nodeId, instanceId, metadata);
                },
              )
              .then((result) => {
                if (result.success) {
                  broadcastLog(
                    workflowId,
                    runId,
                    'success',
                    `Profile ${i + 1}/${count} completed successfully`,
                    undefined,
                    instanceId,
                  );
                } else {
                  broadcastLog(
                    workflowId,
                    runId,
                    'error',
                    `Profile ${i + 1}/${count} failed: ${result.error}`,
                    undefined,
                    instanceId,
                  );
                }
                return { instanceId, emailId, ...result };
              });

            promises.push(promise);
          }

          // Wait for all to complete
          const executionResults = await Promise.all(promises);
          results.push(...executionResults);

          broadcastLog(workflowId, runId, 'info', 'All profile instances completed');
        }

        // Calculate duration
        const duration = Date.now() - startTime;
        const allSuccess = results.every((r) => r.success);

        // Update workflow run
        await dbManager.run(
          `UPDATE workflow_runs SET status = ?, duration = ?, results = ? WHERE id = ?`,
          [allSuccess ? 'completed' : 'failed', duration, JSON.stringify(results), runId],
        );

        broadcastLog(
          workflowId,
          runId,
          allSuccess ? 'success' : 'error',
          `Workflow execution ${allSuccess ? 'completed' : 'failed'} in ${(duration / 1000).toFixed(2)}s`,
        );
        return { success: true, runId, instances: results, duration };
      } catch (error: any) {
        console.error('[WorkflowRecord] Error running workflow:', error);
        const duration = Date.now() - startTime;

        // Update workflow run with error
        await dbManager.run(
          `UPDATE workflow_runs SET status = ?, duration = ?, error = ? WHERE id = ?`,
          ['failed', duration, error.message, runId],
        );

        broadcastLog(workflowId, runId, 'error', `Workflow execution failed: ${error.message}`);

        return { success: false, error: error.message, runId };
      }
    },
  );

  // Get workflow run history
  ipcMain.handle('workflow:get-runs', async (event, workflowId: string, limit = 50) => {
    try {
      const runs = await dbManager.all(
        `SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY timestamp DESC LIMIT ?`,
        [workflowId, limit],
      );

      return { success: true, runs };
    } catch (error: any) {
      console.error('[WorkflowRecord] Error getting runs:', error);
      return { success: false, error: error.message };
    }
  });

  // Get workflow logs
  ipcMain.handle('workflow:get-logs', async (event, runId: string, limit = 500) => {
    try {
      const logs = await dbManager.all(
        `SELECT * FROM workflow_logs WHERE run_id = ? ORDER BY timestamp ASC LIMIT ?`,
        [runId, limit],
      );

      return { success: true, logs };
    } catch (error: any) {
      console.error('[WorkflowRecord] Error getting logs:', error);
      return { success: false, error: error.message };
    }
  });

  // Get live logs for a workflow (for LogPanel)
  ipcMain.handle('workflow:get-live-logs', async (event, workflowId: string, limit = 100) => {
    try {
      const logs = await dbManager.all(
        `SELECT * FROM workflow_logs WHERE workflow_id = ? ORDER BY timestamp DESC LIMIT ?`,
        [workflowId, limit],
      );

      return { success: true, logs: logs.reverse() };
    } catch (error: any) {
      console.error('[WorkflowRecord] Error getting live logs:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle run workflow on recorder browser (NEW: Execute workflow on the active recorder browser)
  ipcMain.handle('workflow:run-on-recorder', async (event, workflowId: string, nodes: any[]) => {
    const runId = randomUUID();
    const startTime = Date.now();

    try {
      const launcher = ChromeRecorderLauncher.getInstance();

      // Check if recorder browser is active
      if (!launcher.isBrowserActive(workflowId)) {
        throw new Error('No active recorder browser found. Please launch browser recorder first.');
      }

      broadcastLog(workflowId, runId, 'info', 'Starting workflow execution on recorder browser');

      // Filter out start nodes
      const actionNodes = nodes.filter((node: any) => node.type !== 'start');
      broadcastLog(
        workflowId,
        runId,
        'info',
        `Filtered to ${actionNodes.length} action node(s) to execute`,
      );

      // Execute workflow on the recorder browser
      const result = await launcher.executeWorkflow(
        workflowId,
        actionNodes,
        (level, message, nodeId, metadata) => {
          broadcastLog(workflowId, runId, level, message, nodeId, workflowId, metadata);
        },
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        broadcastLog(
          workflowId,
          runId,
          'success',
          `Workflow execution completed successfully in ${(duration / 1000).toFixed(2)}s`,
        );
        return { success: true, runId, results: result.results, duration };
      } else {
        broadcastLog(workflowId, runId, 'error', `Workflow execution failed: ${result.error}`);
        return { success: false, error: result.error, runId, duration };
      }
    } catch (error: any) {
      console.error('[WorkflowRecord] Error running workflow on recorder:', error);
      const duration = Date.now() - startTime;

      broadcastLog(workflowId, runId, 'error', `Workflow execution failed: ${error.message}`);

      return { success: false, error: error.message, runId, duration };
    }
  });
}
