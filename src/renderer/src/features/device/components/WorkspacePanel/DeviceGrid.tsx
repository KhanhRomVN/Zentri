import { FC } from 'react';
import { Device } from '../../types';
import DeviceCard from './DeviceCard';

interface DeviceGridProps {
  devices: Device[];
  onRowClick: (device: Device) => void;
}

const DeviceGrid: FC<DeviceGridProps> = ({ devices, onRowClick }) => {
  if (devices.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-tertiary">
        No devices found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} onClick={onRowClick} />
      ))}
    </div>
  );
};

export default DeviceGrid;