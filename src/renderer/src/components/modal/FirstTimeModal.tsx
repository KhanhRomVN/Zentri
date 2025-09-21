import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Upload, FolderPlus, X } from 'lucide-react'

interface FirstTimeModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (filePath: string) => void
  onCreateNew: (folderPath: string) => void
}

export function FirstTimeModal({ isOpen, onClose, onImport, onCreateNew }: FirstTimeModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'create'>('import')
  const [filePath, setFilePath] = useState('')
  const [folderPath, setFolderPath] = useState('')

  const handleImport = () => {
    if (filePath.trim()) {
      onImport(filePath.trim())
    }
  }

  const handleCreateNew = () => {
    if (folderPath.trim()) {
      onCreateNew(folderPath.trim())
    }
  }

  const handleBrowseFile = () => {
    // In a real electron app, you would use electron's dialog API
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setFilePath(file.path || file.name)
      }
    }
    input.click()
  }

  const handleBrowseFolder = () => {
    // In a real electron app, you would use electron's dialog API
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        const path = files[0].webkitRelativePath.split('/')[0]
        setFolderPath(path)
      }
    }
    input.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Chào mừng bạn đến với Zentri!
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Đây có phải là lần đầu bạn sử dụng ứng dụng? Hãy chọn một trong các tùy chọn sau:
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'import'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('import')}
            >
              Import Profile
            </button>
            <button
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Tạo mới
            </button>
          </div>

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="import-path">Đường dẫn file profile.json</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="import-path"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="Chọn file profile.json..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleBrowseFile} className="px-3">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={handleImport} disabled={!filePath.trim()} className="w-full">
                Import Profile
              </Button>
            </div>
          )}

          {/* Create New Tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-path">Chọn nơi tạo thư mục Zentri</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="folder-path"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="Chọn thư mục..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleBrowseFolder} className="px-3">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Sẽ tạo thư mục "Zentri" với file "profile.json" tại vị trí bạn chọn
              </div>
              <Button onClick={handleCreateNew} disabled={!folderPath.trim()} className="w-full">
                Tạo Profile Mới
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
