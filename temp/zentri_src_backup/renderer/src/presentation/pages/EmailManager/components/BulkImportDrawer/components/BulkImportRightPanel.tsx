import React, { useMemo } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomTable from '../../../../../../components/common/CustomTable'
import { CheckCircle, Download, Copy, AlertCircle, Loader2, TableIcon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

interface ParsedEmail {
  email_address: string
  email_provider: string
  pasword: string
  name?: string
  age?: number
  tags?: string[]
  recovery_email?: string
  phone_numbers?: string
  note?: string
  _rowIndex?: number
}

interface BulkImportRightPanelProps {
  parsedEmails: ParsedEmail[]
  isProcessing: boolean
  detectedStructure: string
  onExport: () => void
  onCopyTable: () => void
  onConfirmCreate: () => void
  isCreating: boolean
}

const BulkImportRightPanel: React.FC<BulkImportRightPanelProps> = ({
  parsedEmails,
  isProcessing,
  detectedStructure,
  onExport,
  onCopyTable,
  onConfirmCreate,
  isCreating
}) => {
  const columns = useMemo<ColumnDef<ParsedEmail>[]>(() => {
    if (parsedEmails.length === 0) return []

    return [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => <div className="text-text-secondary font-medium">{row.index + 1}</div>,
        size: 60
      },
      {
        accessorKey: 'email_address',
        header: 'Email Address',
        cell: ({ getValue }: any) => (
          <div className="font-medium text-blue-600 dark:text-blue-400">{getValue()}</div>
        )
      },
      {
        accessorKey: 'email_provider',
        header: 'Provider',
        cell: ({ getValue }: any) => {
          const provider = getValue() as string
          const colors = {
            gmail: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
            yahoo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
            outlook: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
            icloud: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${colors[provider] || 'bg-gray-100 text-gray-700'}`}
            >
              {provider}
            </span>
          )
        }
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ getValue }: any) => <div>{getValue() || '-'}</div>
      },
      {
        accessorKey: 'pasword',
        header: 'Password',
        cell: ({ getValue }: any) => (
          <div className="font-mono text-xs">{getValue() ? '••••••••' : '-'}</div>
        )
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ getValue }: any) => {
          const tags = getValue() as string[]
          return (
            <div className="flex flex-wrap gap-1">
              {tags && tags.length > 0 ? (
                tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          )
        }
      }
    ]
  }, [parsedEmails])

  const emptyMessage = (
    <div className="text-center space-y-3">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto">
        {isProcessing ? (
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        ) : (
          <TableIcon className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <div>
        <p className="text-lg font-medium text-text-primary">
          {isProcessing ? 'Processing data...' : 'No Data Processed'}
        </p>
        <p className="text-sm text-text-secondary mt-1">
          {isProcessing
            ? 'Please wait while AI analyzes your data'
            : 'Upload a file or paste text, then click Process'}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 flex-shrink-0 border-b border-border-default bg-card-background flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <TableIcon className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            Preview ({parsedEmails.length} emails)
          </span>
        </div>

        {parsedEmails.length > 0 && (
          <div className="flex items-center gap-2">
            <CustomButton variant="secondary" size="sm" onClick={onCopyTable} icon={Copy}>
              Copy
            </CustomButton>
            <CustomButton variant="secondary" size="sm" onClick={onExport} icon={Download}>
              Export CSV
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={onConfirmCreate}
              loading={isCreating}
              icon={CheckCircle}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? 'Creating...' : `Create ${parsedEmails.length} Emails`}
            </CustomButton>
          </div>
        )}
      </div>

      {/* Detected Structure Info */}
      {detectedStructure && parsedEmails.length > 0 && (
        <div className="flex-none px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Detected Fields
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-mono mt-1 break-all">
                {detectedStructure}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="flex-1 min-h-0 p-4">
        <CustomTable
          data={parsedEmails}
          columns={columns}
          loading={isProcessing}
          emptyMessage={emptyMessage}
          showHeaderWhenEmpty={false}
          showFooterWhenEmpty={false}
          emptyStateHeight="h-full"
          showScrollbar={true}
          size="md"
        />
      </div>

      {/* Validation Info */}
      {parsedEmails.length > 0 && (
        <div className="flex-none px-4 py-3 border-t border-border-default bg-card-background">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>All emails validated</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-blue-600" />
              <span>Ready to import</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BulkImportRightPanel
