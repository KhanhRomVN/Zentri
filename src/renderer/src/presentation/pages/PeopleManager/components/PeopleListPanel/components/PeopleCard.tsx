// src/renderer/src/presentation/pages/PeopleManager/components/PeopleListPanel/components/PeopleCard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Calendar, Tag, User } from 'lucide-react'
import { Person } from '../../../types'
import { calculateAge, getInitials, formatDate } from '../../../utils/peopleUtils'

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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
            : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold
              ${isSelected ? 'bg-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}
            `}
          >
            {initials}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Age */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {person.full_name}
            </h3>
            {person.preferred_name && (
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                ({person.preferred_name})
              </span>
            )}
            {age && (
              <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                {age} years
              </span>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-1 mb-2">
            {person.gender && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <User className="h-3 w-3" />
                <span className="capitalize">{person.gender}</span>
              </div>
            )}

            {person.date_of_birth && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(person.date_of_birth)}</span>
              </div>
            )}

            {person.nationality && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                <span>{person.nationality}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-1 mb-2">
            {person.primary_email && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{person.primary_email}</span>
              </div>
            )}

            {person.primary_phone && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{person.primary_phone}</span>
              </div>
            )}
          </div>

          {/* Occupation */}
          {person.occupation && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {person.occupation}
              {person.employer && ` at ${person.employer}`}
            </div>
          )}

          {/* Tags */}
          {person.tags && person.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {person.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  <Tag className="h-2 w-2" />
                  {tag}
                </span>
              ))}
              {person.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{person.tags.length - 3} more
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
