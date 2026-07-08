import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SpinEntryButton } from '@/components/features';

export function Layout() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SpinEntryButton />
    </div>
  );
}
