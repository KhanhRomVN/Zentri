// src/renderer/src/presentation/pages/EmailManager/components/ServicesList.tsx
import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Plus, Search, Filter, Grid, List, Globe, User, Key, Activity } from 'lucide-react'
import { Input } from '../../../../components/ui/input'
import { cn } from '../../../../shared/lib/utils'
import ServiceCard from './ServiceCard'
import { ServiceAccount } from '../data/mockEmailData'

interface ServicesListProps {
  services: ServiceAccount[]
  onServiceClick: (service: ServiceAccount) => void
  className?: string
  showHeader?: boolean
  compact?: boolean
}

const ServicesList: React.FC<ServicesListProps> = ({
  services,
  onServiceClick,
  className,
  showHeader = true,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Get unique service types
  const serviceTypes = [...new Set(services.map((s) => s.service_type).filter(Boolean))]
  const statuses = [...new Set(services.map((s) => s.status).filter(Boolean))]

  const getServiceTypeLabel = (type: string) => {
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
    return typeLabels[type] || type
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.username && service.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.name && service.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = !selectedServiceType || service.service_type === selectedServiceType
    const matchesStatus = !selectedStatus || service.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={cn(
                'font-bold text-gray-900 dark:text-white flex items-center gap-2',
                compact ? 'text-lg' : 'text-xl'
              )}
            >
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Services liên kết
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {services.length} service đã liên kết với email này
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  'h-7 w-7 p-0',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <List className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'h-7 w-7 p-0',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <Grid className="h-3 w-3" />
              </Button>
            </div>

            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm Service
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm service, username hoặc name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Tất cả loại</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {getServiceTypeLabel(type)}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid/List */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Không tìm thấy service
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}
        >
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onServiceClick={onServiceClick}
              defaultExpanded={false}
              className={cn(viewMode === 'grid' && 'h-fit')}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {showHeader && !compact && filteredServices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {filteredServices.filter((s) => s.status === 'active').length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Services</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {serviceTypes.length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Service Types</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {filteredServices.filter((s) => s.password).length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Passwords</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {filteredServices.filter((s) => s.username).length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Username</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServicesList
