import React from 'react';
import { cn } from '../../../shared/lib/utils';
import { DropdownItemProps, DropdownSeparatorProps } from './type';
import { useDropdownContext } from './Dropdown';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return '';
}

export function DropdownItem({
  children,
  onClick,
  className,
  disabled,
  icon,
  closeOnSelect = true,
  variant = 'default',
  noPadding = false,
  ...props
}: DropdownItemProps) {
  const { close, searchText } = useDropdownContext();

  // Filter by search text
  if (searchText) {
    const itemText = extractText(children);
    if (!itemText.toLowerCase().includes(searchText.toLowerCase())) {
      return null;
    }
  }

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    if (closeOnSelect) {
      close();
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 text-sm transition-colors cursor-pointer whitespace-nowrap relative',
        !noPadding && 'px-3 py-1.5',
        variant === 'error'
          ? 'text-error hover:bg-error/10'
          : 'text-text-primary hover:bg-dropdown-item-hover',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

DropdownItem.displayName = 'DropdownItem';

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return <div className={cn('h-px bg-border/60 my-1 mx-2', className)} />;
}

DropdownSeparator.displayName = 'DropdownSeparator';

export default DropdownItem;
