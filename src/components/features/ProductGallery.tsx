import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ImageOff, ZoomIn } from 'lucide-react';
import { cn } from '@/utils';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs, FreeMode } from 'swiper/modules';
import { useMediaQuery } from '@/hooks';
import 'swiper/css';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleImageError = useCallback((index: number) => {
    setImgErrors((prev) => new Set(prev).add(index));
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!zoomed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    },
    [zoomed]
  );

  const displayImages = images.length > 0 ? images : [''];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 cursor-crosshair"
        onMouseEnter={() => !isMobile && setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {!imgErrors.has(selectedIndex) && displayImages[selectedIndex] ? (
          <>
            <img
              src={displayImages[selectedIndex]}
              alt={`${productName} - صورة ${selectedIndex + 1}`}
              className={cn(
                'w-full h-full object-cover transition-transform duration-200',
                zoomed && 'scale-150'
              )}
              style={
                zoomed
                  ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                  : undefined
              }
            />
            {!zoomed && !isMobile && (
              <div className="absolute bottom-3 left-3 p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-soft">
                <ZoomIn className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <ImageOff className="w-16 h-16 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400 font-cairo">لا توجد صورة</p>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === 0 ? displayImages.length - 1 : prev - 1
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-soft hover:bg-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label="الصورة السابقة"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === displayImages.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-soft hover:bg-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label="الصورة التالية"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-cairo">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails - Desktop */}
      {displayImages.length > 1 && (
        <div className="hidden md:flex items-center gap-3 overflow-x-auto pb-1">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200',
                index === selectedIndex
                  ? 'border-secondary ring-2 ring-secondary/30'
                  : 'border-gray-100 hover:border-gray-300'
              )}
              aria-label={`الصورة ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            >
              {!imgErrors.has(index) && img ? (
                <img
                  src={img}
                  alt={`${productName} - مصغر ${index + 1}`}
                  loading="lazy"
                  onError={() => handleImageError(index)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <ImageOff className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mobile: Swiper Thumbnails */}
      {displayImages.length > 1 && (
        <div className="md:hidden">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView={4.5}
            freeMode
            watchSlidesProgress
            modules={[Thumbs, FreeMode]}
            className="thumb-swiper"
          >
            {displayImages.map((img, index) => (
              <SwiperSlide key={index}>
                <button
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200',
                    index === selectedIndex
                      ? 'border-secondary ring-2 ring-secondary/30'
                      : 'border-gray-100'
                  )}
                  aria-label={`الصورة ${index + 1}`}
                >
                  {!imgErrors.has(index) && img ? (
                    <img
                      src={img}
                      alt={`${productName} - مصغر ${index + 1}`}
                      loading="lazy"
                      onError={() => handleImageError(index)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <ImageOff className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
