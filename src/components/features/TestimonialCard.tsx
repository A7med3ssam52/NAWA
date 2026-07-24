import { Star } from 'lucide-react';
import type { Testimonial } from '@/types';
import { FadeInView } from '@/components/ui';

interface TestimonialCardProps {
  testimonial: Testimonial;
  index?: number;
}

export function TestimonialCard({ testimonial, index = 0 }: TestimonialCardProps) {
  const fullStars = Math.floor(testimonial.rating);
  const emptyStars = 5 - fullStars;

  return (
    <FadeInView delay={index * 0.05} y={20} duration={0.3}>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
        <div className="flex items-center gap-0.5 mb-4" dir="ltr">
          {Array.from({ length: fullStars }).map((_, i) => (
            <Star key={`full-${i}`} className="w-4 h-4 fill-accent text-accent" />
          ))}
          {Array.from({ length: emptyStars }).map((_, i) => (
            <Star key={`empty-${i}`} className="w-4 h-4 text-gray-200" />
          ))}
        </div>

        <p className="text-sm text-gray-600 font-cairo leading-relaxed mb-5 line-clamp-4">
          &ldquo;{testimonial.comment}&rdquo;
        </p>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold font-cairo overflow-hidden shrink-0">
            {testimonial.avatar ? (
              <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
            ) : (
              testimonial.name.charAt(0)
            )}
          </div>
          <div>
            <p className="text-sm font-bold font-cairo text-gray-900">
              {testimonial.name}
            </p>
            <p className="text-xs text-gray-400 font-cairo">
              {testimonial.role}
            </p>
          </div>
        </div>
      </div>
    </FadeInView>
  );
}
