import React from 'react';
import { cn } from '../../../shared/lib/utils';
import { EmptyStateProps, EmptyStateVariant } from './type';

const variantMap: Record<
  EmptyStateVariant,
  { container: string; iconContainer: string; iconColor: string; titleColor: string }
> = {
  default: {
    container: '',
    iconContainer: '',
    iconColor: '',
    titleColor: '',
  },
  'soft-info': {
    container: '',
    iconContainer: 'p-5 rounded-2xl border-2 border-dashed bg-info/10 border-info',
    iconColor: 'text-info',
    titleColor: 'text-info/80',
  },
  'soft-success': {
    container: '',
    iconContainer: 'p-5 rounded-2xl border-2 border-dashed bg-success/10 border-success',
    iconColor: 'text-success',
    titleColor: 'text-success/80',
  },
  'soft-warning': {
    container: '',
    iconContainer: 'p-5 rounded-2xl border-2 border-dashed bg-warn/10 border-warn',
    iconColor: 'text-warn',
    titleColor: 'text-warn/80',
  },
  'soft-error': {
    container: '',
    iconContainer: 'p-5 rounded-2xl border-2 border-dashed bg-error/10 border-error',
    iconColor: 'text-error',
    titleColor: 'text-error/80',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  variant = 'default',
  children,
  className,
}) => {
  const v = variantMap[variant];
  const isDefault = variant === 'default';

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col items-center justify-center text-center',
        isDefault ? 'gap-4 opacity-20 p-4' : 'gap-6 p-8',
        v.container,
        className,
      )}
    >
      <div className={cn('flex items-center justify-center', v.iconContainer)}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: cn(
                isDefault ? 'w-10 h-10' : 'w-12 h-12',
                (icon.props as any)?.className,
                v.iconColor,
              ),
            })
          : icon}
      </div>

      <div className={cn(isDefault ? 'space-y-1' : 'space-y-2')}>
        <h3
          className={cn(
            isDefault
              ? 'text-xs font-black uppercase tracking-widest'
              : 'text-base font-semibold',
            v.titleColor,
          )}
        >
          {title}
        </h3>
        {!isDefault && (
          <p className="text-sm text-muted-foreground/50 max-w-[300px] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
};

export default EmptyState;