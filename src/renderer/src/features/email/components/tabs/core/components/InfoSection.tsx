import { Mail, Key, AtSign, User, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { ReactNode } from 'react';

export const SectionHeader = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 text-foreground/80 pb-4 border-b border-border/50 mb-6">
    <span className="text-base font-semibold tracking-tight">{label}</span>
  </div>
);

export const InputGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

interface InfoSectionProps {
  form: any;
  initialForm: any;
  onChange: (field: string, value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export const InfoSection = ({
  form,
  initialForm,
  onChange,
  showPassword,
  setShowPassword,
}: InfoSectionProps) => {
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
      <SectionHeader label="Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputGroup label="Email Address">
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className={cn(
                'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                form.email !== initialForm.email &&
                  (form.email === ''
                    ? 'border-red-500 border-dashed'
                    : 'border-yellow-500 border-dashed'),
              )}
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
        </InputGroup>
        <InputGroup label="Password">
          <div className="relative group">
            <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              className={cn(
                'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary font-mono tracking-widest',
                form.password !== initialForm.password &&
                  (form.password === ''
                    ? 'border-red-500 border-dashed'
                    : 'border-yellow-500 border-dashed'),
              )}
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </InputGroup>
        <InputGroup label="Username">
          <div className="relative group">
            <AtSign className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className={cn(
                'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                form.username !== initialForm.username &&
                  (form.username === ''
                    ? 'border-red-500 border-dashed'
                    : 'border-yellow-500 border-dashed'),
              )}
              value={form.username}
              onChange={(e) => onChange('username', e.target.value)}
            />
          </div>
        </InputGroup>
        <InputGroup label="Full Name">
          <div className="relative group">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className={cn(
                'flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                form.name !== initialForm.name &&
                  (form.name === ''
                    ? 'border-red-500 border-dashed'
                    : 'border-yellow-500 border-dashed'),
              )}
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </div>
        </InputGroup>
      </div>
    </div>
  );
};
