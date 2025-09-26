// src/renderer/src/presentation/pages/PeopleManager/components/PeopleListPanel/index.tsx
import React, { useState, useMemo } from 'react'
import { Search, Plus, Users, SlidersHorizontal } from 'lucide-react'
import CustomInput from '../../../../../components/common/CustomInput'
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
    <div className="h-full flex flex-col border-r border-border-default">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              People ({filteredPeople.length})
            </h2>
          </div>
          <CustomButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onCreateNewPerson}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Person
          </CustomButton>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
            {/* Gender Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Gender
              </label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.genders.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => handleFilterToggle('gender', gender)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      filters.gender.includes(gender)
                        ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                        : 'bg-white text-gray-600 border-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Nationality Filter */}
            {filterOptions.nationalities.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Nationality
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.nationalities.slice(0, 5).map((nationality) => (
                    <button
                      key={nationality}
                      onClick={() => handleFilterToggle('nationality', nationality)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.nationality.includes(nationality)
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                          : 'bg-white text-gray-600 border-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {nationality}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {filterOptions.tags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.tags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleFilterToggle('tags', tag)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
                          : 'bg-white text-gray-600 border-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* People List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">
              {people.length === 0 ? 'No people found' : 'No matching people found'}
            </p>
            {people.length === 0 && (
              <button
                onClick={onCreateNewPerson}
                className="text-blue-600 hover:text-blue-700 text-sm mt-2"
              >
                Add your first person
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
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
