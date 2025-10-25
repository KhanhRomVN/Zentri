// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/Email/EmailSection.tsx
import React, { useEffect, useState } from 'react'
import { Button } from '../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../components/common/CustomInput'
import CustomTag from '../../../../../../../components/common/CustomTag'
import Metadata from '../../../../../../../components/common/Metadata'
import { Eye, EyeOff, Copy, Phone, Mail, User, MapPin, Tag, FileText } from 'lucide-react'
import { cn } from '../../../../../../../shared/lib/utils'
import { Email, ServiceAccount } from '../../../../types'

interface EmailSectionProps {
  email: Email
  className?: string
  onServiceClick?: (service: ServiceAccount) => void
  serviceAccounts?: ServiceAccount[]
  onUpdateEmail?: (id: string, updates: Partial<Email>) => Promise<boolean>
}

const EmailSection: React.FC<EmailSectionProps> = ({ email, className, onUpdateEmail }) => {
  const [showPassword, setShowPassword] = useState(false)
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
    // Tạo deep copy để tránh reference issue
    const baseMetadata = email.metadata ? JSON.parse(JSON.stringify(email.metadata)) : {}

    // Chỉ set default values nếu chưa tồn tại
    if (!baseMetadata.created_at) {
      baseMetadata.created_at = email.metadata?.created_at || new Date().toISOString()
    }
    if (!baseMetadata.last_password_change) {
      baseMetadata.last_password_change =
        email.metadata?.last_password_change ||
        email.last_password_change ||
        new Date().toISOString()
    }

    return baseMetadata
  })

  // Reset metadata khi email thay đổi
  useEffect(() => {
    const baseMetadata = email.metadata ? JSON.parse(JSON.stringify(email.metadata)) : {}

    if (!baseMetadata.created_at) {
      baseMetadata.created_at = email.metadata?.created_at || new Date().toISOString()
    }
    if (!baseMetadata.last_password_change) {
      baseMetadata.last_password_change =
        email.metadata?.last_password_change ||
        email.last_password_change ||
        new Date().toISOString()
    }

    setMetadata(baseMetadata)
  }, [email.id, email.metadata, email.last_password_change]) // Dependency array

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
  const handleSaveField = async (
    field: string,
    value: string | string[] | number | Record<string, any>
  ) => {
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

      const success = await onUpdateEmail(email.id, updates)

      if (success) {
        // ✅ Reset state local về giá trị vừa lưu để hasChanged = false ngay lập tức
        switch (field) {
          case 'name':
            setName(value as string)
            break

          case 'age':
            setAge(value ? (typeof value === 'number' ? value.toString() : (value as string)) : '')
            break
          case 'address':
            setAddress(value as string)
            break
          case 'phone_numbers':
            setPhoneNumbers(value as string)
            break
          case 'recovery_email':
            setRecoveryEmail(value as string)
            break
          case 'password':
            setPassword(value as string)
            break
          case 'note':
            setNote(value as string)
            break
          case 'tags':
            setEditedTags(value as string[])
            break
        }

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

  const handleTagsChange = (newTags: string[]) => {
    setEditedTags(newTags)
  }

  const handleMetadataChange = (newMetadata: Record<string, any>) => {
    // Deep clone để tránh mutation
    const clonedNewMetadata = JSON.parse(JSON.stringify(newMetadata))

    // Loại bỏ các trường có giá trị null, undefined hoặc empty string
    const cleanedMetadata = Object.fromEntries(
      Object.entries(clonedNewMetadata).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ''
      )
    )

    // Bảo vệ các trường hệ thống - sử dụng giá trị từ email gốc
    const finalMetadata = {
      created_at: email.metadata?.created_at || metadata.created_at || new Date().toISOString(),
      last_password_change:
        email.metadata?.last_password_change ||
        metadata.last_password_change ||
        email.last_password_change ||
        new Date().toISOString(),
      ...cleanedMetadata
    }

    setMetadata(finalMetadata)

    // Chỉ lưu nếu có thay đổi thực sự
    const currentMetadataStr = JSON.stringify(email.metadata || {})
    const newMetadataStr = JSON.stringify(finalMetadata)

    if (currentMetadataStr !== newMetadataStr) {
      handleSaveField('metadata', finalMetadata)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Email Information
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Personal details and account information
          </p>
        </div>
      </div>

      <div>
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
            trackChanges={true}
            initialValue={email.name || ''}
            onSave={async (newValue) => {
              await handleSaveField('name', newValue)
            }}
            isSaving={savingField === 'name'}
            saveSuccess={saveStatus['name'] === 'success'}
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
            trackChanges={true}
            initialValue={email.age?.toString() || ''}
            onSave={async (newValue) => {
              await handleSaveField('age', parseInt(newValue) || 0)
            }}
            isSaving={savingField === 'age'}
            saveSuccess={saveStatus['age'] === 'success'}
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
            trackChanges={true}
            initialValue={email.phone_numbers || ''}
            onSave={async (newValue) => {
              await handleSaveField('phone_numbers', newValue)
            }}
            isSaving={savingField === 'phone_numbers'}
            saveSuccess={saveStatus['phone_numbers'] === 'success'}
            disabled={savingField !== null && savingField !== 'phone_numbers'}
            actions={
              phoneNumbers ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(phoneNumbers)}
                  className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={savingField !== null}
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              ) : undefined
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
            trackChanges={true}
            initialValue={email.address || ''}
            onSave={async (newValue) => {
              await handleSaveField('address', newValue)
            }}
            isSaving={savingField === 'address'}
            saveSuccess={saveStatus['address'] === 'success'}
            disabled={savingField !== null && savingField !== 'address'}
            actions={
              address ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(address)}
                  className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={savingField !== null}
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              ) : undefined
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
            trackChanges={true}
            initialValue={email.recovery_email || ''}
            onSave={async (newValue) => {
              await handleSaveField('recovery_email', newValue)
            }}
            isSaving={savingField === 'recovery_email'}
            saveSuccess={saveStatus['recovery_email'] === 'success'}
            disabled={savingField !== null && savingField !== 'recovery_email'}
            actions={
              recoveryEmail ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(recoveryEmail)}
                  className="p-0.5 h-5 w-5 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={savingField !== null}
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              ) : undefined
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
            trackChanges={true}
            initialValue={email.pasword || ''}
            onSave={async (newValue) => {
              await handleSaveField('password', newValue)
            }}
            isSaving={savingField === 'password'}
            saveSuccess={saveStatus['password'] === 'success'}
            disabled={savingField !== null && savingField !== 'password'}
            actions={
              <>
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
              </>
            }
          />
        </div>

        {/* Note Section - Full Width Row */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <CustomInput
            label="Notes"
            value={note}
            onChange={setNote}
            placeholder="Add notes about this email account..."
            variant="filled"
            size="sm"
            leftIcon={<FileText className="h-3 w-3" />}
            trackChanges={true}
            initialValue={email.note || ''}
            onSave={async (newValue) => {
              await handleSaveField('note', newValue)
            }}
            isSaving={savingField === 'note'}
            saveSuccess={saveStatus['note'] === 'success'}
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
            <h5 className="text-sm font-semibold text-text-primary">Tags</h5>
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
            size="sm"
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
              defaultExpanded={true}
              editable={true}
              showDeleteButtons={true}
              hideEmpty={true}
              maxVisibleFields={10}
              protectedFields={['created_at', 'last_password_change']}
              emailAddress={email.email_address} // THÊM DÒNG NÀY
              shouldRenderField={(_, value) => {
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
  )
}

export default EmailSection
