import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Megaphone } from 'lucide-react';
import { adminService } from '@/services';
import type { AnnouncementConfig } from '@/types';

interface AnnouncementBarProps {
  onDismiss: () => void;
  onVisibilityChange?: (visible: boolean) => void;
}

export function AnnouncementBar({ onDismiss, onVisibilityChange }: AnnouncementBarProps) {
  const { i18n } = useTranslation();
  const [config, setConfig] = useState<AnnouncementConfig>({ text: '', enabled: false, dismissible: true });

  useEffect(() => {
    adminService.getAnnouncement().then(setConfig);
  }, []);

  useEffect(() => {
    const cb = () => adminService.getAnnouncement().then(setConfig);
    window.addEventListener('announcement-update', cb);
    return () => window.removeEventListener('announcement-update', cb);
  }, []);

  useEffect(() => {
    adminService.getAnnouncement().then(setConfig);
  }, [i18n.language]);

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('announcement-dismissed') === 'true'; }
    catch { return false; }
  });

  const isVisible = config.enabled && !dismissed;

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('announcement-dismissed', 'true'); }
    catch {}
    onDismiss();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-9 flex items-center justify-center bg-secondary text-white text-xs sm:text-sm font-cairo font-medium overflow-hidden">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Megaphone className="w-3.5 h-3.5 shrink-0" />
        <span>{config.text}</span>
      </div>
      {config.dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute left-2 p-1 rounded-full hover:bg-white/10 transition-colors active:scale-90"
          aria-label="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
