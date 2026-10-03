import { cn } from '@renderer/shared/utils/cn';
import { DropdownContentProps } from './type';

export function DropdownContent({ children, className }: DropdownContentProps) {
  return (
    <div className={cn('flex flex-col px-1.5 py-1.5', className)} onClick={(e) => e.stopPropagation()}>
      <div className="max-h-[300px] overflow-y-auto">{children}</div>
    </div>
  );
}

DropdownContent.displayName = 'DropdownContent';

export default DropdownContent;
