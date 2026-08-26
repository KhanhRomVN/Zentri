import { useCallback, useEffect, useState } from 'react';
import type { WorkflowNode } from '../types';

interface UseCanvasViewportArgs {
  currentNodes: WorkflowNode[];
  setViewport: (
    viewport: { x: number; y: number; zoom: number },
    opts?: { duration?: number },
  ) => void;
  getViewport: () => { x: number; y: number; zoom: number };
  getZoom: () => number;
  zoomIn: () => void;
  zoomOut: () => void;
  reactFlowWrapRef: React.RefObject<HTMLDivElement>;
}

export const useCanvasViewport = ({
  currentNodes,
  setViewport,
  getViewport,
  getZoom,
  zoomIn,
  zoomOut,
  reactFlowWrapRef,
}: UseCanvasViewportArgs) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const updateZoom = () => {
      const currentZoom = getZoom();
      setZoom(Math.round(currentZoom * 100));
    };

    updateZoom();
    const interval = setInterval(updateZoom, 100);
    return () => clearInterval(interval);
  }, [getZoom]);

  const goToRoot = useCallback(() => {
    const rootNode = currentNodes.find((n) => n.type === 'start' || n.id === 'start');
    if (!rootNode) return;

    const currentZoom = getZoom();
    const flowWrapper = reactFlowWrapRef.current;
    const canvasWidth = flowWrapper?.offsetWidth || window.innerWidth;
    const canvasHeight = flowWrapper?.offsetHeight || window.innerHeight;

    const nodeCenterX = rootNode.x + rootNode.w / 2;
    const nodeCenterY = rootNode.y + rootNode.h / 2;

    const viewportX = canvasWidth / 2 - nodeCenterX * currentZoom;
    const viewportY = canvasHeight / 2 - nodeCenterY * currentZoom;

    setViewport({ x: viewportX, y: viewportY, zoom: currentZoom }, { duration: 500 });
  }, [currentNodes, setViewport, getZoom, reactFlowWrapRef]);

  // Middle mouse button pan
  useEffect(() => {
    let isPanning = false;
    let panStart = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        if (reactFlowWrapRef.current) {
          reactFlowWrapRef.current.style.cursor = 'grabbing';
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      const viewport = getViewport();
      setViewport({ x: viewport.x + dx, y: viewport.y + dy, zoom: viewport.zoom });
      panStart = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isPanning = false;
        if (reactFlowWrapRef.current) {
          reactFlowWrapRef.current.style.cursor = '';
        }
      }
    };

    const wrap = reactFlowWrapRef.current;
    if (wrap) {
      wrap.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        wrap.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [getViewport, setViewport, reactFlowWrapRef]);

  // Ctrl + wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        if (delta > 0) zoomIn();
        else zoomOut();
      }
    };

    const wrap = reactFlowWrapRef.current;
    if (wrap) {
      wrap.addEventListener('wheel', handleWheel, { passive: false });
      return () => wrap.removeEventListener('wheel', handleWheel);
    }
    return undefined;
  }, [zoomIn, zoomOut, reactFlowWrapRef]);

  return { zoom, goToRoot };
};
