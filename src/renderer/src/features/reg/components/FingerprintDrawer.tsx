import { memo } from 'react';
import { X, Monitor, Globe, Shield, ChevronDown } from 'lucide-react';
import { Agent, Fingerprint } from '../types';
import { RESOLUTIONS, TIMEZONES, LANGUAGES, USER_AGENTS } from '../constants';
import * as Flags from 'country-flag-icons/react/3x2';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../shared/components/ui/dropdown';
import { cn } from '../../../shared/lib/utils';
import { Drawer } from '../../../shared/components/ui/drawer';

interface FingerprintDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Omit<Agent, 'id'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Agent, 'id'>>>;
  onSave?: () => void;
}

const FingerprintDrawer = memo(
  ({ isOpen, onClose, formData, setFormData, onSave }: FingerprintDrawerProps) => {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} direction="right" width={512}>
        {/* Header */}
        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/20">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold tracking-tight">Advanced Settings</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-all">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
              <Monitor className="w-3 h-3" /> Basic Information
            </h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Agent Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chrome Windows"
                  className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:border-primary/40 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  User Agent
                </label>
                <Dropdown className="w-full">
                  <DropdownTrigger className="w-full">
                    <div className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm flex items-center justify-between hover:border-primary/40 transition-colors">
                      <span className="truncate">
                        {USER_AGENTS.find((u) => u.value === formData.userAgent)?.label ||
                          formData.userAgent ||
                          'Select User Agent'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50" />
                    </div>
                  </DropdownTrigger>
                  <DropdownContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
                    {USER_AGENTS.map((u) => (
                      <DropdownItem
                        key={u.value}
                        onClick={() => setFormData((p) => ({ ...p, userAgent: u.value, os: u.os }))}
                        className={cn(
                          'text-sm flex flex-col items-start gap-0.5',
                          formData.userAgent === u.value && 'text-primary bg-primary/10',
                        )}
                      >
                        <span className="font-medium">{u.label}</span>
                        <span className="text-[10px] text-muted-foreground opacity-70">
                          {u.value.substring(0, 40)}...
                        </span>
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
              <Monitor className="w-3 h-3" /> Environment
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">OS</label>
                <select
                  className="w-full h-9 px-2 rounded-md bg-input border border-border text-sm focus:border-primary/40 outline-none"
                  value={formData.os}
                  onChange={(e) => setFormData((p) => ({ ...p, os: e.target.value }))}
                >
                  <option>Windows</option>
                  <option>macOS</option>
                  <option>Linux</option>
                  <option>Android</option>
                  <option>iOS</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Resolution
                </label>
                <Dropdown className="w-full">
                  <DropdownTrigger className="w-full">
                    <div className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm flex items-center justify-between hover:border-primary/40 transition-colors">
                      <span className="truncate">
                        {RESOLUTIONS.find((r) => r.value === formData.resolution)?.label ||
                          formData.resolution ||
                          'Select Resolution'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50" />
                    </div>
                  </DropdownTrigger>
                  <DropdownContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                      Desktop
                    </div>
                    {RESOLUTIONS.filter((r) => r.group === 'Desktop').map((r) => (
                      <DropdownItem
                        key={r.label}
                        onClick={() => setFormData((p) => ({ ...p, resolution: r.value }))}
                        className={cn(
                          'text-sm',
                          formData.resolution === r.value && 'text-primary bg-primary/10',
                        )}
                      >
                        {r.label}
                      </DropdownItem>
                    ))}
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-t border-border mt-1 pt-2">
                      Mobile
                    </div>
                    {RESOLUTIONS.filter((r) => r.group === 'Mobile').map((r) => (
                      <DropdownItem
                        key={r.label}
                        onClick={() => setFormData((p) => ({ ...p, resolution: r.value }))}
                        className={cn(
                          'text-sm',
                          formData.resolution === r.value && 'text-primary bg-primary/10',
                        )}
                      >
                        {r.label}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Timezone
                </label>
                <Dropdown className="w-full">
                  <DropdownTrigger className="w-full">
                    <div className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm flex items-center justify-between hover:border-primary/40 transition-colors">
                      <span className="truncate">
                        {TIMEZONES.find((t) => t.value === formData.timezone)?.label ||
                          formData.timezone ||
                          'Select Timezone'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50" />
                    </div>
                  </DropdownTrigger>
                  <DropdownContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
                    {TIMEZONES.map((t) => (
                      <DropdownItem
                        key={t.value}
                        onClick={() => setFormData((p) => ({ ...p, timezone: t.value }))}
                        className={cn(
                          'text-sm',
                          formData.timezone === t.value && 'text-primary bg-primary/10',
                        )}
                      >
                        {t.label}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Language
                </label>
                <Dropdown className="w-full">
                  <DropdownTrigger className="w-full">
                    <div className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm flex items-center justify-between hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        {(() => {
                          const selectedLang = LANGUAGES.find((l) => l.value === formData.language);
                          if (selectedLang) {
                            const FlagComponent = Flags[selectedLang.code as keyof typeof Flags];
                            return (
                              <>
                                {FlagComponent && (
                                  <FlagComponent className="w-4 h-3 rounded-[2px]" />
                                )}
                                <span className="truncate">{selectedLang.label}</span>
                              </>
                            );
                          }
                          return <span className="text-muted-foreground">Select Language</span>;
                        })()}
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50" />
                    </div>
                  </DropdownTrigger>
                  <DropdownContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
                    {LANGUAGES.map((l) => {
                      const FlagComponent = Flags[l.code as keyof typeof Flags];
                      return (
                        <DropdownItem
                          key={l.value}
                          onClick={() => setFormData((p) => ({ ...p, language: l.value }))}
                          className={cn(
                            'text-sm flex items-center gap-2',
                            formData.language === l.value && 'text-primary bg-primary/10',
                          )}
                        >
                          {FlagComponent && <FlagComponent className="w-4 h-3 rounded-[2px]" />}
                          {l.label}
                        </DropdownItem>
                      );
                    })}
                  </DropdownContent>
                </Dropdown>
              </div>
            </div>
          </div>

          {/* Browser Features */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
              <Globe className="w-3 h-3" /> API Features
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  WebRTC
                </label>
                <select
                  className="w-full h-9 px-2 rounded-md bg-input border border-border text-sm focus:border-primary/40 outline-none"
                  value={formData.webrtc}
                  onChange={(e) => setFormData((p) => ({ ...p, webrtc: e.target.value }))}
                >
                  <option>Enabled</option>
                  <option>Disabled</option>
                  <option>Masked</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Location
                </label>
                <select
                  className="w-full h-9 px-2 rounded-md bg-input border border-border text-sm focus:border-primary/40 outline-none"
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                >
                  <option>Ask</option>
                  <option>Enabled</option>
                  <option>Disabled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fingerprint */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Fingerprint Protection
            </h4>
            <div className="grid grid-cols-2 gap-4 pb-10">
              {Object.keys(formData.fingerprint).map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    className="w-full h-9 px-3 rounded-md bg-input border border-border text-xs focus:border-primary/40 outline-none"
                    value={formData.fingerprint[key as keyof Fingerprint]}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        fingerprint: { ...p.fingerprint, [key]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-card/10 backdrop-blur-md flex justify-end">
          <button
            onClick={() => {
              if (onSave) onSave();
              onClose();
            }}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Confirm Settings
          </button>
        </div>
      </Drawer>
    );
  },
);

export default FingerprintDrawer;
