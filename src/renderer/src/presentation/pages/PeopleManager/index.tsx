// src/renderer/src/presentation/pages/PeopleManager/index.tsx
import { useState } from 'react'
import CustomBreadcrumb, { BreadcrumbItem } from '../../../components/common/CustomBreadcrumb'
import { Users, Database, X, AlertCircle } from 'lucide-react'
import { usePeopleManager } from './hooks/usePeopleManager'
import DatabaseModal from './components/DatabaseModal'
import PeopleListPanel from './components/PeopleListPanel'
import { Person } from './types'
import CreatePeopleModal from './components/CreatePeopleModal'
// import PeopleDetailPanel from './components/PeopleDetailPanel'

const PeopleManagerPage = () => {
  const {
    // Database state
    currentDatabase,
    isLoading,
    error,
    isDatabaseReady,
    showDatabaseModal,

    // People data
    people,
    filteredPeople,
    selectedPerson,

    // Search and filters
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    clearFilters,

    // Actions
    selectPerson,
    createPerson,
    updatePerson,
    deletePerson,
    handleDatabaseSelected,
    closeDatabase,
    clearError
  } = usePeopleManager()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreatingPerson, setIsCreatingPerson] = useState(false)
  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Users
    },
    {
      label: 'People Manager',
      isCurrentPage: true
    }
  ]

  const handleCreateNewPerson = () => {
    setShowCreateModal(true)
  }

  const handleCreatePersonSubmit = async (personData: Omit<Person, 'id'>) => {
    try {
      setIsCreatingPerson(true)
      const newPerson = await createPerson(personData)
      if (newPerson) {
        setShowCreateModal(false)
        // Optionally select the newly created person
        selectPerson(newPerson)
      }
    } catch (error) {
      console.error('Error creating person:', error)
      // Error will be handled by the usePeopleManager hook
    } finally {
      setIsCreatingPerson(false)
    }
  }

  const handleCloseCreateModal = () => {
    if (!isCreatingPerson) {
      setShowCreateModal(false)
    }
  }

  // If database modal should be shown, render only the modal
  if (showDatabaseModal) {
    return <DatabaseModal onDatabaseSelected={handleDatabaseSelected} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full h-full flex">
        {/* Left Panel - People List */}
        <div className="w-96 flex-shrink-0 h-screen overflow-hidden">
          <PeopleListPanel
            people={filteredPeople}
            selectedPerson={selectedPerson}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectPerson={selectPerson}
            onCreateNewPerson={handleCreateNewPerson}
            filters={filters}
            onFiltersChange={updateFilters}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - Person Details */}
        <div className="flex-1 min-w-0">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CustomBreadcrumb items={breadcrumbItems} className="text-text-secondary" />

                  {currentDatabase && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full">
                      <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {currentDatabase.name}
                      </span>
                      <button
                        onClick={closeDatabase}
                        className="p-0.5 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
                        title="Close database"
                      >
                        <X className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {people.length} people total
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                      Database Error
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    <button
                      onClick={clearError}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-2 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {/* <div className="flex-1 overflow-auto">
              {selectedPerson ? (
                <PeopleDetailPanel
                  person={selectedPerson}
                  onUpdatePerson={updatePerson}
                  onDeletePerson={deletePerson}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        No Person Selected
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select a person from the list to view details
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div> */}

            <CreatePeopleModal
              isOpen={showCreateModal}
              onClose={handleCloseCreateModal}
              onSubmit={handleCreatePersonSubmit}
              loading={isCreatingPerson}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PeopleManagerPage
