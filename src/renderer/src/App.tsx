import MainLayout from './layouts/MainLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="zentri-theme">
        <MainLayout />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
