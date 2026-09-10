/**
 * ServiceListModal
 * Danh sách service có search + phân trang — modal độc lập.
 */
import { FC, useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, PackageOpen, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ServiceProviderConfig } from '../../types';

interface ServiceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

const getFaviconUrl = (url: string) => {
  if (!url) return '';
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return '';
  }
};

const PAGE_SIZE = 8;

const ServiceListModal: FC<ServiceListModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [services, setServices] = useState<Record<string, ServiceProviderConfig>>({});
  const [loading, setLoading] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke('sqlite:all', 'SELECT * FROM services');
      const mapped: Record<string, ServiceProviderConfig> = {};
      rows.forEach((row: any) => {
        mapped[row.id] = {
          id: row.id,
          name: row.name,
          websiteUrl: row.url || '',
          defaultTags: row.tags ? JSON.parse(row.tags) : [],
          defaultCategories: row.category ? JSON.parse(row.category) : [],
          description: row.description || '',
          metadata: row.metadata ? JSON.parse(row.metadata) : [],
          authMethods: row.auth_method ? JSON.parse(row.auth_method) : [],
        } as ServiceProviderConfig;
      });
      setServices(mapped);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      loadServices();
    }
  }, [isOpen, loadServices]);

  const allRows = Object.values(services);
  const filteredRows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.websiteUrl.toLowerCase().includes(q) ||
        (s.defaultCategories?.[0] || '').toLowerCase().includes(q),
    );
  }, [allRows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl h-[80vh]" hideCloseButton>
      <ModalHeader
        title="Service Registry"
        description="Manage available services for your email accounts"
        onClose={onClose}
      />
      <ModalBody className="p-0 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
            <span className="text-sm font-bold text-foreground">Service Registry</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search services..."
                  className="w-56 h-9 pl-9 pr-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-text-secondary outline-none focus:border-primary/50"
                />
              </div>
              <Button variant="soft" size="sm" onClick={onCreate} className="w-9 h-9 p-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <EmptyState
                  icon={<Loader2 className="animate-spin" />}
                  title="Loading services..."
                  description="Fetching service registry from database."
                />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <EmptyState
                  icon={<PackageOpen />}
                  title="No services found"
                  description={search ? 'Try a different search term.' : 'Create your first service to get started.'}
                />
              </div>
            ) : (
              <table className="border-collapse table-fixed w-full">
                <thead className="sticky top-0 z-30">
                  <tr className="border-b border-border/50 bg-table-header-background">
                    <th className="w-[60px] pl-4 text-sm font-bold h-10 text-left text-text-secondary">STT</th>
                    <th className="text-sm font-bold h-10 text-left text-text-secondary">Service</th>
                    <th className="w-[180px] text-sm font-bold h-10 text-left text-text-secondary">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((service, index) => (
                    <tr key={service.id} className="group border-b border-border/20 h-[48px] hover:bg-table-row-hover">
                      <td className="text-muted-foreground font-mono text-xs pl-4 py-2">
                        #{String((safePage - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <img
                            src={getFaviconUrl(service.websiteUrl)}
                            alt={service.name}
                            className="w-5 h-5 rounded-sm shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-foreground text-[13px] font-bold truncate">{service.name}</span>
                            <span className="text-[9px] text-muted-foreground/40 font-mono truncate">{service.websiteUrl}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-[13px] text-foreground/70 truncate">
                          {service.defaultCategories?.[0] || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="h-10 border-t border-border/50 bg-card-background/80 flex items-center justify-between px-4 shrink-0">
            <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
              {filteredRows.length} services
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border/50 text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-text-secondary px-2">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border/50 text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default ServiceListModal;