import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles/dfd.css';
import { useDfdModels } from './hooks/useDfdData';
import { toFlowNode, toFlowEdge } from './utils';
import { DfdProcessNode } from './components/DfdProcessNode';
import { DfdEntityNode } from './components/DfdEntityNode';
import { DfdStoreNode } from './components/DfdStoreNode';
import { DfdFlowEdge } from './components/DfdFlowEdge';
import { DfdSidebar } from './components/DfdSidebar';
import { HeaderBar } from './components/HeaderBar';
import { autoLayoutDfd, needsAutoLayout } from './services/autoLayout';
import type { DfdModel, DfdLevel } from './types';

const nodeTypes = {
  dfdProcess: DfdProcessNode,
  dfdEntity: DfdEntityNode,
  dfdStore: DfdStoreNode,
};

const edgeTypes = {
  dfdFlow: DfdFlowEdge,
};

/**
 * Build ordered level options by depth (Mức 0 → root, Mức 1 → children, …)
 */
function buildLevelOptions(model: DfdModel | undefined): { id: string; label: string }[] {
  if (!model) return [];

  const rootId = model.meta.rootLevel;
  const options: { id: string; label: string }[] = [{ id: rootId, label: 'Mức 0' }];
  const visited = new Set<string>([rootId]);
  const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const children = Object.keys(model.levels).filter(
      (k) => !visited.has(k) && model.levels[k].parent?.level === id,
    );
    children.forEach((childId) => {
      visited.add(childId);
      queue.push({ id: childId, depth: depth + 1 });
      options.push({ id: childId, label: `Mức ${depth + 1}` });
    });
  }

  return options;
}

/**
 * DFD Canvas — read-only DFD viewer, loads data from static .json files
 */
const DfdCanvas = () => {
  const models = useDfdModels();
  const [activeModelId, setActiveModelId] = useState(models[0]?.meta.modelName ?? '');
  const [currentLevelId, setCurrentLevelId] = useState(models[0]?.meta.rootLevel ?? '');
  const [layoutedLevel, setLayoutedLevel] = useState<DfdLevel | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);

  const model = models.find((m) => m.meta.modelName === activeModelId) ?? models[0];
  const level = model?.levels[currentLevelId];

  // Auto-layout effect when level changes
  useEffect(() => {
    if (!level) {
      setLayoutedLevel(null);
      return;
    }

    // Check if auto-layout is needed
    if (needsAutoLayout(level)) {
      setIsLayouting(true);
      autoLayoutDfd(level)
        .then((result) => {
          setLayoutedLevel({
            ...level,
            nodes: result.nodes,
            canvas: { w: result.canvasWidth, h: result.canvasHeight },
          });
        })
        .catch((error) => {
          console.error('Auto-layout failed:', error);
          setLayoutedLevel(level);
        })
        .finally(() => {
          setIsLayouting(false);
        });
    } else {
      setLayoutedLevel(level);
    }
  }, [level]);

  const displayLevel = layoutedLevel ?? level;

  const handleModelSelect = useCallback((m: DfdModel) => {
    setActiveModelId(m.meta.modelName);
    setCurrentLevelId(m.meta.rootLevel);
  }, []);

  const handleLevelChange = useCallback((levelId: string) => {
    setCurrentLevelId(levelId);
  }, []);

  // Click node → drill down nếu process có childLevel
  const handleSelect = useCallback(
    (kind: 'node' | 'flow', id: string) => {
      if (!displayLevel) return;
      if (kind === 'node') {
        const node = displayLevel.nodes.find((n) => n.id === id);
        if (node?.childLevel) {
          setCurrentLevelId(node.childLevel);
        }
      }
    },
    [displayLevel],
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      const dfdNode = displayLevel?.nodes.find((n) => n.id === node.id);
      if (dfdNode?.childLevel) {
        setCurrentLevelId(dfdNode.childLevel);
      }
    },
    [displayLevel],
  );

  const nodes = useMemo(() => {
    if (!displayLevel) return [];
    return displayLevel.nodes.map((n) => toFlowNode(n, { onSelect: handleSelect }));
  }, [displayLevel, handleSelect]);

  const edges = useMemo(() => {
    if (!displayLevel) return [];
    return displayLevel.flows.map((f) => toFlowEdge(f, { onSelect: handleSelect }));
  }, [displayLevel, handleSelect]);

  const levelOptions = useMemo(() => buildLevelOptions(model), [model]);

  if (!model || !displayLevel) {
    return <div className="dfd-shell dfd-empty">Không có dữ liệu DFD.</div>;
  }

  if (isLayouting) {
    return (
      <div className="dfd-shell dfd-empty">
        <div className="dfd-loading">
          <div className="dfd-spinner" />
          <p>Đang tự động sắp xếp sơ đồ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dfd-shell">
      <HeaderBar
        modelName={model.meta.modelName}
        levelOptions={levelOptions}
        currentLevelId={currentLevelId}
        onLevelChange={handleLevelChange}
        nodeCount={displayLevel.nodes.length}
        flowCount={displayLevel.flows.length}
      />

      <div className="dfd-body">
        <DfdSidebar
          models={models}
          activeModelId={activeModelId}
          onModelSelect={handleModelSelect}
        />

        <div className="dfd-main">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.35}
            maxZoom={1.8}
            nodesDraggable
            nodesConnectable={false}
            zoomOnScroll
            panOnScroll
            panOnDrag
            proOptions={{ hideAttribution: true }}
          >
            <defs>
              <marker
                id="dfd-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#5B6B80" />
              </marker>
            </defs>
          </ReactFlow>

          <div className="dfd-main-head">
            <h2>{displayLevel.title}</h2>
            <p>{displayLevel.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * DFD feature entry point
 */
const Dfd = () => (
  <ReactFlowProvider>
    <DfdCanvas />
  </ReactFlowProvider>
);

export default Dfd;
