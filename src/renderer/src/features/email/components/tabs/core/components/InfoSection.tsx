import { Mail, Key, AtSign, User, Eye, EyeOff, Smartphone, AlertCircle } from 'lucide-react';
import { ReactNode, useState } from 'react';
import Input from '../../../../../../shared/components/ui/input/Input';
import Combobox from '../../../../../../shared/components/ui/combobox/Combobox';
import { DEFAULT_TAGS } from '../../../../../../../../shared/constant';

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
  onChange: (field: string, value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export const InfoSection = ({
  form,
  onChange,
  showPassword,
  setShowPassword,
}: InfoSectionProps) => {
  const [tagSearch, setTagSearch] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
      <SectionHeader label="Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputGroup label="Email Address">
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
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
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary font-mono tracking-widest"
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
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              value={form.username}
              onChange={(e) => onChange('username', e.target.value)}
            />
          </div>
        </InputGroup>
        <InputGroup label="Full Name">
          <div className="relative group">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </div>
        </InputGroup>
        <InputGroup label="Recovery Email">
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              value={form.recoveryEmail}
              onChange={(e) => onChange('recoveryEmail', e.target.value)}
              placeholder="recovery@example.com"
            />
          </div>
        </InputGroup>
        <InputGroup label="Phone Number">
          <div className="relative group">
            <Smartphone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              value={form.phoneNumber}
              onChange={(e) => onChange('phoneNumber', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </InputGroup>
        <InputGroup label="Tags">
          <Input
            type="combobox"
            placeholder="Add tags..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            leftIcon={<div className="font-bold text-[10px]">#</div>}
            multiValue={true}
            badgeVariant="neon"
            badgeColorMode="diverse"
            badges={(form.tags || '')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
              .map((t: string) => ({ id: t, label: t }))}
            onBadgeRemove={(id: string | number) => {
              const newTags = (form.tags || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s !== id && s !== '');
              onChange('tags', newTags.join(', '));
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && tagSearch.trim()) {
                const currentTags = (form.tags || '')
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean);

                const newTag = tagSearch.trim();
                // Nếu chưa có tag thì mới thêm vào
                if (!currentTags.includes(newTag)) {
                  onChange('tags', [...currentTags, newTag].join(', '));
                }

                // Luôn xóa input sau khi Enter thành công hoặc khi trùng
                setTagSearch('');
                setTagInputOpen(false);
              }
            }}
            popoverOpen={tagInputOpen}
            onPopoverOpenChange={setTagInputOpen}
            popoverContent={(() => {
              const currentTags = (form.tags || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean);
              const isDuplicate = currentTags.includes(tagSearch.trim());

              return (
                <Combobox
                  searchQuery={tagSearch}
                  options={DEFAULT_TAGS.filter((t: string) => !currentTags.includes(t)).map(
                    (t: string) => ({ value: t, label: t }),
                  )}
                  creatable={true}
                  creatableMessage={isDuplicate ? 'Tag "%s" already exists' : 'Create "%s"'}
                  creatableClassName={isDuplicate ? 'text-red-500 bg-red-500/5' : ''}
                  creatableIcon={
                    isDuplicate ? (
                      <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                    ) : null
                  }
                  onCreate={(newTag: string) => {
                    if (!currentTags.includes(newTag)) {
                      onChange('tags', [...currentTags, newTag].join(', '));
                    }
                    setTagSearch('');
                    setTagInputOpen(false);
                  }}
                  onChange={(val: string) => {
                    if (!currentTags.includes(val)) {
                      onChange('tags', [...currentTags, val].join(', '));
                    }
                    setTagSearch('');
                    setTagInputOpen(false);
                  }}
                />
              );
            })()}
          />
        </InputGroup>
      </div>
    </div>
  );
};
