import { CURRENCY } from '@/constants';
import i18n from '@/i18n';

export function formatPrice(price: number): string {
  return `${price.toLocaleString('ar-EG')} ${CURRENCY()}`;
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

  if (diffMins < 1) return i18n.t('utils.timeAgo.now');
  if (diffMins < 60) return i18n.t('utils.timeAgo.minutes', { count: diffMins });
  if (diffHours < 24) return i18n.t('utils.timeAgo.hours', { count: diffHours });
  if (diffDays < 7) return i18n.t('utils.timeAgo.days', { count: diffDays });
  return formatDate(dateStr);
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cod: i18n.t('utils.paymentMethods.cod'),
    card: i18n.t('utils.paymentMethods.card'),
    'vodafone-cash': i18n.t('utils.paymentMethods.vodafoneCash'),
    fawry: i18n.t('utils.paymentMethods.fawry'),
    instapay: i18n.t('utils.paymentMethods.instapay'),
  };
  return labels[method] || method;
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `MAT-${year}-${seq}`;
}
