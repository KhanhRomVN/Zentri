// src/renderer/src/presentation/pages/EmailManager/components/EmailListPanel/components/EmailCard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { Phone, Shield, Globe, Tag } from 'lucide-react'
import { Email } from '../../../types'

interface EmailCardProps {
  email: Email
  serviceAccountsCount: number
  twoFAMethodsCount: number
  isSelected: boolean
  onClick: () => void
}

const EmailCard: React.FC<EmailCardProps> = ({
  email,
  serviceAccountsCount,
  twoFAMethodsCount,
  isSelected,
  onClick
}) => {
  const getInitials = (emailAddress: string): string => {
    return emailAddress.charAt(0).toUpperCase()
  }

  const initials = getInitials(email.email_address)

  // Check if email has phone number
  const hasPhoneNumber = !!email.phone_numbers && email.phone_numbers.trim().length > 0

  // Check if email has "main" tag
  const hasMainTag = email.tags && email.tags.includes('main')

  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-lg p-3 transition-all duration-200 ease-out
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
            : 'bg-card-background border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
      )}

      <div className="flex items-center gap-3">
        {/* Avatar/Favicon */}
        <div className="relative flex-shrink-0">
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm
              transition-all duration-200
              ${
                isSelected
                  ? 'bg-blue-600 shadow-sm'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 group-hover:shadow-sm'
              }
            `}
          >
            {initials}
          </div>
        </div>

        {/* Content - 2 dòng */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Dòng 1: Favicon + Email address */}
          <div className="flex items-center gap-2">
            <img
              src={`/src/renderer/src/assets/icon/${email.email_provider}_icon.png`}
              alt={email.email_provider}
              className="w-3 h-3 flex-shrink-0"
            />
            <span className="text-sm font-medium text-text-primary truncate">
              {email.email_address}
            </span>
          </div>

          {/* Dòng 2: Thông tin liệt kê */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Số lượng service */}
            {serviceAccountsCount > 0 && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-text-secondary">{serviceAccountsCount}</span>
              </div>
            )}

            {/* Số lượng security/2FA */}
            {twoFAMethodsCount > 0 && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-text-secondary">{twoFAMethodsCount}</span>
              </div>
            )}

            {/* Có số điện thoại */}
            {hasPhoneNumber && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="text-xs text-text-secondary">Phone</span>
              </div>
            )}

            {/* Có tag "main" */}
            {hasMainTag && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  Main
                </span>
              </div>
            )}

            {/* Hiển thị thông báo nếu không có gì */}
            {serviceAccountsCount === 0 &&
              twoFAMethodsCount === 0 &&
              !hasPhoneNumber &&
              !hasMainTag && (
                <span className="text-xs text-gray-400 dark:text-gray-500">No additional info</span>
              )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EmailCard
