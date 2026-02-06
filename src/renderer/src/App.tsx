import { RouterProvider, createHashRouter } from 'react-router-dom';
import { routes } from './core/routes/routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { Toaster } from 'sonner';

const router = createHashRouter(routes);
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="zentri-theme">
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
