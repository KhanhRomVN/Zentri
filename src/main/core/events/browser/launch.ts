import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as sqlite3 from 'sqlite3';
import { ProxyBridgeService } from '../../../services/ProxyBridgeService';
import { CloakBrowserLauncher } from '../../../services/CloakBrowserLauncher';
import { Proxy } from '../../../../renderer/src/types/db';
import * as puppeteer from 'puppeteer-core';
import { dbManager } from '../../database';
import { getExecutablePath, getChromeStablePath } from './utils';
import { buildFingerprintScript } from './fingerprint-injector';
import { onPageNavigated } from './site-history';

const activeBrowsers = new Map<string, { port: number; process: ReturnType<typeof spawn> }>();

/**
 * Set profile name in Chrome/Chromium Preferences file
 * This ensures the profile displays the correct name instead of default "Work"
 */
function setProfileName(userDataDir: string, profileName: string): void {
  try {
    const defaultProfileDir = path.join(userDataDir, 'Default');
    if (!fs.existsSync(defaultProfileDir)) {
      fs.mkdirSync(defaultProfileDir, { recursive: true });
    }

    const preferencesPath = path.join(defaultProfileDir, 'Preferences');
    let preferences: any = {};

    // Read existing preferences if file exists
    if (fs.existsSync(preferencesPath)) {
      try {
        const content = fs.readFileSync(preferencesPath, 'utf-8');
        preferences = JSON.parse(content);
      } catch (e) {
        console.warn('[BrowserLaunch] Failed to parse existing Preferences, creating new one');
      }
    }

    // Set profile name
    if (!preferences.profile) {
      preferences.profile = {};
    }
    preferences.profile.name = profileName;

    // Write back to file
    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2), 'utf-8');
  } catch (error) {
    console.error('[BrowserLaunch] Failed to set profile name:', error);
  }
}

/**
 * Compute the deterministic unpacked-extension ID Chrome assigns to a
 * directory: sha256 of the absolute path, first 16 bytes mapped hex→a..p.
 * This matches Chrome's own algorithm when the manifest has no `key` field.
 */
function computeUnpackedExtensionId(absPath: string): string {
  const hash = crypto.createHash('sha256').update(absPath).digest('hex').slice(0, 32);
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += String.fromCharCode(97 + parseInt(hash[i], 16));
  }
  return id;
}

/**
 * Minimal Preferences entry Chrome needs to load an unpacked extension on
 * next start. Field shape mirrors what Chrome itself writes after a manual
 * "Load unpacked" (verified against a real profile using fingerprint-chromium).
 */
function buildUnpackedExtensionEntry(absPath: string) {
  const manifestPath = path.join(absPath, 'manifest.json');
  let permissions: string[] = [];
  let hostPermissions: string[] = [];
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      permissions = Array.isArray(m.permissions) ? m.permissions : [];
      hostPermissions = Array.isArray(m.host_permissions) ? m.host_permissions : [];
    } catch (e) {
      /* fall through with empty permissions */
    }
  }
  return {
    account_extension_type: 0,
    active_permissions: {
      api: permissions,
      explicit_host: hostPermissions,
      manifest_permissions: [],
      scriptable_host: hostPermissions,
    },
    content_settings: [],
    creation_flags: 38,
    disable_reasons: [],
    from_webstore: false,
    granted_permissions: {
      api: permissions,
      explicit_host: hostPermissions,
      manifest_permissions: [],
      scriptable_host: hostPermissions,
    },
    incognito_content_settings: [],
    incognito_preferences: {},
    location: 4,
    newAllowFileAccess: true,
    path: absPath,
    preferences: {},
    regular_only_preferences: {},
    state: 1,
    was_installed_by_default: false,
    was_installed_by_oem: false,
    withholding_permissions: false,
  };
}

/**
 * Ensure the Chrome profile at `userDataDir` has developer mode enabled and
 * the given unpacked extensions registered in `Default/Preferences`, so they
 * are loaded on next browser start. Writes directly to Preferences — safe on
 * the fingerprint-chromium build used here (no Secure Preferences MAC).
 */
