// src/renderer/src/presentation/pages/PeopleManager/components/PeopleListPanel/index.tsx
import React, { useState, useMemo } from 'react'
import { Search, Plus, Users, SlidersHorizontal, X } from 'lucide-react'
import CustomButton from '../../../../../components/common/CustomButton'
import PeopleCard from './components/PeopleCard'
import { Person, PersonInfo, Contact } from '../../types'

interface PeopleListPanelProps {
  people: Person[]
  personInfos: PersonInfo[]
  contacts: Contact[]
  selectedPerson: Person | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectPerson: (person: Person) => void
  onCreateNewPerson: () => void
  filters: {
    gender: string[]
    nationality: string[]
    tags: string[]
  }
  onFiltersChange: (filters: any) => void
  isLoading?: boolean
}

const PeopleListPanel: React.FC<PeopleListPanelProps> = ({
  people,
  personInfos,
  contacts,
  selectedPerson,
  searchQuery,
  onSearchChange,
  onSelectPerson,
  onCreateNewPerson,
  filters,
  onFiltersChange,
  isLoading = false
}) => {
  const [showFilters, setShowFilters] = useState(false)

  // Filter people based on search and filters
  // Filter people based on search and filters
  // Filter people based on search and filters
  const filteredPeople = useMemo(() => {
    // Safety check: ensure arrays exist
    if (!people || !Array.isArray(people)) return []
    if (!personInfos || !Array.isArray(personInfos)) return []
    if (!contacts || !Array.isArray(contacts)) return []

    return people.filter((person) => {
      const personInfo = personInfos.find((info) => info.person_id === person.id)
      const personContacts = contacts.filter((c) => c.person_id === person.id)

      // Search query filter
      const matchesSearch =
        searchQuery === '' ||
        personInfo?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        personInfo?.preferred_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        personContacts.some(
          (c) =>
            c.contact_type === 'email' &&
            c.email_address?.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        personContacts.some(
          (c) => c.contact_type === 'sms' && c.phone_number?.includes(searchQuery)
        )

      // Gender filter
      const matchesGender =
        filters.gender.length === 0 ||
        (personInfo?.gender && filters.gender.includes(personInfo.gender))

      return matchesSearch && matchesGender
    })
  }, [people, personInfos, contacts, searchQuery, filters])

  const clearAllFilters = () => {
    onFiltersChange({ gender: [], nationality: [], tags: [] })
    onSearchChange('')
  }

  const hasActiveFilters =
    searchQuery ||
    filters.gender.length > 0 ||
    filters.nationality.length > 0 ||
    filters.tags.length > 0

  return (
    <div className="h-full flex flex-col border-r border-border-default w-[420px]">
      {/* Header với các action buttons */}
      <div className="flex-none p-4 border-b border-border-default bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">People</h2>
              <p className="text-xs text-text-secondary">{filteredPeople.length} contacts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-sidebar-itemHover rounded-lg transition-colors"
              title="Filter (Coming Soon)"
            >
              <SlidersHorizontal className="h-4 w-4 text-text-secondary" />
            </button>
            <button
              onClick={onCreateNewPerson}
              className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              title="Add new person"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary/60" />
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-border-default rounded-lg text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <X className="h-3 w-3 text-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex-none px-4 py-2 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              Active filters
            </span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* People List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-text-secondary px-6">
            <div className="p-3 rounded-lg mb-3">
              <Users className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1 text-center">
              {people.length === 0 ? 'No contacts yet' : 'No results found'}
            </h3>
            <p className="text-xs text-center text-text-secondary mb-3">
              {people.length === 0
                ? 'Get started by adding your first contact'
                : 'Try adjusting your search or filters'}
            </p>
            {people.length === 0 && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={onCreateNewPerson}
                icon={Plus}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                Add First Contact
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2 border-b border-border-default">
            {filteredPeople.map((person) => {
              const personInfo = personInfos?.find((info) => info.person_id === person.id) || null
              const personContacts = contacts?.filter((c) => c.person_id === person.id) || []

              return (
                <PeopleCard
                  key={person.id}
                  person={person}
                  personInfo={personInfo}
                  contacts={personContacts}
                  isSelected={selectedPerson?.id === person.id}
                  onClick={() => onSelectPerson(person)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PeopleListPanel
