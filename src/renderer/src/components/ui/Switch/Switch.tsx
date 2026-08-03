import { cn } from '@renderer/shared/lib/utils';
import { SwitchProps } from './type';

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative w-9 h-5 rounded-md transition-colors duration-200 border',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-emerald-500 border-emerald-500' : 'bg-card-background border-border',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-sm transition-transform duration-200',
          checked ? 'translate-x-4 bg-white' : 'bg-text-secondary/30',
        )}
      />
    </button>
  );
}

Switch.displayName = 'Switch';

export default Switch;
