import React from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import { TableIcon, Download, Copy, Loader2 } from 'lucide-react'

interface TablePreviewPanelProps {
  tableData: any[]
  tableColumns: string[]
  tableName: string
  isExecuting: boolean
  onExport: () => void
  onCopyTable: () => void
}

const TablePreviewPanel: React.FC<TablePreviewPanelProps> = ({
  tableData,
  tableColumns,
  isExecuting,
  onExport,
  onCopyTable
}) => {
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Table Toolbar */}
      <div className="h-12 border-b border-border-default bg-card-background flex items-center justify-between px-4">
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
      <div className="flex-1 overflow-hidden p-4">
        {tableData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
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
          </div>
        ) : (
          <div className="bg-card-background rounded-lg border border-border-default max-h-[calc(100vh-12rem)] overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">
                    #
                  </th>
                  {tableColumns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider min-w-[150px]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {tableData.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-secondary">{rowIdx + 1}</td>
                    {tableColumns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-3 text-sm text-text-primary whitespace-nowrap min-w-[150px]"
                      >
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablePreviewPanel
