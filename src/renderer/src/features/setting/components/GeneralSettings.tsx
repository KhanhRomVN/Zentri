import { useState, useEffect } from 'react';
import { Database, Info, FolderOpen, FilePlus, X, ChevronDown } from 'lucide-react';

export const GeneralSettings = () => {
  const [folderPath, setFolderPath] = useState('');
  const [agentUrl, setAgentUrl] = useState('http://localhost:8888');
  const [language, setLanguage] = useState('vi');
  const [isSaved, setIsSaved] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tempPath, setTempPath] = useState('');

  useEffect(() => {
    const savedPath = localStorage.getItem('zentri_storage_folder') || '';
    const savedUrl = localStorage.getItem('zentri_agent_url') || 'http://localhost:8888';
    const savedLanguage = localStorage.getItem('zentri_agent_language') || 'vi';
    setFolderPath(savedPath);
    setAgentUrl(savedUrl);
    setLanguage(savedLanguage);
  }, []);

  const saveConfiguration = (path: string) => {
    setFolderPath(path);
    localStorage.setItem('zentri_storage_folder', path);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const saveAgentUrl = (url: string) => {
    setAgentUrl(url);
    localStorage.setItem('zentri_agent_url', url);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const saveLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('zentri_agent_language', lang);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('storage:select-folder');
      if (result) {
        // Check if zentri.db exists
        // @ts-ignore
        const dbExists = await window.electron.ipcRenderer.invoke(
          'fs:exists',
          result + '/zentri.db',
        );

        if (!dbExists) {
          // zentri.db not found, show modal
          setTempPath(result);
          setShowCreateModal(true);
        } else {
          // zentri.db exists, save immediately
          saveConfiguration(result);
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleCreateFile = async () => {
    try {
      // 1. Create profiles directory
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('fs:createDirectory', tempPath + '/profiles');

      // 2. Initialize zentri.db (sqlite:create will open it as well)
      // @ts-ignore
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
          <label className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Data Storage Folder
          </label>
          <div className="flex gap-2">
            <div className="flex-1 h-11 rounded-xl border border-border bg-input-background px-4 text-sm flex items-center text-muted-foreground overflow-hidden font-mono truncate">
              {folderPath || 'No folder selected'}
            </div>
            <button
              onClick={handleSelectFolder}
              className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95"
              title="Select Folder"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/50">
              AI Agent URL
            </label>
            <input
              type="text"
              value={agentUrl}
              onChange={(e) => saveAgentUrl(e.target.value)}
              placeholder="http://localhost:8888"
              className="w-full h-11 rounded-xl border border-border bg-input-background px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Agent Response Language
            </label>
            <div className="relative group">
              <select
                value={language}
                onChange={(e) => saveLanguage(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-input-background px-4 text-[13px] focus:outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none pr-10 font-medium"
              >
                <option value="vi">Tiếng Việt (Vietnamese)</option>
                <option value="en">English (US)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="ko">한국어 (Korean)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/40 group-hover:text-primary/50 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {isSaved && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium animate-in fade-in zoom-in duration-300 w-fit">
            Settings updated successfully
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
              <h2 className="text-xl font-bold mb-2">Initialize Storage?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                The selected folder is missing database files. Would you like us to initialize{' '}
                <code className="bg-muted px-1 rounded text-foreground">zentri.db</code> and{' '}
                <code className="bg-muted px-1 rounded text-foreground">profiles/</code> folder for
                you?
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
