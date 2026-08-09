import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Trash2, Star, Filter, MessageSquareQuote, X,
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { adminService } from '@/services';
import { Button, Select, Modal, Badge, EmptyState, Spinner, Card } from '@/components/ui';
import { toast } from '@/components/ui';
import type { Review, Product } from '@/types';

export function AdminReviewsPage() {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<Review | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await adminService.getReviews(productFilter || undefined);
    setReviews(result.items);
    setLoading(false);
  }, [productFilter]);

  const fetchProducts = useCallback(async () => {
    const result = await adminService.getProducts();
    setProducts(result.items);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(review: Review) {
    await adminService.deleteReview(review.id);
    toast.success(t('admin.reviewDeleted'));
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
              star <= rating ? 'fill-accent text-accent' : 'fill-gray-200 text-gray-200'
            )}
          />
        ))}
      </div>
    );
  }

  const productOptions = [
    { value: '', label: t('admin.allProducts') },
    ...products.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.reviewsManagement')}</h1>
        <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.reviewsDesc')}</p>
      </div>

      <div className="w-full sm:w-72">
        <Select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          options={productOptions}
          placeholder={t('admin.allProducts')}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote className="w-16 h-16" />} title={t('admin.noReviews')} description={t('admin.noReviewsDesc')} />
      ) : (
        <>
        <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.reviewProduct')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.reviewUser')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.reviewRating')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.reviewComment')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.reviewDate')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, i) => {
                  const product = products.find((p) => p.id === review.productId);
                  return (
                    <motion.tr key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                            <img src={product?.images?.[0] || ''} alt={product?.name || ''} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <span className="text-xs font-semibold font-cairo text-gray-900 truncate max-w-[120px]">
                            {product?.name || review.productId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-50">
                            <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <span className="text-xs font-cairo text-gray-700">{review.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{renderStars(review.rating)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-cairo text-gray-500 line-clamp-2 max-w-[200px]">
                          {review.comment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-cairo text-gray-400">{formatDate(review.createdAt)}</span>
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

        <div className="lg:hidden space-y-3">
          {reviews.map((review, i) => {
            const product = products.find((p) => p.id === review.productId);
            return (
              <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card padding="md">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                        <img src={product?.images?.[0] || ''} alt={product?.name || ''} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <span className="text-sm font-semibold font-cairo text-gray-900 truncate">{product?.name || review.productId}</span>
                    </div>
                    <button onClick={() => setDeleteModal(review)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-50 shrink-0">
                      <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <span className="text-xs font-cairo text-gray-700">{review.userName}</span>
                    <span className="text-xs text-gray-400 font-cairo mr-auto">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="mt-2">{renderStars(review.rating)}</div>
                  <p className="text-xs font-cairo text-gray-500 mt-2 line-clamp-2">{review.comment}</p>
                </Card>
            </motion.div>
          );
          })}
        </div>
        </>
      )}

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('common.confirmDelete')} size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 font-cairo">{t('admin.deleteReviewConfirm')}</p>
          {deleteModal && (
            <div className="bg-gray-50 rounded-xl p-3 text-right">
              <div className="flex justify-center mb-2">{renderStars(deleteModal.rating)}</div>
              <p className="text-xs font-cairo text-gray-600">{deleteModal.comment}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
