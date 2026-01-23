import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../shared/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  isCurrentPage?: boolean
  onClick?: () => void
}

interface CustomBreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ComponentType<{ className?: string }>
  className?: string
  showHomeIcon?: boolean
}

const CustomBreadcrumb: React.FC<CustomBreadcrumbProps> = ({
  items,
  separator: Separator = ChevronRight,
  className,
  showHomeIcon = true
}) => {
  const navigate = useNavigate()

  const handleItemClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault()
      item.onClick()
    } else if (item.href && !item.isCurrentPage) {
      navigate(item.href)
    }
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isClickable = (item.href || item.onClick) && !item.isCurrentPage

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <Separator className="h-4 w-4 text-text-secondary mx-2 flex-shrink-0" />
              )}

              {/* Breadcrumb Item */}
              <div className="flex items-center gap-1.5">
                {/* Icon */}
                {item.icon && (
                  <item.icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isLast || item.isCurrentPage ? 'text-text-primary' : 'text-text-secondary'
                    )}
                  />
                )}

                {/* Home icon for first item if no custom icon */}
                {index === 0 && showHomeIcon && !item.icon && (
                  <Home
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isLast || item.isCurrentPage ? 'text-text-primary' : 'text-text-secondary'
                    )}
                  />
                )}

                {/* Label */}
                {isClickable ? (
                  <button
                    onClick={(e) => handleItemClick(item, e)}
                    className={cn(
                      'font-medium transition-colors duration-200 text-left',
                      'hover:text-primary focus:outline-none focus:text-primary',
                      isLast || item.isCurrentPage
                        ? 'text-text-primary cursor-default pointer-events-none'
                        : 'text-text-secondary hover:text-primary'
                    )}
                    aria-current={isLast || item.isCurrentPage ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    className={cn(
                      'font-medium',
                      isLast || item.isCurrentPage ? 'text-text-primary' : 'text-text-secondary'
                    )}
                    aria-current={isLast || item.isCurrentPage ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default CustomBreadcrumb
