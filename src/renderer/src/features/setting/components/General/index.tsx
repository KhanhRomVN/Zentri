import { useState, useEffect, useRef } from 'react';
import { FolderOpen, FilePlus, X, ChevronDown } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];

const LanguageDropdown = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { code: string; label: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.code === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer"
      >
        <span>{selected?.label || value}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 p-1 hover:border-primary transition-colors">
          {options.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                onChange(opt.code);
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 text-sm text-left hover:bg-dropdown-item-hover rounded-xl transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const GeneralSettings = () => {
  const [language, setLanguage] = useState<'en' | 'vi'>(() => {
    try {
      const saved = localStorage.getItem('systema-language');
      if (saved === 'en' || saved === 'vi') return saved;
    } catch { /* ignore */ }
    return 'en';
  });
  const [folderPath, setFolderPath] = useState('');
  const [browserPath, setBrowserPath] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tempPath, setTempPath] = useState('');

  useEffect(() => {
    const savedPath = localStorage.getItem('zentri_storage_folder') || '';
    const savedBrowserPath = localStorage.getItem('zentri_browser_path') || '';
    setFolderPath(savedPath);
    setBrowserPath(savedBrowserPath);
  }, []);

  const saveConfiguration = (path: string) => {
    setFolderPath(path);
    localStorage.setItem('zentri_storage_folder', path);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const saveBrowserPath = (path: string) => {
    setBrowserPath(path);
    localStorage.setItem('zentri_browser_path', path);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSelectFolder = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('storage:select-folder');
      if (result) {
        const dbExists = await window.electron.ipcRenderer.invoke(
          'fs:exists',
          result + '/zentri.db',
        );

        if (!dbExists) {
          setTempPath(result);
          setShowCreateModal(true);
        } else {
          saveConfiguration(result);
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleCreateFile = async () => {
    try {
      await window.electron.ipcRenderer.invoke('fs:createDirectory', tempPath + '/profiles');
      await window.electron.ipcRenderer.invoke('sqlite:create', tempPath + '/zentri.db');

      saveConfiguration(tempPath);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to initialize repository files:', error);
      alert('Failed to initialize repository files.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Storage Folder
          </label>
          <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-md border border-border bg-input-background px-3 text-sm flex items-center text-muted-foreground overflow-hidden font-mono truncate">
              {folderPath || 'No folder selected'}
            </div>
            <button
              onClick={handleSelectFolder}
              className="w-9 h-9 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95"
              title="Select Folder"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            App Language
          </label>
          <LanguageDropdown
            value={language}
            onChange={(lang) => {
              setLanguage(lang as 'en' | 'vi');
              try { localStorage.setItem('systema-language', lang); } catch { /* ignore */ }
            }}
            options={SUPPORTED_LANGUAGES}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Browser Executable Path
          </label>
          <input
            type="text"
            value={browserPath}
            onChange={(e) => saveBrowserPath(e.target.value)}
            placeholder="/path/to/browser/executable"
            className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
          />
          <p className="text-[11px] text-muted-foreground/50">
            Leave empty to use the default system browser path.
          </p>
        </div>

        {isSaved && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium animate-in fade-in zoom-in duration-300 w-fit">
            Saved successfully
          </div>
        )}
      </div>

      {/* Create File Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md bg-background border border-border shadow-2xl rounded-3xl p-8 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                <FilePlus className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Initialize Repository</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                This will create{' '}
                <code className="bg-muted px-1 rounded text-foreground">zentri.db</code>{' '}
                and{' '}
                <code className="bg-muted px-1 rounded text-foreground">profiles/</code>{' '}
                in the selected folder.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-12 rounded-md border border-border font-bold text-sm hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="flex-1 h-12 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  Initialize & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
