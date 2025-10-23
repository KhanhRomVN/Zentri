import React, { useState, useEffect } from 'react'
import CustomButton from '../../../../components/common/CustomButton'
import CustomTextArea from '../../../../components/common/CustomTextArea'
import {
  Database,
  X,
  RefreshCw,
  Table as TableIcon,
  Sparkles,
  Code,
  Download,
  Copy,
  AlertCircle,
  Play,
  Loader2
} from 'lucide-react'

interface CreateTableDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (config: any) => void
  emails: any[]
  serviceAccounts: any[]
  email2FAMethods: any[]
  serviceAccount2FAMethods: any[]
  serviceAccountSecrets: any[]
}

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyAo6EGIGKMOeSAU203sBck5SAEjCAUCjpw'
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'

// Database schema for AI context
const DATABASE_SCHEMA = `
-- Database Schema for Email Manager
-- Tables: emails, email_2fa, service_accounts, service_account_2fa, service_account_secrets

CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  email_address TEXT NOT NULL UNIQUE,
  email_provider TEXT NOT NULL CHECK (email_provider IN ('gmail', 'yahoo', 'outlook', 'icloud')),
  name TEXT,
  age INTEGER,
  address TEXT,
  password TEXT NOT NULL,
  last_password_change TEXT NOT NULL,
  recovery_email TEXT,
  phone_numbers TEXT,
  tags TEXT, -- JSON array
  note TEXT,
  metadata TEXT, -- JSON object
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_2fa (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('backup_codes', 'totp_key', 'app_password', 'security_key', 'recovery_email', 'sms')),
  app TEXT,
  value TEXT NOT NULL, -- JSON for arrays or string for single values
  last_update TEXT NOT NULL,
  expire_at TEXT,
  metadata TEXT, -- JSON object
  FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
);

CREATE TABLE service_accounts (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'social_media', 'communication', 'developer', 'cloud_storage', 'ai_saas',
    'productivity_tool', 'payment_finance', 'ecommerce', 'entertainment',
    'education', 'hosting_domain', 'security_vpn', 'government', 'health',
    'gaming', 'travel_transport', 'news_media', 'forum_community',
    'iot_smart_device', 'other'
  )),
  service_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  name TEXT,
  username TEXT,
  password TEXT,
  note TEXT,
  metadata TEXT, -- JSON object
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
);

CREATE TABLE service_account_2fa (
  id TEXT PRIMARY KEY,
  service_account_id TEXT NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('backup_codes', 'totp_key', 'app_password', 'security_key', 'recovery_email', 'sms')),
  app TEXT,
  value TEXT NOT NULL, -- JSON for arrays or string for single values
  last_update TEXT NOT NULL,
  expire_at TEXT,
  metadata TEXT, -- JSON object
  FOREIGN KEY (service_account_id) REFERENCES service_accounts (id) ON DELETE CASCADE
);

CREATE TABLE service_account_secrets (
  id TEXT PRIMARY KEY,
  service_account_id TEXT NOT NULL,
  secret TEXT NOT NULL, -- JSON object with secret_name and custom fields
  expire_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_account_id) REFERENCES service_accounts (id) ON DELETE CASCADE
);
`

