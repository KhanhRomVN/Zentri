import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useState } from 'react';

export const WorkflowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isInvalid = (data as any)?.isInvalid || false;
  const errorMessage =
    (data as any)?.errorMessage || 'Invalid connection: multiple edges from same source handle';

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isInvalid) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} interactionWidth={20} />

      {/* Invisible wider path for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Tooltip */}
      {showTooltip && isInvalid && (
        <div
          className="fixed z-[9999] max-w-[280px] pointer-events-none whitespace-normal bg-tooltip-background text-text-primary text-[11px] px-3 py-1.5 rounded shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-border"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 30,
          }}
        >
          {errorMessage}
        </div>
      )}
    </>
  );
};
