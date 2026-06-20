import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  downloadUrl: string | null;
  error?: string;
}

export const useBrowserUpdate = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'downloading' | 'extracting'>('idle');

  const checkUpdate = useCallback(async () => {
    setIsChecking(true);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('browser:check-update');
      setUpdateInfo(result);
      return result;
    } catch (error) {
      console.error('Failed to check for browser updates:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;

    setIsUpdating(true);
    setStage('downloading');
    setProgress(0);

    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('browser:download-update', {
        url: updateInfo.downloadUrl,
        version: updateInfo.latestVersion,
      });

      if (result.success) {
        toast.success('Wayfern updated successfully!', {
          description: `Version ${updateInfo.latestVersion} is now ready to use.`,
        });
        setUpdateInfo({
          ...updateInfo,
          hasUpdate: false,
          currentVersion: updateInfo.latestVersion,
        });
      } else {
        toast.error('Failed to update Wayfern', {
          description: result.error || 'Unknown error occurred during update.',
        });
      }
    } catch (error: any) {
      toast.error('Update failed', {
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
      setStage('idle');
      setProgress(0);
    }
  }, [updateInfo]);

  useEffect(() => {
    // Listen for progress events
    // @ts-ignore
    const removeListener = window.electron.ipcRenderer.on(
      'browser:update-progress',
      (_event, data: { progress: number; stage: 'downloading' | 'extracting' }) => {
        setProgress(data.progress);
        setStage(data.stage);
      },
    );

    // Initial check
    checkUpdate();

    return () => {
      if (removeListener) removeListener();
    };
  }, [checkUpdate]);

  return {
    updateInfo,
    isChecking,
    isUpdating,
    progress,
    stage,
    checkUpdate,
    downloadUpdate,
  };
};