const CreateTableDrawer: React.FC<CreateTableDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  emails,
  serviceAccounts,
  email2FAMethods,
  serviceAccount2FAMethods,
  serviceAccountSecrets
}) => {
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
Bạn là một SQL expert. Nhiệm vụ của bạn là tạo một câu lệnh SQLite SELECT query dựa trên schema và yêu cầu sau:

DATABASE SCHEMA:
${DATABASE_SCHEMA}

YÊU CẦU CỦA NGƯỜI DÙNG:
${promptInput}

QUAN TRỌNG:
1. Chỉ trả về câu lệnh SQL SELECT, không thêm bất kỳ giải thích nào
2. Query phải hợp lệ với SQLite syntax
3. Có thể sử dụng JOIN giữa các bảng nếu cần
4. Có thể parse JSON fields (tags, metadata, secret) bằng json_extract() nếu cần
5. Ví dụ parse JSON: json_extract(metadata, '$.key_name')
6. Ví dụ parse array: SELECT * FROM emails WHERE json_array_length(tags) > 0
7. KHÔNG sử dụng markdown code blocks, chỉ trả về SQL thuần

Hãy trả về câu lệnh SQL:
`

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate query')
      }

      const data = await response.json()
      const generatedQuery = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

      // Clean up the query - remove markdown code blocks if present
      let cleanQuery = generatedQuery
        .replace(/```sql\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      setSqlQuery(cleanQuery)
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
        setQueryError(error instanceof Error ? error.message : 'Lỗi khi thực thi query')
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

  const handleReset = () => {
    setTableName('')
    setPromptInput('')
    setSqlQuery('')
    setGenerateError('')
    setTableData([])
    setTableColumns([])
    setQueryError('')
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
      name: tableName.trim(),
      query: sqlQuery.trim(),
      columns: tableColumns,
      data: tableData
    }

    onSubmit(config)
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
            AI Query Builder - Tạo Bảng Mới
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
            Tạo Bảng
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
        <div className="w-[450px] flex-shrink-0 border-r border-border-default bg-card-background overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Table Name */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <TableIcon className="h-4 w-4 text-blue-600" />
                <span>1. Tên Bảng</span>
              </div>
              <CustomTextArea
                value={tableName}
                onChange={setTableName}
                placeholder="Ví dụ: Bảng API Keys của Google Cloud Services"
                rows={2}
                maxLength={200}
                showCharCount
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
                placeholder='Ví dụ: "Tạo bảng liệt kê các email có service là Google AI Cloud và có lưu Secret là API Key"'
                rows={4}
                maxLength={1000}
                showCharCount
              />

              <CustomButton
                variant="primary"
                size="sm"
                onClick={handleGenerateQuery}
                disabled={isGenerating || !promptInput.trim()}
                loading={isGenerating}
                icon={Sparkles}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? 'Đang tạo Query...' : 'Tạo SQL Query bằng AI'}
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
                <span>3. SQL Query (Có thể chỉnh sửa)</span>
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
                  <div>• {tableData.length} dòng dữ liệu</div>
                  <div>• {tableColumns.length} cột</div>
                  {isExecuting && <div>• Đang thực thi query...</div>}
                </div>
              </div>
            )}

            {/* Example Prompts */}
            <div className="pt-4 border-t border-border-default">
              <div className="text-xs font-semibold text-text-primary mb-3">Ví dụ các yêu cầu:</div>
              <div className="space-y-2">
                {[
                  'Liệt kê tất cả email có service type là "ai_saas"',
                  'Tìm các email có nhiều hơn 5 service accounts',
                  'Hiển thị email và số lượng 2FA methods của mỗi email',
                  'Lấy danh sách service có secret là "api_key"'
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPromptInput(example)}
                    className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors"
                  >
                    → {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Table Preview */}
        <div className="flex-1 flex flex-col bg-background">
          {/* Table Toolbar */}
          <div className="h-12 border-b border-border-default bg-card-background flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">
                Preview ({tableData.length} rows)
              </span>
            </div>

            {tableData.length > 0 && (
              <div className="flex items-center gap-2">
                <CustomButton variant="secondary" size="sm" onClick={handleCopyTable} icon={Copy}>
                  Copy
                </CustomButton>
                <CustomButton variant="secondary" size="sm" onClick={handleExport} icon={Download}>
                  Export CSV
                </CustomButton>
              </div>
            )}
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto p-4">
            {tableData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto">
                    {isExecuting ? (
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    ) : (
                      <TableIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-text-primary">
                      {isExecuting ? 'Đang thực thi query...' : 'No Data'}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      {isExecuting
                        ? 'Vui lòng đợi trong giây lát'
                        : 'Nhập yêu cầu và tạo SQL query để xem dữ liệu'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card-background rounded-lg border border-border-default overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border-default">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">
                          #
                        </th>
                        {tableColumns.map((col, idx) => (
                          <th
                            key={idx}
                            className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {tableData.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-text-secondary">{rowIdx + 1}</td>
                          {tableColumns.map((col, colIdx) => (
                            <td
                              key={colIdx}
                              className="px-4 py-3 text-sm text-text-primary whitespace-nowrap"
                            >
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateTableDrawer
