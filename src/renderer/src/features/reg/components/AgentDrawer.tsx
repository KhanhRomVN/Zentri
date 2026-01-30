import {
  X,
  Plus,
  User,
  Monitor,
  Globe,
  Clock,
  Maximize,
  Shield,
  Settings2,
  Trash2,
  Cpu,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import { Agent, Fingerprint } from '../types';
import { cn } from '../../../shared/lib/utils';

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onCreateAgent: (agent: Omit<Agent, 'id'>) => void;
  onDeleteAgent: (id: string) => void;
  onSelectAgent: (id: string) => void;
  selectedAgentId?: string;
}

const AgentDrawer = ({
  isOpen,
  onClose,
  agents,
  onCreateAgent,
  onDeleteAgent,
  onSelectAgent,
  selectedAgentId,
}: AgentDrawerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<Agent, 'id'>>({
    name: '',
    userAgent: '',
    os: 'Windows',
    timezone: 'UTC+7',
    resolution: '1920x1080',
    webrtc: 'Disabled',
    location: 'Disabled',
    language: 'vi-VN',
    fingerprint: {
      canvas: 'Safe',
      audio: 'Safe',
      clientRect: 'Safe',
      webglImage: 'Safe',
      webglMetadata: 'Safe',
      webglVector: 'Safe',
      webglVendor: 'Deepmind',
      webglReRender: 'Enabled',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAgent(formData);
    setIsCreating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-border">
        {/* Header */}
        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/20">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold tracking-tight">Agent Manager</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-all">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isCreating ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
                  <User className="w-3 h-3" /> Basic Information
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Agent Name
                    </label>
                    <input
                      required
                      className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:border-primary/40 focus:outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Chrome Windows High-end"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      User Agent
                    </label>
                    <textarea
                      required
                      className="w-full h-20 p-3 rounded-md bg-input border border-border text-xs focus:border-primary/40 focus:outline-none resize-none font-mono"
                      value={formData.userAgent}
                      onChange={(e) => setFormData((p) => ({ ...p, userAgent: e.target.value }))}
                      placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                    />
                  </div>
                </div>
              </div>

              {/* Hardware & OS */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
                  <Monitor className="w-3 h-3" /> Environment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      OS
                    </label>
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
                    <input
                      className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:border-primary/40 outline-none"
                      value={formData.resolution}
                      onChange={(e) => setFormData((p) => ({ ...p, resolution: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Timezone
                    </label>
                    <input
                      className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:border-primary/40 outline-none"
                      value={formData.timezone}
                      onChange={(e) => setFormData((p) => ({ ...p, timezone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Language
                    </label>
                    <input
                      className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:border-primary/40 outline-none"
                      value={formData.language}
                      onChange={(e) => setFormData((p) => ({ ...p, language: e.target.value }))}
                    />
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
            </form>
          ) : (
            <div className="p-4 space-y-2">
              {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                  <Settings2 className="w-12 h-12 mb-4" />
                  <p className="text-sm">No agents created yet</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className={cn(
                      'p-4 rounded-xl border border-border cursor-pointer transition-all hover:border-primary/40 group relative overflow-hidden',
                      agent.id === selectedAgentId ? 'bg-primary/5 border-primary/30' : 'bg-card',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          {agent.os.includes('Win') ? (
                            <Laptop className="w-5 h-5" />
                          ) : agent.os.includes('Android') || agent.os.includes('iOS') ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <Monitor className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm truncate">{agent.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">
                            {agent.os} • {agent.resolution}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAgent(agent.id);
                        }}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-card/10 backdrop-blur-md flex gap-3">
          {isCreating ? (
            <>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 h-10 rounded-lg border border-border font-bold text-xs hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Save Agent Profile
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New Agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDrawer;
