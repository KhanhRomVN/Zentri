import { useCallback, useEffect } from 'react';

interface UseKeyboardShortcutsArgs {
  undo: () => void;
  redo: () => void;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  copiedNode: unknown;
  copyNode: (id: string) => void;
  pasteNode: (pos: { x: number; y: number }) => void;
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  clearNodeContent: (id: string) => void;
  toggleNodeLock: (id: string) => void;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  zoomIn: () => void;
  zoomOut: () => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }, opts?: { duration?: number }) => void;
  getViewport: () => { x: number; y: number; zoom: number };
  goToRoot: () => void;
  setEditModalOpen: (open: boolean) => void;
  screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number };
}

export const useKeyboardShortcuts = ({
  undo,
  redo,
  selectedNodeId,
  selectedEdgeId,
  copiedNode,
  copyNode,
  pasteNode,
  duplicateNode,
  deleteNode,
  deleteEdge,
  clearNodeContent,
  toggleNodeLock,
  setShowGrid,
  zoomIn,
  zoomOut,
  setViewport,
  getViewport,
  goToRoot,
  setEditModalOpen,
  screenToFlowPosition,
}: UseKeyboardShortcutsArgs) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedNodeId) {
        e.preventDefault();
        copyNode(selectedNodeId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && copiedNode) {
        e.preventDefault();
        const center = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        pasteNode(center);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedNodeId) {
        e.preventDefault();
        duplicateNode(selectedNodeId);
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          e.preventDefault();
          deleteEdge(selectedEdgeId);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace' && selectedNodeId) {
        e.preventDefault();
        clearNodeContent(selectedNodeId);
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l' && selectedNodeId) {
        e.preventDefault();
        toggleNodeLock(selectedNodeId);
      }

      if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowGrid((prev) => !prev);
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        zoomOut();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        const vp = getViewport();
        setViewport({ x: vp.x, y: vp.y, zoom: 1 }, { duration: 300 });
      }

      if (e.key === 'Home') {
        e.preventDefault();
        goToRoot();
      }

      if (e.key === 'Enter' && selectedNodeId && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        setEditModalOpen(true);
      }
    },
    [
      undo,
      redo,
      selectedNodeId,
      selectedEdgeId,
      copiedNode,
      copyNode,
      pasteNode,
      duplicateNode,
      deleteNode,
      deleteEdge,
      clearNodeContent,
      toggleNodeLock,
      setShowGrid,
      zoomIn,
      zoomOut,
      setViewport,
      getViewport,
      goToRoot,
      setEditModalOpen,
      screenToFlowPosition,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};