function ensureDeveloperModeAndExtensions(
  userDataDir: string,
  sourceExtensionPaths: string[],
): void {
  try {
    const defaultProfileDir = path.join(userDataDir, 'Default');
    if (!fs.existsSync(defaultProfileDir)) {
      fs.mkdirSync(defaultProfileDir, { recursive: true });
    }
    const preferencesPath = path.join(defaultProfileDir, 'Preferences');
    let prefs: any = {};
    if (fs.existsSync(preferencesPath)) {
      try {
        prefs = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
      } catch (e) {
        console.warn('[BrowserLaunch] Failed to parse Preferences, recreating');
      }
    }

    if (!prefs.extensions) prefs.extensions = {};
    if (!prefs.extensions.ui) prefs.extensions.ui = {};
    prefs.extensions.ui.developer_mode = true;

    if (!prefs.extensions.settings) prefs.extensions.settings = {};
    if (!Array.isArray(prefs.extensions.pinned_extensions)) {
      prefs.extensions.pinned_extensions = [];
    }

    // Extensions are copied into the profile so each profile keeps its own
    // data.json — required by the password extension for multi-browser safety
    // (a shared extension folder would leak one profile's data into another).
    const extensionsRoot = path.join(userDataDir, 'zentri-extensions');
    if (!fs.existsSync(extensionsRoot)) {
      fs.mkdirSync(extensionsRoot, { recursive: true });
    }

    const processedIds: string[] = [];
    for (const srcPath of sourceExtensionPaths) {
      if (!fs.existsSync(srcPath)) continue;
      if (!fs.existsSync(path.join(srcPath, 'manifest.json'))) continue;

      const absSrc = path.resolve(srcPath);
      const extName = path.basename(absSrc);
      const destPath = path.join(extensionsRoot, extName);

      // Drop any stale entry that pointed at the source path so Chrome does
      // not end up loading both the source and the copied version side by side.
      const staleId = computeUnpackedExtensionId(absSrc);
      if (prefs.extensions.settings[staleId]) {
        delete prefs.extensions.settings[staleId];
      }
      prefs.extensions.pinned_extensions = prefs.extensions.pinned_extensions.filter(
        (id: string) => id !== staleId,
      );

      // Refresh the copy every launch so the profile uses the latest code.
      // Skip data.json — each profile keeps its own copy (written separately).
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      fs.mkdirSync(destPath, { recursive: true });
      fs.cpSync(absSrc, destPath, {
        recursive: true,
        filter: (s) => path.basename(s) !== 'data.json',
      });

      const id = computeUnpackedExtensionId(destPath);
      const existing = prefs.extensions.settings[id];
      const entry = existing ?? buildUnpackedExtensionEntry(destPath);
      // Always enforce the fields that tie the entry to the on-disk folder.
      entry.location = 4;
      entry.path = destPath;
      entry.from_webstore = false;
      if (entry.state === undefined) entry.state = 1;
      prefs.extensions.settings[id] = entry;
      processedIds.push(id);
    }

    // Pin every registered extension to the toolbar so it is visible on
    // launch without manual user action.
    for (const id of processedIds) {
      if (!prefs.extensions.pinned_extensions.includes(id)) {
        prefs.extensions.pinned_extensions.push(id);
      }
    }

    fs.writeFileSync(preferencesPath, JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BrowserLaunch] Failed to ensure dev mode/extensions:', err);
  }
}

/**
 * GUID cố định của DuckDuckGo trong Chromium (prepopulate_id 92).
 * Dùng để kiểm tra và set DDG làm search engine mặc định cho profile.
 */
const DUCKDUCKGO_GUID = '485bf7d3-0215-45af-87dc-538868000092';

/**
 * Template data chuẩn của DuckDuckGo — mirror snapshot Chromium ghi sau khi
 * người dùng chọn DDG làm default. Dùng để ghi đè khi phát hiện profile đang
 * dùng engine khác.
 */
