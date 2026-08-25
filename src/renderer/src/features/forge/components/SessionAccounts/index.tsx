/**
 * SessionAccounts — danh sách account trong một phiên.
 * Hiển thị EmptyState khi chưa có data.
 */

import { ForgeAccount } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';

interface SessionAccountsProps {
  sessionId: string;
  accounts: ForgeAccount[];
  isLoading?: boolean;
}

const SessionAccounts = ({ sessionId, accounts, isLoading }: SessionAccountsProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full opacity-40">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Loading accounts...
        </span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </div>
        <h4 className="text-sm font-bold mb-1">Chưa có account nào</h4>
        <p className="text-xs text-muted-foreground max-w-[280px]">
          Phiên #{sessionId} chưa có account. Dữ liệu sẽ xuất hiện khi account được liên kết.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-5">
        <h2 className="text-xl font-bold font-head">Phiên #{sessionId}</h2>
        <p className="text-xs text-muted-foreground mt-1">{accounts.length} account</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                #
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ngày tạo
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Cập nhật
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, idx) => (
              <tr
                key={account.id}
                className="border-b border-border last:border-0 hover:bg-sidebar-item-hover transition-colors"
              >
                <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-3 text-[13px] font-medium">{account.email}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(account.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateTime(account.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionAccounts;