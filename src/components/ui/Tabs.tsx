import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { useTranslation } from 'react-i18next';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className={cn('flex border-b border-gray-200 gap-0', className)} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'relative flex items-center gap-2 px-5 py-3 text-sm font-cairo font-medium transition-colors duration-200',
              isActive
                ? 'text-secondary'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[11px] px-1.5 py-0.5 rounded-full font-medium',
                  isActive
                    ? 'bg-secondary/10 text-secondary'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
