import type { ReactNode } from 'react';
import { useDirection } from '@/hooks/useDirection';

export function DirectionProvider({ children }: { children: ReactNode }) {
  useDirection();
  return <>{children}</>;
}
