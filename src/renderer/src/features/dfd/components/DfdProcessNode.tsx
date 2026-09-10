import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DfdNode } from '../types';

type DfdProcessNodeProps = NodeProps & {
  data: DfdNode &
    Record<string, unknown> & {
      onSelect?: (kind: 'node' | 'flow', id: string) => void;
    };
};

/**
 * Custom React Flow node: DFD process (circle with divider line at 1/3)
 */
export const DfdProcessNode = memo(({ data, selected }: DfdProcessNodeProps) => {
  const node = data as DfdProcessNodeProps['data'];
  const r = node.r ?? 80;
  const diameter = r * 2;

  return (
    <div style={{ width: diameter, height: diameter, cursor: 'grab' }}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <svg width={diameter} height={diameter} style={{ pointerEvents: 'none' }}>
        <circle
          cx={r}
          cy={r}
          r={r}
          fill="#10141C"
          stroke="#2FE6B8"
          strokeWidth={selected ? 2.4 : 1.6}
          style={{
            ...(selected ? { filter: 'drop-shadow(0 0 8px rgba(47,230,184,0.5))' } : {}),
            pointerEvents: 'all',
          }}
        />
        <line
          x1={r - r * 0.86}
          y1={r - r * 0.32}
          x2={r + r * 0.86}
          y2={r - r * 0.32}
          stroke="#2FE6B8"
          strokeWidth={1.2}
          opacity={0.55}
        />
        {node.code && (
          <text
            x={r}
            y={r - r * 0.32 - 14}
            textAnchor="middle"
            fill="#2FE6B8"
            fontSize={15}
            fontWeight={700}
            fontFamily="'JetBrains Mono', monospace"
          >
            {node.code}
          </text>
        )}
        <text
          x={r}
          y={r - r * 0.32 + 22}
          textAnchor="middle"
          fill="#E7ECF2"
          fontSize={13}
          fontWeight={600}
          fontFamily="'Space Grotesk', sans-serif"
        >
          {node.label}
        </text>
        {node.childLevel && (
          <text
            x={r}
            y={r + r + 18}
            textAnchor="middle"
            fill="#2FE6B8"
            fontSize={9.5}
            fontFamily="'JetBrains Mono', monospace"
          >
            ▾ NHẤP ĐỂ PHÂN RÃ
          </text>
        )}
      </svg>
    </div>
  );
});

DfdProcessNode.displayName = 'DfdProcessNode';
