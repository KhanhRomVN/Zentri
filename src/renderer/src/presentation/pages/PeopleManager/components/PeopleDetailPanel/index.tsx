// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/index.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  FileText,
  Calendar,
  Users,
  Heart,
  Shield,
  Camera,
  Plus,
  SlidersHorizontal
} from 'lucide-react'
import {
  Person,
  PersonInfo,
  Identification,
  Address,
  Contact,
  ServiceAccount,
  Relationship
} from '../../types'
import CustomButton from '../../../../../components/common/CustomButton'
import PersonalSection from './components/PersonalSection'
import SocialSection from './components/SocialSection'

interface PeopleDetailPanelProps {
  person: Person
  personInfo: PersonInfo | null
  identifications: Identification[]
  addresses: Address[]
  contacts: Contact[]
  serviceAccounts: ServiceAccount[]
  relationships: Relationship[]
  allPeople: Person[]
  allPersonInfos: PersonInfo[]
  onUpdatePersonInfo?: (id: string, updates: Partial<PersonInfo>) => Promise<boolean>
  onCreatePersonInfo?: (data: Omit<PersonInfo, 'id'>) => Promise<PersonInfo | null>
  onCreateIdentification?: (data: Omit<Identification, 'id'>) => Promise<Identification | null>
  onUpdateIdentification?: (id: string, updates: Partial<Identification>) => Promise<boolean>
  onDeleteIdentification?: (id: string) => Promise<boolean>
  onCreateAddress?: (data: Omit<Address, 'id'>) => Promise<Address | null>
  onUpdateAddress?: (id: string, updates: Partial<Address>) => Promise<boolean>
  onDeleteAddress?: (id: string) => Promise<boolean>
  onCreateContact?: (data: Omit<Contact, 'id'>) => Promise<Contact | null>
  onUpdateContact?: (id: string, updates: Partial<Contact>) => Promise<boolean>
  onDeleteContact?: (id: string) => Promise<boolean>
  onCreateServiceAccount?: (data: Omit<ServiceAccount, 'id'>) => Promise<ServiceAccount | null>
  onUpdateServiceAccount?: (id: string, updates: Partial<ServiceAccount>) => Promise<boolean>
  onDeleteServiceAccount?: (id: string) => Promise<boolean>
  onCreateRelationship?: (data: Omit<Relationship, 'id'>) => Promise<Relationship | null>
  onUpdateRelationship?: (id: string, updates: Partial<Relationship>) => Promise<boolean>
  onDeleteRelationship?: (id: string) => Promise<boolean>
}

type TabType =
  | 'personal'
  | 'professional'
  | 'family'
  | 'medical'
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
    id: 'personal',
    label: 'Personal',
    icon: User,
    description: 'Personal information and contact details'
  },
  {
    id: 'family',
    label: 'Social',
    icon: Users,
    description: 'Social networks and relationships'
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Shield,
    description: 'Work and education information',
    comingSoon: true
  },
  {
    id: 'medical',
    label: 'Medical',
    icon: Heart,
    description: 'Health information and medical records',
    comingSoon: true
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

const PeopleDetailPanel: React.FC<PeopleDetailPanelProps> = ({
  person,
  personInfo,
  identifications,
  addresses,
  contacts,
  serviceAccounts,
  relationships,
  allPeople,
  allPersonInfos,
  onUpdatePersonInfo,
  onCreatePersonInfo,
  onCreateIdentification,
  onUpdateIdentification,
  onDeleteIdentification,
  onCreateAddress,
  onUpdateAddress,
  onDeleteAddress,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
  onCreateServiceAccount,
  onUpdateServiceAccount,
  onDeleteServiceAccount,
  onCreateRelationship,
  onUpdateRelationship,
  onDeleteRelationship
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal')

  const handleTabClick = (tabId: TabType) => {
    const tab = TABS.find((t) => t.id === tabId)
    if (tab?.comingSoon) {
      return
    }
    setActiveTab(tabId)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalSection
            person={person}
            personInfo={personInfo}
            identifications={identifications}
            addresses={addresses}
            contacts={contacts}
            onUpdatePersonInfo={onUpdatePersonInfo}
            onCreatePersonInfo={onCreatePersonInfo}
            onCreateIdentification={onCreateIdentification}
            onUpdateIdentification={onUpdateIdentification}
            onDeleteIdentification={onDeleteIdentification}
            onCreateAddress={onCreateAddress}
            onUpdateAddress={onUpdateAddress}
            onDeleteAddress={onDeleteAddress}
            onCreateContact={onCreateContact}
            onUpdateContact={onUpdateContact}
            onDeleteContact={onDeleteContact}
          />
        )

      case 'family':
        return (
          <SocialSection
            person={person}
            serviceAccounts={serviceAccounts}
            relationships={relationships}
            allPeople={allPeople}
            allPersonInfos={allPersonInfos}
            onCreateServiceAccount={onCreateServiceAccount}
            onUpdateServiceAccount={onUpdateServiceAccount}
            onDeleteServiceAccount={onDeleteServiceAccount}
            onCreateRelationship={onCreateRelationship}
            onUpdateRelationship={onUpdateRelationship}
            onDeleteRelationship={onDeleteRelationship}
          />
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

  const getPersonDisplayName = (_person: Person, personInfo: PersonInfo | null) => {
    return personInfo?.preferred_name || personInfo?.full_name || 'Unknown'
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header Section */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-transparent">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Person Info */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {getPersonDisplayName(person, personInfo).charAt(0).toUpperCase()}
              </div>

              {/* Basic Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-text-primary truncate">
                    {getPersonDisplayName(person, personInfo)}
                  </h1>
                  {personInfo?.preferred_name &&
                    personInfo.preferred_name !== personInfo.full_name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                        aka {personInfo.full_name}
                      </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {personInfo?.gender && (
                    <span className="font-medium capitalize">Gender: {personInfo.gender}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
                children={undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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
