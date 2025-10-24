// src/renderer/src/presentation/pages/Setting/index.tsx
import React, { useState } from 'react'
import { Settings, Key, Bell, Shield, Palette } from 'lucide-react'
import GeminiAPIManagerSection from './components/GeminiAPIManagerSection'

type SettingTab = 'general' | 'gemini' | 'notifications' | 'security' | 'appearance'

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState<SettingTab>('gemini')

  const tabs = [
    { id: 'general' as SettingTab, label: 'General', icon: Settings },
    { id: 'gemini' as SettingTab, label: 'Gemini API', icon: Key },
    { id: 'notifications' as SettingTab, label: 'Notifications', icon: Bell },
    { id: 'security' as SettingTab, label: 'Security', icon: Shield },
    { id: 'appearance' as SettingTab, label: 'Appearance', icon: Palette }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gemini':
        return <GeminiAPIManagerSection />
      case 'general':
        return (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">General settings coming soon...</p>
          </div>
        )
      case 'notifications':
        return (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Notification settings coming soon...</p>
          </div>
        )
      case 'security':
        return (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Security settings coming soon...</p>
          </div>
        )
      case 'appearance':
        return (
          <div className="text-center py-12">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Appearance settings coming soon...</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage your application preferences and settings</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-card-background rounded-xl border border-gray-200 dark:border-gray-700 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                      ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}
                    />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-card-background rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingPage
