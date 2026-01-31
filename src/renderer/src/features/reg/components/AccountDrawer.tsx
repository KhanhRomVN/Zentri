import React, { useEffect, useState } from 'react';
import { X, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Agent, RegAccount } from '../types';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../shared/components/ui/dropdown';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: Partial<RegAccount> | null;
  agents: Agent[];
  onSave: (account: Partial<RegAccount>) => void;
}

const AccountDrawer = ({ isOpen, onClose, account, agents, onSave }: AccountDrawerProps) => {
  const [formData, setFormData] = useState<Partial<RegAccount>>({
    email: '',
    password: '',
    proxy: '',
    agentId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to allow render before animation
      requestAnimationFrame(() => setIsAnimating(true));
      if (account) {
        setFormData({
          email: account.email || account.username || '',
          password: account.password || '',
          proxy: account.proxy || '',
          agentId: account.agentId || '',
        });
      } else {
        // Reset for new account
        setFormData({
          email: '',
          password: '',
          proxy: '',
          agentId: '',
        });
      }
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300); // Match duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, account]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const selectedAgent = agents.find((a) => a.id === formData.agentId);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto',
          isAnimating ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'relative w-[400px] bg-card border-l border-border h-full shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-in-out transform',
          isAnimating ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg tracking-tight">
              {account?.id ? 'Edit Account' : 'New Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Email / Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email / Username</label>
            <input
              type="text"
              value={formData.email || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  email: e.target.value,
                  username: e.target.value,
                }))
              }
              className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="example@gmail.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 pr-9"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Agent */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Agent</label>
            <Dropdown className="w-full">
              <DropdownTrigger className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm flex items-center justify-between hover:border-primary/40 transition-colors">
                <span className="truncate">
                  {selectedAgent ? (
                    selectedAgent.name
                  ) : (
                    <span className="text-muted-foreground">Select Agent</span>
                  )}
                </span>
              </DropdownTrigger>
              <DropdownContent className="w-[350px] max-h-[300px] overflow-y-auto">
                {agents.map((agent) => (
                  <DropdownItem
                    key={agent.id}
                    onClick={() => setFormData((prev) => ({ ...prev, agentId: agent.id }))}
                    className={cn(
                      'py-2',
                      formData.agentId === agent.id && 'bg-primary/10 text-primary',
                    )}
                  >
                    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                      <span className="font-medium text-xs truncate">{agent.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate opacity-70">
                        {agent.os} • {agent.userAgent}
                      </span>
                    </div>
                  </DropdownItem>
                ))}
                {agents.length === 0 && (
                  <div className="p-3 text-center text-muted-foreground text-xs">
                    No agents found
                  </div>
                )}
              </DropdownContent>
            </Dropdown>
          </div>

          {/* Proxy */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Proxy</label>
            <input
              type="text"
              value={formData.proxy || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, proxy: e.target.value }))}
              className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
              placeholder="http://user:pass@host:port"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/50 shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDrawer;
