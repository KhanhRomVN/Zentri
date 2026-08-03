/**
 * Build a JavaScript injection script that overrides browser fingerprint APIs.
 * Used as fallback when Wayfern.setFingerprint is unavailable (free users).
 */

export function buildFingerprintScript(config: Record<string, any>): string {
  const parts: string[] = [];

  // ── Navigator overrides ──────────────────────────────────────────────
  const navOverrides: Record<string, unknown> = {
    userAgent: config.userAgent ?? null,
    appVersion: config.appVersion ?? null,
    platform: config.platform ?? null,
    oscpu: config.oscpu ?? null,
    buildID: config.buildID ?? null,
    hardwareConcurrency: config.hardwareConcurrency ?? null,
    deviceMemory: config.deviceMemory ?? null,
    maxTouchPoints: config.maxTouchPoints ?? null,
    language: config.language ?? null,
    vendor: config.vendor ?? null,
    vendorSub: config.vendorSub ?? null,
    productSub: config.productSub ?? null,
    doNotTrack: config.doNotTrack ?? null,
    cookieEnabled: config.cookieEnabled ?? null,
    pdfViewerEnabled: config.pdfViewerEnabled ?? null,
    webdriver: config.webdriver === true ? true : false,
  };

  for (const [key, value] of Object.entries(navOverrides)) {
    if (value === null || value === undefined) continue;
    const jsValue = typeof value === 'string' ? JSON.stringify(value) : String(value);
    parts.push(`
    Object.defineProperty(navigator, '${key}', {
      get: () => ${jsValue},
      configurable: true,
    });`);
  }

  // languages (array)
  if (config.languages && Array.isArray(config.languages)) {
    const langsJson = JSON.stringify(config.languages);
    parts.push(`
    Object.defineProperty(navigator, 'languages', {
      get: () => Object.freeze(${langsJson}),
      configurable: true,
    });`);
  }

  // ── Screen overrides ─────────────────────────────────────────────────
  if (config.screenWidth != null) {
    parts.push(`
    Object.defineProperty(screen, 'width', { get: () => ${config.screenWidth}, configurable: true });
    Object.defineProperty(screen, 'availWidth', { get: () => ${config.screenAvailWidth ?? config.screenWidth}, configurable: true });`);
  }
  if (config.screenHeight != null) {
    parts.push(`
    Object.defineProperty(screen, 'height', { get: () => ${config.screenHeight}, configurable: true });
    Object.defineProperty(screen, 'availHeight', { get: () => ${config.screenAvailHeight ?? config.screenHeight}, configurable: true });`);
  }
  if (config.screenColorDepth != null) {
    parts.push(`
    Object.defineProperty(screen, 'colorDepth', { get: () => ${config.screenColorDepth}, configurable: true });
    Object.defineProperty(screen, 'pixelDepth', { get: () => ${config.screenPixelDepth ?? config.screenColorDepth}, configurable: true });`);
  }
  if (config.devicePixelRatio != null) {
    parts.push(`
    Object.defineProperty(window, 'devicePixelRatio', { get: () => ${config.devicePixelRatio}, configurable: true });`);
  }

  // Window outer/inner dimensions
  if (config.windowOuterWidth != null) {
    parts.push(`Object.defineProperty(window, 'outerWidth', { get: () => ${config.windowOuterWidth}, configurable: true });`);
  }
  if (config.windowOuterHeight != null) {
    parts.push(`Object.defineProperty(window, 'outerHeight', { get: () => ${config.windowOuterHeight}, configurable: true });`);
  }
  if (config.windowInnerWidth != null) {
    parts.push(`Object.defineProperty(window, 'innerWidth', { get: () => ${config.windowInnerWidth}, configurable: true });`);
  }
  if (config.windowInnerHeight != null) {
    parts.push(`Object.defineProperty(window, 'innerHeight', { get: () => ${config.windowInnerHeight}, configurable: true });`);
  }
  if (config.screenX != null) {
    parts.push(`Object.defineProperty(window, 'screenX', { get: () => ${config.screenX}, configurable: true });`);
  }
  if (config.screenY != null) {
    parts.push(`Object.defineProperty(window, 'screenY', { get: () => ${config.screenY}, configurable: true });`);
  }

  // ── Timezone override ────────────────────────────────────────────────
  if (config.timezone) {
    parts.push(`
    // Override timezone
    const origDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(locales, options) {
      const instance = new origDateTimeFormat(locales, options);
      const origResolved = instance.resolvedOptions.bind(instance);
      instance.resolvedOptions = function() {
        const result = origResolved();
        result.timeZone = ${JSON.stringify(config.timezone)};
        return result;
      };
      return instance;
    };
    Intl.DateTimeFormat.prototype = origDateTimeFormat.prototype;`);
  }

  // ── WebGL overrides ──────────────────────────────────────────────────
  if (config.webglVendor || config.webglRenderer) {
    parts.push(`
    // Override WebGL vendor/renderer
    const vendorStr = ${JSON.stringify(config.webglVendor || '')};
    const rendererStr = ${JSON.stringify(config.webglRenderer || '')};

    const origGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(p) {
      if (p === 0x1F00) return vendorStr; // VENDOR
      if (p === 0x1F01) return rendererStr; // RENDERER
      return origGetParameter.call(this, p);
    };

    if (typeof WebGL2RenderingContext !== 'undefined') {
      const origGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function(p) {
        if (p === 0x1F00) return vendorStr;
        if (p === 0x1F01) return rendererStr;
        return origGetParameter2.call(this, p);
      };
    }

    // Override getExtension to hide WEBGL_debug_renderer_info
    const origGetExtension = WebGLRenderingContext.prototype.getExtension;
    WebGLRenderingContext.prototype.getExtension = function(name) {
      if (name === 'WEBGL_debug_renderer_info') return null;
      return origGetExtension.call(this, name);
    };
    if (typeof WebGL2RenderingContext !== 'undefined') {
      WebGL2RenderingContext.prototype.getExtension = WebGLRenderingContext.prototype.getExtension;
    }`);
  }

  // ── Canvas noise ─────────────────────────────────────────────────────
  if (config.canvasNoiseSeed) {
    parts.push(`
    // Canvas fingerprint noise
    (function() {
      const seed = ${JSON.stringify(config.canvasNoiseSeed)};
      let seedVal = 0;
      for (let i = 0; i < seed.length; i++) seedVal = ((seedVal << 5) - seedVal) + seed.charCodeAt(i);
      const rng = () => { seedVal = (seedVal * 1103515245 + 12345) & 0x7fffffff; return seedVal / 0x7fffffff; };

      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(...args) {
        const ctx = this.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, this.width, this.height);
          const data = imageData.data;
          // Add subtle noise to ~1% of pixels
          for (let i = 0; i < data.length; i += 4) {
            if (rng() < 0.01) {
              const noise = (rng() - 0.5) * 2;
              data[i] = Math.min(255, Math.max(0, data[i] + noise));
              data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
              data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        return origToDataURL.apply(this, args);
      };
    })();`);
  }

  // ── Battery API override ─────────────────────────────────────────────
  if (config.batteryLevel != null || config.batteryCharging != null) {
    parts.push(`
    // Override navigator.getBattery
    navigator.getBattery = function() {
      return Promise.resolve({
        charging: ${config.batteryCharging === true},
        chargingTime: ${config.batteryChargingTime ?? 0},
        dischargingTime: ${config.batteryDischargingTime ?? Infinity},
        level: ${config.batteryLevel ?? 1},
        addEventListener: () => {},
        removeEventListener: () => {},
      });
    };`);
  }

  // ── Connection override ──────────────────────────────────────────────
  if (config.connectionEffectiveType || config.connectionDownlink != null || config.connectionRtt != null) {
    parts.push(`
    // Override navigator.connection
    if (navigator.connection) {
      ${config.connectionEffectiveType ? `Object.defineProperty(navigator.connection, 'effectiveType', { get: () => ${JSON.stringify(config.connectionEffectiveType)}, configurable: true });` : ''}
      ${config.connectionDownlink != null ? `Object.defineProperty(navigator.connection, 'downlink', { get: () => ${config.connectionDownlink}, configurable: true });` : ''}
      ${config.connectionRtt != null ? `Object.defineProperty(navigator.connection, 'rtt', { get: () => ${config.connectionRtt}, configurable: true });` : ''}
    } else {
      navigator.connection = {
        effectiveType: ${JSON.stringify(config.connectionEffectiveType ?? '4g')},
        downlink: ${config.connectionDownlink ?? 10},
        rtt: ${config.connectionRtt ?? 50},
      };
    }`);
  }

  // ── Storage detection ────────────────────────────────────────────────
  if (config.localStorage === false) {
    parts.push(`Object.defineProperty(window, 'localStorage', { get: () => null, configurable: true });`);
  }
  if (config.sessionStorage === false) {
    parts.push(`Object.defineProperty(window, 'sessionStorage', { get: () => null, configurable: true });`);
  }
  if (config.indexedDb === false) {
    parts.push(`Object.defineProperty(window, 'indexedDB', { get: () => null, configurable: true });`);
  }

  // ── Media preferences ────────────────────────────────────────────────
  if (config.prefersDarkMode != null) {
    parts.push(`
    window.matchMedia = (function(orig) {
      return function(q) {
        if (q === '(prefers-color-scheme: dark)') {
          return { matches: ${config.prefersDarkMode === true}, media: q, addEventListener: () => {}, removeEventListener: () => {} };
        }
        return orig.call(window, q);
      };
    })(window.matchMedia);`);
  }

  // ── Audio context fingerprint ───────────────────────────────────────
  if (config.audioSampleRate != null || config.audioMaxChannelCount != null) {
    parts.push(`
    // Override AudioContext properties
    const origCreateAudioContext = window.AudioContext || window.webkitAudioContext;
    if (origCreateAudioContext) {
      const OrigAC = origCreateAudioContext;
      window.AudioContext = function() {
        const ctx = new OrigAC();
        ${config.audioSampleRate != null ? `Object.defineProperty(ctx, 'sampleRate', { get: () => ${config.audioSampleRate}, configurable: true });` : ''}
        ${config.audioMaxChannelCount != null ? `Object.defineProperty(ctx.destination, 'maxChannelCount', { get: () => ${config.audioMaxChannelCount}, configurable: true });` : ''}
        return ctx;
      };
      window.AudioContext.prototype = OrigAC.prototype;
    }`);
  }

  // ── Performance memory ───────────────────────────────────────────────
  if (config.performanceMemory != null) {
    parts.push(`
    if (performance) {
      Object.defineProperty(performance, 'memory', {
        get: () => ({ jsHeapSizeLimit: ${config.performanceMemory * 1024 * 1024 * 1024}, totalJSHeapSize: ${Math.round(config.performanceMemory * 0.5 * 1024 * 1024 * 1024)}, usedJSHeapSize: ${Math.round(config.performanceMemory * 0.3 * 1024 * 1024 * 1024)} }),
        configurable: true,
      });
    }`);
  }

  return `(function() { ${parts.join('\n')} })();`;
}