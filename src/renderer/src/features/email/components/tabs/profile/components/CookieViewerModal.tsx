import { useState, useMemo } from 'react';
import {
  Database,
  Download,
  Search,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { Cookie } from '../../../mock/accounts';
import { cn } from '../../../../../../shared/lib/utils';

interface CookieViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookies?: Cookie[];
}

export const CookieViewerModal = ({ isOpen, onClose, cookies = [] }: CookieViewerModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const filteredCookies = useMemo(() => {
    return cookies.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [cookies, searchTerm]);

  if (!isOpen) return null;

  const handleCopy = (cookie: Cookie) => {
    navigator.clipboard.writeText(JSON.stringify(cookie, null, 2));
    setCopied(cookie.name);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cookies, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'cookies.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const formatExpires = (expires?: number) => {
    if (!expires) return { label: 'Session', class: 'text-blue-500 bg-blue-500/10' };

    const now = Date.now();
    const diff = expires * 1000 - now; // Chrome expires are usually in seconds

    if (diff <= 0) return { label: 'Expired', class: 'text-red-500 bg-red-500/10' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) {
      const color =
        days < 7 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';
      return { label: `${days}d left`, class: color };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    return { label: `${hours}h left`, class: 'text-red-500 bg-red-500/10 animate-pulse' };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-8">
      <div className="w-full max-w-5xl h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Cookie Explorer</h2>
              <p className="text-xs text-muted-foreground">
                Manage and view captured session cookies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadJson}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold hover:bg-muted transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-card">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredCookies.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10 border-b border-border">
                <tr className="text-left text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4 w-[20%]">Name</th>
                  <th className="px-6 py-4 w-[25%]">Value</th>
                  <th className="px-6 py-4 w-[15%]">Domain</th>
                  <th className="px-6 py-4 w-[15%]">Expires</th>
                  <th className="px-6 py-4 w-[10%] text-center">Flags</th>
                  <th className="px-6 py-4 w-[15%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCookies.map((cookie, idx) => {
                  const expiry = formatExpires(cookie.expires);
                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground/90">
                        {cookie.name}
                      </td>
                      <td className="px-6 py-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-[11px] truncate max-w-[150px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                            {showValues[cookie.name] ? cookie.value : '•'.repeat(16)}
                          </div>
                          <button
                            onClick={() =>
                              setShowValues((p) => ({ ...p, [cookie.name]: !p[cookie.name] }))
                            }
                            className="p-1 rounded hover:bg-muted text-muted-foreground transition-all shrink-0"
                          >
                            {showValues[cookie.name] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        {cookie.domain}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap',
                            expiry.class,
                          )}
                        >
                          {expiry.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          {cookie.httpOnly && (
                            <div
                              className="w-5 h-5 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[8px] font-bold"
                              title="HttpOnly"
                            >
                              H
                            </div>
                          )}
                          {cookie.secure && (
                            <div
                              className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[8px] font-bold"
                              title="Secure"
                            >
                              S
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCopy(cookie)}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all',
                            copied === cookie.name
                              ? 'bg-emerald-500 text-white'
                              : 'bg-primary/5 text-primary hover:bg-primary/10',
                          )}
                        >
                          {copied === cookie.name ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No cookies found</p>
              <p className="text-xs">Try adjusting your search filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex gap-4">
            <span>
              Total: <strong>{cookies.length}</strong> cookies
            </span>
            <span>
              Search results: <strong>{filteredCookies.length}</strong>
            </span>
          </div>
          <div className="italic">Tip: Click the eyeball icon to unmask cookie values.</div>
        </div>
      </div>
    </div>
  );
};
