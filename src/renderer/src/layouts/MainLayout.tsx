import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../features/dashboard';
import EmailManager from '../features/email';
import RegisManager from '../features/regis';
import ProxyManager from '../features/proxy';
import SearchManager from '../features/search';
import SettingPage from '../features/setting';

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  '/': Dashboard,
  '/email': EmailManager,
  '/regis': RegisManager,
  '/proxy': ProxyManager,
  '/search': SearchManager,
  '/setting': SettingPage,
};

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [activePage, setActivePage] = useState('/');

  const handleNavigate = useCallback((href: string) => {
    setActivePage(href);
  }, []);

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

  const ActiveComponent = PAGE_COMPONENTS[activePage] || Dashboard;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden w-full">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 min-h-0 bg-background overflow-hidden flex flex-col">
          {isDbReady ? (
            <ActiveComponent />
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
