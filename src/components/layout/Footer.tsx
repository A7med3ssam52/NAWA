import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Facebook,
  Instagram,
  Music2,
  MessageCircle,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { cn } from '@/utils';
import { categories } from '@/data';
import { PAGES, SITE_NAME, SITE_DESCRIPTION } from '@/constants';
import toast from 'react-hot-toast';

const WHATSAPP_NUMBER = '201037223730';

const quickLinks = [
  { label: 'footer.about', href: PAGES.ABOUT },
  { label: 'footer.contact', href: PAGES.CONTACT },
  { label: 'footer.faq', href: PAGES.FAQ },
  { label: 'footer.privacy', href: PAGES.PRIVACY },
  { label: 'footer.terms', href: PAGES.TERMS },
];

const customerServiceLinks = [
  { label: 'footer.help', href: PAGES.FAQ },
  { label: 'footer.shipping', href: '/shipping' },
  { label: 'footer.returns', href: '/returns' },
  { label: 'footer.payment', href: '/payment' },
];

const socialLinks = [
  { icon: Facebook, href: 'https://www.facebook.com/share/1D3j6EgNHy/?mibextid=wwXIfr', label: 'footer.facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/zahieg?igsh=N3FsNWl4czQyMHMy&utm_source=qr', label: 'footer.instagram' },
  { icon: Music2, href: 'https://www.tiktok.com/@zahieg_?_r=1&_t=ZS-977bxSRHr9h', label: 'footer.tiktok' },
  { icon: MessageCircle, href: `https://wa.me/${WHATSAPP_NUMBER}`, label: 'footer.whatsapp' },
];

const paymentMethods = [
  { name: 'common.visa', src: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/visa.svg' },
  { name: 'common.mastercard', src: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/mastercard.svg' },
  { name: 'common.mada', src: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/mada.svg' },
  { name: 'utils.paymentMethods.vodafoneCash', src: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/vodafone.svg' },
  { name: 'utils.paymentMethods.fawry', src: '' },
  { name: 'utils.paymentMethods.instapay', src: '' },
  { name: 'common.valu', src: '' },
];

export const Footer = memo(function Footer() {
  const { t, i18n } = useTranslation();

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  };

  return (
    <footer dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="bg-gray-50 border-t border-gray-100">
      {/* Newsletter */}
      <div className="bg-secondary/10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-right">
              <h3 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 mb-1.5">
                {t('nav.newsletter')}
              </h3>
              <p className="text-sm text-gray-500 font-cairo">
                {t('nav.newsletterDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center justify-center gap-2 bg-secondary text-white hover:bg-secondary/90 shadow-lg whitespace-nowrap h-12 px-6 rounded-xl font-cairo font-bold text-base transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              {t('nav.subscribe')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to={PAGES.HOME} className="inline-block mb-3">
              <img src="/images/zahilogo.png" alt={SITE_NAME()} className="h-16 sm:h-20 w-auto" />
            </Link>
            <p className="text-sm text-gray-500 font-cairo leading-relaxed mb-4">
              {SITE_DESCRIPTION()}
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500 font-cairo">
                <MapPin className="w-4 h-4 shrink-0 text-secondary" />
                <span>{t('nav.location')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-500 font-cairo">
                <Phone className="w-4 h-4 shrink-0 text-secondary" />
                <span dir="ltr">+20 103 722 3730</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-500 font-cairo">
                <Mail className="w-4 h-4 shrink-0 text-secondary" />
                <span dir="ltr">sales@zahieg.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold font-cairo text-gray-900 mb-4">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm font-cairo text-gray-500 hover:text-secondary transition-colors"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold font-cairo text-gray-900 mb-4">
              {t('nav.categories')}
            </h4>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`${PAGES.CATEGORY_PRODUCTS.replace(':slug', cat.slug)}`}
                    className="text-sm font-cairo text-gray-500 hover:text-secondary transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-bold font-cairo text-gray-900 mb-4">
              {t('footer.customerService')}
            </h4>
            <ul className="space-y-2.5">
              {customerServiceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm font-cairo text-gray-500 hover:text-secondary transition-colors"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-400 font-cairo text-center lg:text-right">
              {t('nav.copyright')}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-secondary hover:text-white transition-all duration-200"
                    aria-label={t(social.label)}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-2 flex-wrap">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="w-10 h-7 flex items-center justify-center bg-white rounded-lg border border-gray-100 px-1.5"
                  title={t(method.name)}
                >
                  {method.src ? (
                    <img
                      src={method.src}
                      alt={t(method.name)}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[6px] font-bold font-cairo text-gray-500 leading-tight text-center">
                      {t(method.name)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
