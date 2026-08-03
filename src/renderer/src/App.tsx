import MainLayout from './layouts/MainLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { Toaster } from 'sonner';
import { ServiceDrawerProvider } from './contexts/ServiceDrawerContext';
import { loadServices } from './features/setting/components/Service'; // We'll need to export this

const queryClient = new QueryClient();

function App() {
  const handleSaveService = async (
    data: Partial<import('./features/email/types').ServiceProviderConfig>,
    metadata: { key: string; value: string }[],
    authMethods: string[],
    twoFa?: { has_totp: boolean; has_backup_codes: boolean },
  ) => {
    const id = data.id || (data.name || '').toLowerCase().replace(/\s+/g, '-');
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke(
        'sqlite:run',
        `INSERT OR REPLACE INTO services (id, name, url, tags, category, description, metadata, config_json, auth_method, two_fa, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          data.name,
          data.websiteUrl,
          JSON.stringify(data.defaultTags || []),
          JSON.stringify(data.defaultCategories || []),
          (data as any).description || '',
          JSON.stringify(metadata),
          JSON.stringify({}),
          JSON.stringify(authMethods),
          JSON.stringify(twoFa || { has_totp: false, has_backup_codes: false }),
        ],
      );
      // Trigger a reload of services in the ServiceManager
      window.dispatchEvent(new CustomEvent('services-changed'));
    } catch (error) {
      console.error('Failed to save service:', error);
      throw error;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="zentri-theme">
        <ServiceDrawerProvider onSave={handleSaveService}>
          <MainLayout />
        </ServiceDrawerProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
