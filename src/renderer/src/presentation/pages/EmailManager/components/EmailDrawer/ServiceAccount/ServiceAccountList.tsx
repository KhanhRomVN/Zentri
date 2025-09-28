import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import { Plus, Search, Filter, Globe } from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount, Email } from '../../../types'
import ServiceAccountCard from './ServiceAccountCard'
import CreateServiceAccountForm from './CreateServiceAccountForm'
import CustomButton from '../../../../../../components/common/CustomButton'

interface ServiceAccountListProps {
  services: ServiceAccount[]
  emailAddress?: string
  email?: Email
  onServiceAdd?: (service: Omit<ServiceAccount, 'id' | 'email_id'>) => void
  onServiceEdit?: (service: ServiceAccount) => void
  onServiceDelete?: (serviceId: string) => void
  onServiceClick?: (service: ServiceAccount) => void
  onServiceUpdate?: (serviceId: string, field: string, value: string) => Promise<boolean> // THÊM DÒNG NÀY
  onViewAllServices?: () => void
  className?: string
  compact?: boolean
  showViewDetailsButton?: boolean
}

const ServiceAccountList: React.FC<ServiceAccountListProps> = ({
  services,
  emailAddress,
  email, // Nhận prop email
  onServiceAdd,
  onServiceClick,
  onServiceUpdate,
  className,
  compact = false,
  showViewDetailsButton = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Thêm state để quản lý form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreatingService, setIsCreatingService] = useState(false)

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

  // Sửa handleAddService để hiển thị form
  const handleAddService = () => {
    setShowCreateForm(true)
  }

  // Thêm handler để tạo service
  const handleCreateService = async (serviceData: Omit<ServiceAccount, 'id' | 'email_id'>) => {
    try {
      setIsCreatingService(true)
      if (onServiceAdd) {
        await onServiceAdd(serviceData)
      }
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating service account:', error)
    } finally {
      setIsCreatingService(false)
    }
  }

  // Handler để hủy tạo service
  const handleCancelCreate = () => {
    setShowCreateForm(false)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-2">
          <h3
            className={cn(
              'font-bold text-text-primary flex items-center gap-2',
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

      {/* Create Service Form - Thêm form ở đây */}
      {showCreateForm && email && (
        <CreateServiceAccountForm
          email={email}
          existingServices={services}
          onSubmit={handleCreateService}
          onCancel={handleCancelCreate}
          loading={isCreatingService}
        />
      )}

      {/* Search and Filters */}
      {services.length > 0 && (
        <div className="bg-card-background rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                    {getStatusLabel(status || 'unknown')}
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
          {/* Services Cards - Limited display */}
          {(compact
            ? filteredServices.slice(0, Math.min(5, filteredServices.length))
            : filteredServices
          ).map((service) => (
            <ServiceAccountCard
              key={service.id}
              service={service}
              onServiceClick={showViewDetailsButton ? onServiceClick : undefined}
              onServiceUpdate={onServiceUpdate}
              defaultExpanded={false}
            />
          ))}

          {/* "More" button when there are more than 5 services in compact mode */}
          {compact && filteredServices.length > 5 && (
            <div className="text-center pt-4">
              <CustomButton
                variant="secondary"
                size="md"
                onClick={() => {
                  if (onServiceClick) {
                    onServiceClick({ view: 'all_services' } as any)
                  }
                }}
                className="border-dashed border-2 border-blue-300 hover:border-blue-400 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                View All Services ({filteredServices.length - 5} more)
              </CustomButton>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-card-background rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            {services.length === 0 ? (
              <Globe className="h-8 w-8 text-gray-400" />
            ) : (
              <Search className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
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
    </div>
  )
}

export default ServiceAccountList
