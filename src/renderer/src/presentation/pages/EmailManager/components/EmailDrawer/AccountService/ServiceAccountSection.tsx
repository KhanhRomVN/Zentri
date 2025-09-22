// src/renderer/src/presentation/pages/EmailManager/components/ServiceAccountSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import {
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Globe,
  Key,
  Check,
  User,
  Link,
  Tag,
  Plus,
  X,
  Activity,
  Shield,
  ExternalLink
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount } from '../../../types'

interface ServiceAccountSectionProps {
  serviceAccount: ServiceAccount
  className?: string
}

// Curated beautiful hex colors for tags
const TAG_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint Green
  '#FFEAA7', // Light Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Gold
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Peach
  '#82E0AA', // Light Green
  '#F1948A', // Light Pink
  '#85929E', // Blue Gray
  '#D7BDE2', // Lavender
  '#A9DFBF', // Pale Green
  '#F9E79F', // Pale Yellow
  '#AED6F1', // Pale Blue
  '#F5B7B1', // Pale Pink
  '#D5A6BD' // Dusty Pink
]

// Function to get consistent color for a tag
const getTagColor = (tag: string): string => {
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % TAG_COLORS.length
  return TAG_COLORS[index]
}

// Function to determine if text should be dark or light based on background
const getTextColor = (hexColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#374151' : '#FFFFFF' // Dark gray or white
}

