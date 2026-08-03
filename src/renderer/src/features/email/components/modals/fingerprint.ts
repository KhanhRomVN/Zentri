// Fingerprint configuration — shared type used by generator and injector

export interface FingerprintConfig {
  userAgent?: string;
  appVersion?: string;
  platform?: string;
  platformVersion?: string;
  oscpu?: string;
  buildID?: string;
  brand?: string;
  brandVersion?: string;

  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  deviceMemory?: number;

  screenWidth?: number;
  screenHeight?: number;
  screenAvailWidth?: number;
  screenAvailHeight?: number;
  screenColorDepth?: number;
  screenPixelDepth?: number;
  devicePixelRatio?: number;

  windowOuterWidth?: number;
  windowOuterHeight?: number;
  windowInnerWidth?: number;
  windowInnerHeight?: number;
  screenX?: number;
  screenY?: number;

  language?: string;
  languages?: string[];

  doNotTrack?: string;
  cookieEnabled?: boolean;
  webdriver?: boolean;
  pdfViewerEnabled?: boolean;

  webglVendor?: string;
  webglRenderer?: string;
  webglVersion?: string;
  webglShadingLanguageVersion?: string;
  webglParameters?: string;
  webgl2Parameters?: string;
  webglShaderPrecisionFormats?: string;
  webgl2ShaderPrecisionFormats?: string;

  timezone?: string;
  timezoneOffset?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;

  prefersReducedMotion?: boolean;
  prefersDarkMode?: boolean;
  prefersContrast?: string;
  prefersReducedData?: boolean;

  colorGamutSrgb?: boolean;
  colorGamutP3?: boolean;
  colorGamutRec2020?: boolean;
  hdrSupport?: boolean;

  audioSampleRate?: number;
  audioMaxChannelCount?: number;

  localStorage?: boolean;
  sessionStorage?: boolean;
  indexedDb?: boolean;

  canvasNoiseSeed?: string;
  fonts?: string;
  plugins?: string;
  mimeTypes?: string;

  batteryCharging?: boolean;
  batteryChargingTime?: number;
  batteryDischargingTime?: number;
  batteryLevel?: number;

  voices?: string;

  vendor?: string;
  vendorSub?: string;
  productSub?: string;

  connectionEffectiveType?: string;
  connectionDownlink?: number;
  connectionRtt?: number;

  performanceMemory?: number;
}

export interface Fingerprint {
  id: string;
  name: string;
  description: string;
  config: FingerprintConfig;
  group?: string;
  os?: string;
  browser?: string;
}