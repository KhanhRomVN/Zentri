// src/renderer/src/presentation/pages/EmailManager/index.tsx
import { useState, useMemo } from 'react'
import CustomBreadcrumb, { BreadcrumbItem } from '../../../components/common/CustomBreadcrumb'
import CustomButton from '../../../components/common/CustomButton'
import EmailDetailsDrawer from './components/EmailDetailsDrawer'
import EmailTable from './components/EmailTable'
import { Input } from '../../../components/ui/input'
import { Plus, Search, Mail } from 'lucide-react'
import { fakeData } from './data/mockEmailData'

const EmailManagerPage = () => {
  const [data] = useState(fakeData.emails)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEmail, setSelectedEmail] = useState<(typeof fakeData.emails)[0] | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pageSize = 10

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Mail
    },
    {
      label: 'Email Manager',
      isCurrentPage: true
    }
  ]

  // Filter data based on search
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email_provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags &&
          item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [data, searchTerm])

  // Handle row click to open drawer
  const handleRowClick = (email: (typeof fakeData.emails)[0]) => {
    setSelectedEmail(email)
    setIsDrawerOpen(true)
  }

  // Handle drawer close
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedEmail(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full width container */}
      <div className="w-full h-full flex flex-col">
        {/* Header Section */}
        <div className="flex-none px-2 py-4">
          <div className="space-y-4">
            {/* Breadcrumb */}
            <CustomBreadcrumb items={breadcrumbItems} className="text-text-secondary" />

            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Email Manager</h1>
              </div>
              <CustomButton
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => {
                  // Handle add new email
                }}
                className="bg-[#52aaa5] hover:bg-[#52aaa5]/90"
              >
                Thêm Email
              </CustomButton>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm email, provider hoặc tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section - Full Width */}
        <div className="flex-1 p-2">
          <div className="h-full">
            <EmailTable
              data={data}
              loading={loading}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onRowClick={handleRowClick}
              filteredData={filteredData}
            />
          </div>
        </div>

        {/* Email Details Drawer */}
        <EmailDetailsDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          email={selectedEmail}
        />
      </div>
    </div>
  )
}

export default EmailManagerPage
