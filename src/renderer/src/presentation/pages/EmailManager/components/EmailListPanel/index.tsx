// src/renderer/src/presentation/pages/EmailManager/components/EmailListPanel/index.tsx
import React, { useState, useMemo } from 'react'
import { Search, Plus, Mail, SlidersHorizontal, X } from 'lucide-react'
import CustomButton from '../../../../../components/common/CustomButton'
import EmailCard from './components/EmailCard'
import { Email, ServiceAccount, Email2FA } from '../../types'

interface EmailListPanelProps {
  emails: Email[]
  serviceAccounts: ServiceAccount[]
  email2FAMethods: Email2FA[]
  selectedEmail: Email | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectEmail: (email: Email) => void
  onCreateNewEmail: () => void
  filters: {
    provider: string[]
    tags: string[]
  }
  onFiltersChange: (filters: any) => void
  isLoading?: boolean
}

const EmailListPanel: React.FC<EmailListPanelProps> = ({
  emails,
  serviceAccounts,
  email2FAMethods,
  selectedEmail,
  searchQuery,
  onSearchChange,
  onSelectEmail,
  onCreateNewEmail,
  filters,
  onFiltersChange,
  isLoading = false
}) => {
  const [showFilters, setShowFilters] = useState(false)

  // Filter emails based on search and filters
  const filteredEmails = useMemo(() => {
    if (!emails || !Array.isArray(emails)) return []
    if (!serviceAccounts || !Array.isArray(serviceAccounts)) return []
    if (!email2FAMethods || !Array.isArray(email2FAMethods)) return []

    return emails.filter((email) => {
      // Search query filter
      const matchesSearch =
        searchQuery === '' ||
        email.email_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.email_provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Provider filter
      const matchesProvider =
        filters.provider.length === 0 ||
        (email.email_provider && filters.provider.includes(email.email_provider))

      // Tags filter
      const matchesTags =
        filters.tags.length === 0 ||
        (email.tags && email.tags.some((tag) => filters.tags.includes(tag)))

      return matchesSearch && matchesProvider && matchesTags
    })
  }, [emails, serviceAccounts, email2FAMethods, searchQuery, filters])

  const clearAllFilters = () => {
    onFiltersChange({ provider: [], tags: [] })
    onSearchChange('')
  }

  const hasActiveFilters = searchQuery || filters.provider.length > 0 || filters.tags.length > 0

  // Helper function to count service accounts for an email
  const getServiceAccountsCount = (emailId: string) => {
    return serviceAccounts.filter((sa) => sa.email_id === emailId).length
  }

  // Helper function to count 2FA methods for an email
  const get2FAMethodsCount = (emailId: string) => {
    return email2FAMethods.filter((method) => method.email_id === emailId).length
  }

  return (
    <div className="h-full flex flex-col border-r border-border-default w-[420px]">
      {/* Header với các action buttons */}
      <div className="flex-none p-4 border-b border-border-default bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Emails</h2>
              <p className="text-xs text-text-secondary">{filteredEmails.length} accounts</p>
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
              onClick={onCreateNewEmail}
              className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              title="Add new email"
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
            placeholder="Search emails..."
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

      {/* Emails List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-text-secondary px-6">
            <div className="p-3 rounded-lg mb-3">
              <Mail className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1 text-center">
              {emails.length === 0 ? 'No emails yet' : 'No results found'}
            </h3>
            <p className="text-xs text-center text-text-secondary mb-3">
              {emails.length === 0
                ? 'Get started by adding your first email account'
                : 'Try adjusting your search or filters'}
            </p>
            {emails.length === 0 && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={onCreateNewEmail}
                icon={Plus}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                Add First Email
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2 border-b border-border-default">
            {filteredEmails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                serviceAccountsCount={getServiceAccountsCount(email.id || '')}
                twoFAMethodsCount={get2FAMethodsCount(email.id || '')}
                isSelected={selectedEmail?.id === email.id}
                onClick={() => onSelectEmail(email)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailListPanel
