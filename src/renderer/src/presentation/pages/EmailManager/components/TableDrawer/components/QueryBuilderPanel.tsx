import React from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomTextArea from '../../../../../../components/common/CustomTextArea'
import {
  TableIcon,
  Sparkles,
  Code,
  AlertCircle,
  Loader2,
  History,
  Check,
  X,
  Clock
} from 'lucide-react'

interface QueryHistoryItem {
  id: string
  prompt: string
  query: string
  timestamp: string
  rowCount: number
  columnCount: number
}

interface QueryBuilderPanelProps {
  tableName: string
  setTableName: (value: string) => void
  promptInput: string
  setPromptInput: (value: string) => void
  sqlQuery: string
  setSqlQuery: (value: string) => void
  isGenerating: boolean
  generateError: string
  isExecuting: boolean
  queryError: string
  tableData: any[]
  tableColumns: string[]
  onGenerateQuery: () => void
  queryHistory: QueryHistoryItem[]
  previewHistoryItem: QueryHistoryItem | null
  onPreviewHistory: (item: QueryHistoryItem) => void
  onConfirmRestore: () => void
  onCancelRestore: () => void
}

const QueryBuilderPanel: React.FC<QueryBuilderPanelProps> = ({
  tableName,
  setTableName,
  promptInput,
  setPromptInput,
  sqlQuery,
  setSqlQuery,
  isGenerating,
  generateError,
  isExecuting,
  queryError,
  tableData,
  tableColumns,
  onGenerateQuery,
  queryHistory,
  previewHistoryItem,
  onPreviewHistory,
  onConfirmRestore,
  onCancelRestore
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="w-[450px] flex-shrink-0 border-r border-border-default bg-card-background overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Preview Mode Banner */}
        {previewHistoryItem && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Preview Mode
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Bạn đang xem query từ lịch sử. Xác nhận để restore hoặc hủy để quay lại.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <CustomButton
                variant="primary"
                size="sm"
                onClick={onConfirmRestore}
                icon={Check}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Xác nhận Restore
              </CustomButton>
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={onCancelRestore}
                icon={X}
                className="flex-1"
              >
                Hủy
              </CustomButton>
            </div>
          </div>
        )}

        {/* Table Name */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <TableIcon className="h-4 w-4 text-blue-600" />
            <span>Table Name</span>
          </div>
          <CustomTextArea
            value={tableName}
            onChange={setTableName}
            placeholder="Ví dụ: Bảng API Keys của Google Cloud Services"
            rows={2}
            maxLength={200}
            showCharCount
            disabled={!!previewHistoryItem}
          />
        </div>

        {/* AI Prompt Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>2. Mô Tả Yêu Cầu (AI Prompt)</span>
          </div>

          <CustomTextArea
            value={promptInput}
            onChange={setPromptInput}
            placeholder='For example: "Create a list of emails whose service is Google AI Cloud and whose Secret is saved as API Key"'
            rows={4}
            maxLength={1000}
            showCharCount
            disabled={!!previewHistoryItem}
          />

          <CustomButton
            variant="primary"
            size="sm"
            onClick={onGenerateQuery}
            disabled={isGenerating || !promptInput.trim() || !!previewHistoryItem}
            loading={isGenerating}
            icon={Sparkles}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? 'Creating Query...' : 'Create SQL Query with AI'}
          </CustomButton>

          {generateError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">{generateError}</div>
              </div>
            </div>
          )}
        </div>

        {/* SQL Query Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Code className="h-4 w-4 text-green-600" />
            <span>3. SQL Query (Editable)</span>
          </div>

          <div className="relative">
            <CustomTextArea
              value={sqlQuery}
              onChange={setSqlQuery}
              placeholder="SELECT * FROM emails WHERE ..."
              rows={8}
              maxLength={5000}
              showCharCount
              className="font-mono text-sm"
              disabled={!!previewHistoryItem}
            />
            {isExecuting && (
              <div className="absolute top-2 right-2">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
            )}
          </div>

          {queryError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">{queryError}</div>
              </div>
            </div>
          )}
        </div>

        {/* Query Info */}
        {sqlQuery && !queryError && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
              Query Status:
            </div>
            <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <div>• {tableData.length} row</div>
              <div>• {tableColumns.length} cột</div>
              {isExecuting && <div>• Executing query...</div>}
            </div>
          </div>
        )}

        {/* Query History */}
        {queryHistory.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border-default">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <History className="h-4 w-4 text-orange-600" />
              <span>Lịch Sử Query ({queryHistory.length})</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {queryHistory.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => !previewHistoryItem && onPreviewHistory(item)}
                  disabled={!!previewHistoryItem}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    previewHistoryItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${previewHistoryItem && previewHistoryItem.id !== item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                        #{queryHistory.length - index}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {item.prompt}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600 line-clamp-2">
                    {item.query}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>📊 {item.rowCount} rows</span>
                    <span>📋 {item.columnCount} cols</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QueryBuilderPanel
