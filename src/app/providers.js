import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../auth/auth.hooks';
import ErrorBoundary from '../components/ui/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: 'Cairo, sans-serif',
                  direction: 'rtl',
                  textAlign: 'right',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  padding: '12px 16px',
                  fontSize: '14px',
                  boxShadow: 'var(--shadow-md)',
                },
                success: {
                  iconTheme: { primary: 'var(--color-success)', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: 'var(--color-danger)', secondary: '#fff' },
                },
              }}
            />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