function buildDuckDuckGoTemplateData() {
  return {
    alternate_urls: [],
    contextual_search_url: '',
    created_from_play_api: false,
    date_created: '0',
    doodle_url: '',
    enforced_by_policy: false,
    favicon_url: 'https://duckduckgo.com/favicon.ico',
    featured_by_policy: false,
    id: '6',
    image_search_branding_label: '',
    image_translate_source_language_param_key: '',
    image_translate_target_language_param_key: '',
    image_translate_url: '',
    image_url: '',
    image_url_post_params: '',
    input_encodings: ['UTF-8'],
    is_active: 0,
    keyword: 'duckduckgo.com',
    last_modified: '0',
    last_visited: '0',
    logo_url: 'https://staticcdn.duckduckgo.com/android/DuckDuckGoLogo.png',
    new_tab_url: 'https://duckduckgo.com/chrome_newtab',
    originating_url: '',
    policy_origin: 0,
    preconnect_to_search_url: false,
    prefetch_likely_navigations: false,
    prepopulate_id: 92,
    safe_for_autoreplace: true,
    search_intent_params: [],
    search_url_post_params: '',
    short_name: 'DuckDuckGo',
    starter_pack_id: 0,
    suggestions_url: 'https://duckduckgo.com/ac/?q={searchTerms}&type=list',
    suggestions_url_post_params: '',
    synced_guid: DUCKDUCKGO_GUID,
    url: 'https://duckduckgo.com/?q={searchTerms}',
    usage_count: 0,
  };
}

/**
 * Đảm bảo profile tại `userDataDir` dùng DuckDuckGo làm search engine mặc
 * định. Đọc `Default/Preferences`; nếu `default_search_provider.guid` khác
 * GUID DDG thì ghi đè lại guid + template_url_data + mirrored_template_url_data.
 * Chạy trước khi spawn Chromium (giống setProfileName) để tránh bị Chrome
 * ghi đè ngược lại khi khởi động.
 */
function ensureDuckDuckGoDefaultSearch(userDataDir: string): void {
  try {
    const defaultProfileDir = path.join(userDataDir, 'Default');
    if (!fs.existsSync(defaultProfileDir)) {
      fs.mkdirSync(defaultProfileDir, { recursive: true });
    }
    const preferencesPath = path.join(defaultProfileDir, 'Preferences');
    let prefs: any = {};
    if (fs.existsSync(preferencesPath)) {
      try {
        prefs = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
      } catch (e) {
        console.warn('[BrowserLaunch] Failed to parse Preferences for DDG check, recreating');
      }
    }

    if (prefs.default_search_provider?.guid === DUCKDUCKGO_GUID) {
      return; // Đã đúng, không cần ghi lại file.
    }

    prefs.default_search_provider = {
      ...(prefs.default_search_provider || {}),
      guid: DUCKDUCKGO_GUID,
      reset_occurred: false,
    };
    prefs.default_search_provider_data = {
      ...(prefs.default_search_provider_data || {}),
      template_url_data: buildDuckDuckGoTemplateData(),
      mirrored_template_url_data: buildDuckDuckGoTemplateData(),
    };

    fs.writeFileSync(preferencesPath, JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BrowserLaunch] Failed to ensure DDG default search:', err);
  }
}

/**
 * Export credentials from `<profileDir>/passwords.db` (SQLite) into
 * `<extensionDir>/data.json`, so the password extension can read them via
 * `chrome.runtime.getURL('data.json')` when the user opens the popup.
 * Runs on every launch; the file is overwritten to reflect the current state.
 */
async function writeExtensionPasswordData(profileDir: string, extensionDir: string): Promise<void> {
  try {
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }
    const dataPath = path.join(extensionDir, 'data.json');
    const dbPath = path.join(profileDir, 'passwords.db');

    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dataPath, '[]', 'utf-8');
      return;
    }

    const rows: any[] = await new Promise((resolve) => {
      const db = new sqlite3.Database(dbPath);
      db.all(
        'SELECT id, url, username, password FROM passwords ORDER BY created_at ASC',
        (err, r) => {
          db.close();
          resolve(err ? [] : r || []);
        },
      );
    });

    fs.writeFileSync(dataPath, JSON.stringify(rows, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BrowserLaunch] Failed to write extension password data:', err);
  }
}

export function setupLaunchHandlers() {
  ipcMain.handle(
    'email:open-login',
    async (
      _event,
      {
        provider,
        accountId,
        url,
        profilePath,
        email,
        browserPath,
        fingerprintId,
        fingerprintConfig,
        proxyId,
        launchMode,
        browserPatchType,
      }: {
        provider: string;
        accountId: string;
        url?: string;
        profilePath?: string;
        email?: string;
        browserPath?: string;
        fingerprintId?: string;
        fingerprintConfig?: object;
        proxyId?: string;
        launchMode?: 'normal' | 'secure';
        browserPatchType?: 'ungoogled-chromium' | 'cloakbrowser' | 'official-chrome';
      },
    ) => {
      try {
        // If CloakBrowser is selected, use CloakBrowserLauncher
        if (browserPatchType === 'cloakbrowser') {
          console.log(`[BrowserLaunch] ═══════════════════════════════════════════════════════`);
          console.log(`[BrowserLaunch] 🎯 CloakBrowser Launch Request`);
          console.log(`[BrowserLaunch] ═══════════════════════════════════════════════════════`);
          console.log(`[BrowserLaunch] Account ID: ${accountId}`);
          console.log(`[BrowserLaunch] Provider: ${provider}`);
          console.log(`[BrowserLaunch] Email: ${email || 'N/A'}`);
          console.log(`[BrowserLaunch] Launch Mode: ${launchMode || 'N/A'}`);

          const launcher = CloakBrowserLauncher.getInstance();

          // Get proxy configuration
          let proxyUrl: string | undefined;
          if (proxyId) {
            console.log(`[BrowserLaunch] 🔍 Loading proxy with ID: ${proxyId}`);
            const px = await dbManager.get<Proxy>(
              'SELECT protocol, host, port, username, password FROM proxies WHERE id = ?',
              [proxyId],
            );
            if (px) {
              if (px.username && px.password) {
                proxyUrl = `${px.protocol}://${px.username}:${px.password}@${px.host}:${px.port}`;
                console.log(
                  `[BrowserLaunch] ✅ Proxy loaded: ${px.protocol}://${px.username}:***@${px.host}:${px.port}`,
                );
              } else {
                proxyUrl = `${px.protocol}://${px.host}:${px.port}`;
                console.log(`[BrowserLaunch] ✅ Proxy loaded (no auth): ${proxyUrl}`);
              }
            } else {
              console.log(`[BrowserLaunch] ❌ Proxy not found in database`);
            }
          } else {
            console.log(`[BrowserLaunch] ℹ️  No proxy ID provided`);
          }

          // Log fingerprint info
          if (fingerprintConfig) {
            console.log(`[BrowserLaunch] ✅ Fingerprint config provided (direct object)`);
            console.log(`[BrowserLaunch] Fingerprint keys:`, Object.keys(fingerprintConfig));
          } else if (fingerprintId) {
            console.log(`[BrowserLaunch] ✅ Fingerprint ID provided: ${fingerprintId}`);
            console.log(
              `[BrowserLaunch] ⚠️  Note: Fingerprint loading from DB not implemented for CloakBrowser`,
            );
          } else {
            console.log(`[BrowserLaunch] ℹ️  No fingerprint provided`);
          }

          console.log(`[BrowserLaunch] 📦 Calling CloakBrowserLauncher.launchBrowser()...`);
          const result = await launcher.launchBrowser(accountId, {
            url: url || 'https://google.com',
            proxy: proxyUrl,
            fingerprint: fingerprintConfig,
            headless: false,
            humanize: true,
          });

          if (!result.success) {
            console.error(`[BrowserLaunch] ❌ CloakBrowser launch failed:`, result.error);
            throw new Error(result.error || 'Failed to launch CloakBrowser');
          }

          console.log(`[BrowserLaunch] ✅ CloakBrowser launched successfully`);
          console.log(`[BrowserLaunch] ═══════════════════════════════════════════════════════`);

          if (!_event.sender.isDestroyed() && accountId)
            _event.sender.send('email:browser-opened', { accountId });

          return { success: true };
        }

        // Official Chrome: launch with only the profile folder — fingerprint
        // and proxy are disabled at the logic level regardless of what the
        // renderer sent.
        const isOfficialChrome = browserPatchType === 'official-chrome';
        if (isOfficialChrome) {
          fingerprintId = undefined;
          fingerprintConfig = undefined;
          proxyId = undefined;
        }

        // Original ungoogled-chromium / official Chrome launch logic
        const userDataPath = app.getPath('userData');
        let executablePath = '';

        if (isOfficialChrome) {
          executablePath = getChromeStablePath();
          if (!executablePath) {
            throw new Error('Google Chrome (chính thức) not found on this machine.');
          }
        } else if (launchMode === 'normal') {
          executablePath = getChromeStablePath();
          if (!executablePath) {
            executablePath = getExecutablePath(browserPath);
          }
        } else {
          executablePath = getExecutablePath(browserPath);
        }

        if (!executablePath) {
          throw new Error('Browser (Chromium/Chrome) not found.');
        }

        let browserProfileDir = '';
        if (profilePath) {
          browserProfileDir = profilePath;
        } else {
          try {
            if (dbManager.dbPath && email) {
              browserProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
            } else {
              browserProfileDir = path.join(
                userDataPath,
                'browser_profiles',
                email || accountId || provider,
              );
            }
          } catch (e) {
            browserProfileDir = path.join(
              userDataPath,
              'browser_profiles',
              email || accountId || provider,
            );
          }
        }

        if (!fs.existsSync(browserProfileDir)) {
          fs.mkdirSync(browserProfileDir, { recursive: true });
        }

        // Set profile name in Chrome Preferences to display correct name instead of "Work"
        const profileName = email || accountId || provider;
        setProfileName(browserProfileDir, profileName);
        // Ensure developer mode + unpacked extensions are registered before launch.
        ensureDeveloperModeAndExtensions(browserProfileDir, [
          path.join(process.cwd(), 'extensions', 'workflow-recorder'),
          path.join(process.cwd(), 'extensions', 'password'),
        ]);
        // Force DuckDuckGo as the default search engine (guard against manual changes).
        ensureDuckDuckGoDefaultSearch(browserProfileDir);
        // Export the profile's credentials into the copied extension folder
        // (per-profile data.json) so multi-browser sessions stay isolated.
        await writeExtensionPasswordData(
          browserProfileDir,
          path.join(browserProfileDir, 'zentri-extensions', 'password'),
        );

        let proxyServer = '';
        let proxyAuth: { username?: string; password?: string } | null = null;
        let proxyBridgePort: number | null = null;

        if (proxyId) {
          const px = await dbManager.get<Proxy>(
            'SELECT protocol, host, port, username, password FROM proxies WHERE id = ?',
            [proxyId],
          );
          if (px) {
            if (px.protocol?.toUpperCase() === 'SOCKS5' || px.protocol?.toUpperCase() === 'SOCKS') {
              try {
                proxyBridgePort = await ProxyBridgeService.startBridge(px);
                proxyServer = 'socks5://127.0.0.1:' + proxyBridgePort;
              } catch (err) {
                console.error('[BrowserLaunch] Failed to start proxy bridge:', err);
                proxyServer = 'socks5://' + px.host + ':' + px.port;
              }
            } else {
              proxyServer = px.protocol + '://' + px.host + ':' + px.port;
              if (px.username && px.password) {
                proxyAuth = { username: px.username, password: px.password };
              }
            }
          }
        }

        const args = [
          '--user-data-dir=' + browserProfileDir,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          '--ozone-platform=x11',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--disable-notifications',
          '--disable-quic',
          '--disable-features=DialMediaRouteProvider,DnsOverHttps,AsyncDns',
          '--dns-prefetch-disable',
          '--enable-features=NetworkServiceInProcess',
          '--proxy-bypass-list=<-loopback>',
          '--password-store=basic',
          '--use-mock-keychain',
        ];

        const extensionPath = path.join(process.cwd(), 'zentri-extension', 'dist');
        if (fs.existsSync(extensionPath)) {
          args.push('--load-extension=' + extensionPath);
          args.push('--disable-extensions-except=' + extensionPath);
        }

        if (proxyServer) {
          args.push('--proxy-server=' + proxyServer);
        }

        const cdpPort = 9222 + Math.floor(Math.random() * 1000);
        args.push('--remote-debugging-port=' + cdpPort);
        args.push('--remote-debugging-address=127.0.0.1');

        if (url) {
          args.push(url);
        } else {
          args.push('chrome://newtab');
        }

        const chromeProcess = spawn(executablePath, args, { detached: true });

        if (accountId) {
          activeBrowsers.set(accountId, { port: cdpPort, process: chromeProcess });
        }

        if (cdpPort) {
          (async () => {
            try {
              for (let i = 0; i < 60; i++) {
                try {
                  const browser = await puppeteer.connect({
                    browserURL: 'http://127.0.0.1:' + cdpPort,
                  });
                  let fpConfig: any = null;

                  if (fingerprintConfig) {
                    fpConfig = { ...(fingerprintConfig as any) };
                  } else if (fingerprintId) {
                    const fp = await dbManager.get<{ config_json: string }>(
                      'SELECT config_json FROM fingerprints WHERE id = ?',
                      [fingerprintId],
                    );
                    if (fp?.config_json) {
                      fpConfig = JSON.parse(fp.config_json);
                    }
                  }

                  if (fpConfig) {
                    let languages = fpConfig.languages;
                    if (typeof languages === 'string') {
                      try {
                        languages = JSON.parse(languages);
                      } catch (e) {
                        languages = [languages];
                      }
                    }
                    fpConfig = {
                      ...fpConfig,
                      userAgent: fpConfig.userAgent || fpConfig.ua,
                      platformVersion: fpConfig.osVersion || fpConfig.os_version,
                      os_version: fpConfig.os_version || fpConfig.osVersion,
                      canvasNoiseSeed: fpConfig.canvasNoiseSeed?.toString(),
                      languages: Array.isArray(languages) ? languages : [],
                    };
                  }

                  // Store CDP sessions per target for reuse on navigation
                  const sessionMap = new Map<any, any>();

                  const evaluateScript = async (client: any, label: string) => {
                    if (!fpConfig || launchMode === 'normal') return;
                    const script = buildFingerprintScript(fpConfig);
                    try {
                      await client.send('Runtime.enable');
                      await client.send('Runtime.evaluate', { expression: script });
                    } catch (e: any) {}
                  };

                  const setupPageTarget = async (target: any, isNew: boolean) => {
                    const targetUrl = target.url();
                    const label = targetUrl || 'empty';

                    try {
                      let client = sessionMap.get(target);
                      if (!client) {
                        client = await target.createCDPSession();
                        sessionMap.set(target, client);
                      }

                      // Setup proxy auth
                      if (proxyAuth && isNew) {
                        await client.send('Fetch.enable', { handleAuthRequests: true });
                        client.on('Fetch.authRequired', async (event: any) => {
                          try {
                            await client.send('Fetch.continueWithAuth', {
                              requestId: event.requestId,
                              authChallengeResponse: {
                                response: 'ProvideCredentials',
                                username: proxyAuth!.username!,
                                password: proxyAuth!.password!,
                              },
                            });
                          } catch (err) {
                            console.error('[CDP] Proxy Auth Error:', err);
                          }
                        });
                      }

                      // Inject script for future navigations (only once per target)
                      if (isNew && fpConfig && launchMode !== 'normal') {
                        const script = buildFingerprintScript(fpConfig);
                        await client.send('Page.addScriptToEvaluateOnNewDocument', {
                          source: script,
                        });
                      }

                      // Run script immediately for current page
                      await evaluateScript(client, label);
                    } catch (err) {
                      console.error('[CDP] Setup error for', label, ':', err);
                    }
                  };

                  // Fire on every new target
                  browser.on('targetcreated', async (target: any) => {
                    if (target.type() === 'page') {
                      await setupPageTarget(target, true);
                    }
                  });

                  // Fire on URL change within same target (navigation)
                  browser.on('targetchanged', async (target: any) => {
                    if (target.type() === 'page') {
                      await setupPageTarget(target, false);
                      // Track fingerprint + IP history for this domain
                      var cdpClient = sessionMap.get(target);
                      var tUrl = target.url();
                      if (cdpClient) {
                        onPageNavigated(
                          browserProfileDir,
                          cdpClient,
                          fpConfig,
                          tUrl,
                          !!proxyServer,
                        ).catch(function (e) {
                          console.error('[SiteHistory] Error:', e.message);
                        });
                      }
                    }
                  });

                  // Setup existing targets
                  for (const t of browser.targets()) {
                    if (t.type() === 'page') {
                      await setupPageTarget(t, true);
                    }
                  }

                  break;
                } catch (e) {
                  await new Promise((r) => setTimeout(r, 500));
                }
              }
            } catch (err) {
              console.error('[BrowserLaunch] CDP Connection loop failed:', err);
            }
          })();
        }

        if (!_event.sender.isDestroyed() && accountId)
          _event.sender.send('email:browser-opened', { accountId });

        chromeProcess.on('exit', async () => {
          if (accountId) {
            activeBrowsers.delete(accountId);
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          let cookieCount = 0;
          try {
            const possibleCookiePaths = [
              path.join(browserProfileDir, 'Default', 'Cookies'),
              path.join(browserProfileDir, 'Default', 'Network', 'Cookies'),
              path.join(browserProfileDir, 'Cookies'),
            ];
            const foundPath = possibleCookiePaths.find((p) => fs.existsSync(p));
            if (foundPath) {
              const tempCookieFile = path.join(userDataPath, 'temp_cookies_' + Date.now() + '.db');
              fs.copyFileSync(foundPath, tempCookieFile);
              const db = new sqlite3.Database(tempCookieFile);
              cookieCount = await new Promise<number>((resolve) => {
                db.get('SELECT COUNT(*) as count FROM cookies', (err, row: any) => {
                  db.close();
                  resolve(err ? 0 : row?.count || 0);
                });
              });
              fs.unlinkSync(tempCookieFile);
            }
          } catch (e) {}

          if (!_event.sender.isDestroyed()) {
            _event.sender.send('email:browser-closed', {
              accountId,
              stats: { cookies: cookieCount, localStorage: -1, sessionStorage: -1 },
            });
          }
        });

        return { success: true };
      } catch (error) {
        console.error('Error opening browser:', error);
        throw error;
      }
    },
  );

  /**
   * Best-effort session renewal: opens the account's profile headlessly,
   * navigates to the given domain using the same fingerprint config that
   * was recorded for it, waits for the page's own JS to refresh its
   * cookies, then closes. Does NOT reuse the original proxy (proxy
   * credentials are not stored in site history — only geo info is).
   */
  ipcMain.handle(
    'email:renew-session',
    async (
      _event,
      {
        email,
        domain,
        fingerprintConfig,
      }: { email: string; domain: string; fingerprintConfig?: object },
    ) => {
      let renewProcess: ReturnType<typeof spawn> | null = null;
      try {
        if (!email || !domain) {
          return { success: false, error: 'INVALID_INPUT' };
        }

        const userDataPath = app.getPath('userData');
        let browserProfileDir = '';
        try {
          if (dbManager.dbPath) {
            browserProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
          } else {
            browserProfileDir = path.join(userDataPath, 'browser_profiles', email);
          }
        } catch (e) {
          browserProfileDir = path.join(userDataPath, 'browser_profiles', email);
        }

        if (!fs.existsSync(browserProfileDir)) {
          return { success: false, error: 'PROFILE_NOT_FOUND' };
        }

        const executablePath = getExecutablePath();
        if (!executablePath) {
          throw new Error('Browser (Chromium/Chrome) not found.');
        }

        const cdpPort = 9222 + Math.floor(Math.random() * 1000);
        const args = [
          '--user-data-dir=' + browserProfileDir,
          '--headless=new',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--remote-debugging-port=' + cdpPort,
          '--remote-debugging-address=127.0.0.1',
          'https://' + domain,
        ];

        renewProcess = spawn(executablePath, args, { detached: true });

        let browser: any = null;
        for (let i = 0; i < 40; i++) {
          try {
            browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + cdpPort });
            break;
          } catch (e) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (!browser) {
          renewProcess.kill('SIGTERM');
          return { success: false, error: 'FAILED_TO_CONNECT' };
        }

        try {
          const pages = await browser.pages();
          const page = pages[0];

          if (fingerprintConfig && page) {
            const script = buildFingerprintScript(fingerprintConfig as any);
            const client = await page.target().createCDPSession();
            await client.send('Page.addScriptToEvaluateOnNewDocument', { source: script });
          }

          await page
            .goto('https://' + domain, { waitUntil: 'networkidle2', timeout: 20000 })
            .catch(() => {});

          // Give the site's own JS a window to refresh its session cookies.
          await new Promise((r) => setTimeout(r, 5000));
        } finally {
          try {
            browser.disconnect();
          } catch (e) {}
        }

        return { success: true };
      } catch (error: any) {
        console.error('[RenewSession] Error:', error);
        return { success: false, error: error.message };
      } finally {
        if (renewProcess) {
          try {
            renewProcess.kill('SIGTERM');
          } catch (e) {}
        }
      }
    },
  );

  ipcMain.handle(
    'email:open-inbox-debug',
    async (_event, { email, browserPath }: { email: string; browserPath?: string }) => {
      try {
        const userDataPath = app.getPath('userData');
        const executablePath = getExecutablePath(browserPath);
        let realProfileDir = '';
        if (dbManager.dbPath && email) {
          realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
        } else {
          realProfileDir = path.join(userDataPath, 'browser_profiles', email);
        }

        // Set profile name before launching
        setProfileName(realProfileDir, email);
        // Ensure developer mode + unpacked extensions are registered before launch.
        ensureDeveloperModeAndExtensions(realProfileDir, [
          path.join(process.cwd(), 'extensions', 'workflow-recorder'),
          path.join(process.cwd(), 'extensions', 'password'),
        ]);
        // Force DuckDuckGo as the default search engine (guard against manual changes).
        ensureDuckDuckGoDefaultSearch(realProfileDir);
        // Export the profile's credentials into the copied extension folder
        // (per-profile data.json) so multi-browser sessions stay isolated.
        await writeExtensionPasswordData(
          realProfileDir,
          path.join(realProfileDir, 'zentri-extensions', 'password'),
        );

        spawn(
          executablePath,
          [
            '--user-data-dir=' + realProfileDir,
            '--no-first-run',
            'https://mail.google.com/mail/u/0/h/',
          ],
          { detached: true },
        );
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle('email:is-profile-open', async (_event, accountId: string) => {
    const entry = activeBrowsers.get(accountId);
    if (!entry) return false;

    try {
      const res = await fetch('http://127.0.0.1:' + entry.port + '/json/version', {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return true;
    } catch {
      activeBrowsers.delete(accountId);
      return false;
    }

    activeBrowsers.delete(accountId);
    return false;
  });

  ipcMain.handle('email:close-profile', async (_event, accountId: string) => {
    const entry = activeBrowsers.get(accountId);
    if (!entry) return { success: false, error: 'No active browser found for this account' };

    try {
      entry.process.kill('SIGTERM');
      activeBrowsers.delete(accountId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
