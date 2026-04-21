import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { cn } from '../../shared/lib/utils';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDatabase = async () => {
      const savedPath = localStorage.getItem('zentri_storage_folder');
      if (savedPath) {
        try {
          // @ts-ignore
          await window.electron.ipcRenderer.invoke('sqlite:open', savedPath + '/zentri.db');
          setIsDbReady(true);
          console.log('Database auto-initialized on startup');
        } catch (error) {
          console.error('Failed to auto-initialize database:', error);
          // Even if it fails, we might want to show the app so user can fix the path
          setIsDbReady(true);
        }
      } else {
        // No path saved? We should still set ready to true so Dashboard can show "Select Path"
        setIsDbReady(true);
      }
    };
    initDatabase();
  }, []);

  return (
    <div className="flex min-h-screen bg-background overflow-hidden w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div
        className={cn(
          'flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300',
          isCollapsed ? 'pl-[60px]' : 'pl-[280px]',
        )}
      >
        <div className="flex-1 min-h-0 bg-background overflow-hidden flex flex-col">
          {isDbReady ? (
            <Outlet />
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-20">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                Initializing Zentri Core...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
