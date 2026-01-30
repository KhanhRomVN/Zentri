import { useState, useEffect } from 'react';
import { GitGraph, Info, FolderOpen, FilePlus, X } from 'lucide-react';

const SettingPage = () => {
  const [folderPath, setFolderPath] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tempPath, setTempPath] = useState('');

  useEffect(() => {
    const savedPath = localStorage.getItem('gitlab_repo_folder') || '';
    setFolderPath(savedPath);
  }, []);

  const saveConfiguration = (path: string) => {
    setFolderPath(path);
    localStorage.setItem('gitlab_repo_folder', path);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    window.dispatchEvent(
      new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: false } }),
    );
  };

  const extractData = (res: any) => {
    if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
      return res.data;
    }
    return res;
  };

  const handleSelectFolder = async () => {
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('git:select-folder');
      if (result) {
        // Check if entries exist by trying to read emails.json
        // @ts-ignore
        const rawData = await window.electron.ipcRenderer.invoke(
          'git:read-data',
          result,
          'emails.json',
        );
        const data = extractData(rawData);

        if (data === null || data === undefined) {
          // File not found, show modal
          setTempPath(result);
          setShowCreateModal(true);
        } else {
          // File exists, save immediately
          saveConfiguration(result);
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleCreateFile = async () => {
    try {
      // Create emails.json
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: tempPath,
        filename: 'emails.json',
        data: [],
      });
      // Create regs.json
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: tempPath,
        filename: 'regs.json',
        data: { sessions: [], accounts: [] },
      });

      saveConfiguration(tempPath);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to initialize repository files:', error);
      alert('Failed to create files. Please check folder permissions.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <GitGraph className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Local Git Storage</h1>
          <p className="text-muted-foreground text-sm">
            Select your local git repository to store account data
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-semibold flex items-center gap-2">
            Git Repository Folder
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </label>
          <div className="flex gap-2">
            <div className="flex-1 h-11 rounded-md border border-border bg-muted/10 px-4 text-xs flex items-center text-muted-foreground overflow-hidden font-mono">
              {folderPath || 'No folder selected'}
            </div>
            <button
              onClick={handleSelectFolder}
              className="px-6 h-11 rounded-md bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap"
            >
              <FolderOpen className="w-4 h-4" />
              Select Folder
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground ml-1 italic">
            * Data will be synchronized via 'emails.json' and 'regs.json' inside this directory.
          </p>
        </div>

        {isSaved && (
          <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium animate-in fade-in zoom-in duration-300">
            Repository folder updated!
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
              <h2 className="text-xl font-bold mb-2">Initialize Repository?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                The selected folder is missing database files. Would you like us to initialize{' '}
                <code className="bg-muted px-1 rounded text-foreground">emails.json</code> and{' '}
                <code className="bg-muted px-1 rounded text-foreground">regs.json</code> for you?
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

export default SettingPage;
