import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../features/dashboard';
import Email from '../features/email/Email';
import Forrge from '../features/forge/Forrge';
import Proxy from '../features/proxy/Proxy';
import Filter from '../features/filter/Filter';
import Setting from '../features/setting/Setting';
import Workflow from '../features/workflow/Workflow';
import Dfd from '../features/dfd/Dfd';
import Device from '@renderer/features/device/Device';

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  '/': Dashboard,
  '/email': Email,
  '/forge': Forrge,
  '/proxy': Proxy,
  '/filter': Filter,
  '/setting': Setting,
  '/workflow': Workflow,
  '/dfd': Dfd,
  '/device': Device,
};

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/email': 'Email',
  '/forge': 'Forge',
  '/proxy': 'Proxy',
  '/filter': 'Search',
  '/setting': 'Setting',
  '/workflow': 'Workflow',
  '/device': 'Device',
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
      try {
        const dbPath = await window.electron.ipcRenderer.invoke('storage:init-zentri');
        await window.electron.ipcRenderer.invoke('sqlite:open', dbPath);
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to auto-initialize database:', error);
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
