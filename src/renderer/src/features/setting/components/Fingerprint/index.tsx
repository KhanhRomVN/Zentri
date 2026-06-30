import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Plus, Trash2, Edit2, ChevronDown, Monitor, Cpu } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import { FingerprintConfig, INITIAL_CONFIG } from './FingerprintPresets';
import { FingerprintDetail } from './FingerprintDetail';

interface FingerprintRow {
  id: string;
  name: string;
  description: string;
  config: FingerprintConfig;
}

export const FingerprintSettings = () => {
  const [presets, setPresets] = useState<FingerprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<FingerprintConfig>(INITIAL_CONFIG);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; presetId: string } | null>(
    null,
  );
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const loadPresets = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const rows = await window.electron.ipcRenderer.invoke(
        'sqlite:all',
        'SELECT * FROM fingerprints ORDER BY created_at DESC',
      );
      setPresets(
        rows.map((r: any) => ({
          id: r.id,
          name: r.name || 'Untitled',
          description: r.description || '',
          config: r.config_json ? JSON.parse(r.config_json) : INITIAL_CONFIG,
        })),
      );
    } catch (error) {
      console.error('Failed to load fingerprint presets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
    const handleUpdate = () => loadPresets();
    const handleAddClick = () => handleAdd();
    window.addEventListener('zentri:fingerprints-updated', handleUpdate);
    window.addEventListener('add-fingerprint-click', handleAddClick);
    return () => {
      window.removeEventListener('zentri:fingerprints-updated', handleUpdate);
      window.removeEventListener('add-fingerprint-click', handleAddClick);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = () => {
    const newId = 'new-' + Date.now();
    const newPreset: FingerprintRow = {
      id: newId,
      name: 'New Fingerprint',
      description: '',
      config: { ...INITIAL_CONFIG, profileName: 'New Fingerprint' },
    };
    setPresets((prev) => [newPreset, ...prev]);
    setEditConfig(newPreset.config);
    setExpandedId(newId);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this fingerprint?')) {
      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke(
          'sqlite:run',
          'DELETE FROM fingerprints WHERE id = ?',
          [id],
        );
        setPresets((prev) => prev.filter((p) => p.id !== id));
        if (expandedId === id) setExpandedId(null);
      } catch (e) {
        console.error('Delete failed', e);
      }
    }
    setContextMenu(null);
  };

  const handleRowClick = (preset: FingerprintRow) => {
    if (expandedId === preset.id) {
      setExpandedId(null);
    } else {
      setEditConfig({ ...preset.config });
      setExpandedId(preset.id);
    }
  };

  const OS_LABEL: Record<string, string> = {
    Win32: 'Windows',
    MacIntel: 'macOS',
    'Linux x86_64': 'Linux',
    'Linux armv8l': 'Android',
    iPhone: 'iOS',
    iPad: 'iPadOS',
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="border-collapse table-fixed w-full">
          <thead className="sticky top-0 z-30">
            <tr className="hover:bg-transparent border-b border-border/50 bg-table-headerBg shadow-sm">
              <th className="w-[60px] pl-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                #
              </th>
              <th className="text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                Name
              </th>
              <th className="w-[120px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                OS
              </th>
              <th className="w-[140px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                Browser
              </th>
              <th className="w-[130px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                Resolution
              </th>
              <th className="w-[120px] text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-left text-muted-foreground">
                CPU / RAM
              </th>
              <th className="w-[100px] pr-6 text-[10px] uppercase tracking-[0.2em] font-bold h-10 text-right text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-20 text-muted-foreground/30 font-mono text-xs"
                >
                  Loading fingerprints...
                </td>
              </tr>
            ) : presets.length === 0 ? (
              <tr className="hover:bg-transparent border-none">
                <td colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <Shield className="w-16 h-16" />
                    <span className="text-[12px] font-black uppercase tracking-[0.3em]">
                      No fingerprint presets. Click + to create one.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              presets.map((preset, index) => (
                <React.Fragment key={preset.id}>
                  <tr
                    className={cn(
                      'group transition-all cursor-pointer border-b border-border/20 h-[48px] hover:bg-table-hoverItemBodyBg/50',
                      expandedId === preset.id && 'bg-primary/5 border-b-primary/30',
                    )}
                    onClick={() => handleRowClick(preset)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, presetId: preset.id });
                    }}
                  >
                    <td className="text-muted-foreground font-mono text-[10px] pl-6 py-2">
                      #{String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-110 transition-transform">
                          <Shield className="w-4 h-4 text-primary/60" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-bold text-foreground tracking-tight truncate">
                            {preset.name}
                          </span>
                          {preset.description && (
                            <span className="text-[10px] text-muted-foreground/40 font-mono truncate">
                              {preset.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-[12px] font-medium text-foreground/70">
                          {OS_LABEL[preset.config.os] || preset.config.os}
                        </span>
                      </div>
                    </td>
                    <td className="py-2">
                      <span className="text-[12px] font-mono text-foreground/60">
                        {preset.config.brand} {preset.config.brandVersion}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="text-[12px] font-mono text-foreground/60">
                        {preset.config.width}x{preset.config.height}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-[12px] font-medium text-foreground/70">
                          {preset.config.hardwareConcurrency}C / {preset.config.deviceMemory}GB
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(preset);
                          }}
                          className="p-1.5 rounded-lg hover:bg-primary/20 text-primary transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(preset.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500/60 hover:text-red-500 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-muted-foreground/50 transition-transform duration-300',
                            expandedId === preset.id && 'rotate-180',
                          )}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expandedId === preset.id && (
                    <tr className="hover:bg-transparent border-none">
                      <td colSpan={7} className="p-0">
                        <div className="bg-background/20 backdrop-blur-xl border-b border-border/10 animate-in fade-in duration-300">
                          <div className="p-8">
                            <FingerprintDetail
                              config={editConfig}
                              setConfig={setEditConfig}
                              presetId={preset.id}
                              isEditMode={true}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="h-10 border-t border-border/50 bg-table-headerBg/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-40">
        <div className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.25em]">
          {presets.length} fingerprints
        </div>
        <button
          onClick={handleAdd}
          className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-all active:scale-90 border border-primary/20"
          title="Add Fingerprint"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu &&
        createPortal(
          <div
            ref={contextMenuRef}
            className="fixed bg-background border border-border rounded-lg shadow-xl py-1.5 z-[1000] min-w-[160px] animate-in fade-in zoom-in-95 duration-100 p-1 hover:border-primary transition-colors"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                const preset = presets.find((p) => p.id === contextMenu.presetId);
                if (preset) {
                  setEditConfig({ ...preset.config });
                  setExpandedId(preset.id);
                }
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
            >
              <Edit2 className="w-3.5 h-3.5 text-primary" />
              Edit
            </button>
            <div className="h-px bg-border/20 my-1 mx-2" />
            <button
              onClick={() => handleDelete(contextMenu.presetId)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-dropdown-item-hover rounded-md transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};
