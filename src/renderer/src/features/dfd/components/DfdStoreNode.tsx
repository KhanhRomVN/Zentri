import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DfdNode } from '../types';

type DfdStoreNodeProps = NodeProps & {
  data: DfdNode &
    Record<string, unknown> & {
      onSelect?: (kind: 'node' | 'flow', id: string) => void;
    };
};

/**
 * Custom React Flow node: DFD data store (open-ended rectangle)
 */
export const DfdStoreNode = memo(({ data, selected }: DfdStoreNodeProps) => {
  const node = data as DfdStoreNodeProps['data'];
  const w = node.w ?? 175;
  const h = node.h ?? 52;

  const pathD = `M${w},0 L0,0 L0,${h} L${w},${h}`;

  return (
    <div style={{ width: w, height: h, cursor: 'grab' }}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <svg width={w} height={h} style={{ pointerEvents: 'none' }}>
        <path
          d={pathD}
          fill="#10141C"
          stroke="none"
        />
        <path
          d={`M0,0 L${w},0 M${w},0 L${w},${h} M${w},${h} L0,${h}`}
          fill="none"
          stroke="#9D7BFF"
          strokeWidth={selected ? 2.4 : 1.6}
          style={{
            ...(selected ? { filter: 'drop-shadow(0 0 8px rgba(157,123,255,0.5))' } : {}),
            pointerEvents: 'all',
          }}
        />
        <text
          x={w / 2}
          y={h / 2 + 4}
          textAnchor="middle"
          fill="#E7ECF2"
          fontSize={11.5}
          fontWeight={500}
          fontFamily="'JetBrains Mono', monospace"
        >
          {node.code ? `${node.code} · ${node.label}` : node.label}
        </text>
      </svg>
    </div>
  );
});

DfdStoreNode.displayName = 'DfdStoreNode';
