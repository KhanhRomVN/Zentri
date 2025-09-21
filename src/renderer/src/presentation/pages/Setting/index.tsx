import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import ThemeDrawer from '../../../components/drawer/ThemeDrawer'
import {
  Settings,
  Palette,
  Shield,
  Bell,
  Database,
  Download,
  Upload,
  Trash2,
  User,
  Lock,
  Globe,
  Monitor,
  Smartphone,
  HardDrive,
  RefreshCw
} from 'lucide-react'

const SettingPage = () => {
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    dataPath: 'C:/Users/Admin/Documents/Zentri',
    autoSave: true,
    notifications: true,
    autoLock: false,
    lockTimeout: '15',
    exportFormat: 'json'
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExportData = () => {
    // Handle export logic here
    console.log('Exporting data...')
  }

  const handleImportData = () => {
    // Handle import logic here
    console.log('Importing data...')
  }

  const handleClearData = () => {
    // Handle clear data logic here
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
      console.log('Clearing data...')
    }
  }

  return (
    <div className="relative min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-[#52aaa5]" />
          <div>
            <h1 className="text-3xl font-bold text-[#2D3748]">Settings</h1>
            <p className="text-[#718096] mt-1">Cài đặt ứng dụng và tùy chỉnh giao diện</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#2D3748]">Profile Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Tên người dùng</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#2D3748]">Security</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#2D3748]">Auto Lock</div>
                    <div className="text-sm text-[#718096]">
                      Tự động khóa ứng dụng khi không sử dụng
                    </div>
                  </div>
                  <Button
                    variant={formData.autoLock ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('autoLock', !formData.autoLock)}
                    className={formData.autoLock ? 'bg-[#52aaa5] hover:bg-[#52aaa5]/90' : ''}
                  >
                    {formData.autoLock ? 'ON' : 'OFF'}
                  </Button>
                </div>

                {formData.autoLock && (
                  <div>
                    <Label htmlFor="lockTimeout">Thời gian khóa tự động (phút)</Label>
                    <Input
                      id="lockTimeout"
                      type="number"
                      value={formData.lockTimeout}
                      onChange={(e) => handleInputChange('lockTimeout', e.target.value)}
                      className="mt-1 w-32"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#2D3748]">Data Management</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="dataPath">Đường dẫn lưu trữ dữ liệu</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="dataPath"
                      value={formData.dataPath}
                      onChange={(e) => handleInputChange('dataPath', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" className="px-3">
                      <HardDrive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#2D3748]">Auto Save</div>
                    <div className="text-sm text-[#718096]">Tự động lưu thay đổi</div>
                  </div>
                  <Button
                    variant={formData.autoSave ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('autoSave', !formData.autoSave)}
                    className={formData.autoSave ? 'bg-[#52aaa5] hover:bg-[#52aaa5]/90' : ''}
                  >
                    {formData.autoSave ? 'ON' : 'OFF'}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    className="gap-2 flex-1 min-w-[140px]"
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                  <Button
                    onClick={handleImportData}
                    variant="outline"
                    className="gap-2 flex-1 min-w-[140px]"
                  >
                    <Upload className="h-4 w-4" />
                    Import Data
                  </Button>
                  <Button
                    onClick={handleClearData}
                    variant="outline"
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-1 min-w-[140px]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Bell className="h-5 w-5 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#2D3748]">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#2D3748]">Enable Notifications</div>
                    <div className="text-sm text-[#718096]">
                      Nhận thông báo về các hoạt động quan trọng
                    </div>
                  </div>
                  <Button
                    variant={formData.notifications ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('notifications', !formData.notifications)}
                    className={formData.notifications ? 'bg-[#52aaa5] hover:bg-[#52aaa5]/90' : ''}
                  >
                    {formData.notifications ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Theme & Quick Actions */}
          <div className="space-y-6">
            {/* Theme Customization */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#2D3748]">Appearance</h2>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setIsThemeDrawerOpen(true)}
                  className="w-full bg-gradient-to-r from-[#52aaa5] to-[#52aaa5]/90 text-white hover:from-[#52aaa5]/90 hover:to-[#52aaa5]/80 gap-2"
                >
                  <Palette className="h-4 w-4" />
                  Customize Theme
                </Button>

                <div className="text-sm text-[#718096] text-center">
                  Thay đổi màu sắc và giao diện ứng dụng
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#2D3748] mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-[#52aaa5]" />
                    <span className="text-sm text-[#718096]">Desktop App</span>
                  </div>
                  <span className="text-sm font-medium text-[#2D3748]">v1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-[#52aaa5]" />
                    <span className="text-sm text-[#718096]">Data Size</span>
                  </div>
                  <span className="text-sm font-medium text-[#2D3748]">2.4 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-[#52aaa5]" />
                    <span className="text-sm text-[#718096]">Last Backup</span>
                  </div>
                  <span className="text-sm font-medium text-[#2D3748]">2 days ago</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#2D3748] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <RefreshCw className="h-4 w-4" />
                  Sync Data
                </Button>
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <Lock className="h-4 w-4" />
                  Change Master Password
                </Button>
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <Globe className="h-4 w-4" />
                  Check for Updates
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <Button
            className="bg-[#52aaa5] text-white hover:bg-[#52aaa5]/90 px-8"
            onClick={() => {
              // Handle save changes
              console.log('Saving settings...', formData)
            }}
          >
            Save Changes
          </Button>
        </div>

        {/* Theme Drawer */}
        <ThemeDrawer isOpen={isThemeDrawerOpen} onClose={() => setIsThemeDrawerOpen(false)} />
      </div>
    </div>
  )
}

export default SettingPage
