/**
 * ServiceListModal
 * Danh sách service có search + phân trang — modal độc lập.
 */
import { FC, useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  PackageOpen,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../components/ui/Dropdown';
import { useAccentColors } from '../../../../hooks/useAccentColors';
import ServiceFormModal from './ServiceFormModal';
import { ServiceProviderConfig } from '../../types';

interface ServiceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

/** ServiceProviderConfig extended with the linked-email count from the registry query. */
type ServiceRow = ServiceProviderConfig & { emailCount?: number };

const getFaviconUrl = (url: string) => {
  if (!url) return '';
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return '';
  }
};

/**
 * `services.category` is stored as a JSON-encoded array string (e.g. '["Social"]'),
 * but some code paths pass it through as an already-parsed array or a plain string.
 * Normalize all of these to a single display label.
 */
function normalizeCategoryLabel(cat: any): string | null {
  if (!cat) return null;
  if (Array.isArray(cat)) return cat[0] ?? null;
  if (typeof cat !== 'string') return null;
  const trimmed = cat.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? (parsed[0] ?? null) : parsed;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

const PAGE_SIZE = 8;

const ServiceListModal: FC<ServiceListModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { getColorByIndex, toRgba } = useAccentColors();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [services, setServices] = useState<Record<string, ServiceRow>>({});
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<ServiceProviderConfig | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; service: ServiceRow } | null>(
    null,
  );

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        `SELECT s.*,
           (SELECT COUNT(*) FROM service_emails se WHERE se.service_id = s.id) AS emailCount
         FROM services s`,
      );
      const mapped: Record<string, ServiceRow> = {};
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
          twoFa: row.two_fa
            ? JSON.parse(row.two_fa)
            : { has_totp: false, has_backup_codes: false },
          emailCount: row.emailCount || 0,
        } as ServiceRow;
      });
      setServices(mapped);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices({});
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteService = useCallback(
    async (id: string) => {
      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('sqlite:run', 'DELETE FROM services WHERE id = ?', [
          id,
        ]);
        setDeleteConfirmId(null);
        setContextMenu(null);
        loadServices();
        window.dispatchEvent(new CustomEvent('services-changed'));
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    },
    [loadServices],
  );

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
                    <th className="w-[80px] text-sm font-bold h-10 text-center text-text-secondary">Emails</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((service, index) => {
                    const categoryLabel = normalizeCategoryLabel(service.defaultCategories);
                    const categoryColor = categoryLabel
                      ? getColorByIndex(
                          categoryLabel
                            .split('')
                            .reduce((sum: number, c: string) => sum + c.charCodeAt(0), 0),
                        )
                      : null;
                    return (
                      <tr
                        key={service.id}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, service });
                        }}
                        className="group border-b border-border/20 h-[48px] hover:bg-table-row-hover"
                      >
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
                              <span className="text-foreground text-[13px] font-bold truncate">
                                {service.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground/40 font-mono truncate">
                                {service.websiteUrl}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {categoryLabel && categoryColor ? (
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
                              style={{
                                backgroundColor: toRgba(categoryColor, 0.12),
                                color: categoryColor,
                              }}
                            >
                              {categoryLabel}
                            </span>
                          ) : (
                            <span className="text-[13px] text-foreground/40">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="text-[12px] font-mono text-foreground/70">
                            {service.emailCount || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Row context menu */}
      {contextMenu &&
        createPortal(
          <Dropdown
            open={true}
            onOpenChange={(open) => {
              if (!open) setContextMenu(null);
            }}
            position={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <DropdownTrigger asChild>
              <div className="fixed" />
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingService(contextMenu.service);
                  setContextMenu(null);
                }}
              >
                <Pencil className="w-3.5 h-3.5 text-blue-500/60" />
                Edit
              </DropdownItem>
              <div className="h-px bg-divider my-1" />
              <DropdownItem
                className="text-error focus:text-error focus:bg-error/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(contextMenu.service.id);
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </DropdownItem>
            </DropdownContent>
          </Dropdown>,
          document.body,
        )}

      {/* Delete confirm */}
      {deleteConfirmId &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirmId(null)}
            />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground">Delete Service</h3>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This service will be permanently deleted. All linked emails will lose their
                  association with it. This action cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-border/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-muted/50 hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteService(deleteConfirmId)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit modal (create mode when service=null) */}
      {createPortal(
        <ServiceFormModal
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          service={editingService}
        />,
        document.body,
      )}
    </Modal>
  );
};

export default ServiceListModal;