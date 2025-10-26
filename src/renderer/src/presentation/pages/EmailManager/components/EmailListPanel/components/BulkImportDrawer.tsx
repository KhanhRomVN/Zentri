// src/renderer/src/presentation/pages/EmailManager/components/BulkImportDrawer/index.tsx
import React, { useState, useRef } from 'react'
import MotionCustomDrawer from '../../../../../../components/common/CustomDrawer'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import { Upload, AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { geminiService } from '../../../../../../services/GeminiService'
import { Email } from '../../../types'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface BulkImportDrawerProps {
  isOpen: boolean
  onClose: () => void
  onBulkCreate: (emails: Omit<Email, 'id'>[]) => Promise<void>
}

interface ParsedEmail extends Omit<Email, 'id'> {
  _rowIndex?: number
}

type ImportStep = 'input' | 'processing' | 'preview' | 'creating' | 'success' | 'error'

const BulkImportDrawer: React.FC<BulkImportDrawerProps> = ({ isOpen, onClose, onBulkCreate }) => {
  const [step, setStep] = useState<ImportStep>('input')
  const [inputText, setInputText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state khi đóng drawer
  const handleClose = () => {
    setStep('input')
    setInputText('')
    setSelectedFile(null)
    setParsedEmails([])
    setError(null)
    setProcessingMessage('')
    onClose()
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
  }

  // Parse file to text based on file type
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
  const buildGeminiPrompt = (rawData: string): string => {
    return `You are a data transformation assistant. Convert the following data into a JSON array of email objects.

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
  }

  // Process data with Gemini
  const handleProcess = async () => {
    try {
      setStep('processing')
      setError(null)
      setProcessingMessage('Đang xử lý dữ liệu...')

      let rawData = inputText

      // If file is selected, parse it first
      if (selectedFile) {
        setProcessingMessage(`Đang đọc file ${selectedFile.name}...`)
        rawData = await parseFileToText(selectedFile)
      }

      if (!rawData.trim()) {
        throw new Error('Vui lòng nhập dữ liệu hoặc chọn file')
      }

      // Call Gemini API
      setProcessingMessage('Đang gửi dữ liệu đến Gemini AI...')
      const prompt = buildGeminiPrompt(rawData)
      const response = await geminiService.generateContent(prompt, {
        temperature: 0.1,
        maxTokens: 8000
      })

      if (!response.success || !response.text) {
        throw new Error(response.error || 'Gemini API failed to process data')
      }

      // Parse Gemini response
      setProcessingMessage('Đang phân tích kết quả...')
      let jsonText = response.text.trim()

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const parsed = JSON.parse(jsonText)

      if (!Array.isArray(parsed)) {
        throw new Error('Gemini response is not an array')
      }

      // Validate and add row index
      const validatedEmails: ParsedEmail[] = parsed.map((item: any, index: number) => {
        if (!item.email_address || !item.email_provider || !item.pasword) {
          throw new Error(`Email tại dòng ${index + 1} thiếu thông tin bắt buộc`)
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
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  // Handle bulk create
  const handleBulkCreate = async () => {
    try {
      setStep('creating')
      setProcessingMessage(`Đang tạo ${parsedEmails.length} email accounts...`)

      // Remove _rowIndex before creating
      const emailsToCreate = parsedEmails.map(({ _rowIndex, ...email }) => email)

      await onBulkCreate(emailsToCreate)

      setStep('success')
      setProcessingMessage(`Đã tạo thành công ${parsedEmails.length} email accounts!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create emails')
      setStep('error')
    }
  }

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 'input':
        return (
          <div className="space-y-6 p-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Nhập dữ liệu</h3>
              <p className="text-sm text-text-secondary mb-4">
                Bạn có thể nhập text trực tiếp hoặc tải file (txt, csv, json, excel)
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tải file lên
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <CustomButton
                variant="secondary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                icon={Upload}
              >
                {selectedFile ? selectedFile.name : 'Chọn file'}
              </CustomButton>
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Text Input */}
            <div>
              <CustomInput
                label="Hoặc nhập text trực tiếp"
                multiline
                rows={12}
                autoResize
                maxRows={20}
                value={inputText}
                onChange={setInputText}
                placeholder="Paste your data here..."
                disabled={!!selectedFile}
              />
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-medium text-text-primary">{processingMessage}</p>
          </div>
        )

      case 'preview':
        return (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border-default">
              <h3 className="text-lg font-semibold text-text-primary">
                Preview ({parsedEmails.length} emails)
              </h3>
              <p className="text-sm text-text-secondary">Kiểm tra dữ liệu trước khi tạo</p>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Provider</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEmails.map((email, idx) => (
                      <tr key={idx} className="border-b border-border-default">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2">{email.email_address}</td>
                        <td className="px-4 py-2">{email.email_provider}</td>
                        <td className="px-4 py-2">{email.name || '-'}</td>
                        <td className="px-4 py-2">{email.tags?.join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'creating':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
            <p className="text-lg font-medium text-text-primary">{processingMessage}</p>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <p className="text-xl font-semibold text-text-primary mb-2">Thành công!</p>
            <p className="text-text-secondary">{processingMessage}</p>
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
            <p className="text-xl font-semibold text-text-primary mb-2">Lỗi xảy ra</p>
            <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )
    }
  }

  // Footer actions
  const renderFooter = () => {
    if (step === 'input') {
      return (
        <>
          <CustomButton variant="secondary" onClick={handleClose}>
            Hủy
          </CustomButton>
          <CustomButton
            variant="primary"
            onClick={handleProcess}
            disabled={!inputText.trim() && !selectedFile}
          >
            Xử lý dữ liệu
          </CustomButton>
        </>
      )
    }

    if (step === 'preview') {
      return (
        <>
          <CustomButton variant="secondary" onClick={() => setStep('input')}>
            Quay lại
          </CustomButton>
          <CustomButton variant="primary" onClick={handleBulkCreate}>
            Tạo {parsedEmails.length} emails
          </CustomButton>
        </>
      )
    }

    if (step === 'success' || step === 'error') {
      return (
        <CustomButton variant="primary" onClick={handleClose}>
          Đóng
        </CustomButton>
      )
    }

    return null
  }

  return (
    <MotionCustomDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Emails"
      subtitle="Import nhiều email cùng lúc từ file hoặc text"
      size="xl"
      direction="right"
      footerActions={renderFooter()}
      animationType="slide"
    >
      {renderContent()}
    </MotionCustomDrawer>
  )
}

export default BulkImportDrawer
