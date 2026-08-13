import React, { useCallback } from 'react';
import { cn } from '../../../shared/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  /** Nhãn hiển thị bên trái switch */
  label?: string;
  /** Mô tả phụ dưới label */
  description?: string;
  /** Icon lucide-react hiển thị bên trái */
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    track: 'w-8 h-4.5',
    thumb: 'w-3.5 h-3.5',
    translate: 'translate-x-3.5',
    icon: 'w-7 h-7',
    iconSize: 14,
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    icon: 'w-9 h-9',
    iconSize: 16,
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
    icon: 'w-10 h-10',
    iconSize: 18,
  },
} as const;

function SwitchButton({
  isChecked,
  disabled,
  id,
  name,
  className,
  size,
  onClick,
}: {
  isChecked: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
}) {
  const { track, thumb, translate } = sizeConfig[size];

  return (
    <button
      type="button"
      role="switch"
      id={id}
      name={name}
      aria-checked={isChecked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative shrink-0 transition-colors duration-300 rounded-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card-background',
        track,
        disabled && 'opacity-50 cursor-not-allowed',
        isChecked ? 'bg-primary border-primary' : 'border border-border',
        'border',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 rounded-md bg-white shadow-sm transition-transform duration-300 ease-out',
          thumb,
          isChecked ? translate : 'translate-x-0',
        )}
      />
    </button>
  );
}

export function Toggle({
  checked,
  defaultChecked,
  onChange,
  disabled,
  className,
  id,
  name,
  label,
  description,
  icon: Icon,
  size = 'sm',
}: ToggleProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
  const isChecked = isControlled ? checked : internalChecked;

  const handleClick = useCallback(() => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onChange?.(next);
  }, [disabled, isChecked, isControlled, onChange]);

  // Chỉ render switch khi không có label (dùng inline như trong ProxyModal)
  if (!label && !description && !Icon) {
    return (
      <SwitchButton
        isChecked={isChecked}
        disabled={disabled}
        id={id}
        name={name}
        size={size}
        className={className}
        onClick={handleClick}
      />
    );
  }

  const { icon: iconCls, iconSize } = sizeConfig[size];

  // Render đầy đủ với label + description + icon
  return (
    <label
      className={cn(
        'flex items-center justify-between gap-4 py-3 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              'rounded-lg flex items-center justify-center transition-colors duration-300',
              iconCls,
              isChecked ? 'bg-primary/10 text-primary' : 'bg-muted text-text-secondary/60',
            )}
          >
            <Icon size={iconSize} strokeWidth={2} />
          </div>
        )}
        <div>
          {label && <div className="text-sm font-medium text-text-primary">{label}</div>}
          {description && (
            <div className="text-xs text-text-secondary/50 mt-0.5">{description}</div>
          )}
        </div>
      </div>

      <SwitchButton
        isChecked={isChecked}
        disabled={disabled}
        id={id}
        name={name}
        size={size}
        onClick={handleClick}
      />
    </label>
  );
}

Toggle.displayName = 'Toggle';

export default Toggle;
