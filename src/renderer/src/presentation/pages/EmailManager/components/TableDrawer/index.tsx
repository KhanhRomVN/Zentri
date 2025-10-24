import React, { useState, useEffect } from 'react'
import CustomButton from '../../../../../components/common/CustomButton'
import QueryBuilderPanel from './components/QueryBuilderPanel'
import TablePreviewPanel from './components/TablePreviewPanel'
import { Database, X, RefreshCw, Play, History } from 'lucide-react'
import { geminiService } from '../../../../../services/GeminiService'
import { databaseService } from '../../services/DatabaseService'
import { SavedTable } from '../../types'
import DatabaseSchemaDrawer from './components/DatabaseSchemaDrawer'
import HistoryQueryDrawer from './components/HistoryQueryDrawer'

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
  const [isRunningQuery, setIsRunningQuery] = useState(false) // NEW: Loading state cho Run Query

  // Database Schema Drawer state
  const [showSchemaDrawer, setShowSchemaDrawer] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  const [selectClause, setSelectClause] = useState('')
  const [fromClause, setFromClause] = useState('')
  const [whereClause, setWhereClause] = useState('')

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  // Sync selectedFields → selectClause và auto-generate FROM clause
  useEffect(() => {
    if (selectedFields.length > 0) {
      const newSelectClause = selectedFields.join(', ')
      setSelectClause(newSelectClause)

      // Auto-generate FROM clause
      const newFromClause = generateFromClause(selectedFields)
      setFromClause(newFromClause)

      rebuildFullQuery(newSelectClause, newFromClause, whereClause)
    } else if (selectedFields.length === 0 && selectClause) {
      // Nếu bỏ chọn tất cả fields → reset về *
      setSelectClause('*')
      setFromClause('')
      rebuildFullQuery('*', '', whereClause)
    }
  }, [selectedFields])

  // Parse SQL query thành SELECT, FROM và WHERE/JOIN/ORDER BY
  const parseSQLQuery = (query: string): { select: string; from: string; where: string } => {
    const trimmedQuery = query.trim()
    const upperQuery = trimmedQuery.toUpperCase()

    if (!upperQuery.startsWith('SELECT')) {
      return { select: '', from: '', where: query }
    }

    // Tìm vị trí của FROM
    const fromIndex = upperQuery.indexOf(' FROM ')
    if (fromIndex === -1) {
      return {
        select: trimmedQuery.substring(6).trim(),
        from: '',
        where: ''
      }
    }

    const selectPart = trimmedQuery.substring(6, fromIndex).trim()

    // Tìm vị trí của WHERE
    const whereIndex = upperQuery.indexOf(' WHERE ', fromIndex)
    const joinIndex = upperQuery.indexOf(' JOIN ', fromIndex)
    const orderIndex = upperQuery.indexOf(' ORDER BY ', fromIndex)

    // Tìm index nhỏ nhất (WHERE/JOIN/ORDER BY xuất hiện đầu tiên)
    const breakpoints = [whereIndex, joinIndex, orderIndex].filter((i) => i !== -1)
    const firstBreakpoint = breakpoints.length > 0 ? Math.min(...breakpoints) : -1

    if (firstBreakpoint === -1) {
      // Chỉ có FROM, không có WHERE/JOIN/ORDER BY
      return {
        select: selectPart,
        from: trimmedQuery.substring(fromIndex).trim(),
        where: ''
      }
    }

    const fromPart = trimmedQuery.substring(fromIndex, firstBreakpoint).trim()
    const wherePart = trimmedQuery.substring(firstBreakpoint).trim()

    return { select: selectPart, from: fromPart, where: wherePart }
  }

  // Extract fields từ SELECT clause (format: table.column)
  const extractFieldsFromSelect = (selectClause: string): string[] => {
    if (!selectClause || selectClause.trim() === '*') return []

    const fields: string[] = []
    const parts = selectClause.split(',').map((p) => p.trim())

    for (const part of parts) {
      // Chỉ chấp nhận format: table.column
      const match = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)$/)
      if (match) {
        fields.push(part)
      }
    }

    return fields
  }

  // Generate FROM clause từ selected fields (auto-detect tables và JOINs)
  const generateFromClause = (fields: string[]): string => {
    if (fields.length === 0) return ''

    // Extract unique tables từ selected fields
    const tables = new Set<string>()
    fields.forEach((field) => {
      const [table] = field.split('.')
      if (table) tables.add(table)
    })

    const tableList = Array.from(tables)

    if (tableList.length === 0) return ''
    if (tableList.length === 1) {
      return `FROM ${tableList[0]}`
    }

    // Multiple tables → need JOINs
    // Join logic theo cấu trúc database:
    // emails <- email_2fa
    // emails <- service_accounts <- service_account_2fa
    // emails <- service_accounts <- service_account_secrets

    const mainTable = 'emails'
    let fromClause = `FROM ${mainTable}`

    if (tableList.includes('email_2fa')) {
      fromClause += `\nJOIN email_2fa ON emails.id = email_2fa.email_id`
    }

    if (tableList.includes('service_accounts')) {
      fromClause += `\nJOIN service_accounts ON emails.id = service_accounts.email_id`

      if (tableList.includes('service_account_2fa')) {
        fromClause += `\nJOIN service_account_2fa ON service_accounts.id = service_account_2fa.service_account_id`
      }

      if (tableList.includes('service_account_secrets')) {
        fromClause += `\nJOIN service_account_secrets ON service_accounts.id = service_account_secrets.service_account_id`
      }
    }

    return fromClause
  }

  // Rebuild full SQL query từ 3 phần
  const rebuildFullQuery = (select: string, from: string, where: string) => {
    if (!select.trim() && !from.trim() && !where.trim()) {
      setSqlQuery('')
      return
    }

    let fullQuery = ''
    if (select.trim()) {
      fullQuery = `SELECT ${select.trim()}`
    }

    if (from.trim()) {
      fullQuery += fullQuery ? `\n${from.trim()}` : from.trim()
    }

    if (where.trim()) {
      fullQuery += fullQuery ? `\n${where.trim()}` : where.trim()
    }

    setSqlQuery(fullQuery)
  }

  // Handler: Khi user thay đổi SELECT clause thủ công
  const handleSelectClauseChange = (value: string) => {
    setSelectClause(value)

    // Extract fields và sync với selectedFields
    const fields = extractFieldsFromSelect(value)
    setSelectedFields(fields)

    // Rebuild full query
    rebuildFullQuery(value, fromClause, whereClause)
  }

  // Handler: Khi user thay đổi WHERE/JOIN/ORDER BY
  const handleWhereClauseChange = (value: string) => {
    setWhereClause(value)

    // Rebuild full query
    rebuildFullQuery(selectClause, fromClause, value)
  }

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

      // ✅ Parse query thành 3 phần trước khi set
      const parsed = parseSQLQuery(editingTable.query)
      setSelectClause(parsed.select)
      setFromClause(parsed.from)
      setWhereClause(parsed.where)
      setSqlQuery(editingTable.query)

      setTableData(editingTable.data)
      setTableColumns(editingTable.columns)

      // Load selected fields từ editingTable
      const savedSelectedFields = editingTable.selectedFields || []
      console.log('[DEBUG] Loading saved selected fields:', savedSelectedFields)
      setSelectedFields(savedSelectedFields)

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

      // Build field context từ selected fields
      let fieldContext = ''
      if (selectedFields.length > 0) {
        fieldContext = `\n\nUSER SELECTED FIELDS (prioritize these in SELECT):\n${selectedFields.map((f) => `- ${f}`).join('\n')}`
      }

      // Kiểm tra xem có SELECT clause chưa
      const hasSelectClause = selectClause.trim().length > 0

      let serviceNamesContext = ''
      try {
        const allServices = await databaseService.getAllServiceAccounts()
        const uniqueServices = [...new Set(allServices.map((s) => s.service_name))]
        if (uniqueServices.length > 0) {
          serviceNamesContext = `\n\nAVAILABLE SERVICE NAMES IN DATABASE (use LIKE '%keyword%' for fuzzy matching):\n${uniqueServices.map((s) => `- ${s}`).join('\n')}`
        }
      } catch (e) {
        console.warn('Could not load service names for context')
      }

      // Nếu đã có SELECT clause, chỉ generate phần WHERE/JOIN/ORDER BY (FROM đã auto-generate)
      const prompt = hasSelectClause
        ? `
You are a SQL expert. The user has already selected these fields and tables:

SELECTED FIELDS (DO NOT MODIFY):
${selectClause}

FROM CLAUSE (ALREADY GENERATED - DO NOT MODIFY):
${fromClause}

DATABASE SCHEMA:
${DATABASE_SCHEMA}
${serviceNamesContext}

USER REQUIREMENT:
${promptInput}

IMPORTANT INSTRUCTIONS:
1. Generate ONLY the "WHERE / ORDER BY / GROUP BY / HAVING" part
2. DO NOT generate SELECT or FROM clauses
3. Your response should start with "WHERE" keyword (or be empty if no filter needed)
4. Use fuzzy matching with LIKE '%keyword%' for service names
5. Use LOWER() for case-insensitive matching

EXAMPLE OUTPUT:
WHERE LOWER(service_accounts.service_name) LIKE '%google cloud%'
ORDER BY emails.email_address
`
        : `
You are a SQL expert. Generate a complete SQLite SELECT query based on the following schema and requirements.

DATABASE SCHEMA:
${DATABASE_SCHEMA}
${fieldContext}
${serviceNamesContext}

USER REQUIREMENT:
${promptInput}

FUZZY MATCHING RULES:
1. For service names, use LIKE '%keyword%' for partial matching
2. Example: "google cloud" should match "Google AI Cloud", "Google Cloud Console"
3. Use LOWER() for case-insensitive matching
4. Combine multiple LIKE conditions with OR when appropriate
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

      // Nếu đã có SELECT clause, chỉ lấy phần WHERE trở đi
      if (hasSelectClause) {
        // Validate response (có thể rỗng hoặc bắt đầu với WHERE/ORDER BY)
        const upperClean = cleanQuery.toUpperCase().trim()
        if (
          upperClean &&
          !upperClean.startsWith('WHERE') &&
          !upperClean.startsWith('ORDER') &&
          !upperClean.startsWith('GROUP') &&
          !upperClean.startsWith('HAVING')
        ) {
          console.warn('Generated query may be invalid - expected WHERE/ORDER BY/GROUP BY/HAVING')
        }

        // Update WHERE clause (không động vào SELECT và FROM)
        setWhereClause(cleanQuery)
        setSqlQuery(`SELECT ${selectClause}\n${fromClause}\n${cleanQuery}`.trim())
      } else {
        // Validate full query starts with SELECT
        if (!cleanQuery.toUpperCase().startsWith('SELECT')) {
          throw new Error('Generated query is invalid - must start with SELECT')
        }

        // Parse và set cả 3 phần
        const parsed = parseSQLQuery(cleanQuery)
        setSelectClause(parsed.select)
        setFromClause(parsed.from)
        setWhereClause(parsed.where)
        setSqlQuery(cleanQuery)
      }

      // Clear prompt sau khi generate xong
      setPromptInput('')
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
  // NEW: Check xem query hiện tại có khác với query mới nhất trong history không
  const canRunQuery = (() => {
    if (!sqlQuery.trim()) return false
    if (queryHistory.length === 0) return true

    const latestQuery = queryHistory[queryHistory.length - 1].query
    return sqlQuery.trim() !== latestQuery.trim()
  })()

  // NEW: Handler cho button Run Query
  const handleRunQuery = async () => {
    if (!sqlQuery.trim() || !canRunQuery) return

    try {
      setIsRunningQuery(true)

      // Execute query để lấy results
      const rows = await window.electronAPI.sqlite.getAllRows(sqlQuery)

      if (rows.length === 0) {
        setQueryError('Query không trả về kết quả nào')
        return
      }

      const columns = Object.keys(rows[0])

      // Tạo history item
      const historyItem: QueryHistoryItem = {
        id: `history_${Date.now()}`,
        prompt: promptInput || '(Manual query execution)',
        query: sqlQuery.trim(),
        timestamp: new Date().toISOString(),
        rowCount: rows.length,
        columnCount: columns.length
      }

      // Add vào history state
      setQueryHistory((prev) => [...prev, historyItem])

      // Lưu vào database
      try {
        await databaseService.createQueryHistory({
          prompt: historyItem.prompt,
          query: historyItem.query,
          rowCount: historyItem.rowCount,
          columnCount: historyItem.columnCount,
          createdAt: historyItem.timestamp
        })
      } catch (error) {
        console.error('Failed to save query history:', error)
      }

      // Update table data (query đã execute trong try block trên)
      setTableColumns(columns)
      setTableData(rows)
      setQueryError('')
    } catch (error) {
      console.error('Error running query:', error)

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
      setIsRunningQuery(false)
    }
  }

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
    setSelectedFields([])
    setSelectClause('')
    setFromClause('')
    setWhereClause('')
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
      selectedFields: selectedFields,
      createdAt: editingTable?.createdAt || new Date().toISOString(),
      updatedAt: editingTable ? new Date().toISOString() : undefined
    }

    // DEBUG: Log để kiểm tra selected fields có được lưu không
    console.log('[DEBUG] Submitting table config:', {
      selectedFieldsCount: selectedFields.length,
      selectedFields: selectedFields
    })

    onSubmit(config, !!editingTable, editingTable?.id)
    // Không gọi handleReset() nữa - giữ nguyên state
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
            {editingTable ? 'Edit Table' : 'AI Query Builder - Create New Table'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <CustomButton
            variant="secondary"
            size="sm"
            onClick={() => setShowSchemaDrawer(true)}
            icon={Database}
          >
            Schema ({selectedFields.length})
          </CustomButton>

          <CustomButton
            variant="secondary"
            size="sm"
            onClick={() => setShowHistoryDrawer(true)}
            icon={History}
          >
            History ({queryHistory.length})
          </CustomButton>

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
            {editingTable ? 'Update Table' : 'Create Table'}
          </CustomButton>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
      </div>

      <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
        {/* LEFT PANEL - AI Query Builder */}
        <QueryBuilderPanel
          tableName={tableName}
          setTableName={setTableName}
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          selectClause={selectClause}
          setSelectClause={handleSelectClauseChange}
          fromClause={fromClause}
          whereClause={whereClause}
          setWhereClause={handleWhereClauseChange}
          sqlQuery={sqlQuery}
          setSqlQuery={setSqlQuery}
          isGenerating={isGenerating}
          generateError={generateError}
          isExecuting={isExecuting}
          queryError={queryError}
          tableData={tableData}
          tableColumns={tableColumns}
          onGenerateQuery={handleGenerateQuery}
          onRunQuery={handleRunQuery}
          isRunningQuery={isRunningQuery}
          canRunQuery={canRunQuery}
          queryHistory={queryHistory}
          previewHistoryItem={previewHistoryItem}
          onPreviewHistory={handlePreviewHistory}
          onConfirmRestore={handleConfirmRestore}
          onCancelRestore={handleCancelRestore}
        />

        {/* RIGHT PANEL - Table Preview */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <TablePreviewPanel
            tableData={tableData}
            tableColumns={tableColumns}
            tableName={tableName}
            isExecuting={isExecuting}
            onExport={handleExport}
            onCopyTable={handleCopyTable}
            selectedFields={selectedFields}
          />
        </div>
      </div>
      {/* Database Schema Drawer */}
      <DatabaseSchemaDrawer
        isOpen={showSchemaDrawer}
        onClose={() => setShowSchemaDrawer(false)}
        selectedFields={selectedFields}
        onFieldsChange={setSelectedFields}
      />

      {/* History Query Drawer */}
      <HistoryQueryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        queryHistory={queryHistory}
        onPreviewHistory={handlePreviewHistory}
      />
    </div>
  )
}

export default TableDrawer
