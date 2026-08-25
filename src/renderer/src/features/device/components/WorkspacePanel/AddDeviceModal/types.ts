export interface ScannedDevice {
  id: string;
  serial: string;
  model: string;
  deviceType: 'mobile' | 'desktop';
  connectionType: 'usb' | 'lan' | 'emulator';
  status: 'online' | 'offline';
  adbState: string;
}

export type AddDeviceMode = 'scan' | 'manual';
export type SourceFilter = 'all' | 'usb' | 'lan' | 'emulator';
export type StatusFilter = 'all' | 'new' | 'added';
export type DetailTab = 'overview' | 'hardware' | 'network' | 'apps' | 'security';

export const PRESET_TAGS = ['android', 'ios', 'proxy', 'high-load'];

export const CONN_LABEL: Record<string, string> = {
  usb: 'USB',
  lan: 'LAN',
  emulator: 'EMULATOR',
  manual: 'MANUAL',
};