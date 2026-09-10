import type { DfdNodeType } from '../types';

/**
 * Visual metadata for DFD node types
 */
export const DFD_NODE_META: Record<
  DfdNodeType,
  { label: string; color: string; bg: string; kindLabel: string }
> = {
  process: {
    label: 'Process',
    color: '#2FE6B8',
    bg: 'rgba(47, 230, 184, 0.08)',
    kindLabel: 'TIẾN TRÌNH',
  },
  entity: {
    label: 'Entity',
    color: '#FFB454',
    bg: 'rgba(255, 180, 84, 0.08)',
    kindLabel: 'THỰC THỂ NGOÀI',
  },
  store: {
    label: 'Store',
    color: '#9D7BFF',
    bg: 'rgba(157, 123, 255, 0.08)',
    kindLabel: 'KHO DỮ LIỆU',
  },
};