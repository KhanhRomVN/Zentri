import React, { useState, useEffect } from 'react'
import CustomButton from '../../../../../components/common/CustomButton'
import QueryBuilderPanel from './components/QueryBuilderPanel'
import TablePreviewPanel from './components/TablePreviewPanel'
import { Database, X, RefreshCw, Play } from 'lucide-react'
import { geminiService } from '../../../../../services/GeminiService'
import { databaseService } from '../../services/DatabaseService'
import { SavedTable } from '../../types'

interface TableDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (config: any, isEdit: boolean, tableId?: string) => void
  emails: any[]
  serviceAccounts: any[]
  email2FAMethods: any[]
  serviceAccount2FAMethods: any[]
  serviceAccountSecrets: any[]
  editingTable?: SavedTable | null
}

// Database schema for AI context
const DATABASE_SCHEMA = `
Available tables and key columns:

1. emails: id, email_address, email_provider(gmail|yahoo|outlook|icloud), name, age, password, tags(JSON), note

2. email_2fa: id, email_id, method_type(backup_codes|totp_key|app_password|security_key), app, value

3. service_accounts: id, email_id, service_name, service_type(social_media|developer|cloud_storage|ai_saas|...), status(active|inactive), username, password

4. service_account_2fa: id, service_account_id, method_type, app, value

5. service_account_secrets: id, service_account_id, secret(JSON object), expire_at

Note: 
- Use json_extract() for JSON fields: json_extract(tags, '$[0]')
- Use json_array_length() to check array size
- All tables can be joined via foreign keys
`

// History item type
interface QueryHistoryItem {
  id: string
  prompt: string
  query: string
  timestamp: string
  rowCount: number
  columnCount: number
}

