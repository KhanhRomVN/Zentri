// src/renderer/src/presentation/pages/EmailManager/components/TableManagerDrawer/index.tsx
import React, { useState, useEffect } from 'react'
import CustomDrawer from '../../../../components/common/CustomDrawer'
import CustomButton from '../../../../components/common/CustomButton'
import { Plus, Trash2, Eye, FileSpreadsheet, Edit } from 'lucide-react'
import TableDrawer from './TableDrawer'
import { databaseService } from '../services/DatabaseService'
import { SavedTable } from '../types'

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
  const [editingTable, setEditingTable] = useState<SavedTable | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load saved tables từ database khi drawer mở
  useEffect(() => {
    if (isOpen) {
      loadSavedTables()
    }
  }, [isOpen])

  const loadSavedTables = async () => {
    try {
      setIsLoading(true)
      const tables = await databaseService.getAllSavedTables()
      setSavedTables(tables)
    } catch (error) {
      console.error('Failed to load saved tables:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTable = async (tableConfig: any, isEdit: boolean, tableId?: string) => {
    try {
      let savedTable: SavedTable

      if (isEdit && tableId) {
        // Update existing table
        await databaseService.updateSavedTable(tableId, {
          name: tableConfig.name,
          query: tableConfig.query,
          columns: tableConfig.columns,
          data: tableConfig.data,
          selectedFields: tableConfig.selectedFields
        })
        // Lấy lại table đã update để set vào editingTable
        savedTable = (await databaseService.getSavedTableById(tableId))!
      } else {
        // Create new table
        savedTable = await databaseService.createSavedTable({
          name: tableConfig.name,
          query: tableConfig.query,
          columns: tableConfig.columns,
          data: tableConfig.data,
          selectedFields: tableConfig.selectedFields,
          createdAt: tableConfig.createdAt
        })
      }

      // Reload tables
      await loadSavedTables()

      // Chuyển sang chế độ edit với table vừa tạo/update
      setEditingTable(savedTable)
      // Không đóng drawer
    } catch (error) {
      console.error('Failed to save table:', error)
      alert('Không thể lưu bảng. Vui lòng thử lại.')
    }
  }

  const handleDeleteTable = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bảng này?')) {
      try {
        await databaseService.deleteSavedTable(id)
        await loadSavedTables()
      } catch (error) {
        console.error('Failed to delete table:', error)
        alert('Không thể xóa bảng. Vui lòng thử lại.')
      }
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

  return (
    <>
      <CustomDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Quản lý Bảng Thống Kê"
        position="right"
        size="lg"
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
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-text-secondary">Đang tải bảng...</p>
                </div>
              </div>
            ) : savedTables.length === 0 ? (
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
                            {table.columns.length} cột
                          </span>
                          <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                            {table.data.length} dòng
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTable(table)
                            setShowCreateDrawer(true)
                          }}
                          className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </button>
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
                        <span className="font-medium">Query:</span>
                        <span className="truncate font-mono">
                          {table.query.substring(0, 60)}...
                        </span>
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
      <TableDrawer
        isOpen={showCreateDrawer}
        onClose={() => {
          setShowCreateDrawer(false)
          setEditingTable(null)
        }}
        onSubmit={handleSaveTable}
        emails={emails}
        serviceAccounts={serviceAccounts}
        email2FAMethods={email2FAMethods}
        serviceAccount2FAMethods={serviceAccount2FAMethods}
        serviceAccountSecrets={serviceAccountSecrets}
        editingTable={editingTable}
      />

      {/* View Table Drawer */}
      {viewingTable && (
        <CustomDrawer
          isOpen={!!viewingTable}
          onClose={() => setViewingTable(null)}
          title={viewingTable.name}
          position="right"
          size="xl"
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
