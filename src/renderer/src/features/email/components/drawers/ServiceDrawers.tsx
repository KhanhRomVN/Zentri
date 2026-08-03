import { FC } from 'react';
import { Plus, Database, ChevronDown, Search, X } from 'lucide-react';
import React from 'react';
import { Account } from '../../types';
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@renderer/components/ui/Drawer';
import { useServiceDrawer } from '@renderer/contexts/ServiceDrawerContext';
import { cn } from '@renderer/shared/lib/utils';
import { Button } from '@renderer/components/ui/Button';
import CryptoJS from 'crypto-js';

interface ServiceDrawersProps {
  isServiceDrawerOpen: boolean;
  setIsServiceDrawerOpen: (val: boolean) => void;
  linkServiceSearchQuery: string;
  setLinkServiceSearchQuery: (val: string) => void;
  focusedAccount: Account | null;
  newServiceData: any;
  setNewServiceData: React.Dispatch<React.SetStateAction<any>>;
  globalServices: any[];
  handleAddServiceLink: () => void;
  isQuickCreateModalOpen: boolean;
  setIsQuickCreateModalOpen: (val: boolean) => void;
  quickCreateData: any;
  setQuickCreateData: React.Dispatch<React.SetStateAction<any>>;
  handleQuickCreateService: () => void;
  categorySearch: string;
  setCategorySearch: (val: string) => void;
  categoryInputOpen: boolean;
  setCategoryInputOpen: (val: boolean) => void;
  isEditMode?: boolean;
  onRestoreService?: (linkId: string) => void;
  onServicesChanged?: () => void;
}

// ─── TOTP Helpers ─────────────────────────────────────────────────────────
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(secret: string): Uint8Array | null {
  try {
    const s = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
    if (s.length === 0) return null;
    const bits: number[] = [];
    for (let i = 0; i < s.length; i++) {
      const val = BASE32_ALPHABET.indexOf(s[i]);
      if (val === -1) return null;
      const b = val.toString(2).padStart(5, '0');
      for (let j = 0; j < 5; j++) bits.push(parseInt(b[j]));
    }
    const bytes: number[] = [];
    for (let i = 0; i + 7 < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      bytes.push(byte);
    }
    return new Uint8Array(bytes);
  } catch {
    return null;
  }
}

function generateTotp(secret: string, timeStep = 30, digits = 6): string | null {
  const key = base32Decode(secret);
  if (!key || key.length === 0) return null;
  let counter = Math.floor(Date.now() / 1000 / timeStep);
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter >>= 8;
  }
  const hmac = CryptoJS.HmacSHA1(
    CryptoJS.lib.WordArray.create(key),
    CryptoJS.lib.WordArray.create(counterBytes),
  );
  const hmacBytes = new Uint8Array(hmac.words.length * 4);
  for (let i = 0; i < hmac.words.length; i++) {
    const w = hmac.words[i];
    hmacBytes[i * 4] = (w >>> 24) & 0xff;
    hmacBytes[i * 4 + 1] = (w >>> 16) & 0xff;
    hmacBytes[i * 4 + 2] = (w >>> 8) & 0xff;
    hmacBytes[i * 4 + 3] = w & 0xff;
  }
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binCode =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);
  return (binCode % Math.pow(10, digits)).toString().padStart(digits, '0');
}

function isValidBase32(secret: string): boolean {
  return base32Decode(secret) !== null;
}

// ─── Backup Code Color ────────────────────────────────────────────────────
const CODE_COLORS = [
  { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: 'rgb(217,119,6)' },
  { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', text: 'rgb(37,99,235)' },
  { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', text: 'rgb(124,58,237)' },
  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: 'rgb(5,150,105)' },
  { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.2)', text: 'rgb(219,39,119)' },
  { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', text: 'rgb(234,88,12)' },
];

function getCodeColor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash * 31) + code.charCodeAt(i)) | 0;
  }
  return CODE_COLORS[Math.abs(hash) % CODE_COLORS.length];
}

