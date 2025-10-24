import React, { useState } from 'react'
import CustomDrawer from '../../../../../../components/common/CustomDrawer'
import CustomButton from '../../../../../../components/common/CustomButton'
import {
  History,
  Clock,
  Database,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  FileText,
  Search,
  X
} from 'lucide-react'

interface QueryHistoryItem {
  id: string
  prompt: string
  query: string
  timestamp: string
  rowCount: number
  columnCount: number
}

interface HistoryQueryDrawerProps {
  isOpen: boolean
  onClose: () => void
  queryHistory: QueryHistoryItem[]
  onPreviewHistory: (item: QueryHistoryItem) => void
  onDeleteHistory?: (id: string) => void
  onClearAll?: () => void
}

const HistoryQueryDrawer: React.FC<HistoryQueryDrawerProps> = ({
  isOpen,
  onClose,
  queryHistory,
  onPreviewHistory,
  onDeleteHistory,
  onClearAll
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

  // Filter history dựa trên search query
  const filteredHistory = queryHistory.filter(
    (item) =>
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePreview = (item: QueryHistoryItem) => {
    setSelectedHistoryId(item.id)
    onPreviewHistory(item)
  }

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (window.confirm('Bạn có chắc chắn muốn xóa query này khỏi lịch sử?')) {
      onDeleteHistory?.(id)
      if (selectedHistoryId === id) {
        setSelectedHistoryId(null)
      }
    }
  }

  const handleClearAll = () => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa toàn bộ ${queryHistory.length} query trong lịch sử?`
      )
    ) {
      onClearAll?.()
      setSelectedHistoryId(null)
    }
  }

  // Group history by date
  const groupedHistory: { [key: string]: QueryHistoryItem[] } = {}
  filteredHistory.forEach((item) => {
    const date = new Date(item.timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    if (!groupedHistory[date]) {
      groupedHistory[date] = []
    }
    groupedHistory[date].push(item)
  })

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'))
    const dateB = new Date(b.split('/').reverse().join('-'))
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <CustomDrawer isOpen={isOpen} onClose={onClose} title="Lịch Sử Query" position="right">
      <div className="h-full flex flex-col">
        {/* Header Info & Search */}
        <div className="flex-none p-4 border-b border-border-default space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Query History</p>
              <p className="text-xs text-text-secondary">{queryHistory.length} query đã thực thi</p>
            </div>
            {queryHistory.length > 0 && (
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                icon={Trash2}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Xóa Tất Cả
              </CustomButton>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong lịch sử..."
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                {searchQuery ? (
                  <Search className="h-8 w-8 text-gray-400" />
                ) : (
                  <History className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử'}
              </h3>
              <p className="text-sm text-text-secondary max-w-sm">
                {searchQuery
                  ? `Không tìm thấy query nào với từ khóa "${searchQuery}"`
                  : 'Các query đã thực thi sẽ được lưu tại đây để bạn dễ dàng xem lại'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background dark:bg-gray-900 py-2 z-10">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-text-primary">{date}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>

                  {/* History Items */}
                  <div className="space-y-2">
                    {groupedHistory[date].map((item, index) => (
                      <div
                        key={item.id}
                        className={`group rounded-lg border transition-all cursor-pointer ${
                          selectedHistoryId === item.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-card-background hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                        }`}
                        onClick={() => handlePreview(item)}
                      >
                        {/* Header */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                                #{groupedHistory[date].length - index}
                              </span>
                              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-sm text-text-primary truncate font-medium">
                                {item.prompt}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePreview(item)
                                }}
                                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              </button>
                              {onDeleteHistory && (
                                <button
                                  onClick={(e) => handleDelete(item.id, e)}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(item.timestamp)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {item.rowCount} rows
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {item.columnCount} cols
                            </div>
                          </div>
                        </div>

                        {/* Query Preview */}
                        <div className="p-3">
                          <div className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-200 dark:border-gray-600 line-clamp-3 whitespace-pre-wrap">
                            {item.query}
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {selectedHistoryId === item.id && (
                          <div className="px-3 pb-3">
                            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                              <Eye className="h-3 w-3" />
                              <span className="font-medium">Đang xem query này</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {queryHistory.length > 0 && (
          <div className="flex-none p-4 border-t border-border-default">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tổng Query</p>
                <p className="text-lg font-bold text-text-primary">{queryHistory.length}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tổng Rows</p>
                <p className="text-lg font-bold text-text-primary">
                  {queryHistory.reduce((sum, item) => sum + item.rowCount, 0)}
                </p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Avg Rows</p>
                <p className="text-lg font-bold text-text-primary">
                  {Math.round(
                    queryHistory.reduce((sum, item) => sum + item.rowCount, 0) / queryHistory.length
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomDrawer>
  )
}

export default HistoryQueryDrawer
