import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { SpinProvider } from '@/contexts/SpinContext';
import { DirectionProvider } from '@/components/ui/DirectionProvider';
import { Toaster } from '@/components/ui/Toast';
import { AppRouter } from '@/routes';
import { RealtimeProvider } from '@/api/useRealtime';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <div className="min-h-screen">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <SpinProvider>
                  <DirectionProvider>
                    <RealtimeProvider>
                      <AppRouter />
                      <Toaster />
                    </RealtimeProvider>
                  </DirectionProvider>
                </SpinProvider>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}
