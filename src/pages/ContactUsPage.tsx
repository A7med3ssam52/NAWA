import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  Store,
  MessageCircle,
  Facebook,
  Instagram,
  Music2,
  Languages,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

const WHATSAPP_NUMBER = '201037223730';

type ContactLink = {
  id: number;
  key: string;
  url: string;
  icon: LucideIcon;
  color: string;
};

const socialLinks: ContactLink[] = [
  { id: 2, key: 'store', url: 'https://zahieg.com/products', icon: Store, color: '#C79B4A' },
  { id: 5, key: 'whatsapp', url: `https://wa.me/${WHATSAPP_NUMBER}`, icon: MessageCircle, color: '#25D366' },
  { id: 6, key: 'facebook', url: 'https://www.facebook.com/share/1EKpLrYND6/?mibextid=wwXIfr', icon: Facebook, color: '#1877F2' },
  { id: 7, key: 'instagram', url: 'https://www.instagram.com/zahieg?igsh=N3FsNWl4czQyMHMy&utm_source=qr', icon: Instagram, color: '#E4405F' },
  { id: 8, key: 'tiktok', url: 'https://www.tiktok.com/@zahieg_?_r=1&_t=ZS-977bxSRHr9h', icon: Music2, color: '#000000' },
  { id: 1, key: 'contact', url: `tel:+${WHATSAPP_NUMBER}`, icon: Phone, color: '#214458' },
];

const footerSocials: ContactLink[] = [
  { id: 1, key: 'whatsapp', url: `https://wa.me/${WHATSAPP_NUMBER}`, icon: MessageCircle, color: '#25D366' },
  { id: 2, key: 'facebook', url: 'https://www.facebook.com/share/1EKpLrYND6/?mibextid=wwXIfr', icon: Facebook, color: '#1877F2' },
  { id: 3, key: 'instagram', url: 'https://www.instagram.com/zahieg?igsh=N3FsNWl4czQyMHMy&utm_source=qr', icon: Instagram, color: '#E4405F' },
  { id: 4, key: 'tiktok', url: 'https://www.tiktok.com/@zahieg_?_r=1&_t=ZS-977bxSRHr9h', icon: Music2, color: '#000000' },
  { id: 5, key: 'contact', url: `tel:+${WHATSAPP_NUMBER}`, icon: Phone, color: '#4CAF50' },
  { id: 6, key: 'location', url: 'https://www.google.com/maps/search/?api=1&query=Zahieg+Cairo', icon: MapPin, color: '#F77F00' },
];

export function ContactUsPage() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isArabic = (i18n.language ?? i18n.resolvedLanguage ?? '').toLowerCase().startsWith('ar');

  const toggleLang = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="contact-us-page">
      <header className={`header${scrolled ? ' header-scrolled' : ''}`} role="banner">
        <div className="header-bg" aria-hidden="true" />
        <div className="header-inner">
          <div className="header-brand">
            <img
              className="header-logo"
              src="/images/zahieg.png"
              alt={t('contactPage.headerTitle')}
              width="56"
              height="56"
            />
          </div>
          <button
            type="button"
            className="lang-switcher"
            onClick={toggleLang}
            aria-label={t('contactPage.language')}
            title={t('contactPage.language')}
          >
            <Languages className="lang-switcher-icon" aria-hidden="true" />
            <span className="lang-switcher-text">{t('contactPage.language')}</span>
          </button>
        </div>
      </header>

      <main role="main">
        <section className="hero" aria-label={t('contactPage.heroTitle')}>
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-blob" />
            <div className="hero-blob" />
          </div>
          <div className="hero-content">
            <div className="hero-logo-wrapper">
              <div className="hero-logo">
                <img
                  className="hero-logo-img"
                  src="/images/zahieg.png"
                  alt={t('contactPage.heroTitle')}
                  width="120"
                  height="120"
                />
              </div>
            </div>
            <img className="hero-subtitle-img" src="/images/anaqa.png" alt={t('contactPage.heroSubtitle')} />
            <p className="hero-description">{t('contactPage.heroDescription')}</p>
          </div>
        </section>

        <section className="social-links" aria-label={t('contactPage.heroSubtitle')}>
          <div className="social-links-grid">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-card"
                  style={{ '--card-color': link.color } as React.CSSProperties}
                  aria-label={t(`contactPage.links.${link.key}`)}
                >
                  <Icon className="social-card-icon" aria-hidden="true" />
                  <span className="social-card-label">{t(`contactPage.links.${link.key}`)}</span>
                </a>
              );
            })}
          </div>
          <div className="location-address">
            <MapPin className="location-address-icon" aria-hidden="true" />
            <span className="location-address-text">{t('contactPage.address')}</span>
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-glow" aria-hidden="true" />
        <div className="footer-inner">
          <div className="footer-brand">
            <img className="footer-brand-img" src="/images/footer.png" alt={t('contactPage.headerTitle')} />
          </div>
          <div className="footer-social">
            {footerSocials.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  style={{ '--social-color': social.color } as React.CSSProperties}
                  aria-label={t(`contactPage.links.${social.key}`)}
                >
                  <Icon aria-hidden="true" />
                </a>
              );
            })}
          </div>
          <div className="footer-divider" aria-hidden="true" />
          <p className="footer-text">{t('contactPage.copyright')}</p>
          <p className="footer-credit">{t('contactPage.credit')}</p>
        </div>
      </footer>
    </div>
  );
}
