// src/renderer/src/presentation/pages/PeopleManager/components/PeopleListPanel/components/PeopleCard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { User, MapPin, Mail, Phone } from 'lucide-react'
import { Person, PersonInfo, Contact } from '../../../types'

interface PeopleCardProps {
  person: Person
  personInfo: PersonInfo | null
  contacts: Contact[]
  isSelected: boolean
  onClick: () => void
}

const PeopleCard: React.FC<PeopleCardProps> = ({
  person,
  personInfo,
  contacts,
  isSelected,
  onClick
}) => {
  // Helper functions
  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials(personInfo?.full_name || personInfo?.preferred_name)

  // Get primary email and phone from contacts
  const primaryEmail = contacts.find(
    (c) => c.contact_type === 'email' && c.is_primary
  )?.email_address
  const primaryPhone = contacts.find((c) => c.contact_type === 'sms' && c.is_primary)?.phone_number

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
          {/* Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary text-sm leading-tight truncate">
                {personInfo?.preferred_name || personInfo?.full_name || 'Unknown'}
              </h3>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-1.5">
            {/* Email */}
            {primaryEmail && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-3 h-3 opacity-60" />
                <span className="text-xs truncate">{primaryEmail}</span>
              </div>
            )}

            {/* Phone */}
            {primaryPhone && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="w-3 h-3 opacity-60" />
                <span className="text-xs">{primaryPhone}</span>
              </div>
            )}

            {/* Gender */}
            {personInfo?.gender && (
              <div className="flex items-center gap-2 text-text-secondary">
                <User className="w-3 h-3 opacity-60" />
                <span className="text-xs capitalize">{personInfo.gender}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PeopleCard
