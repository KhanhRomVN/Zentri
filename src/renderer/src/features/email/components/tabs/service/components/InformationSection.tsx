import { Database, Globe, ExternalLink, User, Key, EyeOff, Eye, Copy } from 'lucide-react';
import { ServiceItem } from '../../../../mock/accounts';
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

interface InformationSectionProps {
  selectedService: ServiceItem;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onChange?: (field: string, value: string) => void;
}

export const InformationSection = ({
  selectedService,
  showPassword,
  setShowPassword,
  onChange,
}: InformationSectionProps) => {
  const [tagSearch, setTagSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  return (
    <div>
      <SectionHeader label="Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputGroup label="Service Name">
          <div className="relative group">
            <Database className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              value={selectedService.name}
              readOnly
            />
          </div>
        </InputGroup>
        <InputGroup label="Website URL">
          <div className="relative group">
            <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm focus-visible:outline-none text-blue-500 hover:underline cursor-pointer"
              value={selectedService.websiteUrl}
              readOnly
              onClick={() => window.open(selectedService.websiteUrl, '_blank')}
            />
            <ExternalLink className="absolute right-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </InputGroup>
        <InputGroup label="Username / Email">
          <div className="relative group">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <input
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-10 text-sm focus-visible:outline-none"
              value={selectedService.username}
              readOnly
            />
            <Copy className="absolute right-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </InputGroup>
        <InputGroup label="Password">
          <div className="relative group">
            <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="flex h-11 w-full rounded-lg border border-border bg-input pl-10 pr-20 text-sm focus-visible:outline-none font-mono tracking-widest"
              value={selectedService.password || ''}
              readOnly
            />
            <div className="absolute right-3.5 top-3.5 flex items-center gap-2">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <Copy className="w-4 h-4 text-muted-foreground" />
            </div>
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
            badges={(selectedService.tags || []).map((t: string) => ({ id: t, label: t }))}
            onBadgeRemove={(id: string | number) => {
              if (onChange) {
                const newTags = (selectedService.tags || []).filter((t: string) => t !== id);
                onChange('tags', newTags.join(', '));
              }
            }}
            popoverContent={
              <Combobox
                searchQuery={tagSearch}
                options={DEFAULT_TAGS.map((t: string) => ({ value: t, label: t }))}
                creatable={true}
                onCreate={(newTag: string) => {
                  if (onChange) {
                    const currentTags = selectedService.tags || [];
                    if (!currentTags.includes(newTag)) {
                      onChange('tags', [...currentTags, newTag].join(', '));
                    }
                  }
                  setTagSearch('');
                }}
                onChange={(val: string) => {
                  if (onChange) {
                    const currentTags = selectedService.tags || [];
                    if (!currentTags.includes(val)) {
                      onChange('tags', [...currentTags, val].join(', '));
                    }
                  }
                  setTagSearch('');
                }}
              />
            }
          />
        </InputGroup>
        <InputGroup label="Categories">
          <Input
            type="combobox"
            placeholder="Select categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            leftIcon={<Database className="h-4 w-4" />}
            multiValue={true}
            badgeVariant="neon"
            badgeColorMode="diverse"
            badges={(selectedService.categories || []).map((c: string) => ({ id: c, label: c }))}
            onBadgeRemove={(id: string | number) => {
              if (onChange) {
                const newCats = (selectedService.categories || []).filter((c: string) => c !== id);
                onChange('categories', newCats.join(', '));
              }
            }}
            popoverContent={
              <Combobox
                searchQuery={categorySearch}
                options={[
                  'social_media',
                  'music',
                  'entertainment',
                  'productivity',
                  'gaming',
                  'shopping',
                  'finance',
                  'other',
                ].map((cat: string) => ({ value: cat, label: cat }))}
                creatable={true}
                onCreate={(newCat: string) => {
                  if (onChange) {
                    const currentCats = selectedService.categories || [];
                    if (!currentCats.includes(newCat)) {
                      onChange('categories', [...currentCats, newCat].join(', '));
                    }
                  }
                  setCategorySearch('');
                }}
                onChange={(val: string) => {
                  if (onChange) {
                    const currentCats = selectedService.categories || [];
                    if (!currentCats.includes(val)) {
                      onChange('categories', [...currentCats, val].join(', '));
                    }
                  }
                  setCategorySearch('');
                }}
              />
            }
          />
        </InputGroup>
      </div>
    </div>
  );
};
