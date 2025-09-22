// src/renderer/src/presentation/pages/EmailManager/components/EmailSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomTag from '../../../../../../components/common/CustomTag'
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
  User,
  MapPin,
  Tag
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { Email, ServiceAccount } from '../../types'

interface EmailSectionProps {
  email: Email
  className?: string
  onServiceClick?: (service: ServiceAccount) => void
  serviceAccounts?: ServiceAccount[]
}

const EmailSection: React.FC<EmailSectionProps> = ({ email, className }) => {
  const [showPassword, setShowPassword] = useState(false)

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

  const handleTagsChange = (newTags: string[]) => {
    setEditedTags(newTags)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Account Information Section - Consolidated */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Account Information</h4>
          </div>

          {/* Full Name - Full Width Row */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <CustomInput
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Enter full name..."
              variant="filled"
              size="sm"
              leftIcon={<User className="h-3 w-3" />}
              rightIcon={
                hasNameChanged ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveField('name', name)}
                    className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                ) : undefined
              }
            />
          </div>

          {/* Age and Phone Numbers - Same Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <CustomInput
              label="Age"
              type="number"
              value={age}
              onChange={setAge}
              placeholder="Age..."
              variant="filled"
              size="sm"
              rightIcon={
                hasAgeChanged ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveField('age', parseInt(age) || 0)}
                    className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                ) : undefined
              }
            />

            <CustomInput
              label="Phone Numbers"
              value={phoneNumbers}
              onChange={setPhoneNumbers}
              placeholder="+84 xxx xxx xxx"
              variant="filled"
              size="sm"
              leftIcon={<Phone className="h-3 w-3" />}
              rightIcon={
                <div className="flex items-center gap-0.5">
                  {phoneNumbers && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(phoneNumbers)}
                      className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  {hasPhoneChanged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('phone_numbers', phoneNumbers)}
                      className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              }
            />
          </div>

          {/* Address - Full Width Row */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <CustomInput
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="Enter address..."
              variant="filled"
              size="sm"
              leftIcon={<MapPin className="h-3 w-3" />}
              rightIcon={
                <div className="flex items-center gap-0.5">
                  {address && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address)}
                      className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  {hasAddressChanged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('address', address)}
                      className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              }
            />
          </div>

          {/* Email Address - Full Width Row */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <CustomInput
              label="Email Address"
              value={email.email_address}
              readOnly
              variant="filled"
              size="sm"
              leftIcon={<Mail className="h-3 w-3" />}
              rightIcon={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(email.email_address)}
                  className="p-0.5 h-5 w-5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              }
            />
          </div>

          {/* Recovery Email - Full Width Row */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <CustomInput
              label="Recovery Email"
              value={recoveryEmail}
              onChange={setRecoveryEmail}
              placeholder="Enter recovery email..."
              variant="filled"
              size="sm"
              leftIcon={<Mail className="h-3 w-3" />}
              rightIcon={
                <div className="flex items-center gap-0.5">
                  {recoveryEmail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(recoveryEmail)}
                      className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  {hasRecoveryEmailChanged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('recovery_email', recoveryEmail)}
                      className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              }
            />
          </div>

          {/* Password - Full Width Row */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <CustomInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              variant="filled"
              size="sm"
              rightIcon={
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-2.5 w-2.5" />
                    ) : (
                      <Eye className="h-2.5 w-2.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(password)}
                    className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                  {hasPasswordChanged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('password', password)}
                      className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              }
            />
          </div>

          {/* Tags Section - Full Width Row */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-50 dark:bg-purple-900/20 rounded-md flex items-center justify-center">
                  <Tag className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Tags</h5>
              </div>

              {/* Save Tags Button */}
              {hasTagsChanged && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveField('tags', editedTags)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save Tags
                </Button>
              )}
            </div>

            <CustomTag
              tags={editedTags}
              onTagsChange={handleTagsChange}
              placeholder="Enter tag name..."
              allowDuplicates={false}
              className="mb-2"
            />
          </div>

          {/* Activity Timeline - Full Width Row */}
          <div className="">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-purple-50 dark:bg-purple-900/20 rounded-md flex items-center justify-center">
                <Activity className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Activity</h5>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {email.metadata?.created_at && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-xs">Created</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {formatDate(email.metadata.created_at)}
                    </div>
                  </div>
                </div>
              )}

              {email.metadata?.last_login && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                  <Clock className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-xs">
                      Last Login
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {formatDate(email.metadata.last_login)}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <Key className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-xs">
                    Password Changed
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {formatDate(email.last_password_change)}
                  </div>
                </div>
              </div>

              {email.metadata?.storage_used && (
                <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                  <Activity className="h-3 w-3 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-xs">
                      Storage Used
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
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
  )
}

export default EmailSection
