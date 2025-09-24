// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/Email/EmailSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomTextArea from '../../../../../../components/common/CustomTextArea'
import CustomTag from '../../../../../../components/common/CustomTag'
import Metadata from '../../../../../../components/common/Metadata'
import { Eye, EyeOff, Copy, Phone, Check, Mail, User, MapPin, Tag, FileText } from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { Email, ServiceAccount } from '../../../types'

interface EmailSectionProps {
  email: Email
  className?: string
  onServiceClick?: (service: ServiceAccount) => void
  serviceAccounts?: ServiceAccount[]
  onUpdateEmail?: (id: string, updates: Partial<Email>) => Promise<boolean>
}

const EmailSection: React.FC<EmailSectionProps> = ({ email, className, onUpdateEmail }) => {
  const [showPassword, setShowPassword] = useState(false)
  // Editable fields - khởi tạo từ email prop
  const [phoneNumbers, setPhoneNumbers] = useState(email.phone_numbers || '')
  const [recoveryEmail, setRecoveryEmail] = useState(email.recovery_email || '')
  const [password, setPassword] = useState(email.pasword || '')
  const [editedTags, setEditedTags] = useState<string[]>(email.tags || [])
  const [name, setName] = useState(email.name || '')
  const [age, setAge] = useState(email.age?.toString() || '')
  const [address, setAddress] = useState(email.address || '')
  const [note, setNote] = useState(email.note || '')

  // Metadata với các trường hệ thống không thể xóa
  const [metadata, setMetadata] = useState<Record<string, any>>(() => {
    // Chỉ giữ lại created_at và last_password_change từ metadata gốc
    const baseMetadata = { ...email.metadata } || {}

    // Đảm bảo các trường hệ thống luôn tồn tại
    return {
      created_at: baseMetadata.created_at || new Date().toISOString(),
      last_password_change: baseMetadata.last_password_change || new Date().toISOString(),
      ...baseMetadata
    }
  })

  // State để theo dõi trạng thái loading và feedback
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Hàm xử lý lưu field
  const handleSaveField = async (field: string, value: string | string[] | number) => {
    if (!email.id || !onUpdateEmail) {
      console.error('Missing email ID or update function')
      return
    }

    try {
      setSavingField(field)

      // Chuẩn bị dữ liệu cập nhật
      const updates: Partial<Email> = {}

      switch (field) {
        case 'name':
          updates.name = value as string
          break
        case 'age':
          updates.age = value ? parseInt(value as string) : undefined
          break
        case 'address':
          updates.address = value as string
          break
        case 'phone_numbers':
          updates.phone_numbers = value as string
          break
        case 'recovery_email':
          updates.recovery_email = value as string
          break
        case 'password':
          updates.pasword = value as string
          // Cập nhật last_password_change trong metadata
          setMetadata((prev) => ({
            ...prev,
            last_password_change: new Date().toISOString()
          }))
          break
        case 'tags':
          updates.tags = value as string[]
          break
        case 'note':
          updates.note = value as string
          break
        case 'metadata':
          updates.metadata = value as Record<string, any>
          break
        default:
          console.warn(`Unknown field: ${field}`)
          return
      }

      // Gọi hàm update từ parent
      const success = await onUpdateEmail(email.id, updates)

      if (success) {
        setSaveStatus((prev) => ({ ...prev, [field]: 'success' }))
        // Reset status sau 2 giây
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [field]: null }))
        }, 2000)
      } else {
        setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
      }
    } catch (error) {
      console.error(`Error saving ${field}:`, error)
      setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  // Check if values have changed
  const hasNameChanged = name !== (email.name || '')
  const hasAgeChanged = age !== (email.age?.toString() || '')
  const hasAddressChanged = address !== (email.address || '')
  const hasPhoneChanged = phoneNumbers !== (email.phone_numbers || '')
  const hasRecoveryEmailChanged = recoveryEmail !== (email.recovery_email || '')
  const hasPasswordChanged = password !== (email.pasword || '')
  const hasNoteChanged = note !== (email.note || '')
  const hasMetadataChanged = JSON.stringify(metadata) !== JSON.stringify(email.metadata || {})

  const handleTagsChange = (newTags: string[]) => {
    setEditedTags(newTags)
  }

  const handleMetadataChange = (newMetadata: Record<string, any>) => {
    // Loại bỏ các trường có giá trị null, undefined hoặc empty string
    const cleanedMetadata = Object.fromEntries(
      Object.entries(newMetadata).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ''
      )
    )

    // Đảm bảo các trường hệ thống không bị xóa
    const finalMetadata = {
      created_at: metadata.created_at || new Date().toISOString(),
      last_password_change: metadata.last_password_change || new Date().toISOString(),
      ...cleanedMetadata
    }

    setMetadata(finalMetadata)

    // Chỉ lưu nếu có thay đổi thực sự
    if (JSON.stringify(finalMetadata) !== JSON.stringify(email.metadata || {})) {
      handleSaveField('metadata', finalMetadata)
    }
  }

  // Hàm render icon trạng thái cho input
  const renderStatusIcon = (field: string, hasChanged: boolean) => {
    if (savingField === field) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    }

    if (saveStatus[field] === 'success') {
      return <Check className="h-4 w-4 text-green-600" />
    }

    if (saveStatus[field] === 'error') {
      return <div className="text-red-600">!</div>
    }

    if (hasChanged) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            handleSaveField(
              field,
              field === 'age'
                ? parseInt(age) || 0
                : field === 'tags'
                  ? editedTags
                  : field === 'name'
                    ? name
                    : field === 'address'
                      ? address
                      : field === 'phone_numbers'
                        ? phoneNumbers
                        : field === 'recovery_email'
                          ? recoveryEmail
                          : field === 'note'
                            ? note
                            : password
            )
          }
          className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2.5 w-2.5" />
        </Button>
      )
    }

    return undefined
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
              rightIcon={renderStatusIcon('name', hasNameChanged)}
              disabled={savingField !== null && savingField !== 'name'}
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
              rightIcon={renderStatusIcon('age', hasAgeChanged)}
              disabled={savingField !== null && savingField !== 'age'}
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
                      disabled={savingField !== null}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  {renderStatusIcon('phone_numbers', hasPhoneChanged)}
                </div>
              }
              disabled={savingField !== null && savingField !== 'phone_numbers'}
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
                      disabled={savingField !== null}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  {renderStatusIcon('address', hasAddressChanged)}
                </div>
              }
              disabled={savingField !== null && savingField !== 'address'}
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
                  disabled={savingField !== null}
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
                      disabled={savingField !== null}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  {renderStatusIcon('recovery_email', hasRecoveryEmailChanged)}
                </div>
              }
              disabled={savingField !== null && savingField !== 'recovery_email'}
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
                    disabled={savingField !== null}
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
                    disabled={savingField !== null}
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                  {renderStatusIcon('password', hasPasswordChanged)}
                </div>
              }
              disabled={savingField !== null && savingField !== 'password'}
            />
          </div>

          {/* Note Section - Full Width Row */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <CustomTextArea
              label="Notes"
              value={note}
              onChange={setNote}
              placeholder="Add notes about this email account..."
              variant="filled"
              size="sm"
              leftIcon={<FileText className="h-3 w-3" />}
              rightIcon={renderStatusIcon('note', hasNoteChanged)}
              disabled={savingField !== null && savingField !== 'note'}
              rows={3}
              showCharCount={true}
              maxLength={500}
            />
          </div>

          {/* Tags Section - Full Width Row */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-purple-50 dark:bg-purple-900/20 rounded-md flex items-center justify-center">
                <Tag className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Tags</h5>
            </div>

            <CustomTag
              tags={editedTags}
              onTagsChange={(newTags) => {
                handleTagsChange(newTags)
                // Tự động lưu tags khi có thay đổi
                handleSaveField('tags', newTags)
              }}
              placeholder="Enter tag name..."
              allowDuplicates={false}
              className="mb-2"
              disabled={savingField !== null}
            />
          </div>

          {/* Metadata với các trường hệ thống */}
          <div className="pt-4">
            <div className="space-y-4">
              <Metadata
                metadata={metadata}
                onMetadataChange={handleMetadataChange}
                onDelete={(key) => {
                  // Ngăn chặn xóa các trường hệ thống
                  if (key === 'created_at' || key === 'last_password_change') {
                    return
                  }
                  const newMetadata = { ...metadata }
                  delete newMetadata[key]
                  setMetadata(newMetadata)
                  handleSaveField('metadata', newMetadata)
                }}
                title="Metadata"
                compact={true}
                collapsible={true}
                defaultExpanded={false}
                editable={true}
                showDeleteButtons={true}
                hideEmpty={true} // THAY ĐỔI: Ẩn các trường empty
                maxVisibleFields={10}
                protectedFields={['created_at', 'last_password_change']}
                // THÊM: Custom render để ẩn hoàn toàn các trường đã xóa
                shouldRenderField={(key, value) => {
                  // Không hiển thị các trường có giá trị null/undefined/empty
                  if (value === null || value === undefined || value === '') {
                    return false
                  }
                  return true
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailSection
