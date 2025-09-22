// src/renderer/src/presentation/pages/EmailManager/components/DatabaseModal.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, FolderOpen, Plus, AlertCircle, Clock, X } from 'lucide-react'
import CustomButton from '../../../../components/common/CustomButton'
import { databaseService } from '../services/DatabaseService'
import { cn } from '../../../../shared/lib/utils'
import { DatabaseInfo } from '../types'

interface DatabaseModalProps {
  onDatabaseSelected: (path: string) => void
  className?: string
}

const DatabaseModal: React.FC<DatabaseModalProps> = ({ onDatabaseSelected, className }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentDatabase, setRecentDatabase] = useState<DatabaseInfo | null>(null)

  // Load recent database on component mount
  useEffect(() => {
    const loadRecentDatabase = async () => {
      try {
        // Try to get the last database from storage
        const lastDatabase = await window.electronAPI.storage.get('email_manager_last_database')
        if (lastDatabase) {
          // Check if file still exists
          const exists = await window.electronAPI.fileSystem.exists(lastDatabase.path)
          if (exists) {
            setRecentDatabase(lastDatabase)
          } else {
            // File doesn't exist anymore, clear from storage
            await window.electronAPI.storage.remove('email_manager_last_database')
          }
        }
      } catch (error) {
        console.error('Error loading recent database:', error)
      }
    }

    loadRecentDatabase()
  }, [])

  const handleCreateNew = async () => {
    try {
      setLoading(true)
      setError(null)

      const path = await databaseService.createNewDatabase()
      if (path) {
        onDatabaseSelected(path)
      }
    } catch (error) {
      console.error('Error creating database:', error)
      setError('Failed to create new database. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenExisting = async () => {
    try {
      setLoading(true)
      setError(null)

      const path = await databaseService.openExistingDatabase()
      if (path) {
        onDatabaseSelected(path)
      }
    } catch (error) {
      console.error('Error opening database:', error)
      setError('Failed to open database. Please check if the file is valid.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRecent = async () => {
    if (!recentDatabase) return

    try {
      setLoading(true)
      setError(null)

      // Check if file still exists
      const exists = await window.electronAPI.fileSystem.exists(recentDatabase.path)
      if (!exists) {
        setError('Recent database file no longer exists.')
        setRecentDatabase(null)
        await window.electronAPI.storage.remove('email_manager_last_database')
        return
      }

      await window.electronAPI.sqlite.openDatabase(recentDatabase.path)
      onDatabaseSelected(recentDatabase.path)
    } catch (error) {
      console.error('Error opening recent database:', error)
      setError('Failed to open recent database. The file may be corrupted.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgetRecent = async () => {
    setRecentDatabase(null)
    await window.electronAPI.storage.remove('email_manager_last_database')
  }

  const handleClearError = () => {
    setError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-full max-w-lg',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Email Manager Database</h2>
          </div>
          <p className="text-blue-100 text-sm">
            Select a database file to get started with managing your emails
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                <button
                  onClick={handleClearError}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-1 underline"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          {/* Recent Database Option */}
          {recentDatabase && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-green-200 dark:border-green-700 rounded-xl p-4 bg-green-50/50 dark:bg-green-900/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Recent Database
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
                      {recentDatabase.name}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Last accessed: {formatDate(recentDatabase.lastAccess)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleForgetRecent}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                  title="Forget this database"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenRecent}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Continue with Recent Database
              </motion.button>
            </motion.div>
          )}

          {/* Options */}
          <div className="space-y-4">
            {/* Create New Database */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 cursor-pointer"
              onClick={!loading ? handleCreateNew : undefined}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Create New Database
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Start fresh with a new empty database
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Open Existing Database */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-200 cursor-pointer"
              onClick={!loading ? handleOpenExisting : undefined}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Open Existing Database
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Continue working with an existing database file
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <CustomButton
              variant="primary"
              size="md"
              onClick={handleCreateNew}
              loading={loading}
              disabled={loading}
              icon={Plus}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Create New
            </CustomButton>

            <CustomButton
              variant="secondary"
              size="md"
              onClick={handleOpenExisting}
              loading={loading}
              disabled={loading}
              icon={FolderOpen}
              className="flex-1"
            >
              Open Existing
            </CustomButton>
          </div>

          {/* Info */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                  Database Security
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your email data is stored locally in an encrypted SQLite database. Keep your
                  database file safe and consider regular backups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DatabaseModal
