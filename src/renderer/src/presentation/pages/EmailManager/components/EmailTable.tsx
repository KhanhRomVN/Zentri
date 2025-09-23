// src/renderer/src/presentation/pages/EmailManager/components/EmailTable.tsx
import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import CustomTable from '../../../../components/common/CustomTable'
import CustomButton from '../../../../components/common/CustomButton'
import { Badge } from '../../../../components/ui/badge'
import { Calendar, Tag, Plus, User, MapPin, Phone } from 'lucide-react'
import { Email } from '../types'

// Import email provider icons
import gmailIcon from '../../../../assets/icon/gmail_icon.png'
import yahooIcon from '../../../../assets/icon/yahoo_icon.png'
import outlookIcon from '../../../../assets/icon/outlook_icon.png'
import icloudIcon from '../../../../assets/icon/icloud_icon.png'

interface EmailTableProps {
  data: Email[]
  loading: boolean
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onRowClick: (email: Email) => void
  filteredData: Email[]
}

const EmailTable = ({
  loading,
  currentPage,
  pageSize,
  onPageChange,
  onRowClick,
  filteredData
}: EmailTableProps) => {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // Provider icon mapping
  const getProviderIcon = (provider: string) => {
    const iconMap: Record<string, string> = {
      gmail: gmailIcon,
      yahoo: yahooIcon,
      outlook: outlookIcon,
      icloud: icloudIcon
    }
    return iconMap[provider] || gmailIcon
  }

  // Handle password visibility toggle
  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Define columns
  const columns: ColumnDef<Email>[] = [
    {
      header: 'Email & Person',
      accessorKey: 'email_address',
      cell: ({ row }) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
          onClick={() => onRowClick(row.original)}
        >
          <div className="flex items-center gap-2">
            <img
              src={getProviderIcon(row.original.email_provider)}
              alt={row.original.email_provider}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <div className="font-medium text-text-primary">{row.original.email_address}</div>
            <div className="text-xs text-text-secondary capitalize">
              {row.original.email_provider}
            </div>
            {row.original.name && (
              <div className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                {row.original.name}
                {row.original.age && `, ${row.original.age} years old`}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessorKey: 'contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.phone_numbers && (
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <Phone className="h-3 w-3" />
              {row.original.phone_numbers}
            </div>
          )}
          {row.original.address && (
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[140px]" title={row.original.address}>
                {row.original.address}
              </span>
            </div>
          )}
          {row.original.recovery_email && (
            <div className="text-xs text-text-secondary">
              Recovery: {row.original.recovery_email}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Password',
      accessorKey: 'pasword',
      cell: ({ row }) => (
        <div
          className="font-mono text-sm max-w-[140px] cursor-pointer px-2 py-1 rounded select-none"
          onClick={(e) => {
            e.stopPropagation()
            togglePasswordVisibility(row.original.id)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            copyToClipboard(row.original.pasword)
          }}
          title="Left click: Toggle visibility | Right click: Copy"
        >
          <div className="truncate">
            {showPasswords[row.original.id]
              ? row.original.pasword
              : '•'.repeat(Math.min(row.original.pasword.length, 12))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Changed: {new Date(row.original.last_password_change).toLocaleDateString('vi-VN')}
          </div>
        </div>
      )
    },
    {
      header: ' Tags',
      accessorKey: 'tags',
      cell: ({ row }) => (
        <div className="space-y-2">
          {row.original.tags && row.original.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {row.original.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs bg-[#52aaa5]/10 text-[#52aaa5] hover:bg-[#52aaa5]/20"
                >
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Activity',
      accessorKey: 'metadata',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.metadata?.created_at && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-[#718096]" />
              <span className="text-xs">
                Created: {new Date(row.original.metadata.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
          {row.original.metadata?.last_login && (
            <div className="text-xs text-green-600 dark:text-green-400">
              Last login: {new Date(row.original.metadata.last_login).toLocaleDateString('vi-VN')}
            </div>
          )}
          {row.original.metadata?.storage_used && (
            <div className="text-xs text-text-secondary">
              Storage: {row.original.metadata.storage_used}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Notes',
      accessorKey: 'note',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          {row.original.note ? (
            <div className="text-xs text-text-secondary truncate" title={row.original.note}>
              {row.original.note}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">No notes</span>
          )}
        </div>
      )
    }
  ]

  return (
    <CustomTable
      data={filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
      columns={columns}
      loading={loading}
      totalCount={filteredData.length}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      emptyMessage={
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl mb-2">📧</div>
          <div className="text-lg font-semibold text-[#2D3748]">Chưa có email nào</div>
          <div className="text-[#718096]">Thêm email đầu tiên để bắt đầu</div>
          <CustomButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              // Handle add new email
            }}
            className="mt-2 bg-[#52aaa5] hover:bg-[#52aaa5]/90"
          >
            Thêm Email
          </CustomButton>
        </div>
      }
    />
  )
}

export default EmailTable
