import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Share2, Check, Truck, Package, Bell, Star, MessageSquare, BarChart3 } from 'lucide-react';
import { useProduct, useRelatedProducts } from '@/api';
import { useRecentlyViewed } from '@/hooks';
import { getProductReviews, categories } from '@/data';
import { PAGES, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/constants';
import { useCart, useWishlist, useCompare } from '@/contexts';
import { formatPrice, cn } from '@/utils';
import { ProductGallery } from '@/components/features/ProductGallery';
import { ProductGrid } from '@/components/features/ProductGrid';
import { ReviewCard } from '@/components/features/ReviewCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button, Badge, Rating, Tabs, QuantitySelector, Spinner, ErrorState, Input, Textarea, Modal } from '@/components/ui';
import toast from 'react-hot-toast';
import type { Tab } from '@/components/ui/Tabs';

const COLORS_OPTIONS = [
  { name: 'أسود', hex: '#000000' },
  { name: 'أبيض', hex: '#FFFFFF' },
  { name: 'أحمر', hex: '#EF4444' },
  { name: 'أزرق', hex: '#3B82F6' },
  { name: 'أخضر', hex: '#22C55E' },
  { name: 'بيج', hex: '#F5E6D3' },
  { name: 'رمادي', hex: '#6B7280' },
  { name: 'نبيتي', hex: '#7C1D4E' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function BackInStockForm({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const existing = JSON.parse(localStorage.getItem('back_in_stock') || '[]');
    existing.push({ productId, email: email.trim(), createdAt: new Date().toISOString() });
    localStorage.setItem('back_in_stock', JSON.stringify(existing));
    setSubmitted(true);
    toast.success('سيتم إشعارك عند توفر المنتج');
    setTimeout(onClose, 1500);
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <Check className="w-12 h-12 text-success mx-auto mb-3" />
        <p className="text-sm font-cairo text-gray-600">تم تسجيل طلبك، سنخبرك عند توفر {productName}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-cairo text-gray-600">أدخل بريدك الإلكتروني ليتم إشعارك عند توفر هذا المنتج</p>
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني" required dir="rtl" />
      <Button type="submit" variant="secondary" size="md" fullWidth rounded="xl">إشعرني عند التوفر</Button>
    </form>
  );
}

function ReviewForm({ productId, onSubmit }: { productId: string; onSubmit: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    const existing = JSON.parse(localStorage.getItem('product_reviews') || '[]');
    existing.unshift({
      id: `review-${Date.now()}`,
      productId,
      userId: 'guest',
      userName: name.trim() || 'مستخدم زاهي',
      userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim() || 'مستخدم زاهي')}&background=2563EB&color=fff`,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    });
    localStorage.setItem('product_reviews', JSON.stringify(existing));
    setSubmitting(false);
    toast.success('تم إضافة تقييمك بنجاح');
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 rounded-xl p-4">
      <h4 className="text-sm font-bold font-cairo text-gray-900">أضف تقييمك</h4>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
            <Star className={`w-6 h-6 transition-colors ${star <= (hoverRating || rating) ? 'fill-accent text-accent' : 'text-gray-300'}`} />
          </button>
        ))}
        <span className="text-xs text-gray-400 font-cairo mr-2">{rating > 0 ? `${rating} من 5` : 'اختر تقييمك'}</span>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التقييم (اختياري)" dir="rtl" />
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب تقييمك هنا..." rows={3} required />
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك (اختياري)" dir="rtl" />
      <div className="flex justify-end gap-2">
        <Button type="submit" variant="secondary" size="md" rounded="xl" loading={submitting} disabled={rating === 0 || !comment.trim()}>
          <MessageSquare className="w-4 h-4" /> إرسال التقييم
        </Button>
      </div>
    </form>
  );
}

export function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error, refetch } = useProduct(slug || '');
  const { data: related } = useRelatedProducts(product?.id || '');
  const { addItem, items } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { isInCompare, addItem: addCompare, removeItem: removeCompare } = useCompare();
  const { addItem: addRecentlyViewed } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);

  useEffect(() => { if (product) document.title = `${product.name} | زاهي`; }, [product]);
  useEffect(() => { if (product) addRecentlyViewed(product); }, [product?.id]);

  const reviews = useMemo(() => {
    if (!product) return [];
    const jsonReviews = getProductReviews(product.id);
    const stored = JSON.parse(localStorage.getItem('product_reviews') || '[]');
    const productStored = stored.filter((r: any) => r.productId === product.id);
    return [...productStored, ...jsonReviews];
  }, [product?.id, reviewKey]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-xl w-1/3 animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-xl w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock === 0;
  const cartItem = items.find((i) => i.product.id === product.id);

  const breadcrumbItems = [
    { label: 'الرئيسية', href: PAGES.HOME },
    { label: 'المنتجات', href: PAGES.PRODUCTS },
    { label: product.name },
  ];

  const tabs: Tab[] = [
    { id: 'description', label: 'الوصف' },
    { id: 'specifications', label: 'المواصفات' },
    { id: 'reviews', label: `التقييمات (${reviews.length})` },
  ];

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    toast.success('تمت إضافة المنتج إلى السلة');
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    navigate(PAGES.CHECKOUT);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('تم نسخ الرابط');
    }
  };

  const handleWishlistToggle = () => {
    toggleItem(product);
    toast.success(inWishlist ? 'تمت إزالة المنتج من المفضلة' : 'تمت إضافة المنتج إلى المفضلة');
  };

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Breadcrumb items={breadcrumbItems} className="mb-4 sm:mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-6 sm:mb-12">
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.isNew && (
                <Badge variant="success" size="sm">جديد</Badge>
              )}
              {product.discount && product.discount > 0 && (
                <Badge variant="danger" size="sm">{product.discount}%-</Badge>
              )}
              {isOutOfStock && (
                <Badge variant="secondary" size="sm">نفد من المخزون</Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Rating value={product.rating} count={product.reviewsCount} size="md" />
              <span className="text-xs text-gray-400 font-cairo">
                | كود المنتج: {product.sku}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl font-bold font-cairo text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <>
                <span className="text-base sm:text-lg text-gray-400 line-through font-cairo">
                  {formatPrice(product.oldPrice)}
                </span>
                <Badge variant="danger" size="md">{product.discount}%-</Badge>
              </>
            )}
          </div>

          <p className="text-sm sm:text-base text-gray-600 font-cairo leading-relaxed">
            {product.shortDescription}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 font-cairo">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              {product.price >= FREE_SHIPPING_THRESHOLD ? 'توصيل مجاني' : `توصيل ${formatPrice(SHIPPING_COST)}`}
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              المخزون: {product.stock} قطعة
            </div>
          </div>

          {selectedColor && (
            <div className="text-sm font-cairo text-gray-500">
              اللون: <span className="font-semibold text-gray-900">{COLORS_OPTIONS.find((c) => c.hex === selectedColor)?.name}</span>
            </div>
          )}

          <div>
            <p className="text-xs font-cairo text-gray-500 mb-2">الألوان المتاحة:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS_OPTIONS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all duration-200',
                    selectedColor === color.hex ? 'border-secondary scale-110 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === color.hex && (
                    <span className="flex items-center justify-center">
                      <Check className={cn('w-4 h-4', color.hex === '#FFFFFF' || color.hex === '#F5E6D3' ? 'text-gray-900' : 'text-white')} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-cairo text-gray-500 mb-2">المقاسات المتاحة:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'min-w-[36px] h-9 px-3 rounded-lg border-2 text-sm font-cairo font-semibold transition-all duration-200',
                    selectedSize === size
                      ? 'border-secondary bg-secondary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} disabled={isOutOfStock} />
            <div className="text-sm text-gray-500 font-cairo">
              الإجمالي: <span className="font-bold text-gray-900">{formatPrice(product.price * quantity)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button variant="secondary" size="lg" rounded="xl" fullWidth onClick={handleAddToCart} disabled={isOutOfStock}>
              <ShoppingCart className="w-5 h-5" />
              أضف إلى السلة
            </Button>
            <Button variant="accent" size="lg" rounded="xl" fullWidth onClick={handleBuyNow} disabled={isOutOfStock}>
              <Check className="w-5 h-5" />
              اشتري الآن
            </Button>
            <Button variant="outline" size="lg" rounded="xl" onClick={handleWishlistToggle} className="!px-4">
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-danger text-danger' : ''}`} />
            </Button>
            <Button variant="outline" size="lg" rounded="xl" onClick={() => isInCompare(product.id) ? removeCompare(product.id) : addCompare(product)} className={cn(isInCompare(product.id) && 'text-secondary border-secondary')}>
              <BarChart3 className="w-5 h-5" />
              {isInCompare(product.id) ? 'إزالة من المقارنة' : 'أضف للمقارنة'}
            </Button>
            <Button variant="ghost" size="lg" rounded="xl" onClick={handleShare} className="!px-4">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {isOutOfStock && (
            <Button variant="outline" size="md" rounded="xl" fullWidth onClick={() => setShowStockModal(true)}>
              <Bell className="w-4 h-4" /> نبهني عند التوفر
            </Button>
          )}

          {product.category && (
            <div className="text-sm text-gray-500 font-cairo">
              القسم: <span className="text-gray-900 font-semibold">{categories.find((c) => c.id === product.category)?.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-12">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="mt-6">
          {activeTab === 'description' && (
            <div className="text-sm text-gray-600 font-cairo leading-relaxed whitespace-pre-line animate-fade-in">
              {product.description}
            </div>
          )}
          {activeTab === 'specifications' && (
            <div className="space-y-2 animate-fade-in">
              {product.specifications.map((spec, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-semibold font-cairo text-gray-900 w-32 shrink-0">{spec.label}</span>
                  <span className="text-sm font-cairo text-gray-600">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="space-y-4 animate-fade-in">
              <ReviewForm productId={product.id} onSubmit={() => setReviewKey((k) => k + 1)} />
              <div className="border-t border-gray-100 pt-4" />
              {reviews.length > 0 ? reviews.map((r, i) => (
                <ReviewCard key={r.id || i} review={r} index={i} />
              )) : (
                <p className="text-sm text-gray-400 font-cairo text-center py-4">لا توجد تقييمات بعد</p>
              )}
            </div>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section>
          <h2 className="text-xl sm:text-2xl font-bold font-cairo text-gray-900 mb-4 sm:mb-6">منتجات ذات صلة</h2>
          <ProductGrid items={related} />
        </section>
      )}

      <Modal isOpen={showStockModal} onClose={() => setShowStockModal(false)} title="نبهني عند التوفر">
        <BackInStockForm productId={product.id} productName={product.name} onClose={() => setShowStockModal(false)} />
      </Modal>
    </div>
  );
}