// ─── SearchableServiceSelect ────────────────────────────────────────────────
const SearchableServiceSelect: FC<{
  services: any[];
  selectedServiceId: string;
  selectedServiceName: string;
  onSelect: (service: any) => void;
  placeholder?: string;
}> = ({ services, selectedServiceId, selectedServiceName, onSelect, placeholder = 'Search services...' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 pl-3 pr-8 rounded-md bg-input-background border border-border text-sm text-foreground outline-none hover:border-primary/50 transition-colors flex items-center gap-2 whitespace-nowrap w-full"
      >
        {selectedService?.url && (
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(selectedService.url).hostname}&sz=64`}
            alt=""
            className="w-4 h-4 rounded-sm"
          />
        )}
        <span className={!selectedServiceId ? 'text-muted-foreground/40' : ''}>
          {selectedServiceId ? selectedServiceName : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground/50 absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-dropdown-background border border-border/50 rounded-md py-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[280px] overflow-y-auto hover:border-primary transition-colors">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 z-10" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-input-background text-xs text-foreground placeholder:text-muted-foreground/40 outline-none"
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground/50">
              No services found
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelect(s);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                  s.id === selectedServiceId
                    ? 'text-foreground bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-dropdown-item-hover',
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center p-1 rounded-md bg-muted/50 border border-border/50">
                  <img
                    src={
                      s.url
                        ? `https://www.google.com/s2/favicons?domain=${new URL(s.url).hostname}&sz=64`
                        : ''
                    }
                    alt=""
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-foreground/80 truncate">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground/40 truncate">{s.url}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ServiceDrawers: FC<ServiceDrawersProps> = ({
  isServiceDrawerOpen,
  setIsServiceDrawerOpen,
  linkServiceSearchQuery: _linkServiceSearchQuery,
  setLinkServiceSearchQuery,
  focusedAccount,
  newServiceData,
  setNewServiceData,
  globalServices,
  handleAddServiceLink,
  isEditMode,
  onRestoreService,
  onServicesChanged,
}) => {
  const { openDrawer } = useServiceDrawer();

  // TOTP
  const [totpCode, setTotpCode] = React.useState<string | null>(null);
  const [totpTimer, setTotpTimer] = React.useState(30);

  React.useEffect(() => {
    const secret = newServiceData.twoFa?.totp;
    if (!secret || !isValidBase32(secret)) {
      setTotpCode(null);
      setTotpTimer(30);
      return;
    }
    const tick = () => {
      setTotpCode(generateTotp(secret));
      setTotpTimer(30 - (Math.floor(Date.now() / 1000) % 30));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [newServiceData.twoFa?.totp]);

  return (
    <>
      {/* Add/Edit Service Link Drawer */}
      <Drawer
        isOpen={isServiceDrawerOpen}
        onClose={() => {
          setIsServiceDrawerOpen(false);
          setLinkServiceSearchQuery('');
        }}
        position="right"
        width="500px"
      >
        <DrawerHeader
          title={isEditMode ? 'Edit Service' : 'Link Account'}
          description={
            isEditMode
              ? `Update credentials for ${newServiceData.serviceName}`
              : `Associate service with ${focusedAccount?.email || ''}`
          }
          onClose={() => {
            setIsServiceDrawerOpen(false);
            setLinkServiceSearchQuery('');
          }}
        />

        <DrawerBody className="space-y-6">
          {/* Service Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">Select Service</label>
              {!isEditMode && (
                <button
                  onClick={() => {
                    openDrawer(null, true, () => {
                      setIsServiceDrawerOpen(true);
                    });
                    setIsServiceDrawerOpen(false);
                    if (onServicesChanged) onServicesChanged();
                  }}
                  className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  + New Service
                </button>
              )}
            </div>
            <div className="relative">
              {isEditMode ? (
                <input
                  type="text"
                  readOnly
                  value={newServiceData.serviceName}
                  className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors"
                />
              ) : (
                <SearchableServiceSelect
                  services={globalServices}
                  selectedServiceId={newServiceData.serviceId || ''}
                  selectedServiceName={newServiceData.serviceName || ''}
                  onSelect={(service) => {
                    const existingInTrash = focusedAccount?.services?.find(
                      (link: any) =>
                        link.serviceId === service.id && link.status === 'deleting',
                    );
                    if (existingInTrash) {
                      setNewServiceData((prev: any) => ({
                        ...prev,
                        serviceId: service.id,
                        serviceName: service.name,
                        username: existingInTrash.username || '',
                        password: existingInTrash.password || '',
                        notes: existingInTrash.notes || '',
                        linkId: existingInTrash.id,
                      }));
                    } else {
                      setNewServiceData((prev: any) => ({
                        ...prev,
                        serviceId: service.id,
                        serviceName: service.name,
                      }));
                    }
                    setLinkServiceSearchQuery(service.name);
                  }}
                />
              )}
            </div>

            {/* Trash Warning */}
            {(() => {
              const existingLink = focusedAccount?.services?.find(
                (link: any) => link.serviceId === newServiceData.serviceId,
              );
              if (existingLink?.status === 'deleting') {
                return (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <Plus className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 rotate-45" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          Link in Trash
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          This service link is in the trash. Restore it to continue.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (onRestoreService && existingLink.id) {
                          onRestoreService(existingLink.id);
                          setIsServiceDrawerOpen(false);
                        }
                      }}
                      className="w-full py-2.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Restore Connection
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* 2FA Configuration */}
          {newServiceData.serviceId && (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground/80 shrink-0">
                  Two-Factor Authentication
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <div className="space-y-2.5">
                {/* TOTP Secret */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                    TOTP Secret
                  </label>
                  <input
                    type="text"
                    placeholder="JBSWY3DPEHPK3PXP..."
                    value={newServiceData.twoFa?.totp || ''}
                    onChange={(e) =>
                      setNewServiceData((d: any) => ({
                        ...d,
                        twoFa: { ...(d.twoFa || {}), totp: e.target.value },
                      }))
                    }
                    className={cn(
                      'w-full h-10 px-3 rounded-md bg-input-background border text-sm text-foreground placeholder:text-xs placeholder:font-sans placeholder:text-muted-foreground/40 outline-none transition-colors font-mono',
                      newServiceData.twoFa?.totp && !isValidBase32(newServiceData.twoFa.totp)
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-border focus:border-primary/50',
                    )}
                  />
                  {newServiceData.twoFa?.totp && !isValidBase32(newServiceData.twoFa.totp) && (
                    <p className="text-[10px] font-bold text-red-500">Invalid Base32 secret</p>
                  )}
                  {/* TOTP Digit Display */}
                  {totpCode && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-600 font-mono tracking-widest">
                        {totpCode.slice(0, 3) + ' ' + totpCode.slice(3)}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600/70 tabular-nums">
                        {totpTimer}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Backup Codes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                    Backup Codes
                  </label>
                  <input
                    type="text"
                    value={newServiceData.twoFa?.backupInput || ''}
                    onChange={(e) =>
                      setNewServiceData((d: any) => ({
                        ...d,
                        twoFa: { ...(d.twoFa || {}), backupInput: e.target.value },
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = (newServiceData.twoFa?.backupInput || '').trim();
                        if (input) {
                          const current = (newServiceData.twoFa?.backupCodes || []) as string[];
                          setNewServiceData((d: any) => ({
                            ...d,
                            twoFa: {
                              ...(d.twoFa || {}),
                              backupCodes: [...current, input],
                              backupInput: '',
                            },
                          }));
                        }
                      }
                    }}
                    placeholder="Type backup code and press Enter..."
                    className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-xs placeholder:font-sans placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50 font-mono"
                  />
                  {((newServiceData.twoFa?.backupCodes || []) as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(newServiceData.twoFa.backupCodes as string[]).map((code: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-0 px-2 py-0.5 rounded-md text-[11px] font-medium border group/tag transition-all font-mono"
                          style={{
                            backgroundColor: getCodeColor(code).bg,
                            borderColor: getCodeColor(code).border,
                            color: getCodeColor(code).text,
                          }}
                        >
                          {code}
                          <button
                            onClick={() => {
                              const updated = (newServiceData.twoFa.backupCodes as string[]).filter(
                                (_: string, i: number) => i !== idx,
                              );
                              setNewServiceData((d: any) => ({
                                ...d,
                                twoFa: { ...(d.twoFa || {}), backupCodes: updated },
                              }));
                            }}
                            className="w-0 overflow-hidden opacity-0 group-hover/tag:w-auto group-hover/tag:overflow-visible group-hover/tag:opacity-100 group-hover/tag:ml-0.5 hover:text-red-500 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Metadata */}
          {newServiceData.serviceId &&
            (() => {
              const selectedService = globalServices.find(
                (s: any) => s.id === newServiceData.serviceId,
              );
              const metadataDefinitions: any[] = selectedService?.metadata
                ? typeof selectedService.metadata === 'string'
                  ? JSON.parse(selectedService.metadata)
                  : selectedService.metadata
                : [];
              if (metadataDefinitions.length === 0) return null;
              return (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300 !mt-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground/80 shrink-0">
                      Metadata Fields
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  {metadataDefinitions.map((item: any) => (
                    <div key={item.key} className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground/80">
                        {item.key}
                        {item.type === 'array' && (
                          <span className="text-[10px] lowercase font-normal opacity-50">
                            (comma separated)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter ${item.key.toLowerCase()}...`}
                        value={
                          item.type === 'array'
                            ? Array.isArray(newServiceData.metadata?.[item.key])
                              ? newServiceData.metadata[item.key].join(', ')
                              : newServiceData.metadata?.[item.key] || ''
                            : newServiceData.metadata?.[item.key] || ''
                        }
                        onChange={(e) =>
                          setNewServiceData((d: any) => ({
                            ...d,
                            metadata: {
                              ...(d.metadata || {}),
                              [item.key]:
                                item.type === 'array'
                                  ? e.target.value.split(',').map((s: string) => s.trim())
                                  : e.target.value,
                            },
                          }))
                        }
                        className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
        </DrawerBody>

        <DrawerFooter className="justify-end">
          <Button variant="outline" onClick={() => setIsServiceDrawerOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="soft"
            disabled={!newServiceData.serviceId}
            onClick={handleAddServiceLink}
          >
            {isEditMode ? 'Update Service' : 'Secure Connection'}
          </Button>
        </DrawerFooter>
      </Drawer>
    </>
  );
};

export default ServiceDrawers;
