import { memo } from 'react';
import { BaseEdge, type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

/**
 * Custom React Flow edge: DFD data flow with smooth step path and label
 */
export const DfdFlowEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const label = (data as any)?.label ?? '';
    const strokeColor = selected ? '#2FE6B8' : '#8A94A3';
    const labelColor = selected ? '#2FE6B8' : '#E7ECF2';

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: strokeColor,
            strokeWidth: selected ? 2.5 : 2,
          }}
          markerEnd="url(#dfd-arrow)"
        />

        {/* Invisible wider path for easier hover */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          className="cursor-pointer"
        />

        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <div
                style={{
                  backgroundColor: '#0A0D13',
                  opacity: 0.92,
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: labelColor,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  },
);

DfdFlowEdge.displayName = 'DfdFlowEdge';
