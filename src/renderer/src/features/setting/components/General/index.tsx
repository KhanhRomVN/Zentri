import { useState, useEffect } from 'react';
import { Database, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export const GeneralSettings = () => {
  const [sqlitePath, setSqlitePath] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

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
    </div>
  );
};
