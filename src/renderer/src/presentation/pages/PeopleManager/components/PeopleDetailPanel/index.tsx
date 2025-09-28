// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/index.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  FileText,
  Calendar,
  Users,
  MapPin,
  Heart,
  Shield,
  Camera,
  Plus,
  SlidersHorizontal
} from 'lucide-react'
import { Person } from '../../types'
import BasicInfoSection from './components/BasicInfoSection'
import DocumentsSection from './components/DocumentsSection'
import EventsSection from './components/EventsSection'
import MedicalInfoSection from './components/MedicalInfoSection'
import ContactInfoSection from './components/ContactInfoSection'
import ProfessionalInfoSection from './components/ProfessionalInfoSection'
import FamilyInfoSection from './components/FamilyInfoSection'
import CustomButton from '../../../../../components/common/CustomButton'

interface PeopleDetailPanelProps {
  person: Person
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

type TabType =
  | 'basic_info'
  | 'contact_info'
  | 'professional_info'
  | 'family_info'
  | 'medical_info'
  | 'documents'
  | 'events'
  | 'legal'
  | 'media'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  comingSoon?: boolean
}

const TABS: TabConfig[] = [
  {
    id: 'basic_info',
    label: 'Basic Info',
    icon: User,
    description: 'Personal information and contact details'
  },
  {
    id: 'contact_info',
    label: 'Contact',
    icon: MapPin,
    description: 'Contact details and addresses'
  },
  {
    id: 'professional_info',
    label: 'Professional',
    icon: Shield,
    description: 'Work and education information'
  },
  {
    id: 'family_info',
    label: 'Family',
    icon: Users,
    description: 'Family relationships and connections'
  },
  {
    id: 'medical_info',
    label: 'Medical',
    icon: Heart,
    description: 'Health information and medical records'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    description: 'Identification and important documents',
    comingSoon: true
  },
  {
    id: 'events',
    label: 'Events',
    icon: Calendar,
    description: 'Timeline and important dates',
    comingSoon: true
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: Shield,
    description: 'Legal documents and records',
    comingSoon: true
  },
  {
    id: 'media',
    label: 'Media',
    icon: Camera,
    description: 'Photos and media files',
    comingSoon: true
  }
]

const PeopleDetailPanel: React.FC<PeopleDetailPanelProps> = ({ person, onUpdatePerson }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic_info')

  const handleTabClick = (tabId: TabType) => {
    const tab = TABS.find((t) => t.id === tabId)
    if (tab?.comingSoon) {
      return
    }
    setActiveTab(tabId)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic_info':
        return <BasicInfoSection person={person} onUpdatePerson={onUpdatePerson} />

      case 'contact_info':
        return <ContactInfoSection person={person} onUpdatePerson={onUpdatePerson} />

      case 'professional_info':
        return <ProfessionalInfoSection person={person} onUpdatePerson={onUpdatePerson} />

      case 'family_info':
        return <FamilyInfoSection person={person} onUpdatePerson={onUpdatePerson} />

      case 'medical_info':
        return <MedicalInfoSection person={person} onUpdatePerson={onUpdatePerson} />

      case 'documents':
        return <DocumentsSection person={person} onUpdatePerson={onUpdatePerson} />

      case 'events':
        return <EventsSection person={person} onUpdatePerson={onUpdatePerson} />

      case 'legal':
        return (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center space-y-4">
              <Shield className="h-16 w-16 mx-auto opacity-50" />
              <div>
                <h3 className="text-lg font-medium">Legal Information</h3>
                <p className="text-sm mt-2">
                  Legal documents and records management coming soon...
                </p>
              </div>
            </div>
          </div>
        )

      case 'media':
        return (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center space-y-4">
              <Camera className="h-16 w-16 mx-auto opacity-50" />
              <div>
                <h3 className="text-lg font-medium">Media Gallery</h3>
                <p className="text-sm mt-2">Photo and media management coming soon...</p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center space-y-4">
              <div className="text-4xl">🚧</div>
              <div>
                <h3 className="text-lg font-medium">Feature in Development</h3>
                <p className="text-sm mt-2">
                  {TABS.find((tab) => tab.id === activeTab)?.label} feature coming soon...
                </p>
              </div>
            </div>
          </div>
        )
    }
  }

  const getPersonDisplayName = (person: Person) => {
    return person.preferred_name || person.full_name
  }

  const getPersonAge = (person: Person) => {
    if (!person.date_of_birth) return null
    const birthDate = new Date(person.date_of_birth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header Section - Compact và hiện đại */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-transparent">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Person Info - Compact hơn */}
            <div className="flex items-start gap-3">
              {/* Avatar - Nhỏ hơn */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {getPersonDisplayName(person).charAt(0).toUpperCase()}
              </div>

              {/* Basic Details - Bố cục chặt chẽ hơn */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-text-primary truncate">
                    {getPersonDisplayName(person)}
                  </h1>
                  {person.preferred_name && person.preferred_name !== person.full_name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                      aka {person.full_name}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {getPersonAge(person) && (
                    <span className="font-medium">Age: {getPersonAge(person)}</span>
                  )}

                  {person.date_of_birth && (
                    <span className="font-medium">Born: {formatDate(person.date_of_birth)}</span>
                  )}

                  {person.gender && (
                    <span className="font-medium capitalize">Gender: {person.gender}</span>
                  )}

                  {person.nationality && (
                    <span className="font-medium">Nationality: {person.nationality}</span>
                  )}
                </div>

                {/* Contact Info - Hiển thị gọn */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                  {person.primary_email && (
                    <span className="font-medium">Email: {person.primary_email}</span>
                  )}

                  {person.primary_phone && (
                    <span className="font-medium">Phone: {person.primary_phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Level và Action Buttons */}
            <div className="flex items-center gap-2">
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  person.privacy_level === 'public'
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                    : person.privacy_level === 'private'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                      : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                }`}
              >
                {person.privacy_level}
              </div>

              {/* Action Buttons giống EmailManager */}
              <div className="flex items-center gap-1">
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Filter (Coming Soon)"
                >
                  <SlidersHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <CustomButton
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  className="p-2 h-8 w-8 bg-blue-600 hover:bg-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Last Updated Info - Nhỏ hơn */}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-4">
            <span>Last updated: {formatDate(person.updated_at) || 'Unknown'}</span>
            {person.last_verified && <span>Last verified: {formatDate(person.last_verified)}</span>}
          </div>
        </div>
      </div>

      {/* Tab Navigation - Compact hơn */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-transparent">
        <div className="px-6">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isDisabled = tab.comingSoon

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={isDisabled}
                  className={`
                    group relative flex items-center gap-2 py-3 px-1 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2
                    ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                        : isDisabled
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-transparent'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  title={isDisabled ? `${tab.label} - Coming Soon` : tab.description}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}
                  />
                  <span>{tab.label}</span>

                  {isDisabled && (
                    <span className="absolute -top-1 -right-3 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PeopleDetailPanel