const ServiceAccountSection: React.FC<ServiceAccountSectionProps> = ({
  serviceAccount,
  className
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagValue, setNewTagValue] = useState('')

  // Editable fields - mock tags for demonstration
  const [editedTags, setEditedTags] = useState<string[]>([
    serviceAccount.service_type.replace(/_/g, ' '),
    serviceAccount.status || 'active'
  ])
  const [serviceName, setServiceName] = useState(serviceAccount.service_name || '')
  const [serviceUrl, setServiceUrl] = useState(serviceAccount.service_url || '')
  const [username, setUsername] = useState(serviceAccount.username || '')
  const [displayName, setDisplayName] = useState(serviceAccount.name || '')
  const [password, setPassword] = useState(serviceAccount.password || '')
  const [note, setNote] = useState(serviceAccount.note || '')

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Check if values have changed
  const hasServiceNameChanged = serviceName !== (serviceAccount.service_name || '')
  const hasServiceUrlChanged = serviceUrl !== (serviceAccount.service_url || '')
  const hasUsernameChanged = username !== (serviceAccount.username || '')
  const hasDisplayNameChanged = displayName !== (serviceAccount.name || '')
  const hasPasswordChanged = password !== (serviceAccount.password || '')
  const hasNoteChanged = note !== (serviceAccount.note || '')
  const hasTagsChanged =
    JSON.stringify(editedTags.sort()) !==
    JSON.stringify(
      [serviceAccount.service_type.replace(/_/g, ' '), serviceAccount.status || 'active'].sort()
    )

  const handleSaveField = (field: string, value: string | string[]) => {
    console.log(`Saving ${field}:`, value)
    // Handle save logic here
  }

  // Tag management functions
  const handleAddTag = () => {
    if (newTagValue.trim() && !editedTags.includes(newTagValue.trim())) {
      const updatedTags = [...editedTags, newTagValue.trim()]
      setEditedTags(updatedTags)
      setNewTagValue('')
      setShowAddTag(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = editedTags.filter((tag) => tag !== tagToRemove)
    setEditedTags(updatedTags)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setShowAddTag(false)
      setNewTagValue('')
    }
  }

  const getServiceTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      social_media: 'Social Media',
      communication: 'Communication',
      developer: 'Developer',
      cloud_storage: 'Cloud Storage',
      ai_saas: 'AI & SaaS',
      productivity_tool: 'Productivity',
      payment_finance: 'Payment & Finance',
      ecommerce: 'E-commerce',
      entertainment: 'Entertainment',
      education: 'Education',
      hosting_domain: 'Hosting & Domain',
      security_vpn: 'Security & VPN',
      government: 'Government',
      health: 'Health',
      gaming: 'Gaming',
      travel_transport: 'Travel & Transport',
      news_media: 'News & Media',
      forum_community: 'Forum & Community',
      iot_smart_device: 'IoT & Smart Device',
      other: 'Other'
    }
    return typeLabels[type] || type.replace(/_/g, ' ')
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Content - Vertical Layout */}
      <div className="space-y-6">
        {/* Service Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Service Information
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Name */}
              <CustomInput
                label="Service Name"
                value={serviceName}
                onChange={setServiceName}
                placeholder="Enter service name..."
                variant="filled"
                leftIcon={<Globe className="h-4 w-4" />}
                rightIcon={
                  hasServiceNameChanged ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('service_name', serviceName)}
                      className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  ) : undefined
                }
              />

              {/* Service Type (Read Only) */}
              <CustomInput
                label="Service Type"
                value={getServiceTypeLabel(serviceAccount.service_type)}
                readOnly
                variant="filled"
                leftIcon={<Tag className="h-4 w-4" />}
              />

              {/* Service URL */}
              <div className="md:col-span-2">
                <CustomInput
                  label="Service URL"
                  value={serviceUrl}
                  onChange={setServiceUrl}
                  placeholder="https://example.com"
                  variant="filled"
                  leftIcon={<Link className="h-4 w-4" />}
                  rightIcon={
                    <div className="flex items-center gap-1">
                      {serviceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(serviceUrl, '_blank')}
                          className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      {serviceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(serviceUrl)}
                          className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      {hasServiceUrlChanged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveField('service_url', serviceUrl)}
                          className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Credentials Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Account Credentials
              </h4>
            </div>

            <div className="space-y-6">
              {/* Username */}
              <CustomInput
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="Enter username..."
                variant="filled"
                leftIcon={<User className="h-4 w-4" />}
                rightIcon={
                  <div className="flex items-center gap-1">
                    {username && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(username)}
                        className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {hasUsernameChanged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveField('username', username)}
                        className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                }
              />

              {/* Display Name */}
              <CustomInput
                label="Display Name"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Enter display name..."
                variant="filled"
                leftIcon={<User className="h-4 w-4" />}
                rightIcon={
                  <div className="flex items-center gap-1">
                    {displayName && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(displayName)}
                        className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {hasDisplayNameChanged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveField('name', displayName)}
                        className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                }
              />

              {/* Password */}
              <CustomInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Enter password..."
                variant="filled"
                rightIcon={
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    {password && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(password)}
                        className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {hasPasswordChanged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveField('password', password)}
                        className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                }
              />
            </div>

            {/* Enhanced Tags Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Tags</h5>
                </div>

                {/* Save Tags Button */}
                {hasTagsChanged && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveField('tags', editedTags)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save Tags
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                {/* Existing Tags */}
                {editedTags.length > 0 &&
                  editedTags.map((tag, index) => {
                    const bgColor = getTagColor(tag)
                    const textColor = getTextColor(bgColor)

                    return (
                      <div
                        key={index}
                        className="relative group"
                        onMouseEnter={() => setHoveredTag(tag)}
                        onMouseLeave={() => setHoveredTag(null)}
                      >
                        <div
                          className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 cursor-default"
                          style={{
                            backgroundColor: bgColor,
                            color: textColor,
                            borderColor: bgColor
                          }}
                        >
                          {tag}

                          {/* Delete Button - appears on hover */}
                          {hoveredTag === tag && (
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                            >
                              <X className="h-2.5 w-2.5" style={{ color: textColor }} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                {/* Add Tag Button/Input */}
                {!showAddTag ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddTag(true)}
                    className="border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600 h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={newTagValue}
                        onChange={(e) => setNewTagValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter tag name..."
                        autoFocus
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[120px]"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddTag}
                        disabled={!newTagValue.trim() || editedTags.includes(newTagValue.trim())}
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddTag(false)
                          setNewTagValue('')
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tag hint */}
              {showAddTag && (
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to add tag, Escape to cancel
                </p>
              )}
            </div>

            {/* Activity Status */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h5>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    serviceAccount.status === 'active'
                      ? 'bg-green-500'
                      : serviceAccount.status === 'suspended'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                  )}
                />
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {serviceAccount.status || 'unknown'}
                </span>
                {serviceAccount.status === 'active' && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Account is active and accessible
                  </span>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h5>
                {hasNoteChanged && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveField('note', note)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 ml-auto"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save Notes
                  </Button>
                )}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes about this service account..."
                rows={4}
                className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Metadata */}
            {serviceAccount.metadata && Object.keys(serviceAccount.metadata).length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Metadata</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(serviceAccount.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceAccountSection
