import { useState, useEffect } from 'react';
import { FolderOpen, Save, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../../../theme/ThemeProvider';
import { PRESET_THEMES, ThemeConfig } from '../../../../theme/theme-loader';
import {
  FONTS,
  applyFont,
  getStoredFont,
  setStoredFont,
  getFontByFamily,
} from '../../../../fonts';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '@renderer/components/ui/Dropdown';
import { Button } from '@renderer/components/ui/Button';

/**
 * Interface settings — gộp từ components/Interface (đã xóa) để General là
 * mục duy nhất trong sidebar Setting. Gồm chọn font và theme.
 */
const InterfaceSettings = () => {
  const { applyPresetTheme, currentPreset } = useTheme();
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    const stored = getStoredFont();
    return stored || FONTS[0]?.fontFamily || '';
  });

  useEffect(() => {
    setThemes(PRESET_THEMES);

    const savedFont = getStoredFont();
    if (savedFont) {
      applyFont(savedFont);
    }
  }, []);

  const handleThemeSelect = (theme: ThemeConfig) => {
    applyPresetTheme(theme);
  };

  const handleFontChange = (fontValue: string) => {
    setSelectedFont(fontValue);
    setStoredFont(fontValue);
  };

  const getFontLabel = (value: string) => {
    const found = getFontByFamily(value);
    return found ? found.label : 'Select font';
  };

  return (
    <div>
      <h3 className="text-base text-primary m-0 mb-4">Interface Settings</h3>

      {/* Font Family Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary tracking-wide mb-1.5">
          Font Family
        </label>
        <div className="max-w-full md:max-w-[calc(50%-0.5rem)]">
          <Dropdown>
            <DropdownTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex justify-between px-3 py-2.5 text-sm font-mono"
                style={{ fontFamily: selectedFont }}
              >
                <span className="truncate">{getFontLabel(selectedFont)}</span>
                <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
              </Button>
            </DropdownTrigger>
            <DropdownContent className="w-full min-w-[200px] max-h-[300px] overflow-y-auto">
              {FONTS.map((font) => (
                <DropdownItem
                  key={font.fontFamily}
                  onClick={() => handleFontChange(font.fontFamily)}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ fontFamily: font.fontFamily }}
                >
                  <span className="text-sm">{font.label}</span>
                  {selectedFont === font.fontFamily && (
                    <span className="ml-auto text-primary text-xs">✓</span>
                  )}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
        </div>
        <p className="text-text-secondary text-xs mt-1.5 tracking-wide">
          Preview:{' '}
          <span className="italic" style={{ fontFamily: selectedFont }}>
            The quick brown fox jumps over the lazy dog
          </span>
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary tracking-wide mb-1.5">
          Theme Selection
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id || theme.name}
              onClick={() => handleThemeSelect(theme)}
              className={`text-left p-4 rounded-md border-2 transition-all ${
                currentPreset?.id === theme.id || currentPreset?.name === theme.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card-background hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded"
                  style={{
                    background: `rgb(${theme.tailwind.primary.match(/\d+/g)?.[0] || '0'}, ${theme.tailwind.primary.match(/\d+/g)?.[1] || '0'}, ${theme.tailwind.primary.match(/\d+/g)?.[2] || '0'})`,
                  }}
                />
                <div>
                  <h4 className="text-text-primary font-medium m-0">{theme.name}</h4>
                  <p className="text-text-secondary text-xs m-0">
                    ID: {theme.id || theme.name.toLowerCase().replace(/\s/g, '_')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const GeneralSettings = () => {
  const [sqlitePath, setSqlitePath] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke('storage:init-zentri');
        if (result) {
          setSqlitePath(result);
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initStorage();
  }, []);

  const handleOpenFolder = async () => {
    if (!sqlitePath) {
      toast.error('Database path not yet detected. Please wait for initialization.');
      return;
    }
    try {
      await window.electron.ipcRenderer.invoke('storage:open-zentri-folder', sqlitePath);
      toast.success('Folder opened in file explorer');
    } catch (error: any) {
      toast.error(`Failed to open folder: ${error.message}`);
    }
  };

  const handleBackup = async () => {
    if (!sqlitePath) {
      toast.error('Database path not yet detected. Please wait for initialization.');
      return;
    }
    setIsBackingUp(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'storage:backup-zentri',
        sqlitePath,
      );
      if (result?.canceled) {
        // Người dùng hủy hộp thoại — im lặng, không cần thông báo.
        return;
      }
      toast.success(`Backup saved to ${result?.path ?? 'selected location'}`);
    } catch (error: any) {
      toast.error(`Backup failed: ${error.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-base font-bold text-foreground">Database Location</label>
          <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-md border border-border bg-input-background px-3 text-sm flex items-center text-muted-foreground overflow-hidden font-mono truncate">
              {isInitializing ? (
                <span className="text-muted-foreground/50 animate-pulse">Initializing...</span>
              ) : (
                <span className="truncate">{sqlitePath || 'Failed to detect path'}</span>
              )}
            </div>
            <button
              onClick={handleBackup}
              disabled={isInitializing || !sqlitePath || isBackingUp}
              className="h-9 shrink-0 px-3 rounded-md bg-primary/10 text-primary flex items-center gap-1.5 hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary/10 disabled:active:scale-100 text-xs font-medium"
              title={
                isInitializing
                  ? 'Initializing...'
                  : !sqlitePath
                    ? 'Path not available'
                    : isBackingUp
                      ? 'Backing up...'
                      : 'Backup Now'
              }
            >
              <Save className="w-4 h-4" />
              <span>{isBackingUp ? 'Backing up...' : 'Backup Now'}</span>
            </button>
            <button
              onClick={handleOpenFolder}
              disabled={isInitializing || !sqlitePath}
              className="w-9 h-9 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary/10 disabled:active:scale-100"
              title={
                isInitializing
                  ? 'Initializing...'
                  : !sqlitePath
                    ? 'Path not available'
                    : 'Open Folder'
              }
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Automatically managed at{' '}
            <code className="bg-muted px-1 rounded text-foreground">~/.zentri/zentri.sql</code>.
            Profiles are stored in{' '}
            <code className="bg-muted px-1 rounded text-foreground">~/.zentri/profiles/</code>.
          </p>
        </div>
      </div>

      <InterfaceSettings />
    </div>
  );
};