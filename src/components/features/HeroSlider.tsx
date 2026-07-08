import { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ArrowLeft, Sparkles, Zap, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PAGES } from '@/constants';
import { Button } from '@/components/ui';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export function HeroSlider() {
  const { t, i18n } = useTranslation();
  const swiperRef = useRef<any>(null);

  const slides = useMemo(() => [
    {
      id: 1,
      heading: t('home.heroSlide1Title'),
      subheading: t('home.heroSlide1Sub'),
      cta: t('home.heroSlide1Cta'),
      link: PAGES.PRODUCTS,
      icon: Sparkles,
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920&q=80',
      gradient: 'from-secondary/80 via-secondary/60 to-purple-600/80',
    },
    {
      id: 2,
      heading: t('home.heroSlide2Title'),
      subheading: t('home.heroSlide2Sub'),
      cta: t('home.heroSlide2Cta'),
      link: PAGES.OFFERS,
      icon: Zap,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
      gradient: 'from-accent/80 via-orange-500/60 to-rose-500/80',
    },
    {
      id: 3,
      heading: t('home.heroSlide3Title'),
      subheading: t('home.heroSlide3Sub'),
      cta: t('home.heroSlide3Cta'),
      link: PAGES.PRODUCTS,
      icon: Truck,
      image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&q=80',
      gradient: 'from-emerald-500/80 via-green-500/60 to-teal-600/80',
    },
  ], [t]);

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="relative">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="hero-slider"
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      >
        {slides.map((slide) => {
          const Icon = slide.icon;
          return (
            <SwiperSlide key={slide.id}>
              <div className="relative flex items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={slide.image}
                    alt={slide.heading}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm mb-5">
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-cairo text-white mb-3 leading-tight"
                    >
                      {slide.heading}
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="text-base sm:text-lg lg:text-xl text-white/80 font-cairo mb-6 lg:mb-8 max-w-lg leading-relaxed"
                    >
                      {slide.subheading}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <Link to={slide.link}>
                        <Button
                          variant="primary"
                          size="lg"
                          rounded="xl"
                          className="bg-white text-gray-900 hover:bg-white/90 shadow-xl text-base gap-2"
                        >
                          {slide.cta}
                          <ArrowLeft className="w-5 h-5" />
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
