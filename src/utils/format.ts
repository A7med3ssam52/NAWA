import { CURRENCY } from '@/constants';

export function formatPrice(price: number): string {
  return `${price.toLocaleString('ar-EG')} ${CURRENCY}`;
}

export function formatDiscount(discount: number): string {
  return `-${discount}%`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatDate(dateStr);
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cod: 'الدفع عند الاستلام',
    card: 'بطاقة ائتمان',
    'vodafone-cash': 'فودافون كاش',
    fawry: 'فوري',
    instapay: 'انستا باي',
  };
  return labels[method] || method;
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `MAT-${year}-${seq}`;
}
