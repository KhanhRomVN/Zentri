// src/renderer/src/presentation/pages/EmailManager/components/EmailSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import CustomInput from '../../../../components/common/CustomInput'
import {
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Clock,
  Phone,
  Key,
  Check,
  Mail,
  Activity,
  X,
  Plus,
  Tag,
  User,
  MapPin
} from 'lucide-react'
import { cn } from '../../../../shared/lib/utils'
import { Email, ServiceAccount } from '../data/mockEmailData'

interface EmailSectionProps {
  email: Email
  className?: string
  onServiceClick?: (service: ServiceAccount) => void
  serviceAccounts?: ServiceAccount[]
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

const EmailSection: React.FC<EmailSectionProps> = ({ email, className }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagValue, setNewTagValue] = useState('')

  // Editable fields
  const [phoneNumbers, setPhoneNumbers] = useState(email.phone_numbers || '')
  const [recoveryEmail, setRecoveryEmail] = useState(email.recovery_email || '')
  const [password, setPassword] = useState(email.pasword || '')
  const [editedTags, setEditedTags] = useState<string[]>(email.tags || [])
  const [name, setName] = useState(email.name || '')
  const [age, setAge] = useState(email.age?.toString() || '')
  const [address, setAddress] = useState(email.address || '')

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDaysSinceLastLogin = () => {
    if (!email.metadata?.last_login) return null
    const lastLogin = new Date(email.metadata.last_login)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastLogin.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Check if values have changed
  const hasPhoneChanged = phoneNumbers !== (email.phone_numbers || '')
  const hasRecoveryEmailChanged = recoveryEmail !== (email.recovery_email || '')
  const hasPasswordChanged = password !== (email.pasword || '')
  const hasTagsChanged =
    JSON.stringify(editedTags.sort()) !== JSON.stringify((email.tags || []).sort())
  const hasNameChanged = name !== (email.name || '')
  const hasAgeChanged = age !== (email.age?.toString() || '')
  const hasAddressChanged = address !== (email.address || '')

  const handleSaveField = (field: string, value: string | string[] | number) => {
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Content - Vertical Layout */}
      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Personal Information
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <CustomInput
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Enter full name..."
                variant="filled"
                leftIcon={<User className="h-4 w-4" />}
                rightIcon={
                  hasNameChanged ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('name', name)}
                      className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  ) : undefined
                }
              />

              {/* Age */}
              <CustomInput
                label="Age"
                type="number"
                value={age}
                onChange={setAge}
                placeholder="Enter age..."
                variant="filled"
                rightIcon={
                  hasAgeChanged ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('age', parseInt(age) || 0)}
                      className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  ) : undefined
                }
              />

              {/* Address */}
              <div className="md:col-span-2">
                <CustomInput
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Enter address..."
                  variant="filled"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  rightIcon={
                    <div className="flex items-center gap-1">
                      {address && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(address)}
                          className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      {hasAddressChanged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveField('address', address)}
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

        {/* Credentials Section - Enhanced */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">Credentials</h4>
            </div>

            <div className="space-y-6">
              {/* Email Address (Read Only) */}
              <CustomInput
                label="Email Address"
                value={email.email_address}
                readOnly
                variant="filled"
                leftIcon={<Mail className="h-4 w-4" />}
                rightIcon={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(email.email_address)}
                    className="p-1 h-6 w-6 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                }
              />

              {/* Password (Editable) */}
              <CustomInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(password)}
                      className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
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

              {/* Recovery Email (Editable) */}
              <CustomInput
                label="Recovery Email"
                value={recoveryEmail}
                onChange={setRecoveryEmail}
                placeholder="Enter recovery email..."
                variant="filled"
                leftIcon={<Mail className="h-4 w-4" />}
                rightIcon={
                  <div className="flex items-center gap-1">
                    {recoveryEmail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(recoveryEmail)}
                        className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {hasRecoveryEmailChanged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveField('recovery_email', recoveryEmail)}
                        className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                }
              />

              {/* Phone Numbers (Editable) */}
              <CustomInput
                label="Phone Numbers"
                value={phoneNumbers}
                onChange={setPhoneNumbers}
                placeholder="+84 xxx xxx xxx"
                variant="filled"
                leftIcon={<Phone className="h-4 w-4" />}
                rightIcon={
                  <div className="flex items-center gap-1">
                    {phoneNumbers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(phoneNumbers)}
                        className="p-1 h-6 w-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {hasPhoneChanged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveField('phone_numbers', phoneNumbers)}
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

                {/* No tags message */}
                {editedTags.length === 0 && !showAddTag && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No tags assigned
                  </span>
                )}
              </div>

              {/* Tag hint */}
              {showAddTag && (
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to add tag, Escape to cancel
                </p>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {email.metadata?.created_at && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        Account Created
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(email.metadata.created_at)}
                      </div>
                    </div>
                  </div>
                )}

                {email.metadata?.last_login && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        Last Login
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(email.metadata.last_login)}
                        {getDaysSinceLastLogin() && ` (${getDaysSinceLastLogin()} days ago)`}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
                  <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      Password Changed
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(email.last_password_change)}
                    </div>
                  </div>
                </div>

                {email.metadata?.storage_used && (
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                    <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        Storage Used
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {email.metadata.storage_used}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailSection
