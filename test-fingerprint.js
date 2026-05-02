const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Helper to find Donut Browser
const getDonutPath = () => {
  const homeDir = os.homedir();
  const basePath = path.join(homeDir, '.local/share/DonutBrowser/binaries/wayfern');
  if (!fs.existsSync(basePath)) return null;
  const versions = fs.readdirSync(basePath);
  versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
  if (versions.length === 0) return null;
  const executablePath = path.join(basePath, versions[0], 'chrome');
  return fs.existsSync(executablePath) ? executablePath : null;
};

async function test() {
  const executablePath = getDonutPath() || '/usr/bin/google-chrome'; // Fallback
  console.log(`Using executable: ${executablePath}`);

  const port = 9333;
  const userDataDir = path.join(os.tmpdir(), 'zentri-test-profile');

  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir);

  const args = [
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new', // Try to run headless if possible
    '--disable-gpu',
    '--no-sandbox',
  ];

  console.log('Launching browser...');
  const browserProcess = spawn(executablePath, args, { detached: true, stdio: 'inherit' });

  console.log('Connecting via CDP (retrying)...');
  let browser;
  for (let i = 0; i < 20; i++) {
    try {
      browser = await puppeteer.connect({
        browserURL: `http://127.0.0.1:${port}`,
      });
      console.log('Connected successfully!');
      break;
    } catch (e) {
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!browser) {
    console.error('\nFailed to connect to browser after 20 attempts.');
    return;
  }

  const fingerprintConfig = {
    platform: 'Linux x86_64',
    platformVersion: '6.5.0',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    canvasNoiseSeed: '123456',
    languages: '["en-US", "en"]', // Passing as a string to test CBOR error
    webglVendor: 'Google Inc. (NVIDIA)',
    webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  };

  console.log('Injecting fingerprint (lightweight mode)...');
  const targets = browser.targets();
  for (const target of targets) {
    if (target.type() === 'page') {
      try {
        const client = await target.createCDPSession();
        await client.send('Wayfern.setFingerprint', fingerprintConfig);
        console.log(`Injected into existing target: ${target.url()}`);
        await client.detach();
      } catch (e) {
        console.error(`Failed to inject into target: ${e.message}`);
      }
    }
  }

  // Listen for new targets
  browser.on('targetcreated', async (target) => {
    if (target.type() === 'page') {
      try {
        console.log(`New target created: ${target.url()}, injecting...`);
        const client = await target.createCDPSession();
        await client.send('Wayfern.setFingerprint', fingerprintConfig);
        console.log('Injected into new target successfully.');
        await client.detach();
      } catch (e) {
        console.error(`Failed to inject into new target: ${e.message}`);
      }
    }
  });

  console.log('Opening BrowserLeaks...');
  const page = await browser.newPage().catch((e) => {
    console.log(
      'browser.newPage() might have caused internal errors, but we check if target was created...',
    );
  });

  if (page) {
    await page
      .goto('https://browserleaks.com/javascript', { waitUntil: 'networkidle2' })
      .catch((e) => {
        console.log('Navigation might show errors due to restricted commands, check the window.');
      });
  }

  console.log('\n--- TEST RUNNING ---');
  console.log('Please check the opened browser window.');
  console.log('Navigate to https://browserleaks.com/javascript if not already there.');
  console.log('Look for "OS Version" or "Kernel Version".');
  console.log('\nPress Ctrl+C to terminate this script (but browser process might stay open).');
}

test().catch(console.error);
