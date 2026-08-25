import { Device } from '../../../types/db';

export interface DeviceFilterState {
  searchQuery: string;
  fleet: Set<string>;
  status: Set<string>;
  platform: Set<string>;
  group: Set<string>;
  tags: Set<string>;
}

export interface DeviceFacetCounts {
  fleet: Record<string, number>;
  status: Record<string, number>;
  platform: Record<string, number>;
  group: Record<string, number>;
  tags: Record<string, number>;
}

export type { Device };