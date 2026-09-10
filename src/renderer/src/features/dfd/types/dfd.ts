import type { DfdNode, DfdFlow } from './node';

/**
 * Parent reference for a DFD level
 */
export type DfdParent = {
  id: string;
  code: string;
  label: string;
  level: string;
};

/**
 * A single DFD level
 */
export type DfdLevel = {
  code: string;
  title: string;
  subtitle: string;
  parent: DfdParent | null;
  canvas: { w: number; h: number };
  nodes: DfdNode[];
  flows: DfdFlow[];
};

/**
 * DFD model metadata
 */
export type DfdMeta = {
  modelName: string;
  rootLevel: string;
  problemStatement?: string;
  notes?: string[];
};

/**
 * Full DFD model loaded from .json
 */
export type DfdModel = {
  meta: DfdMeta;
  levels: Record<string, DfdLevel>;
};
