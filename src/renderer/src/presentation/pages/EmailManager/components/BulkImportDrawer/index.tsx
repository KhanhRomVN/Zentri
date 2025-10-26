import React, { useState } from 'react'
import { X, Database } from 'lucide-react'
import BulkImportLeftPanel from './components/BulkImportLeftPanel'
import BulkImportRightPanel from './components/BulkImportRightPanel'
import { geminiService } from '../../../../../services/GeminiService'
import { Email } from '../../types'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface BulkImportDrawerProps {
  isOpen: boolean
  onClose: () => void
  onBulkCreate: (emails: Omit<Email, 'id'>[]) => Promise<void>
}

interface ParsedEmail extends Omit<Email, 'id'> {
  _rowIndex?: number
  [key: string]: any
}

const BulkImportDrawer: React.FC<BulkImportDrawerProps> = ({ isOpen, onClose, onBulkCreate }) => {
  const [inputText, setInputText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [promptInput, setPromptInput] = useState('')
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedStructure, setDetectedStructure] = useState('')

  // Reset state
  const handleReset = () => {
    setInputText('')
    setSelectedFile(null)
    setPromptInput('')
    setParsedEmails([])
    setIsProcessing(false)
    setIsCreating(false)
    setError(null)
    setDetectedStructure('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  // Parse file to text
  const parseFileToText = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase()

    try {
      if (extension === 'txt') {
        return await file.text()
      }

      if (extension === 'csv') {
        const text = await file.text()
        const parsed = Papa.parse(text, { header: true })
        return JSON.stringify(parsed.data, null, 2)
      }

      if (extension === 'json') {
        return await file.text()
      }

      if (['xlsx', 'xls'].includes(extension || '')) {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        return JSON.stringify(jsonData, null, 2)
      }

      throw new Error(`Unsupported file type: ${extension}`)
    } catch (err) {
      throw new Error(
        `Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  // Build Gemini prompt
  const buildGeminiPrompt = (rawData: string, customPrompt?: string): string => {
    const basePrompt = `You are a data transformation assistant. Convert the following data into a JSON array of email objects.

**STRICT OUTPUT FORMAT:**
Return ONLY a valid JSON array. Do NOT include any markdown, explanations, or code blocks.

**Required Schema for each email object:**
{
  "email_address": string (required, valid email),
  "email_provider": "gmail" | "yahoo" | "outlook" | "icloud" (required),
  "pasword": string (required, use "defaultpassword" if not provided),
  "last_password_change": string (ISO date, use current date if not provided),
  "name": string (optional),
  "age": number (optional),
  "address": string (optional),
  "recovery_email": string (optional),
  "phone_numbers": string (optional),
  "tags": string[] (optional, default: []),
  "note": string (optional),
  "metadata": object (optional, default: {})
}

${customPrompt ? `**CUSTOM INSTRUCTIONS:**\n${customPrompt}\n` : ''}

**Input Data:**
${rawData}

**Instructions:**
1. Extract email_address and auto-detect email_provider from domain
2. If password is missing, use "defaultpassword"
3. If last_password_change is missing, use current date in ISO format
4. Convert all field names to match the schema exactly
5. Validate email addresses
6. Return ONLY the JSON array, nothing else

**Example Output:**
[
  {
    "email_address": "john@gmail.com",
    "email_provider": "gmail",
    "pasword": "secure123",
    "last_password_change": "2025-10-25T00:00:00.000Z",
    "name": "John Doe",
    "tags": ["work"],
    "metadata": {}
  }
]`

    return basePrompt
  }

  // Process data
  const handleProcess = async (useCustomPrompt: boolean = false) => {
    try {
      setIsProcessing(true)
      setError(null)

      let rawData = inputText

      if (selectedFile) {
        rawData = await parseFileToText(selectedFile)
      }

      if (!rawData.trim()) {
        throw new Error('Please enter data or select a file')
      }

      const prompt = buildGeminiPrompt(
        rawData,
        useCustomPrompt && promptInput.trim() ? promptInput.trim() : undefined
      )

      const response = await geminiService.generateContent(prompt, {
        temperature: 0.1,
        maxTokens: 8000
      })

      if (!response.success || !response.text) {
        throw new Error(response.error || 'Gemini API failed to process data')
      }

      let jsonText = response.text.trim()
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const parsed = JSON.parse(jsonText)

      if (!Array.isArray(parsed)) {
        throw new Error('Gemini response is not an array')
      }

      const validatedEmails: ParsedEmail[] = parsed.map((item: any, index: number) => {
        if (!item.email_address || !item.email_provider || !item.pasword) {
          throw new Error(`Email at row ${index + 1} is missing required fields`)
        }

        return {
          ...item,
          last_password_change: item.last_password_change || new Date().toISOString(),
          tags: item.tags || [],
          metadata: item.metadata || {},
          _rowIndex: index
        }
      })

      setParsedEmails(validatedEmails)

      if (validatedEmails.length > 0) {
        const firstEmail = validatedEmails[0]
        const structure = Object.keys(firstEmail)
          .filter(
            (key) =>
              key !== '_rowIndex' && firstEmail[key] !== null && firstEmail[key] !== undefined
          )
          .join(', ')
        setDetectedStructure(structure)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Create emails
  const handleBulkCreate = async () => {
    try {
      setIsCreating(true)
      const emailsToCreate = parsedEmails.map(({ _rowIndex, ...email }) => email)
      await onBulkCreate(emailsToCreate)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create emails')
    } finally {
      setIsCreating(false)
    }
  }

  // Export & Copy handlers
  const handleExport = () => {
    if (parsedEmails.length === 0) return

    const csv = [
      'Email,Provider,Name,Password,Tags',
      ...parsedEmails.map((email) =>
        [
          email.email_address,
          email.email_provider,
          email.name || '',
          email.pasword,
          email.tags?.join(';') || ''
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk_import_preview.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleCopyTable = () => {
    if (parsedEmails.length === 0) return

    const text = [
      'Email\tProvider\tName\tPassword',
      ...parsedEmails.map((email) =>
        [email.email_address, email.email_provider, email.name || '', email.pasword].join('\t')
      )
    ].join('\n')

    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-4 bg-card-background">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Bulk Import Emails</h2>
        </div>

        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-text-secondary" />
        </button>
      </div>

      <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
        {/* LEFT PANEL */}
        <BulkImportLeftPanel
          inputText={inputText}
          setInputText={setInputText}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onClearFile={() => setSelectedFile(null)}
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          isProcessing={isProcessing}
          error={error}
          onProcess={() => handleProcess(false)}
          onProcessWithPrompt={() => handleProcess(true)}
        />

        {/* RIGHT PANEL */}
        <BulkImportRightPanel
          parsedEmails={parsedEmails}
          isProcessing={isProcessing}
          detectedStructure={detectedStructure}
          onExport={handleExport}
          onCopyTable={handleCopyTable}
          onConfirmCreate={handleBulkCreate}
          isCreating={isCreating}
        />
      </div>
    </div>
  )
}

export default BulkImportDrawer
