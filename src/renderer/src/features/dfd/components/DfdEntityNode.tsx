import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DfdNode } from '../types';

type DfdEntityNodeProps = NodeProps & {
  data: DfdNode &
    Record<string, unknown> & {
      onSelect?: (kind: 'node' | 'flow', id: string) => void;
    };
};

/**
 * Custom React Flow node: DFD external entity (rectangle)
 */
export const DfdEntityNode = memo(({ data, selected }: DfdEntityNodeProps) => {
  const node = data as DfdEntityNodeProps['data'];
  const w = node.w ?? 130;
  const h = node.h ?? 66;

  return (
    <div style={{ width: w, height: h, cursor: 'grab' }}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <svg width={w} height={h} style={{ pointerEvents: 'none' }}>
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={3}
          fill="#10141C"
          stroke="#FFB454"
          strokeWidth={selected ? 2.4 : 1.6}
          style={{
            ...(selected ? { filter: 'drop-shadow(0 0 8px rgba(255,180,84,0.5))' } : {}),
            pointerEvents: 'all',
          }}
        />
        <text
          x={w / 2}
          y={h / 2 + 5}
          textAnchor="middle"
          fill="#E7ECF2"
          fontSize={13}
          fontWeight={600}
          fontFamily="'Space Grotesk', sans-serif"
        >
          {node.label}
        </text>
      </svg>
    </div>
  );
});

DfdEntityNode.displayName = 'DfdEntityNode';
