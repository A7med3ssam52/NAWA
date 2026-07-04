import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2, Star, Filter, MessageSquareQuote, X,
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { adminService } from '@/services';
import { Button, Select, Modal, Badge, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/components/ui';
import type { Review, Product } from '@/types';

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<Review | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const result = adminService.getReviews(productFilter || undefined);
    setReviews(result.items);
    setLoading(false);
  }, [productFilter]);

  const fetchProducts = useCallback(() => {
    const result = adminService.getProducts();
    setProducts(result.items);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchData(); }, [fetchData]);

  function handleDelete(review: Review) {
    adminService.deleteReview(review.id);
    toast.success('تم حذف التقييم بنجاح');
    setDeleteModal(null);
    fetchData();
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-3.5 h-3.5',
              star <= rating ? 'fill-accent text-accent' : 'fill-gray-200 dark:fill-dark-border text-gray-200 dark:text-dark-border'
            )}
          />
        ))}
      </div>
    );
  }

  const productOptions = [
    { value: '', label: 'كل المنتجات' },
    ...products.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">التقييمات</h1>
        <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">إدارة تقييمات المنتجات</p>
      </div>

      <div className="w-full sm:w-72">
        <Select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          options={productOptions}
          placeholder="كل المنتجات"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote className="w-16 h-16" />} title="لا توجد تقييمات" description="لا توجد تقييمات لعرضها" />
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">المنتج</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">المستخدم</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">التقييم</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">التعليق</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">التاريخ</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, i) => {
                  const product = products.find((p) => p.id === review.productId);
                  return (
                    <motion.tr key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 dark:bg-dark-border/50 shrink-0">
                            <img src={product?.images?.[0] || ''} alt={product?.name || ''} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <span className="text-xs font-semibold font-cairo text-gray-900 dark:text-dark-text truncate max-w-[120px]">
                            {product?.name || review.productId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-50 dark:bg-dark-border/50">
                            <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <span className="text-xs font-cairo text-gray-700 dark:text-dark-muted">{review.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{renderStars(review.rating)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-cairo text-gray-500 dark:text-dark-muted line-clamp-2 max-w-[200px]">
                          {review.comment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-cairo text-gray-400 dark:text-dark-muted">{formatDate(review.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setDeleteModal(review)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="تأكيد الحذف" size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted font-cairo">هل أنت متأكد من حذف هذا التقييم؟</p>
          {deleteModal && (
            <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl p-3 text-right">
              <div className="flex justify-center mb-2">{renderStars(deleteModal.rating)}</div>
              <p className="text-xs font-cairo text-gray-600 dark:text-dark-muted">{deleteModal.comment}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>إلغاء</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>حذف</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
