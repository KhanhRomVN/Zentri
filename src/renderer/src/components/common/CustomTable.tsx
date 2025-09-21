import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  ColumnDef,
  RowData
} from '@tanstack/react-table'
import { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CustomTableProps<T extends RowData> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  totalCount?: number
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  emptyMessage?: ReactNode
}

const CustomTable = <T extends RowData>({
  data,
  columns,
  loading,
  totalCount,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  emptyMessage
}: CustomTableProps<T>) => {
  const pageCount = totalCount !== undefined ? Math.ceil((totalCount || 1) / pageSize) : 1

  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: !!totalCount,
    pageCount
  })

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-card-background rounded-xl border border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="text-text-primary font-medium">Đang tải...</div>
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card-background rounded-xl border border-border">
        <div className="text-center px-6">
          {emptyMessage || (
            <>
              <div className="text-6xl text-text-secondary/30 mb-4">📊</div>
              <div className="text-xl font-semibold text-text-primary mb-2">Không có dữ liệu</div>
              <div className="text-text-secondary">Chưa có dữ liệu để hiển thị</div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col rounded-xl border border-border-default shadow-sm overflow-hidden">
      {/* Table - Takes remaining height */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full h-full">
          <thead className="bg-card-background sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border-default">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-sm font-semibold text-text-primary whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border-default">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-card-background/30 transition-colors duration-150"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-text-primary">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination - Fixed height */}
      {onPageChange && totalCount !== undefined && (
        <div className="flex-shrink-0 border-t border-border-default bg-card-background">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Results info */}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>
                Hiển thị <span className="font-medium text-text-primary">{data.length}</span> trên{' '}
                <span className="font-medium text-text-primary">{totalCount}</span> kết quả
              </span>
            </div>

            {/* Page info and controls */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-text-secondary">
                Trang <span className="font-medium text-text-primary">{currentPage}</span> /{' '}
                <span className="font-medium text-text-primary">{pageCount}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${
                      currentPage <= 1
                        ? 'bg-background/50 text-text-secondary cursor-not-allowed opacity-50'
                        : 'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow'
                    }
                  `}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={data.length < pageSize}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${
                      data.length < pageSize
                        ? 'bg-background/50 text-text-secondary cursor-not-allowed opacity-50'
                        : 'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow'
                    }
                  `}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomTable
