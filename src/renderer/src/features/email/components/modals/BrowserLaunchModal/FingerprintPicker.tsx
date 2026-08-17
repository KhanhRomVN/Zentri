import { FC, useMemo, useState } from 'react';
import { Check, Filter, X, Search } from 'lucide-react';
import { cn } from '../../../../../shared/lib/utils';
import ModalHeader from '../../../../../components/ui/Modal/ModalHeader';
import ModalFooter from '../../../../../components/ui/Modal/ModalFooter';
import Input from '../../../../../components/ui/Input/Input';
import { Fingerprint } from '../../../../../types/fingerprint-profile';
import { FilterOptions } from './index';
import { useAccentColors } from '../../../../../hooks/useAccentColors';
import windowsIcon from '../../../../../assets/icons/os/windows.png';
import iosIcon from '../../../../../assets/icons/os/ios.png';
import linuxIcon from '../../../../../assets/icons/os/linux.png';
import androidIcon from '../../../../../assets/icons/os/android.png';

const OS_ICON_FILES: Record<string, string> = {
  Windows: windowsIcon,
  macOS: iosIcon,
  Linux: linuxIcon,
  Android: androidIcon,
  iOS: iosIcon,
  Other: windowsIcon,
};

// Extract base browser name (e.g. "Chrome 143" → "Chrome")
function baseBrowserName(name: string): string {
  return name.split(' ')[0];
}

interface FingerprintPickerProps {
  onClose: () => void;
  onBack: () => void;
  fingerprints: Fingerprint[];
  selectedFingerprintId: string | undefined;
  fpSearch: string;
  fpFilters: { groups: string[]; browsers: string[] };
  filterOptions: FilterOptions;
  filteredFingerprints: Fingerprint[];
  onSearchChange: (v: string) => void;
  onToggleFilter: (type: 'groups' | 'browsers', value: string) => void;
  onSelect: (fp: Fingerprint) => void;
}

const FingerprintPicker: FC<FingerprintPickerProps> = ({
  onClose,
  onBack,
  fingerprints,
  selectedFingerprintId,
  fpSearch,
  fpFilters,
  filterOptions,
  filteredFingerprints,
  onSearchChange,
  onToggleFilter,
  onSelect,
}) => {
  // Local draft selection — card click only sets this, actual confirm goes through footer button
  const [draftSelectedId, setDraftSelectedId] = useState<string | undefined>(selectedFingerprintId);
  const { getColorByIndex, toRgba } = useAccentColors();

  // Deduplicate browser names to base names only
  const baseBrowserOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of filterOptions.browsers) {
      set.add(baseBrowserName(b));
    }
    return Array.from(set).sort();
  }, [filterOptions.browsers]);

  const handleConfirm = () => {
    const selected =
      fingerprints.find((f) => f.id === draftSelectedId) ||
      filteredFingerprints.find((f) => f.id === draftSelectedId);
    if (selected) onSelect(selected);
  };

  return (
    <>
      <ModalHeader
        title="Select Fingerprint"
        description={`${fingerprints.length} variants available`}
        onBack={onBack}
        onClose={onClose}
      />
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-5 py-3 space-y-2 border-b border-border shrink-0">
          <Input
            placeholder="Search by OS, browser, resolution..."
            value={fpSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
            leftIcon={<Search className="w-3.5 h-3.5 text-text-secondary" />}
            rightIcon={
              fpSearch ? (
                <button onClick={() => onSearchChange('')} className="p-0.5 hover:bg-muted rounded">
                  <X className="w-3.5 h-3.5 text-text-secondary" />
                </button>
              ) : undefined
            }
          />

          {/* OS Filter — label and badges on separate lines */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
              Operating System
            </span>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.groups.map((g, idx) => {
                const active = fpFilters.groups.includes(g);
                const color = getColorByIndex(idx);
                return (
                  <button
                    key={g}
                    onClick={() => onToggleFilter('groups', g)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border',
                      active
                        ? ''
                        : 'bg-card-background border-border text-text-secondary hover:bg-card-hover',
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: toRgba(color, 0.15),
                            borderColor: toRgba(color, 0.3),
                            color,
                          }
                        : undefined
                    }
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Browser Filter — label and badges on separate lines */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
              Browser
            </span>
            <div className="flex flex-wrap gap-1.5">
              {baseBrowserOptions.map((b, idx) => {
                const variants = filterOptions.browsers.filter((x) => baseBrowserName(x) === b);
                const active = variants.some((v) => fpFilters.browsers.includes(v));
                const color = getColorByIndex(idx);
                return (
                  <button
                    key={b}
                    onClick={() => {
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
                      'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border',
                      active
                        ? ''
                        : 'bg-card-background border-border text-text-secondary hover:bg-card-hover',
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: toRgba(color, 0.15),
                            borderColor: toRgba(color, 0.3),
                            color,
                          }
                        : undefined
                    }
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar px-3 py-2 min-h-[200px] max-h-[400px]">
          {filteredFingerprints.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-2">
              <Filter className="w-8 h-8 opacity-30" />
              <p className="text-sm italic">No fingerprints match</p>
            </div>
          )}
          <div className="space-y-1">
            {filteredFingerprints.map((fp) => (
              <div
                key={fp.id}
                onClick={() => setDraftSelectedId(fp.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                  draftSelectedId === fp.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted border border-transparent',
                )}
              >
                <img
                  src={OS_ICON_FILES[fp.group || 'Other'] || windowsIcon}
                  alt={fp.group || 'OS'}
                  className="w-6 h-6 shrink-0 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{fp.name}</p>
                  <p className="text-[10px] text-text-secondary truncate">{fp.description}</p>
                </div>
                {draftSelectedId === fp.id && <Check className="w-5 h-5 text-success shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border border-border text-text-secondary hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!draftSelectedId}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm
        </button>
      </ModalFooter>
    </>
  );
};

export default FingerprintPicker;
