import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Tag, Shield, LogOut, Trash2, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { PAGES } from '@/constants';
import { Button, Divider, LanguageSwitcher } from '@/components/ui';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orderNotif, setOrderNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(true);

  const handleLogout = () => {
    logout();
    navigate(PAGES.HOME);
    toast.success(t('nav.logout'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-6">
        {t('profile.settings')}
      </h1>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold font-cairo text-gray-900">{t('profile.orderNotifications')}</p>
                <p className="text-xs text-gray-400 font-cairo">{t('profile.orderNotificationsDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => setOrderNotif(!orderNotif)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${orderNotif ? 'bg-secondary' : 'bg-gray-300'}`}
              role="switch"
              aria-checked={orderNotif}
              aria-label={t('profile.orderNotifications')}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${orderNotif ? 'translate-x-[26px]' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold font-cairo text-gray-900">{t('profile.promoNotifications')}</p>
                <p className="text-xs text-gray-400 font-cairo">{t('profile.promoNotificationsDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => setPromoNotif(!promoNotif)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${promoNotif ? 'bg-secondary' : 'bg-gray-300'}`}
              role="switch"
              aria-checked={promoNotif}
              aria-label={t('profile.promoNotifications')}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${promoNotif ? 'translate-x-[26px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden divide-y divide-gray-100">
          {/* Language */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold font-cairo text-gray-900">{t('profile.language')}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          <button onClick={handleLogout} className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-danger/10 text-danger">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold font-cairo text-danger">{t('nav.logout')}</p>
                <p className="text-xs text-gray-400 font-cairo">{t('profile.logoutDesc')}</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>

          <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-danger/10 text-danger">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold font-cairo text-danger">{t('profile.deleteAccount')}</p>
                <p className="text-xs text-gray-400 font-cairo">{t('profile.deleteAccountDesc')}</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-xs text-gray-400 font-cairo text-center pt-4">
          {t('profile.version')} 1.0.0
        </p>
      </div>
    </motion.div>
  );
}
