import React, { useRef } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import { Upload, Sparkles, Trash2, FileText, AlertCircle } from 'lucide-react'

interface BulkImportLeftPanelProps {
  inputText: string
  setInputText: (value: string) => void
  selectedFile: File | null
  onFileSelect: (file: File) => void
  onClearFile: () => void
  promptInput: string
  setPromptInput: (value: string) => void
  isProcessing: boolean
  error: string | null
  onProcess: () => void
  onProcessWithPrompt: () => void
}

const BulkImportLeftPanel: React.FC<BulkImportLeftPanelProps> = ({
  inputText,
  setInputText,
  selectedFile,
  onFileSelect,
  onClearFile,
  promptInput,
  setPromptInput,
  isProcessing,
  error,
  onProcess,
  onProcessWithPrompt
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <div className="w-[450px] flex-shrink-0 border-r border-border-default bg-card-background overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* File Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Upload className="h-4 w-4 text-blue-600" />
            <span>1. Upload File (Optional)</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={handleFileClick}
              icon={Upload}
              disabled={isProcessing}
              className="flex-1"
            >
              {selectedFile ? 'Change File' : 'Choose File'}
            </CustomButton>
            {selectedFile && (
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={onClearFile}
                icon={Trash2}
                disabled={isProcessing}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear
              </CustomButton>
            )}
          </div>

          {selectedFile && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-text-secondary">
            Supported formats: TXT, CSV, JSON, Excel (.xlsx, .xls)
          </p>
        </div>

        {/* Text Input Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <FileText className="h-4 w-4 text-green-600" />
            <span>2. Or Paste Text Data</span>
          </div>

          <CustomInput
            value={inputText}
            onChange={setInputText}
            placeholder="Paste your email data here...&#10;&#10;Example:&#10;john@gmail.com | password123 | John Doe&#10;jane@yahoo.com | pass456 | Jane Smith"
            multiline
            minRows={8}
            maxRows={15}
            autoResize
            maxLength={50000}
            showCharCount
            disabled={!!selectedFile || isProcessing}
          />
        </div>

        {/* AI Prompt Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>3. AI Processing Instructions (Optional)</span>
          </div>

          <CustomInput
            value={promptInput}
            onChange={setPromptInput}
            placeholder="Example: Extract emails from this customer list, use their full name as 'name' field, and tag them as 'customers'"
            multiline
            minRows={3}
            maxRows={8}
            autoResize
            maxLength={1000}
            showCharCount
            disabled={isProcessing}
          />

          <div className="space-y-2">
            <CustomButton
              variant="primary"
              size="sm"
              onClick={onProcessWithPrompt}
              disabled={isProcessing || (!inputText.trim() && !selectedFile)}
              loading={isProcessing}
              icon={Sparkles}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? 'Processing with AI...' : 'Process with AI Instructions'}
            </CustomButton>

            <CustomButton
              variant="secondary"
              size="sm"
              onClick={onProcess}
              disabled={isProcessing || (!inputText.trim() && !selectedFile)}
              loading={isProcessing}
              icon={Upload}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Process with Default Settings'}
            </CustomButton>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkImportLeftPanel
