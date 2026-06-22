import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2 } from 'lucide-react';
import { ServiceProviderConfig } from '../../../email/types';
import { cn } from '@renderer/shared/lib/utils';
import ServiceDrawer from './ServiceDrawer';

interface ServiceManagerProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
}

export const ServiceManager = ({ serviceSearch, setServiceSearch }: ServiceManagerProps) => {
  const [services, setServices] = useState<Record<string, ServiceProviderConfig>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceProviderConfig>>({});
  const [isNew, setIsNew] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [focusedServiceId, setFocusedServiceId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; serviceId: string } | null>(null);

  useEffect(() => { loadServices(); }, []);
  useEffect(() => {
    const h = () => { setEditingService({}); setIsNew(true); setIsModalOpen(true); };
    window.addEventListener('add-service-click', h); return () => window.removeEventListener('add-service-click', h);
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke('sqlite:all', 'SELECT * FROM services');
      const mapped: Record<string, ServiceProviderConfig> = {};
      rows.forEach((row: any) => { mapped[row.id] = { id: row.id, name: row.name, websiteUrl: row.url || '', defaultTags: row.tags ? JSON.parse(row.tags) : [], defaultCategories: row.category ? JSON.parse(row.category) : [], metadata: row.metadata ? JSON.parse(row.metadata) : [] } as ServiceProviderConfig; });
      setServices(mapped);
    } catch (error) { console.error('Failed to load services:', error); setServices({}); } finally { setLoading(false); }
  };

  const getFaviconUrl = (url: string) => { if (!url) return ''; try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return ''; } };

  const handleSave = async (data: Partial<ServiceProviderConfig>, metadata: { key: string; value: string }[], authMethods: string[], layoutConfig: any[]) => {
    const id = editingService.id || (data.name || '').toLowerCase().replace(/\s+/g, '-');
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('sqlite:run',
        `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, metadata, config_json, auth_method, layout_config, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, data.name, data.websiteUrl, JSON.stringify(data.defaultTags || []), JSON.stringify(data.defaultCategories || []), (data as any).description || '', JSON.stringify(metadata), JSON.stringify({}), JSON.stringify(authMethods), JSON.stringify(layoutConfig)]);
      await loadServices(); setIsModalOpen(false);
    } catch (error) { console.error('Failed to save service:', error); }
  };

  const rows = Object.values(services);
  const handleEdit = (service: ServiceProviderConfig) => { setEditingService(service); setIsNew(false); setIsModalOpen(true); };

  return (
    <div className="h-full flex flex-col relative" ref={containerRef}>
      <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="border-collapse table-fixed w-full">
            <thead className="sticky top-0 z-30"><tr className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
              <th className="w-[40px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-center text-muted-foreground"><input type="checkbox" className="w-3.5 h-3.5 rounded border-border/50 bg-input-background accent-primary cursor-pointer" /></th>
              <th className="w-[60px] pl-4 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">#</th>
              <th className="text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">Service</th>
              <th className="w-[180px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">Tags</th>
              <th className="w-[180px] pr-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">Categories</th>
            </tr></thead>
            <tbody>
              {loading ? (<tr><td colSpan={5} className="text-center py-20 text-muted-foreground/30 font-mono text-xs">Loading service registry...</td></tr>) : (
                rows.filter(s => !focusedServiceId || s.id === focusedServiceId).map((service, index) => (
                  <React.Fragment key={service.id}>
                    <tr className={cn('group transition-all cursor-pointer border-b border-border/20 h-[48px] hover:bg-table-hoverItemBodyBg/50', focusedServiceId === service.id && 'bg-primary/5 sticky top-0 z-40 backdrop-blur-md border-b-primary/30')}
                      onClick={() => setFocusedServiceId(focusedServiceId === service.id ? null : service.id)} onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, serviceId: service.id }); }}>
                      <td className="text-center"><input type="checkbox" className="w-3.5 h-3.5 rounded border-border/50 bg-input-background accent-primary cursor-pointer" onClick={e => e.stopPropagation()} /></td>
                      <td className="text-muted-foreground font-mono text-[10px] pl-4 py-2">#{String(index + 1).padStart(2, '0')}</td>
                      <td><div className="flex items-center gap-4">
                        {focusedServiceId === service.id && <button onClick={e => { e.stopPropagation(); setFocusedServiceId(null); }} className="p-1 px-2 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all mr-2">Back</button>}
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform overflow-hidden shrink-0 border border-primary/5 group-hover:scale-110"><img src={getFaviconUrl(service.websiteUrl)} alt={service.name} className="w-full h-full object-contain" /></div>
                        <div className="flex flex-col min-w-0"><span className="text-foreground text-[14px] font-bold tracking-tight truncate">{service.name}</span><span className="text-[10px] text-muted-foreground/40 font-mono truncate">{service.websiteUrl}</span></div>
                      </div></td>
                      <td><div className="flex gap-1 overflow-hidden">{(service.defaultTags || []).filter(t => t.trim()).slice(0, 3).map((tag, idx) => (<span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md border border-border/50 text-[9px] uppercase text-muted-foreground bg-muted/30">{tag}</span>))}</div></td>
                      <td className="pr-6">{service.defaultCategories?.[0] && <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-amber-500/30 text-[10px] uppercase font-black text-amber-500 bg-amber-500/5">{service.defaultCategories[0]}</span>}</td>
                    </tr>
                  </React.Fragment>)))}
            </tbody>
          </table>
        </div>
        <div className="h-10 border-t border-border/50 bg-table-headerBg/80 backdrop-blur-xl flex items-center px-4 shrink-0 z-40"><div className="flex-1 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.25em]">{rows.length} services</div></div>
        {contextMenu && createPortal(<div ref={contextMenuRef} className="fixed bg-popover border border-border/50 rounded-xl shadow-2xl py-1.5 z-[1000] min-w-[160px] animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl hover:border-primary transition-colors" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { handleEdit(services[contextMenu.serviceId]); setContextMenu(null); }} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-muted/50 flex items-center gap-3 transition-colors"><Edit2 className="w-3.5 h-3.5 text-primary" />Edit Configuration</button>
          <div className="h-px bg-border/30 my-1 mx-2" />
          <button onClick={async () => { if (confirm(`Remove "${services[contextMenu.serviceId].name}"?`)) { try { /* @ts-ignore */ await window.electron.ipcRenderer.invoke('sqlite:run', 'DELETE FROM services WHERE id = ?', [contextMenu.serviceId]); await loadServices(); } catch (e) { console.error('Delete failed', e); } } setContextMenu(null); }} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-destructive/10 text-destructive/80 hover:text-destructive flex items-center gap-3 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete Service</button>
        </div>, document.body)}
      </div>
      <ServiceDrawer isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editService={editingService} isNew={isNew} />
    </div>
  );
};