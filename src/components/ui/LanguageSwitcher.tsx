import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <button
      onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-cairo rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
      title={isArabic ? 'English' : 'العربية'}
    >
      <Languages className="w-3.5 h-3.5" />
      <span>{isArabic ? 'EN' : 'AR'}</span>
    </button>
  );
}
