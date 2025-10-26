// src/renderer/src/presentation/pages/EmailManager/components/TableManagerDrawer.tsx
import React, { useState, useEffect } from 'react'
import CustomDrawer from '../../../../components/common/CustomDrawer'
import CustomButton from '../../../../components/common/CustomButton'
import CustomCodeEditor from '../../../../components/common/CustomCodeEditor'
import { Plus, Trash2, Eye, FileSpreadsheet, Edit, Clock, Database, BarChart3 } from 'lucide-react'
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
        await databaseService.updateSavedTable(tableId, {
          name: tableConfig.name,
          query: tableConfig.query,
          columns: tableConfig.columns,
          data: tableConfig.data,
          selectedFields: tableConfig.selectedFields
        })
        savedTable = (await databaseService.getSavedTableById(tableId))!
      } else {
        savedTable = await databaseService.createSavedTable({
          name: tableConfig.name,
          query: tableConfig.query,
          columns: tableConfig.columns,
          data: tableConfig.data,
          selectedFields: tableConfig.selectedFields,
          createdAt: tableConfig.createdAt
        })
      }

      await loadSavedTables()
      setEditingTable(savedTable)
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
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins}p trước`
    if (diffHours < 24) return `${diffHours}h trước`
    if (diffDays < 7) return `${diffDays}d trước`

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  return (
    <>
      <CustomDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Quản lý Bảng Thống Kê"
        direction="right"
        size="sm"
      >
        <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
          {/* Tables List */}
          <div className="flex-1 overflow-y-auto p-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-text-secondary">Đang tải...</p>
                </div>
              </div>
            ) : savedTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center mb-3 ring-2 ring-blue-100 dark:ring-blue-800">
                  <FileSpreadsheet className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">
                  Chưa có bảng thống kê
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-[240px] leading-relaxed">
                  Tạo bảng để tập trung dữ liệu từ emails, services và secrets
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedTables.map((table) => (
                  <div
                    key={table.id}
                    className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
                  >
                    {/* Header */}
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-text-primary truncate mb-1">
                            {table.name}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">
                              <Database className="h-2.5 w-2.5" />
                              {table.columns.length}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-[10px] font-medium">
                              <BarChart3 className="h-2.5 w-2.5" />
                              {table.data.length}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">
                              <Clock className="h-2.5 w-2.5" />
                              {formatDate(table.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingTable(table)
                              setShowCreateDrawer(true)
                              onClose() // Đóng TableManagerDrawer khi mở TableDrawer
                            }}
                            className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors opacity-60 group-hover:opacity-100"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </button>
                          <button
                            onClick={() => handleViewTable(table)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors opacity-60 group-hover:opacity-100"
                            title="Xem bảng"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-60 group-hover:opacity-100"
                            title="Xóa bảng"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Query Preview */}
                    <div className="px-3 pb-3">
                      <CustomCodeEditor
                        value={table.query}
                        language="sql"
                        onChange={() => {}}
                        onLanguageChange={() => {}}
                        disabled={true}
                        height="auto"
                        minHeight={80}
                        maxHeight={180}
                        autoDetectLanguage={false}
                        showLanguageSelector={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Create Button */}
          <div className="flex-none p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CustomButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setShowCreateDrawer(true)
                onClose() // Đóng TableManagerDrawer
              }}
              className="w-full"
            >
              Create New Table
            </CustomButton>
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
          direction="right"
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
