import type { DfdNodeType } from './common';

/**
 * DFD node (process, entity, store)
 */
export type DfdNode = {
  id: string;
  type: DfdNodeType;
  label: string;
  desc?: string;
  code?: string;
  // Entity / Store positioning
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  // Process positioning (circle)
  cx?: number;
  cy?: number;
  r?: number;
  // Child level for drill-down
  childLevel?: string;
};

/**
 * DFD data flow
 */
export type DfdFlow = {
  id: string;
  from: string;
  to: string;
  label: string;
  path: number[][];
};