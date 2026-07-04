import { Truck, X } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, CURRENCY } from '@/constants';

interface AnnouncementBarProps {
  onDismiss: () => void;
}

export function AnnouncementBar({ onDismiss }: AnnouncementBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-9 flex items-center justify-center bg-gradient-to-l from-secondary to-accent text-white text-xs sm:text-sm font-cairo font-medium overflow-hidden">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        <span>توصيل مجاني للطلبات فوق {FREE_SHIPPING_THRESHOLD} {CURRENCY}</span>
      </div>
      <button
        onClick={onDismiss}
        className="absolute left-2 p-1 rounded-full hover:bg-white/10 transition-colors active:scale-90"
        aria-label="إغلاق"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
