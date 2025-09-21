// src/renderer/src/presentation/pages/EmailManager/components/EmailDetailsDrawer.tsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CustomDrawer from '../../../../components/common/CustomDrawer'
import CustomBreadcrumb, { BreadcrumbItem } from '../../../../components/common/CustomBreadcrumb'
import CustomButton from '../../../../components/common/CustomButton'
import EmailSection from './EmailSection'
import EmailTwoFactorAuthSection from './EmailTwoFactorAuthSection'
import ServicesList from './SecretsList'
import { ArrowLeft, X } from 'lucide-react'
import { Email, ServiceAccount, fakeData } from '../data/mockEmailData'

interface EmailDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  email?: Email | null
}

type ViewType = 'email' | 'services' | '2fa' | 'service_detail'

const EmailDetailsDrawer: React.FC<EmailDetailsDrawerProps> = ({ isOpen, onClose, email }) => {
  const [currentView, setCurrentView] = useState<ViewType>('email')
  const [selectedService, setSelectedService] = useState<ServiceAccount | null>(null)

  // Reset view when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentView('email')
      setSelectedService(null)
    }
  }, [isOpen])

  if (!email) return null

  // Get related data for this email
  const emailServiceAccounts = fakeData.serviceAccounts.filter((sa) => sa.email_id === email.id)
  const email2FAMethods = fakeData.email2FA.filter((e2fa) => e2fa.email_id === email.id)

  // Utility function to get email provider icon
  const getEmailProviderIcon = (provider: string): string => {
    const iconMap: Record<string, string> = {
      gmail: '/src/renderer/src/assets/icon/gmail_icon.png',
      yahoo: '/src/renderer/src/assets/icon/yahoo_icon.png',
      outlook: '/src/renderer/src/assets/icon/outlook_icon.png',
      icloud: '/src/renderer/src/assets/icon/icloud_icon.png'
    }
    return iconMap[provider] || iconMap.gmail
  }

  // Create breadcrumb items based on current view
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const emailProviderIcon = getEmailProviderIcon(email.email_provider)

    const baseItems: BreadcrumbItem[] = [
      {
        label: email.email_address,
        icon: ({ className }) => (
          <img
            src={emailProviderIcon}
            alt={email.email_provider}
            className={className}
            style={{ width: '16px', height: '16px' }}
          />
        ),
        onClick: () => setCurrentView('email')
      }
    ]

    if (currentView === 'service_detail' && selectedService) {
      baseItems.push({
        label: 'Services',
        onClick: () => setCurrentView('services')
      })
      baseItems.push({
        label: `${selectedService.service_name}`,
        isCurrentPage: true
      })
    } else if (currentView !== 'email') {
      const viewLabels = {
        services: 'Services',
        '2fa': '2FA Authentication'
      }

      baseItems.push({
        label: viewLabels[currentView as keyof typeof viewLabels] || currentView,
        isCurrentPage: true
      })
    }

    return baseItems
  }

  const getHeaderActions = () => {
    if (currentView !== 'email') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CustomButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selectedService && currentView === 'service_detail') {
                setSelectedService(null)
                setCurrentView('services')
              } else {
                setCurrentView('email')
              }
            }}
            icon={ArrowLeft}
          >
            Back
          </CustomButton>
        </motion.div>
      )
    }
    return null
  }

  const handleServiceClick = (service: ServiceAccount) => {
    setSelectedService(service)
    setCurrentView('service_detail')
  }

  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      direction="right"
      animationType="elastic"
      enableBlur={true}
      className="shadow-2xl"
      hideHeader={true}
    >
      {/* Override container to fix scroll */}
      <div className="flex flex-col h-full" style={{ height: '100vh' }}>
        {/* Custom Header với Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex-shrink-0 px-6 py-4 border-b border-border bg-card-background"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <CustomBreadcrumb
                items={getBreadcrumbItems()}
                showHomeIcon={false}
                className="text-text-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              {getHeaderActions()}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Fixed Scroll Container */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          style={{ flex: '1 1 0%', minHeight: 0 }}
        >
          <AnimatePresence mode="wait">
            {/* Email View */}
            {currentView === 'email' && (
              <motion.div
                key="email-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 space-y-6 pb-8"
              >
                {/* Email Information Section */}
                <EmailSection
                  email={email}
                  onServiceClick={() => setCurrentView('services')}
                  serviceAccounts={emailServiceAccounts}
                />

                {/* Two-Factor Authentication Section */}
                <EmailTwoFactorAuthSection email={email} email2FAMethods={email2FAMethods} />

                {/* Services List Section - NEW: Added below 2FA */}
                <ServicesList
                  services={emailServiceAccounts}
                  onServiceClick={handleServiceClick}
                  showHeader={true}
                  compact={false}
                />
              </motion.div>
            )}

            {/* Services List View */}
            {currentView === 'services' && !selectedService && (
              <motion.div
                key="services-list-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 pb-8"
              >
                <ServicesList services={emailServiceAccounts} onServiceClick={handleServiceClick} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CustomDrawer>
  )
}

export default EmailDetailsDrawer
