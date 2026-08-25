import { execSync } from 'child_process';

export interface ScannedDevice {
  id: string;
  serial: string;
  model: string;
  deviceType: 'mobile' | 'desktop';
  connectionType: 'usb' | 'lan' | 'emulator';
  status: 'online' | 'offline';
  adbState: string;
}

export class DeviceScannerService {
  private static instance: DeviceScannerService;

  static getInstance(): DeviceScannerService {
    if (!DeviceScannerService.instance) {
      DeviceScannerService.instance = new DeviceScannerService();
    }
    return DeviceScannerService.instance;
  }

  scanAdbDevices(): ScannedDevice[] {
    try {
      const output = execSync('adb devices -l', {
        encoding: 'utf-8',
        timeout: 5000,
      });
      const lines = output.trim().split('\n').slice(1);
      return lines
        .filter((line) => line.trim())
        .map((line) => this.parseAdbLine(line))
        .filter((d): d is ScannedDevice => d !== null);
    } catch (err) {
      console.error('[DeviceScanner] ADB scan failed:', err);
      return [];
    }
  }

  private parseAdbLine(line: string): ScannedDevice | null {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const serial = parts[0];
    const adbState = parts[1];
    const modelMatch = line.match(/model:(\S+)/);
    const deviceMatch = line.match(/device:(\S+)/);

    const model = modelMatch ? modelMatch[1].replace(/_/g, ' ') : 'Unknown';
    const deviceKind = deviceMatch ? deviceMatch[1] : '';
    const connectionType: ScannedDevice['connectionType'] =
      deviceKind === 'emulator' ? 'emulator' : serial.includes(':') ? 'lan' : 'usb';

    return {
      id: serial,
      serial,
      model,
      deviceType: 'mobile',
      connectionType,
      status: adbState === 'device' ? 'online' : 'offline',
      adbState,
    };
  }
}