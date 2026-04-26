import { useState, useEffect } from 'react';
import { FolderOpen, FilePlus, X } from 'lucide-react';
import LanguageSwitcher from '../../../shared/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export const GeneralSettings = () => {
  const { t } = useTranslation();
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
          <label className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {t('settings.storageFolder')}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 h-11 rounded-xl border border-border bg-input-background px-4 text-sm flex items-center text-muted-foreground overflow-hidden font-mono truncate">
              {folderPath || t('settings.noFolderSelected')}
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

        <div className="space-y-3">
          <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/50">
            {t('settings.appLanguage')}
          </label>
          <LanguageSwitcher variant="field" />
        </div>

        <div className="space-y-3">
          <label className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {t('settings.browserExecutablePath')}
          </label>
          <input
            type="text"
            value={browserPath}
            onChange={(e) => saveBrowserPath(e.target.value)}
            placeholder={t('settings.browserExecutablePlaceholder')}
            className="w-full h-11 rounded-xl border border-border bg-input-background px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
          />
          <p className="text-[11px] text-muted-foreground/50">
            {t('settings.browserExecutableHint')}
          </p>
        </div>

        {isSaved && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium animate-in fade-in zoom-in duration-300 w-fit">
            {t('settings.savedSuccess')}
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
              <h2 className="text-xl font-bold mb-2">{t('settings.initializeTitle')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                {t('settings.initializeDescPre')}{' '}
                <code className="bg-muted px-1 rounded text-foreground">zentri.db</code>{' '}
                {t('settings.initializeDescAnd')}{' '}
                <code className="bg-muted px-1 rounded text-foreground">profiles/</code>{' '}
                {t('settings.initializeDescPost')}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-12 rounded-md border border-border font-bold text-sm hover:bg-muted transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateFile}
                  className="flex-1 h-12 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  {t('settings.initializeAndSave')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
