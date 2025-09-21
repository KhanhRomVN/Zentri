// src/renderer/src/presentation/pages/EmailManager/components/ServiceCard.tsx
import React, { useState } from 'react'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import {
  ExternalLink,
  User,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Key,
  Link
} from 'lucide-react'
import { cn } from '../../../../shared/lib/utils'
import { ServiceAccount } from '../data/mockEmailData'

interface ServiceCardProps {
  service: ServiceAccount
  onClick?: () => void
  onServiceClick?: (service: ServiceAccount) => void
  className?: string
  defaultExpanded?: boolean
  showNestedServices?: boolean
  nestedServices?: ServiceAccount[]
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onClick,
  onServiceClick,
  className,
  defaultExpanded = false,
  showNestedServices = false,
  nestedServices = []
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showPassword, setShowPassword] = useState(false)

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700'
      case 'inactive':
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
      case 'suspended':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
    }
  }

  // Priority display value: name > username > service metadata
  const getPrimaryDisplayValue = () => {
    if (service.name) return { value: service.name, icon: User, label: 'Name' }
    if (service.username) return { value: service.username, icon: User, label: 'Username' }
    if (service.password)
      return {
        value: showPassword ? service.password : '•'.repeat(Math.min(service.password.length, 12)),
        icon: Key,
        label: 'Password',
        isPassword: true
      }
    return null
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return

    setIsExpanded(!isExpanded)
    if (onClick) onClick()
  }

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (service.service_url) {
      window.open(service.service_url, '_blank')
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Edit service:', service.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Delete service:', service.id)
  }

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPassword(!showPassword)
  }

  // Handle password section clicks in collapsed mode
  const handlePasswordClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPassword(!showPassword)
  }

  const handlePasswordRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (service.password) {
      navigator.clipboard.writeText(service.password)
      console.log('Password copied to clipboard')
    }
  }

  const handleNestedServiceClick = (nestedService: ServiceAccount) => {
    if (onServiceClick) {
      onServiceClick(nestedService)
    }
  }

  const primaryValue = getPrimaryDisplayValue()

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 overflow-hidden',
        isExpanded
          ? 'hover:shadow-lg'
          : 'cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-600 hover:-translate-y-1',
        className
      )}
    >
      {/* Status Indicator - Moved to Left Border */}
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full',
          service.status === 'active'
            ? 'bg-emerald-500'
            : service.status === 'suspended'
              ? 'bg-red-500'
              : 'bg-gray-400'
        )}
      />

      {/* Collapsed View */}
      <div
        className={cn('p-4 transition-all duration-300', !isExpanded && 'cursor-pointer')}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          {/* Left Section - Icon + Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
            {/* Service Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center shadow-sm">
                <Globe className="h-4 w-4 text-white" />
              </div>
              {/* Status Dot */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                  service.status === 'active'
                    ? 'bg-emerald-500'
                    : service.status === 'suspended'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                )}
              />
            </div>

            {/* Service Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {service.service_name}
                </h3>
                {service.service_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExternalLink}
                    className="p-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-900/20"
                    title="Open website"
                  >
                    <ExternalLink className="h-3 w-3 text-blue-600" />
                  </Button>
                )}
              </div>

              {/* Primary Display Value */}
              {primaryValue && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <primaryValue.icon className="h-3 w-3" />
                  <span className="text-sm font-medium truncate">{primaryValue.value}</span>
                  {primaryValue.isPassword && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePasswordVisibility}
                        className="p-0.5 h-4 w-4 text-gray-500 hover:text-amber-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-2.5 w-2.5" />
                        ) : (
                          <Eye className="h-2.5 w-2.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => copyToClipboard(service.password!, e)}
                        className="p-0.5 h-4 w-4 text-gray-500 hover:text-blue-600"
                      >
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Password Display + Expand Button */}
          <div className="flex items-center gap-3">
            {/* Password Section - Always show if password exists */}
            {service.password && !isExpanded && (
              <div
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={handlePasswordClick}
                onContextMenu={handlePasswordRightClick}
                title="Left click to toggle visibility, right click to copy"
              >
                <Key className="h-3 w-3 text-amber-600" />
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 select-none">
                  {showPassword
                    ? service.password.length > 8
                      ? `${service.password.substring(0, 8)}...`
                      : service.password
                    : '•'.repeat(Math.min(service.password.length, 8))}
                </span>
              </div>
            )}

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 transition-transform" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-700 ml-2" />

          {/* Detailed Information */}
          <div className="space-y-3 ml-2">
            {/* All available information */}
            {service.username && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {service.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => service.username && copyToClipboard(service.username, e)}
                    className="p-1 h-6 w-6 text-gray-500 hover:text-blue-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {service.name && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Name
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {service.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => copyToClipboard(service.name!, e)}
                    className="p-1 h-6 w-6 text-gray-500 hover:text-blue-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {service.password && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {showPassword
                      ? service.password.length > 12
                        ? `${service.password.substring(0, 12)}...`
                        : service.password
                      : '•'.repeat(Math.min(service.password.length, 12))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePasswordVisibility}
                    className="p-1 h-6 w-6 text-gray-500 hover:text-amber-600"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => copyToClipboard(service.password!, e)}
                    className="p-1 h-6 w-6 text-gray-500 hover:text-blue-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {service.service_url && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service URL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900 dark:text-white truncate max-w-32">
                    {service.service_url}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => copyToClipboard(service.service_url!, e)}
                    className="p-1 h-6 w-6 text-gray-500 hover:text-blue-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tags & Category */}
          <div className="flex items-center gap-2 ml-2">
            {service.service_type && (
              <Badge
                variant="secondary"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
              >
                {service.service_type.replace(/_/g, ' ')}
              </Badge>
            )}
            <Badge variant="secondary" className={getStatusColor(service.status)}>
              {service.status || 'unknown'}
            </Badge>
          </div>

          {/* Notes */}
          {service.note && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 ml-2">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Notes</div>
              <div className="text-sm text-blue-700 dark:text-blue-200">{service.note}</div>
            </div>
          )}

          {/* Action Buttons - Show when expanded */}
          <div className="flex items-center justify-end gap-2 pt-2 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onServiceClick && onServiceClick(service)}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-indigo-900/20"
            >
              <Shield className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>

          {/* Nested Services List */}
          {showNestedServices && nestedServices && nestedServices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 ml-2">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Related Services ({nestedServices.length})
                </h4>
              </div>
              <div className="space-y-2">
                {nestedServices.map((nestedService) => (
                  <ServiceCard
                    key={nestedService.id}
                    service={nestedService}
                    onClick={() => handleNestedServiceClick(nestedService)}
                    onServiceClick={onServiceClick}
                    className="ml-4 border-l-2 border-blue-200 dark:border-blue-700"
                    defaultExpanded={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metadata Bottom Bar */}
          {service.metadata && Object.keys(service.metadata).length > 0 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 -mx-4 -mb-4 rounded-b-2xl">
              <div className="flex flex-wrap gap-2">
                {Object.entries(service.metadata)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-600"
                    >
                      {key.replace(/_/g, ' ')}: <span className="font-medium">{String(value)}</span>
                    </span>
                  ))}
                {Object.keys(service.metadata).length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                    +{Object.keys(service.metadata).length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ServiceCard
