import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ThumbsUp } from 'lucide-react';
import { cn, formatDate } from '@/utils';
import type { Review } from '@/types';
import { Rating } from '@/components/ui';

interface ReviewCardProps {
  review: Review;
  index?: number;
}

export function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(review.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount((prev) => liked ? prev - 1 : prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white text-sm font-bold font-cairo overflow-hidden shrink-0">
            {review.userAvatar ? (
              <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
            ) : (
              review.userName.charAt(0)
            )}
          </div>
          <div>
            <p className="text-sm font-bold font-cairo text-gray-900">
              {review.userName}
            </p>
            <p className="text-xs text-gray-400 font-cairo">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <Rating value={review.rating} size="sm" showCount={false} />
      </div>

      {/* Review Content */}
      {review.title && (
        <h4 className="text-sm font-bold font-cairo text-gray-900 mb-1.5">
          {review.title}
        </h4>
      )}
      <p className="text-sm text-gray-600 font-cairo leading-relaxed mb-3">
        {review.comment}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium font-cairo transition-colors duration-200 rounded-lg px-2.5 py-1.5',
            liked
              ? 'text-danger bg-danger/5'
              : 'text-gray-400 hover:text-danger hover:bg-danger/5'
          )}
          aria-label={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
        >
          <Heart className={cn('w-3.5 h-3.5 transition-all', liked && 'fill-danger')} />
          <span>{likesCount}</span>
        </button>
      </div>
    </motion.div>
  );
}
