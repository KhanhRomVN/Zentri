import React from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import {
  TableIcon,
  Sparkles,
  Code,
  AlertCircle,
  Loader2,
  History,
  Check,
  X,
  Play
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
  selectClause: string
  setSelectClause: (value: string) => void
  fromClause: string // Auto-generated, read-only
  whereClause: string
  setWhereClause: (value: string) => void
  sqlQuery: string
  setSqlQuery: (value: string) => void
  isGenerating: boolean
  generateError: string
  isExecuting: boolean
  queryError: string
  tableData: any[]
  tableColumns: string[]
  onGenerateQuery: () => void
  onRunQuery: () => void // NEW: Handler cho button Run Query
  isRunningQuery: boolean // NEW: Loading state cho Run Query
  canRunQuery: boolean // NEW: Check xem có thể run query không (disable button)
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
  selectClause,
  setSelectClause,
  fromClause,
  whereClause,
  setWhereClause,
  isGenerating,
  generateError,
  isExecuting,
  queryError,
  onGenerateQuery,
  onRunQuery,
  isRunningQuery,
  canRunQuery,
  previewHistoryItem,
  onConfirmRestore,
  onCancelRestore
}) => {
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
          <CustomInput
            value={tableName}
            onChange={setTableName}
            placeholder="Ví dụ: Bảng API Keys của Google Cloud Services"
            multiline
            minRows={1}
            maxRows={10}
            autoResize
            maxLength={200}
            showCharCount
            disabled={!!previewHistoryItem}
          />
        </div>

        {/* AI Prompt Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Request Description (AI Prompt)</span>
          </div>

          <CustomInput
            value={promptInput}
            onChange={setPromptInput}
            placeholder='For example: "Create a list of emails whose service is Google AI Cloud and whose Secret is saved as API Key"'
            multiline
            minRows={1}
            maxRows={8}
            autoResize
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

        {/* SQL Query Input - CHIA 2 PHẦN */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Code className="h-4 w-4 text-green-600" />
            <span>3. SQL Query (Editable)</span>
          </div>

          {/* SELECT Clause */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">SELECT</label>
            <CustomInput
              value={selectClause}
              onChange={setSelectClause}
              placeholder="Vui lòng chọn fields từ Schema Drawer bên trái"
              multiline
              minRows={1}
              maxRows={6}
              autoResize
              maxLength={2000}
              showCharCount
              className="font-mono text-sm bg-gray-100 dark:bg-gray-800"
              disabled={true}
            />
          </div>

          {/* FROM Clause - Auto-generated */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">FROM</label>
            <CustomInput
              value={fromClause}
              onChange={() => {}} // No-op
              placeholder="Chọn fields từ Schema Drawer để tự động tạo FROM clause"
              multiline
              minRows={1}
              maxRows={6}
              autoResize
              maxLength={2000}
              showCharCount
              className="font-mono text-sm bg-gray-100 dark:bg-gray-800"
              disabled={true}
            />
          </div>

          {/* WHERE / ORDER BY Clause */}
          <div className="relative">
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              WHERE / ORDER BY / GROUP BY
            </label>
            <CustomInput
              value={whereClause}
              onChange={setWhereClause}
              placeholder="WHERE email_provider = 'gmail'\nORDER BY email_address"
              multiline
              minRows={1}
              maxRows={10}
              autoResize
              maxLength={3000}
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

        {/* NEW: Run Query Button */}
        <div className="space-y-3">
          <CustomButton
            variant="primary"
            size="md"
            onClick={onRunQuery}
            disabled={!canRunQuery || isRunningQuery || !!previewHistoryItem}
            loading={isRunningQuery}
            icon={Play}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isRunningQuery ? 'Đang chạy query...' : 'Run Query & Save to History'}
          </CustomButton>

          {!canRunQuery && !previewHistoryItem && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Query hiện tại giống với query mới nhất trong history. Thay đổi query để có thể
                  chạy lại.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QueryBuilderPanel
