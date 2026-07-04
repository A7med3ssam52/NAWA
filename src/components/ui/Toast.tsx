import { Toaster as HotToaster } from 'react-hot-toast';
import { cn } from '@/utils';

export function Toaster() {
  return (
    <HotToaster
      position="top-left"
      reverseOrder={false}
      gutter={12}
      containerClassName="font-cairo"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
          direction: 'rtl',
        },
        success: {
          style: {
            background: '#22C55E',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#22C55E',
          },
        },
        error: {
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        },
        loading: {
          style: {
            background: '#2563EB',
            color: '#fff',
          },
        },
      }}
    />
  );
}

export { toast } from 'react-hot-toast';
