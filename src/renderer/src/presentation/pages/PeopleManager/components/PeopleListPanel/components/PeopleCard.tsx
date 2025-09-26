// src/renderer/src/presentation/pages/PeopleManager/components/PeopleListPanel/components/PeopleCard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { User, MapPin, Briefcase, Mail, Phone } from 'lucide-react'
import { Person } from '../../../types'
import { calculateAge, getInitials } from '../../../utils/peopleUtils'

interface PeopleCardProps {
  person: Person
  isSelected: boolean
  onClick: () => void
}

const PeopleCard: React.FC<PeopleCardProps> = ({ person, isSelected, onClick }) => {
  const initials = getInitials(person.full_name)
  const age = person.date_of_birth ? calculateAge(person.date_of_birth) : null

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
          {/* Name and Age */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary text-sm leading-tight truncate">
                {person.full_name}
              </h3>
              {age && (
                <span className="text-xs text-text-secondary bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  {age}
                </span>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-1.5">
            {/* Email */}
            {person.primary_email && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-3 h-3 opacity-60" />
                <span className="text-xs truncate">{person.primary_email}</span>
              </div>
            )}

            {/* Phone */}
            {person.primary_phone && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="w-3 h-3 opacity-60" />
                <span className="text-xs">{person.primary_phone}</span>
              </div>
            )}

            {/* Occupation */}
            {person.occupation && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Briefcase className="w-3 h-3 opacity-60" />
                <span className="text-xs truncate">
                  {person.occupation}
                  {person.employer && <span className="ml-1">• {person.employer}</span>}
                </span>
              </div>
            )}

            {/* Location Info */}
            <div className="flex items-center gap-2 text-text-secondary">
              {person.gender && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 opacity-60" />
                  <span className="text-xs capitalize">{person.gender}</span>
                </div>
              )}

              {person.nationality && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 opacity-60" />
                  <span className="text-xs">{person.nationality}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {person.tags && person.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {person.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-text-secondary rounded border border-gray-200 dark:border-gray-600"
                >
                  {tag}
                </span>
              ))}
              {person.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-text-secondary">
                  +{person.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default PeopleCard
