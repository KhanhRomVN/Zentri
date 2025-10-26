import React, { useMemo } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomTable from '../../../../../../components/common/CustomTable'
import { TableIcon, Download, Copy, Loader2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

interface TablePreviewPanelProps {
  tableData: any[]
  tableColumns: string[]
  tableName: string
  isExecuting: boolean
  onExport: () => void
  onCopyTable: () => void
  selectedFields?: string[]
}

const TablePreviewPanel: React.FC<TablePreviewPanelProps> = ({
  tableData,
  tableColumns,
  isExecuting,
  onExport,
  onCopyTable,
  selectedFields = []
}) => {
  // Tạo columns definition cho CustomTable
  // Tạo columns definition cho CustomTable
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (tableColumns.length === 0) return []

    // Filter columns based on selected fields - THÊM MỚI
    let visibleColumns = tableColumns
    if (selectedFields.length > 0) {
      // Chỉ hiển thị columns có trong selected fields
      // Format của selectedFields: "table.field"
      const selectedFieldNames = selectedFields.map((f) => f.split('.')[1])
      visibleColumns = tableColumns.filter((col) => selectedFieldNames.includes(col))
    }

    // Nếu không có column nào visible, fallback về tất cả
    if (visibleColumns.length === 0) {
      visibleColumns = tableColumns
    }

    return [
      // Cột số thứ tự
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => <div className="text-text-secondary font-medium">{row.index + 1}</div>,
        size: 60
      },
      // Các cột dữ liệu
      ...visibleColumns.map((col) => ({
        accessorKey: col,
        header: col, // ✅ Giữ nguyên tên field từ database
        cell: ({ getValue }: any) => {
          const value = getValue()
          return <div>{value !== null && value !== undefined ? String(value) : '-'}</div>
        }
      }))
    ]
  }, [tableColumns, selectedFields])

  // Custom empty message
  const emptyMessage = (
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
  )

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Table Toolbar */}
      <div className="h-12 flex-shrink-0 border-b border-border-default bg-card-background flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <TableIcon className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            Preview ({tableData.length} rows)
          </span>
        </div>

        {tableData.length > 0 && (
          <div className="flex items-center gap-2">
            <CustomButton variant="secondary" size="sm" onClick={onCopyTable} icon={Copy}>
              Copy
            </CustomButton>
            <CustomButton variant="secondary" size="sm" onClick={onExport} icon={Download}>
              Export CSV
            </CustomButton>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0 p-4">
        <CustomTable
          data={tableData}
          columns={columns}
          loading={isExecuting}
          emptyMessage={emptyMessage}
          showHeaderWhenEmpty={true}
          showFooterWhenEmpty={false}
          emptyStateHeight="h-full"
          showScrollbar={true}
          size="md"
        />
      </div>
    </div>
  )
}

export default TablePreviewPanel
