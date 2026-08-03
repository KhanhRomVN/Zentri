import { FC, useMemo } from 'react';
import { Check, Filter, X, Search } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';
import Modal from '../../../../../components/ui/Modal/Modal';
import Input from '../../../../../components/ui/Input/Input';
import { Fingerprint } from '../fingerprint';
import { FilterOptions } from './types';

// Extract base browser name (e.g. "Chrome 143" → "Chrome")
function baseBrowserName(name: string): string {
  return name.split(' ')[0];
}

interface PickerViewProps {
  isOpen: boolean;
  onClose: () => void;
  fingerprints: Fingerprint[];
  selectedFingerprintId: string | undefined;
  fpSearch: string;
  fpFilters: { groups: string[]; browsers: string[] };
  filterOptions: FilterOptions;
  filteredFingerprints: Fingerprint[];
  onSearchChange: (v: string) => void;
  onToggleFilter: (type: 'groups' | 'browsers', value: string) => void;
  onSelect: (fp: Fingerprint) => void;
  onBack: () => void;
}

const PickerView: FC<PickerViewProps> = ({
  isOpen, onClose, fingerprints, selectedFingerprintId,
  fpSearch, fpFilters, filterOptions, filteredFingerprints,
  onSearchChange, onToggleFilter, onSelect, onBack,
}) => {
  // Deduplicate browser names to base names only
  const baseBrowserOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of filterOptions.browsers) {
      set.add(baseBrowserName(b));
    }
    return Array.from(set).sort();
  }, [filterOptions.browsers]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} onBack={onBack} className="max-w-xl">
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Select Fingerprint</p>
            <p className="text-[10px] text-secondary">{fingerprints.length} variants available</p>
          </div>
        </div>

        <div className="px-5 py-3 space-y-2 border-b border-border shrink-0">
          <Input
            placeholder="Search by OS, browser, resolution..."
            value={fpSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
            leftIcon={<Search className="w-3.5 h-3.5 text-secondary" />}
            rightIcon={fpSearch ? <button onClick={() => onSearchChange('')} className="p-0.5 hover:bg-muted rounded"><X className="w-3.5 h-3.5 text-secondary" /></button> : undefined}
          />

          {/* OS Filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider self-center mr-0.5">OS:</span>
            {filterOptions.groups.map((g) => (
              <button
                key={g}
                onClick={() => onToggleFilter('groups', g)}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all',
                  fpFilters.groups.includes(g)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-secondary hover:bg-muted/80',
                )}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Browser Filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider self-center mr-0.5">Browser:</span>
            {baseBrowserOptions.map((b) => (
              <button
                key={b}
                onClick={() => {
                  // Toggle all variants of this browser (e.g. "Chrome 143", "Chrome 130"...)
                  const variants = filterOptions.browsers.filter((x) => baseBrowserName(x) === b);
                  const allActive = variants.every((v) => fpFilters.browsers.includes(v));
                  if (allActive) {
                    variants.forEach((v) => onToggleFilter('browsers', v));
                  } else {
                    variants.forEach((v) => {
                      if (!fpFilters.browsers.includes(v)) onToggleFilter('browsers', v);
                    });
                  }
                }}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all',
                  filterOptions.browsers.filter((x) => baseBrowserName(x) === b).some((v) => fpFilters.browsers.includes(v))
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-secondary hover:bg-muted/80',
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar px-3 py-2 min-h-[200px] max-h-[400px]">
          {filteredFingerprints.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-secondary gap-2">
              <Filter className="w-8 h-8 opacity-30" />
              <p className="text-sm italic">No fingerprints match</p>
            </div>
          )}
          <div className="space-y-1">
            {filteredFingerprints.map((fp) => (
              <div
                key={fp.id}
                onClick={() => onSelect(fp)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                  selectedFingerprintId === fp.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted border border-transparent',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{fp.name}</p>
                  <p className="text-[10px] text-secondary truncate">{fp.description}</p>
                </div>
                {selectedFingerprintId === fp.id && <Check className="w-5 h-5 text-success shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PickerView;