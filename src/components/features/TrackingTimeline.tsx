import { motion } from 'framer-motion';
import { Check, Circle, X } from 'lucide-react';
import { cn, formatDateTime } from '@/utils';
import type { TrackingEvent } from '@/types';

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: string;
  cancelled?: boolean;
}

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم تأكيد الطلب',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'تم الإلغاء',
};

export function TrackingTimeline({ events, currentStatus, cancelled }: TrackingTimelineProps) {
  return (
    <div className="relative" dir="rtl">
      {/* Vertical Line */}
      <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />

      <div className="space-y-0">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative flex items-start gap-4 pb-8 last:pb-0"
            >
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 border-2 transition-all duration-300',
                  event.completed
                    ? 'bg-success border-success text-white'
                    : cancelled && !event.completed
                      ? 'bg-danger/10 border-danger/30 text-danger'
                      : 'bg-white border-gray-300 text-gray-400'
                )}
              >
                {event.completed ? (
                  <Check className="w-5 h-5" />
                ) : cancelled ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <h4
                  className={cn(
                    'text-sm font-bold font-cairo mb-0.5',
                    event.completed
                      ? 'text-gray-900'
                      : cancelled
                        ? 'text-danger'
                        : 'text-gray-400'
                  )}
                >
                  {statusLabels[event.status] || event.status}
                </h4>
                <p className="text-xs text-gray-500 font-cairo mb-1">
                  {formatDateTime(event.date)}
                </p>
                {event.description && (
                  <p className="text-xs text-gray-400 font-cairo leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