const TableDrawer: React.FC<TableDrawerProps> = ({ isOpen, onClose, onSubmit, editingTable }) => {
  const [tableName, setTableName] = useState('')
  const [promptInput, setPromptInput] = useState('')
  const [sqlQuery, setSqlQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  // Table preview state
  const [tableData, setTableData] = useState<any[]>([])
  const [tableColumns, setTableColumns] = useState<string[]>([])
  const [queryError, setQueryError] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)

  // History state
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([])
  const [previewHistoryItem, setPreviewHistoryItem] = useState<QueryHistoryItem | null>(null)

  // Backup current state when previewing history
  const [currentStateBackup, setCurrentStateBackup] = useState<{
    prompt: string
    query: string
  } | null>(null)

  // Load query history từ database khi component mount
  useEffect(() => {
    const loadQueryHistory = async () => {
      if (!isOpen) return

      try {
        const history = await databaseService.getAllQueryHistory()
        // Convert từ QueryHistory type sang QueryHistoryItem type
        const convertedHistory = history.map((h) => ({
          id: h.id,
          prompt: h.prompt,
          query: h.query,
          timestamp: h.createdAt,
          rowCount: h.rowCount,
          columnCount: h.columnCount
        }))
        setQueryHistory(convertedHistory)
      } catch (error) {
        console.error('Failed to load query history:', error)
      }
    }

    loadQueryHistory()
  }, [isOpen])

  // Pre-fill data when editing
  useEffect(() => {
    if (editingTable) {
      setTableName(editingTable.name)
      setSqlQuery(editingTable.query)
      setTableData(editingTable.data)
      setTableColumns(editingTable.columns)

      // Tạo history item từ table đang edit
      const historyItem: QueryHistoryItem = {
        id: `history_${editingTable.id}`,
        prompt: '(Restored from saved table)',
        query: editingTable.query,
        timestamp: editingTable.createdAt,
        rowCount: editingTable.data.length,
        columnCount: editingTable.columns.length
      }
      setQueryHistory([historyItem])
    } else {
      // Reset khi không edit
      handleReset()
    }
  }, [editingTable, isOpen])

  // Generate SQL query from prompt using Gemini API
  const handleGenerateQuery = async () => {
    if (!promptInput.trim()) {
      setGenerateError('Vui lòng nhập mô tả yêu cầu')
      return
    }

    try {
      setIsGenerating(true)
      setGenerateError('')

      const prompt = `
You are a SQL expert. Generate a SQLite SELECT query based on the following schema and requirements.

DATABASE SCHEMA:
${DATABASE_SCHEMA}

USER REQUIREMENT:
${promptInput}

CRITICAL RULES:
1. Return ONLY the raw SQL SELECT statement
2. NO markdown code blocks (no \`\`\`sql or \`\`\`sqlite)
3. NO explanations or comments
4. Must be valid SQLite syntax
5. Can use JOINs between tables
6. Use json_extract() for JSON fields: json_extract(metadata, '$.key')
7. Use json_array_length() to check array size

Example output format:
SELECT * FROM emails WHERE email_provider = 'gmail';

Now generate the query:
`

      console.log('[DEBUG] Prompt length:', prompt.length)
      console.log('[DEBUG] Active keys:', geminiService.getActiveAPIKeys().length)

      const result = await geminiService.generateContent(prompt, {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxTokens: 2048
      })

      console.log('[DEBUG] Gemini result:', result)

      if (!result.success) {
        console.error('[ERROR] Gemini failed:', result.error)
        throw new Error(result.error || 'Failed to generate query')
      }

      // Clean up the query - remove ALL markdown artifacts
      let cleanQuery = result.text
        .trim()
        .replace(/^```[\w]*\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .replace(/^`+|`+$/g, '')
        .replace(/^\s*\n/gm, '')
        .trim()

      console.log('[DEBUG] Original text:', result.text)
      console.log('[DEBUG] Cleaned query:', cleanQuery)

      // Validate query starts with SELECT
      if (!cleanQuery.toUpperCase().startsWith('SELECT')) {
        throw new Error('Generated query is invalid - must start with SELECT')
      }

      setSqlQuery(cleanQuery)

      // Save to history sau khi query được execute thành công (sẽ trigger useEffect)
      // Lưu prompt hiện tại để add vào history sau khi execute
      const currentPrompt = promptInput

      // Đợi useEffect execute query xong rồi mới add vào history
      setTimeout(async () => {
        const historyItem = {
          id: `history_${Date.now()}`,
          prompt: currentPrompt,
          query: cleanQuery,
          timestamp: new Date().toISOString(),
          rowCount: 0, // Sẽ được update bởi useEffect
          columnCount: 0
        }

        setQueryHistory((prev) => [...prev, historyItem])

        // Lưu vào database (không cần await vì đây là background operation)
        try {
          await databaseService.createQueryHistory({
            prompt: currentPrompt,
            query: cleanQuery,
            rowCount: 0,
            columnCount: 0,
            createdAt: historyItem.timestamp
          })
        } catch (error) {
          console.error('Failed to save query history:', error)
        }

        // Clear prompt sau khi đã lưu vào history
        setPromptInput('')
      }, 1000) // Đợi 1s để query execute xong
    } catch (error) {
      console.error('Error generating query:', error)
      setGenerateError(
        error instanceof Error ? error.message : 'Không thể tạo query. Vui lòng thử lại.'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  // Execute SQL query and update table preview
  useEffect(() => {
    const executeQuery = async () => {
      if (!sqlQuery.trim()) {
        setTableData([])
        setTableColumns([])
        setQueryError('')
        return
      }

      try {
        setIsExecuting(true)
        setQueryError('')

        // Execute query using Electron SQLite API
        const rows = await window.electronAPI.sqlite.getAllRows(sqlQuery)

        if (rows.length === 0) {
          setTableData([])
          setTableColumns([])
          setQueryError('Query không trả về kết quả nào')
          return
        }

        // Extract columns from first row
        const columns = Object.keys(rows[0])
        setTableColumns(columns)
        setTableData(rows)

        // Update history item với rowCount và columnCount
        setQueryHistory((prev) => {
          const lastItem = prev[prev.length - 1]
          if (lastItem && lastItem.rowCount === 0 && lastItem.columnCount === 0) {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...lastItem,
              rowCount: rows.length,
              columnCount: columns.length
            }
            return updated
          }
          return prev
        })
      } catch (error) {
        console.error('Error executing query:', error)

        let errorMessage = 'Lỗi khi thực thi query'
        if (error instanceof Error) {
          errorMessage = error.message

          if (errorMessage.includes('syntax error')) {
            errorMessage +=
              '\n\nGợi ý: SQL query có thể chứa ký tự không hợp lệ. Hãy kiểm tra lại hoặc chỉnh sửa thủ công.'
          }
        }

        setQueryError(errorMessage)
        setTableData([])
        setTableColumns([])
      } finally {
        setIsExecuting(false)
      }
    }

    // Debounce query execution
    const timeoutId = setTimeout(executeQuery, 500)
    return () => clearTimeout(timeoutId)
  }, [sqlQuery])

  // Handle preview history item
  const handlePreviewHistory = (item: QueryHistoryItem) => {
    // Backup current state
    setCurrentStateBackup({
      prompt: promptInput,
      query: sqlQuery
    })

    // Set preview mode
    setPreviewHistoryItem(item)
    setPromptInput(item.prompt)
    setSqlQuery(item.query)
  }

  // Handle confirm restore
  const handleConfirmRestore = () => {
    setPreviewHistoryItem(null)
    setCurrentStateBackup(null)
  }

  // Handle cancel restore
  const handleCancelRestore = () => {
    if (currentStateBackup) {
      setPromptInput(currentStateBackup.prompt)
      setSqlQuery(currentStateBackup.query)
    }
    setPreviewHistoryItem(null)
    setCurrentStateBackup(null)
  }

  const handleReset = () => {
    setTableName('')
    setPromptInput('')
    setSqlQuery('')
    setGenerateError('')
    setTableData([])
    setTableColumns([])
    setQueryError('')
    setQueryHistory([])
    setPreviewHistoryItem(null)
    setCurrentStateBackup(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleSubmit = () => {
    if (!tableName.trim() || !sqlQuery.trim() || tableData.length === 0) {
      return
    }

    const config = {
      id: editingTable?.id || `table_${Date.now()}`,
      name: tableName.trim(),
      query: sqlQuery.trim(),
      columns: tableColumns,
      data: tableData,
      createdAt: editingTable?.createdAt || new Date().toISOString(),
      updatedAt: editingTable ? new Date().toISOString() : undefined
    }

    onSubmit(config, !!editingTable, editingTable?.id)
    handleReset()
  }

  const handleExport = () => {
    if (tableData.length === 0) return

    const csv = [
      tableColumns.join(','),
      ...tableData.map((row) => tableColumns.map((col) => `"${row[col] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName || 'table'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleCopyTable = () => {
    if (tableData.length === 0) return

    const text = [
      tableColumns.join('\t'),
      ...tableData.map((row) => tableColumns.map((col) => row[col] || '').join('\t'))
    ].join('\n')

    navigator.clipboard.writeText(text)
  }

  const canSubmit = tableName.trim() && sqlQuery.trim() && tableData.length > 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-4 bg-card-background">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            {editingTable ? 'Chỉnh Sửa Bảng' : 'AI Query Builder - Tạo Bảng Mới'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <CustomButton variant="secondary" size="sm" onClick={handleReset} icon={RefreshCw}>
            Reset
          </CustomButton>
          <CustomButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            icon={Play}
          >
            {editingTable ? 'Cập Nhật Bảng' : 'Tạo Bảng'}
          </CustomButton>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
      </div>

      <div className="h-[calc(100vh-3.5rem)] flex">
        {/* LEFT PANEL - AI Query Builder */}
        <QueryBuilderPanel
          tableName={tableName}
          setTableName={setTableName}
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          sqlQuery={sqlQuery}
          setSqlQuery={setSqlQuery}
          isGenerating={isGenerating}
          generateError={generateError}
          isExecuting={isExecuting}
          queryError={queryError}
          tableData={tableData}
          tableColumns={tableColumns}
          onGenerateQuery={handleGenerateQuery}
          queryHistory={queryHistory}
          previewHistoryItem={previewHistoryItem}
          onPreviewHistory={handlePreviewHistory}
          onConfirmRestore={handleConfirmRestore}
          onCancelRestore={handleCancelRestore}
        />

        {/* RIGHT PANEL - Table Preview */}
        <TablePreviewPanel
          tableData={tableData}
          tableColumns={tableColumns}
          tableName={tableName}
          isExecuting={isExecuting}
          onExport={handleExport}
          onCopyTable={handleCopyTable}
        />
      </div>
    </div>
  )
}

export default TableDrawer
