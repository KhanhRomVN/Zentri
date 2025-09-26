// src/renderer/src/presentation/pages/PeopleManager/components/PeopleListPanel/index.tsx
import React, { useState, useMemo } from 'react'
import { Search, Plus, Users, SlidersHorizontal, X } from 'lucide-react'
import CustomButton from '../../../../../components/common/CustomButton'
import PeopleCard from './components/PeopleCard'
import { Person } from '../../types'

interface PeopleListPanelProps {
  people: Person[]
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

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const genders = Array.from(new Set(people.map((p) => p.gender).filter(Boolean))) as string[]
    const nationalities = Array.from(
      new Set(people.map((p) => p.nationality).filter(Boolean))
    ) as string[]
    const allTags = people.flatMap((p) => p.tags || [])
    const tags = Array.from(new Set(allTags))

    return { genders, nationalities, tags }
  }, [people])

  // Filter people based on search and filters
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      // Search query filter
      const matchesSearch =
        searchQuery === '' ||
        person.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.preferred_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.primary_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.primary_phone?.includes(searchQuery) ||
        person.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Gender filter
      const matchesGender =
        filters.gender.length === 0 || (person.gender && filters.gender.includes(person.gender))

      // Nationality filter
      const matchesNationality =
        filters.nationality.length === 0 ||
        (person.nationality && filters.nationality.includes(person.nationality))

      // Tags filter
      const matchesTags =
        filters.tags.length === 0 ||
        (person.tags && filters.tags.some((tag) => person.tags!.includes(tag)))

      return matchesSearch && matchesGender && matchesNationality && matchesTags
    })
  }, [people, searchQuery, filters])

  const handleFilterToggle = (type: 'gender' | 'nationality' | 'tags', value: string) => {
    const currentFilters = filters[type]
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((f) => f !== value)
      : [...currentFilters, value]

    onFiltersChange({ ...filters, [type]: newFilters })
  }

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
            {filteredPeople.map((person) => (
              <PeopleCard
                key={person.id}
                person={person}
                isSelected={selectedPerson?.id === person.id}
                onClick={() => onSelectPerson(person)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PeopleListPanel
