import type { WorkflowNode } from '../types';

export const centerNodeInViewport = (
  node: WorkflowNode,
  canvasWidth: number,
  canvasHeight: number,
  currentZoom: number,
  setViewport: (viewport: { x: number; y: number; zoom: number }, opts?: { duration?: number }) => void,
) => {
  const nodeCenterX = node.x + node.w / 2;
  const nodeCenterY = node.y + node.h / 2;

  const viewportX = canvasWidth / 2 - nodeCenterX * currentZoom;
  const viewportY = canvasHeight / 2 - nodeCenterY * currentZoom;

  setViewport({ x: viewportX, y: viewportY, zoom: currentZoom }, { duration: 500 });
};