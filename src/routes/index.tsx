import { lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';
import { Layout, AdminLayout } from '@/components/layout';
import { Button, Spinner } from '@/components/ui';

function lazyWithRetry<T extends React.ComponentType>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(() =>
    importFn().catch(() => {
      window.location.reload();
      return new Promise<never>(() => {});
    })
  );
}

function lazyPage(path: string, name: string) {
  return lazyWithRetry(() =>
    import(`@/pages/${path}.tsx`).then((m) => ({ default: m[name as keyof typeof m] as unknown as React.ComponentType }))
  );
}

function lazyAdmin(path: string, name: string) {
  return lazyWithRetry(() =>
    import(`@/pages/admin/${path}.tsx`).then((m) => ({ default: m[name as keyof typeof m] as unknown as React.ComponentType }))
  );
}

function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();
  const isChunkError = error instanceof TypeError && `${error}`.includes('dynamically imported');
  const reload = useCallback(() => window.location.reload(), []);
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-xl font-bold font-cairo text-gray-900">
        {isChunkError ? t('errors.chunkError') : t('errors.genericError')}
      </h2>
      <p className="text-sm text-gray-500 font-cairo max-w-md">
        {isChunkError
          ? t('errors.appUpdated')
          : t('errors.tryAgain')}
      </p>
      <Button variant="primary" onClick={reload}>
        {t('errors.reloadPage')}
      </Button>
    </div>
  );
}

const HomePage = lazyPage('HomePage', 'HomePage');
const ProductsPage = lazyPage('ProductsPage', 'ProductsPage');
const ProductDetailsPage = lazyPage('ProductDetailsPage', 'ProductDetailsPage');
const CategoriesPage = lazyPage('CategoriesPage', 'CategoriesPage');
const CategoryProductsPage = lazyPage('CategoryProductsPage', 'CategoryProductsPage');
const OffersPage = lazyPage('OffersPage', 'OffersPage');
const SearchPage = lazyPage('SearchPage', 'SearchPage');
const WishlistPage = lazyPage('WishlistPage', 'WishlistPage');
const CartPage = lazyPage('CartPage', 'CartPage');
const CheckoutPage = lazyPage('CheckoutPage', 'CheckoutPage');
const OrderSuccessPage = lazyPage('OrderSuccessPage', 'OrderSuccessPage');
const ProfilePage = lazyPage('ProfilePage', 'ProfilePage');
const MyOrdersPage = lazyPage('MyOrdersPage', 'MyOrdersPage');
const OrderDetailsPage = lazyPage('OrderDetailsPage', 'OrderDetailsPage');
const AddressesPage = lazyPage('AddressesPage', 'AddressesPage');
const NotificationsPage = lazyPage('NotificationsPage', 'NotificationsPage');
const SettingsPage = lazyPage('SettingsPage', 'SettingsPage');
const AboutPage = lazyPage('AboutPage', 'AboutPage');
const ContactPage = lazyPage('ContactPage', 'ContactPage');
const ContactUsPage = lazyPage('ContactUsPage', 'ContactUsPage');
const FAQPage = lazyPage('FAQPage', 'FAQPage');
const PrivacyPage = lazyPage('PrivacyPage', 'PrivacyPage');
const TermsPage = lazyPage('TermsPage', 'TermsPage');
const PaymentPage = lazyPage('PaymentPage', 'PaymentPage');
const ShippingPage = lazyPage('ShippingPage', 'ShippingPage');
const ReturnsPage = lazyPage('ReturnsPage', 'ReturnsPage');
const LoginPage = lazyPage('LoginPage', 'LoginPage');
const NotFoundPage = lazyPage('NotFoundPage', 'NotFoundPage');
const InvoicePage = lazyPage('InvoicePage', 'InvoicePage');
const ComparePage = lazyPage('ComparePage', 'ComparePage');

const AdminDashboardPage = lazyAdmin('AdminDashboardPage', 'AdminDashboardPage');
const AdminProductsPage = lazyAdmin('AdminProductsPage', 'AdminProductsPage');
const AdminOrdersPage = lazyAdmin('AdminOrdersPage', 'AdminOrdersPage');
const AdminCategoriesPage = lazyAdmin('AdminCategoriesPage', 'AdminCategoriesPage');
const AdminBrandsPage = lazyAdmin('AdminBrandsPage', 'AdminBrandsPage');
const AdminCouponsPage = lazyAdmin('AdminCouponsPage', 'AdminCouponsPage');
const AdminUsersPage = lazyAdmin('AdminUsersPage', 'AdminUsersPage');
const AdminReviewsPage = lazyAdmin('AdminReviewsPage', 'AdminReviewsPage');
const AdminNotificationsPage = lazyAdmin('AdminNotificationsPage', 'AdminNotificationsPage');
const AdminSettingsPage = lazyAdmin('AdminSettingsPage', 'AdminSettingsPage');
const AdminSpinPrizesPage = lazyAdmin('AdminSpinPrizesPage', 'AdminSpinPrizesPage');
const AdminAccountsPage = lazyAdmin('AdminAccountsPage', 'AdminAccountsPage');

function PageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <SuspenseWrapper><HomePage /></SuspenseWrapper> },
      { path: 'products', element: <SuspenseWrapper><ProductsPage /></SuspenseWrapper> },
      { path: 'products/:slug', element: <SuspenseWrapper><ProductDetailsPage /></SuspenseWrapper> },
      { path: 'categories', element: <SuspenseWrapper><CategoriesPage /></SuspenseWrapper> },
      { path: 'categories/:slug', element: <SuspenseWrapper><CategoryProductsPage /></SuspenseWrapper> },
      { path: 'offers', element: <SuspenseWrapper><OffersPage /></SuspenseWrapper> },
      { path: 'search', element: <SuspenseWrapper><SearchPage /></SuspenseWrapper> },
      { path: 'wishlist', element: <SuspenseWrapper><WishlistPage /></SuspenseWrapper> },
      { path: 'cart', element: <SuspenseWrapper><CartPage /></SuspenseWrapper> },
      { path: 'checkout', element: <SuspenseWrapper><CheckoutPage /></SuspenseWrapper> },
      { path: 'order-success/:orderId', element: <SuspenseWrapper><OrderSuccessPage /></SuspenseWrapper> },
      { path: 'profile', element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper> },
      { path: 'profile/orders', element: <SuspenseWrapper><MyOrdersPage /></SuspenseWrapper> },
      { path: 'profile/orders/:orderId', element: <SuspenseWrapper><OrderDetailsPage /></SuspenseWrapper> },
      { path: 'profile/orders/:orderId/invoice', element: <SuspenseWrapper><InvoicePage /></SuspenseWrapper> },
      { path: 'compare', element: <SuspenseWrapper><ComparePage /></SuspenseWrapper> },
      { path: 'profile/addresses', element: <SuspenseWrapper><AddressesPage /></SuspenseWrapper> },
      { path: 'profile/notifications', element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper> },
      { path: 'profile/settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
      { path: 'about', element: <SuspenseWrapper><AboutPage /></SuspenseWrapper> },
      { path: 'contact', element: <SuspenseWrapper><ContactPage /></SuspenseWrapper> },
      { path: 'faq', element: <SuspenseWrapper><FAQPage /></SuspenseWrapper> },
      { path: 'payment', element: <SuspenseWrapper><PaymentPage /></SuspenseWrapper> },
      { path: 'privacy', element: <SuspenseWrapper><PrivacyPage /></SuspenseWrapper> },
      { path: 'terms', element: <SuspenseWrapper><TermsPage /></SuspenseWrapper> },
      { path: 'shipping', element: <SuspenseWrapper><ShippingPage /></SuspenseWrapper> },
      { path: 'returns', element: <SuspenseWrapper><ReturnsPage /></SuspenseWrapper> },
      { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <SuspenseWrapper><AdminDashboardPage /></SuspenseWrapper> },
      { path: 'products', element: <SuspenseWrapper><AdminProductsPage /></SuspenseWrapper> },
      { path: 'orders', element: <SuspenseWrapper><AdminOrdersPage /></SuspenseWrapper> },
      { path: 'categories', element: <SuspenseWrapper><AdminCategoriesPage /></SuspenseWrapper> },
      { path: 'brands', element: <SuspenseWrapper><AdminBrandsPage /></SuspenseWrapper> },
      { path: 'coupons', element: <SuspenseWrapper><AdminCouponsPage /></SuspenseWrapper> },
      { path: 'users', element: <SuspenseWrapper><AdminUsersPage /></SuspenseWrapper> },
      { path: 'reviews', element: <SuspenseWrapper><AdminReviewsPage /></SuspenseWrapper> },
      { path: 'notifications', element: <SuspenseWrapper><AdminNotificationsPage /></SuspenseWrapper> },
      { path: 'settings', element: <SuspenseWrapper><AdminSettingsPage /></SuspenseWrapper> },
      { path: 'spin-prizes', element: <SuspenseWrapper><AdminSpinPrizesPage /></SuspenseWrapper> },
      { path: 'accounts', element: <SuspenseWrapper><AdminAccountsPage /></SuspenseWrapper> },
    ],
  },
  {
    path: '/contacts',
    element: <SuspenseWrapper><ContactUsPage /></SuspenseWrapper>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
    errorElement: <RouteErrorBoundary />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
