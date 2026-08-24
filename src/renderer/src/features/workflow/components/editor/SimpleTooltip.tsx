import React from 'react';
import { cn } from '../../../../shared/lib/utils';

interface SimpleTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Simple CSS-only tooltip that doesn't rely on React state
 * Perfect for components with frequent re-renders
 */
export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  children,
  content,
  side = 'top',
  className,
}) => {
  return (
    <div className={cn('relative inline-block group', className)}>
      {children}
      <div
        className={cn(
          'absolute z-[9999] px-3 py-1.5 text-[11px] bg-tooltip-background text-text-primary border border-border rounded shadow-lg whitespace-nowrap',
          'opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150',
          side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
          side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
          side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
        )}
      >
        {content}
        {/* Arrow */}
        <div
          className={cn(
            'absolute w-0 h-0 border-solid',
            side === 'top' &&
              'top-full left-1/2 -translate-x-1/2 border-t-tooltip-background border-l-transparent border-r-transparent border-b-transparent border-[6px]',
            side === 'bottom' &&
              'bottom-full left-1/2 -translate-x-1/2 border-b-tooltip-background border-l-transparent border-r-transparent border-t-transparent border-[6px]',
            side === 'left' &&
              'left-full top-1/2 -translate-y-1/2 border-l-tooltip-background border-t-transparent border-b-transparent border-r-transparent border-[6px]',
            side === 'right' &&
              'right-full top-1/2 -translate-y-1/2 border-r-tooltip-background border-t-transparent border-b-transparent border-l-transparent border-[6px]',
          )}
        />
      </div>
    </div>
  );
};
