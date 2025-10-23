// src/renderer/src/presentation/pages/EmailManager/components/EmailListPanel/components/EmailCard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Globe, Shield, Tag } from 'lucide-react'
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

  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-lg p-3 transition-all duration-200 ease-out
        ${isSelected ? 'bg-card-background border-transparent' : 'border-transparent '}
      `}
    >
      {/* Selected indicator */}
      {isSelected && <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full" />}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm
              transition-all duration-200
              ${
                isSelected
                  ? 'bg-primary shadow-sm'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 group-hover:shadow-sm'
              }
            `}
          >
            {initials}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Name & Email */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              {email.name && (
                <h3 className="font-medium text-text-primary text-sm leading-tight truncate">
                  {email.name}
                </h3>
              )}
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-3 h-3 opacity-60 flex-shrink-0" />
                <span className="text-xs truncate">{email.email_address}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-1.5">
            {/* Provider */}
            <div className="flex items-center gap-2 text-text-secondary">
              <Globe className="w-3 h-3 opacity-60 flex-shrink-0" />
              <span className="text-xs truncate">{email.email_provider}</span>
            </div>

            {/* Address (if available) */}
            {email.address && (
              <div className="flex items-center gap-2 text-text-secondary">
                <MapPin className="w-3 h-3 opacity-60 flex-shrink-0" />
                <span className="text-xs truncate">{email.address}</span>
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-3 pt-1">
              {serviceAccountsCount > 0 && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {serviceAccountsCount}
                  </span>
                </div>
              )}

              {twoFAMethodsCount > 0 && (
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    {twoFAMethodsCount}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {email.tags && email.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-1">
                <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                {email.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {email.tags.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{email.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EmailCard
