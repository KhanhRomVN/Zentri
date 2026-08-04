import React from 'react';
import { cn } from '../../../shared/lib/utils';
import { DropdownLabelProps } from './type';

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none',
        className,
      )}
    >
      {children}
    </div>
  );
}

DropdownLabel.displayName = 'DropdownLabel';

export default DropdownLabel;