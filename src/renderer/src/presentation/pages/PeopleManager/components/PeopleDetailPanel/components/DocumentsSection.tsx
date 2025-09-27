// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/DocumentsSection.tsx
import React from 'react'
import { FileText, Upload, Download, Eye, Trash2, Plus } from 'lucide-react'
import { Button } from '../../../../../../components/ui/button'
import { cn } from '../../../../../../shared/lib/utils'
import { Person } from '../../../types'

interface DocumentsSectionProps {
  person: Person
  className?: string
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  person,
  className,
  onUpdatePerson
}) => {
  const documents = person.identification_documents || []

  const handleUploadDocument = () => {
    // TODO: Implement document upload functionality
    console.log('Upload document functionality coming soon')
  }

  const handleViewDocument = (document: any) => {
    // TODO: Implement document viewing functionality
    console.log('View document:', document)
  }

  const handleDownloadDocument = (document: any) => {
    // TODO: Implement document download functionality
    console.log('Download document:', document)
  }

  const handleDeleteDocument = (documentId: string) => {
    // TODO: Implement document deletion functionality
    console.log('Delete document:', documentId)
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="pl-1">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
          Documents
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
          Identification documents and important files for {person.full_name}
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
        <div className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-text-primary mb-2">Document Management</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Upload and manage identification documents, certificates, and other important files.
            This feature is coming soon.
          </p>

          <Button
            variant="outline"
            size="lg"
            onClick={handleUploadDocument}
            className="mx-auto"
            disabled
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document (Coming Soon)
          </Button>
        </div>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="bg-card-background rounded-lg border border-border-default p-4 hover:border-border-hover transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h5 className="font-medium text-text-primary capitalize">
                      {doc.type?.replace('_', ' ')}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doc.number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDocument(doc)}
                    className="p-1 h-6 w-6"
                    disabled
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-1 h-6 w-6"
                    disabled
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.number)}
                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                {doc.issuing_country && (
                  <div className="flex justify-between">
                    <span>Issuing Country:</span>
                    <span className="font-medium">{doc.issuing_country}</span>
                  </div>
                )}

                {doc.issue_date && (
                  <div className="flex justify-between">
                    <span>Issue Date:</span>
                    <span className="font-medium">
                      {new Date(doc.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {doc.expiry_date && (
                  <div className="flex justify-between">
                    <span>Expiry Date:</span>
                    <span className="font-medium">
                      {new Date(doc.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card-background rounded-lg border border-border-default p-8 text-center">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No Documents Added</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            This person doesn't have any documents uploaded yet.
          </p>
          <Button variant="outline" onClick={handleUploadDocument} disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add First Document (Coming Soon)
          </Button>
        </div>
      )}

      {/* Coming Soon Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
              Documents Feature Coming Soon
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              We're working on document upload, management, and preview functionality. This will
              include support for passports, IDs, driver's licenses, and other important documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentsSection
