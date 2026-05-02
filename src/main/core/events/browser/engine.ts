import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import { execSync } from 'child_process';
import { dbManager } from '../../database';
import { getDonutCoreVersion } from './utils';

export function setupEngineHandlers() {
  ipcMain.handle('browser:get-version', async () => {
    return getDonutCoreVersion();
  });

  ipcMain.handle('browser:check-update', async () => {
    return new Promise((resolve) => {
      const https = require('https');
      const currentVersion = getDonutCoreVersion();

      console.log(`[UpdateCheck] Current Version: ${currentVersion}`);

      https
        .get('https://donutbrowser.com/wayfern.json', (res: any) => {
          let data = '';
          if (res.statusCode !== 200) {
            console.error(`[UpdateCheck] Failed with status ${res.statusCode}`);
            resolve({ hasUpdate: false, error: `HTTP ${res.statusCode}` });
            return;
          }

          res.on('data', (chunk: any) => (data += chunk));
          res.on('end', () => {
            try {
              const versionInfo = JSON.parse(data);
              const latestVersion = versionInfo.version;

              // Simple version comparison (Wayfern uses 0.x.y)
              const hasUpdate = latestVersion !== currentVersion && currentVersion !== '0.0.0';

              let platformKey = '';
              if (process.platform === 'linux') {
                platformKey = process.arch === 'arm64' ? 'linux-arm64' : 'linux-x64';
              } else if (process.platform === 'win32') {
                platformKey = process.arch === 'arm64' ? 'windows-arm64' : 'windows-x64';
              }

              const downloadUrl = versionInfo.downloads[platformKey] || null;

              console.log(
                `[UpdateCheck] Latest: ${latestVersion}, HasUpdate: ${hasUpdate}, Platform: ${platformKey}`,
              );

              resolve({
                hasUpdate,
                latestVersion,
                currentVersion,
                downloadUrl,
              });
            } catch (e: any) {
              console.error('[UpdateCheck] Parse Error:', e);
              resolve({ hasUpdate: false, error: e.message });
            }
          });
        })
        .on('error', (err: any) => {
          console.error('[UpdateCheck] Network Error:', err);
          resolve({ hasUpdate: false, error: err.message });
        });
    });
  });

  ipcMain.handle('browser:get-fingerprints', async () => {
    try {
      const fingerprints = await dbManager.all(
        'SELECT id, name, description FROM fingerprints ORDER BY updated_at DESC',
      );
      return fingerprints;
    } catch (error) {
      console.error('[DB] Failed to fetch fingerprints:', error);
      return [];
    }
  });

  ipcMain.handle(
    'browser:download-update',
    async (event, { url, version }: { url: string; version: string }) => {
      const webContents = event.sender;

      const homeDir = os.homedir();
      const basePath = path.join(homeDir, '.local/share/DonutBrowser/binaries/wayfern');
      const destDir = path.join(basePath, version);
      const tempPath = path.join(os.tmpdir(), `wayfern_${version}.tar.xz`);

      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
      }

      if (fs.existsSync(destDir)) {
        console.log(`[UpdateDownload] Version ${version} already exists.`);
        return { success: true, path: destDir };
      }

      return new Promise((resolve) => {
        console.log(`[UpdateDownload] Downloading from ${url}...`);
        const file = fs.createWriteStream(tempPath);

        https
          .get(url, (res: any) => {
            const totalSize = parseInt(res.headers['content-length'], 10);
            let downloadedSize = 0;

            res.on('data', (chunk: any) => {
              downloadedSize += chunk.length;
              const progress = (downloadedSize / totalSize) * 100;
              if (!webContents.isDestroyed()) {
                webContents.send('browser:update-progress', { progress, stage: 'downloading' });
              }
            });

            res.pipe(file);

            file.on('finish', () => {
              file.close();
              console.log('[UpdateDownload] Download complete. Extracting...');

              try {
                if (!webContents.isDestroyed()) {
                  webContents.send('browser:update-progress', {
                    progress: 100,
                    stage: 'extracting',
                  });
                }

                if (!fs.existsSync(destDir)) {
                  fs.mkdirSync(destDir, { recursive: true });
                }

                // Linux extraction
                if (process.platform === 'linux') {
                  execSync(`tar -xJf ${tempPath} -C ${destDir} --strip-components=1`);
                } else if (process.platform === 'win32') {
                  // Assuming zip for windows
                  execSync(
                    `powershell -Command "Expand-Archive -Path '${tempPath}' -DestinationPath '${destDir}' -Force"`,
                  );
                }

                fs.unlinkSync(tempPath);
                console.log(`[UpdateDownload] Extraction complete for version ${version}`);
                resolve({ success: true, version });
              } catch (extractError: any) {
                console.error('[UpdateDownload] Extraction failed:', extractError);
                resolve({ success: false, error: extractError.message });
              }
            });
          })
          .on('error', (err: any) => {
            console.error('[UpdateDownload] Download failed:', err);
            fs.unlinkSync(tempPath);
            resolve({ success: false, error: err.message });
          });
      });
    },
  );
}
