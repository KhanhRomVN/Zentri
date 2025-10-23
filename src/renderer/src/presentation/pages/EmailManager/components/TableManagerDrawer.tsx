// src/renderer/src/presentation/pages/EmailManager/components/TableManagerDrawer/index.tsx
import React, { useState } from 'react'
import CustomDrawer from '../../../../components/common/CustomDrawer'
import CustomButton from '../../../../components/common/CustomButton'
import { Plus, Trash2, Eye, FileSpreadsheet } from 'lucide-react'
import CreateTableDrawer from './CreateTableDrawer'

interface SavedTable {
  id: string
  name: string
  emailId: string
  emailAddress: string
  category: 'service' | 'security'
  subcategory: string // 'secret', '2fa', 'service_account'
  field?: string // Specific field like 'api_key'
  createdAt: string
}

interface TableManagerDrawerProps {
  isOpen: boolean
  onClose: () => void
  emails: any[]
  serviceAccounts: any[]
  email2FAMethods: any[]
  serviceAccount2FAMethods: any[]
  serviceAccountSecrets: any[]
}

const TableManagerDrawer: React.FC<TableManagerDrawerProps> = ({
  isOpen,
  onClose,
  emails,
  serviceAccounts,
  email2FAMethods,
  serviceAccount2FAMethods,
  serviceAccountSecrets
}) => {
  const [savedTables, setSavedTables] = useState<SavedTable[]>([])
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [viewingTable, setViewingTable] = useState<SavedTable | null>(null)

  const handleCreateTable = (tableConfig: Omit<SavedTable, 'id' | 'createdAt'>) => {
    const newTable: SavedTable = {
      ...tableConfig,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setSavedTables([...savedTables, newTable])
    setShowCreateDrawer(false)
  }

  const handleDeleteTable = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bảng này?')) {
      setSavedTables(savedTables.filter((t) => t.id !== id))
    }
  }

  const handleViewTable = (table: SavedTable) => {
    setViewingTable(table)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryLabel = (category: string, subcategory: string) => {
    if (category === 'service') {
      if (subcategory === 'secret') return 'Service Secret'
      if (subcategory === '2fa') return 'Service 2FA'
      return 'Service Account'
    }
    if (category === 'security') {
      return 'Email Security (2FA)'
    }
    return category
  }

  return (
    <>
      <CustomDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Quản lý Bảng Thống Kê"
        position="right"
        size="medium"
      >
        <div className="h-full flex flex-col">
          {/* Header Actions */}
          <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
            <CustomButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setShowCreateDrawer(true)}
              className="w-full"
            >
              Tạo Bảng Mới
            </CustomButton>
          </div>

          {/* Tables List */}
          <div className="flex-1 overflow-y-auto p-4">
            {savedTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Chưa có bảng thống kê
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                  Tạo bảng thống kê đầu tiên để tập trung dữ liệu từ emails, services và secrets
                </p>
                <CustomButton
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowCreateDrawer(true)}
                >
                  Tạo Bảng Đầu Tiên
                </CustomButton>
              </div>
            ) : (
              <div className="space-y-3">
                {savedTables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-card-background rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-text-primary mb-1 truncate">
                          {table.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                            {getCategoryLabel(table.category, table.subcategory)}
                          </span>
                          {table.field && (
                            <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                              {table.field}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewTable(table)}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Xem bảng"
                        >
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Xóa bảng"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <span className="truncate">{table.emailAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tạo lúc:</span>
                        <span>{formatDate(table.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CustomDrawer>

      {/* Create Table Drawer */}
      <CreateTableDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateTable}
        emails={emails}
        serviceAccounts={serviceAccounts}
        email2FAMethods={email2FAMethods}
        serviceAccount2FAMethods={serviceAccount2FAMethods}
        serviceAccountSecrets={serviceAccountSecrets}
      />

      {/* View Table Drawer */}
      {viewingTable && (
        <CustomDrawer
          isOpen={!!viewingTable}
          onClose={() => setViewingTable(null)}
          title={viewingTable.name}
          position="right"
          size="large"
        >
          <div className="p-4">
            <p className="text-gray-500 dark:text-gray-400">
              Chức năng hiển thị bảng đang được phát triển...
            </p>
          </div>
        </CustomDrawer>
      )}
    </>
  )
}

export default TableManagerDrawer
