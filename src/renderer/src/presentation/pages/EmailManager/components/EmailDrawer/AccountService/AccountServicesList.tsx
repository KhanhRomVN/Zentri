import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import {
  Plus,
  Search,
  Filter,
  Globe,
  Shield,
  Users,
  Zap,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount } from '../../../types'
import AccountServiceCard from './AccountServiceCard'

interface AccountServicesListProps {
  services: ServiceAccount[]
  emailAddress?: string
  onServiceAdd?: (service: Omit<ServiceAccount, 'id' | 'email_id'>) => void
  onServiceEdit?: (service: ServiceAccount) => void
  onServiceDelete?: (serviceId: string) => void
  onServiceClick?: (service: ServiceAccount) => void // Still available for "View Details" button
  className?: string
  compact?: boolean
  showViewDetailsButton?: boolean // NEW: Control whether to show "View Details" button
}

const AccountServicesList: React.FC<AccountServicesListProps> = ({
  services,
  emailAddress,
  onServiceClick,
  className,
  compact = false,
  showViewDetailsButton = false // NEW: Default to false, so cards just expand by default
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Filter services based on search and filters
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.username && service.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.name && service.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = !selectedType || service.service_type === selectedType
    const matchesStatus = !selectedStatus || service.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Get unique service types and statuses from the services
  const serviceTypes = [...new Set(services.map((s) => s.service_type).filter(Boolean))]
  const serviceStatuses = [...new Set(services.map((s) => s.status).filter(Boolean))]

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      social_media: 'Social Media',
      communication: 'Communication',
      developer: 'Developer',
      cloud_storage: 'Cloud Storage',
      ai_saas: 'AI & SaaS',
      productivity_tool: 'Productivity',
      payment_finance: 'Payment & Finance',
      ecommerce: 'E-commerce',
      entertainment: 'Entertainment',
      education: 'Education',
      hosting_domain: 'Hosting & Domain',
      security_vpn: 'Security & VPN',
      government: 'Government',
      health: 'Health',
      gaming: 'Gaming',
      travel_transport: 'Travel & Transport',
      news_media: 'News & Media',
      forum_community: 'Forum & Community',
      iot_smart_device: 'IoT & Smart Device',
      other: 'Other'
    }
    return typeLabels[type] || type.replace(/_/g, ' ')
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended'
    }
    return statusLabels[status] || status
  }

  const handleAddService = () => {
    // Implementation for add service modal
    console.log('Open add service modal')
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className={cn(
              'font-bold text-gray-900 dark:text-white flex items-center gap-2',
              compact ? 'text-lg' : 'text-xl'
            )}
          >
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Service Accounts
            {emailAddress && (
              <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                for {emailAddress}
              </span>
            )}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {services.length} service{services.length !== 1 ? 's' : ''} connected to this email
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAddService}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Service
        </Button>
      </div>

      {/* Search and Filters */}
      {services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services by name, type, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All types</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All statuses</option>
                {serviceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      {filteredServices.length > 0 ? (
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <AccountServiceCard
              key={service.id}
              service={service}
              // CHANGE: Only pass onServiceClick if showViewDetailsButton is true
              onServiceClick={showViewDetailsButton ? onServiceClick : undefined}
              defaultExpanded={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            {services.length === 0 ? (
              <Globe className="h-8 w-8 text-gray-400" />
            ) : (
              <Search className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {services.length === 0 ? 'No service accounts' : 'No services found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {services.length === 0
              ? 'Connect your first service account to get started'
              : 'Try adjusting your search or filters'}
          </p>
          {services.length === 0 && (
            <Button
              onClick={handleAddService}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Service
            </Button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {services.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {services.filter((s) => s.status === 'active').length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {services.filter((s) => s.service_type === 'social_media').length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Social Media</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {services.filter((s) => s.service_type === 'security_vpn').length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Security</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {services.filter((s) => s.status === 'suspended' || s.status === 'inactive').length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Issues</div>
          </div>
        </div>
      )}

      {/* Service Type Distribution - Only show if there are multiple types */}
      {serviceTypes.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Service Distribution
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceTypes.map((type) => {
              const count = services.filter((s) => s.service_type === type).length
              const percentage = Math.round((count / services.length) * 100)

              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {getTypeLabel(type)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {count} service{count !== 1 ? 's' : ''} ({percentage}%)
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountServicesList
