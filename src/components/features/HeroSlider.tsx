import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ArrowLeft, Sparkles, Zap, Truck } from 'lucide-react';
import { PAGES } from '@/constants';
import { Button } from '@/components/ui';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const slides = [
  {
    id: 1,
    heading: 'تسوق بأفضل الأسعار',
    subheading: 'أحدث المنتجات الأصلية بأقل الأسعار',
    cta: 'تسوق الآن',
    link: PAGES.PRODUCTS,
    icon: Sparkles,
    gradient: 'from-secondary via-secondary/80 to-purple-600',
  },
  {
    id: 2,
    heading: 'خصومات تصل إلى 50%',
    subheading: 'عروض الصيف على آلاف المنتجات',
    cta: 'استكشف العروض',
    link: PAGES.OFFERS,
    icon: Zap,
    gradient: 'from-accent via-orange-500 to-rose-500',
  },
  {
    id: 3,
    heading: 'توصيل مجاني للطلبات',
    subheading: 'أول 500 جنيه توصيل مجاني',
    cta: 'تسوق الآن',
    link: PAGES.PRODUCTS,
    icon: Truck,
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
  },
];

export function HeroSlider() {
  const swiperRef = useRef<any>(null);

  return (
    <div dir="rtl" className="relative">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="hero-slider"
        dir="rtl"
      >
        {slides.map((slide) => {
          const Icon = slide.icon;
          return (
            <SwiperSlide key={slide.id}>
              <div
                className={`relative flex items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] bg-gradient-to-br ${slide.gradient} overflow-hidden`}
              >
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
                  <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
                  <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white/20 rounded-full" />
                  <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/20 rounded-full" />
                  <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-white/20 rounded-full" />
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
