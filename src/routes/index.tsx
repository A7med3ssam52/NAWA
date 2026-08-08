import { lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';
import { Layout, AdminLayout } from '@/components/layout';
import { Button, Spinner } from '@/components/ui';
import { RequireAuth, RequireAdmin, RequireGuest } from '@/routes/guards';
import { HomePage } from '@/pages/HomePage';

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

const HomePageRoute = HomePage;
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
      { index: true, element: <HomePageRoute /> },
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
      { path: 'profile', element: <RequireAuth><SuspenseWrapper><ProfilePage /></SuspenseWrapper></RequireAuth> },
      { path: 'profile/orders', element: <RequireAuth><SuspenseWrapper><MyOrdersPage /></SuspenseWrapper></RequireAuth> },
      { path: 'profile/orders/:orderId', element: <RequireAuth><SuspenseWrapper><OrderDetailsPage /></SuspenseWrapper></RequireAuth> },
      { path: 'profile/orders/:orderId/invoice', element: <RequireAuth><SuspenseWrapper><InvoicePage /></SuspenseWrapper></RequireAuth> },
      { path: 'compare', element: <RequireAuth><SuspenseWrapper><ComparePage /></SuspenseWrapper></RequireAuth> },
      { path: 'profile/addresses', element: <RequireAuth><SuspenseWrapper><AddressesPage /></SuspenseWrapper></RequireAuth> },
      { path: 'profile/notifications', element: <RequireAuth><SuspenseWrapper><NotificationsPage /></SuspenseWrapper></RequireAuth> },
      { path: 'profile/settings', element: <RequireAuth><SuspenseWrapper><SettingsPage /></SuspenseWrapper></RequireAuth> },
      { path: 'about', element: <SuspenseWrapper><AboutPage /></SuspenseWrapper> },
      { path: 'contact', element: <SuspenseWrapper><ContactPage /></SuspenseWrapper> },
      { path: 'faq', element: <SuspenseWrapper><FAQPage /></SuspenseWrapper> },
      { path: 'payment', element: <SuspenseWrapper><PaymentPage /></SuspenseWrapper> },
      { path: 'privacy', element: <SuspenseWrapper><PrivacyPage /></SuspenseWrapper> },
      { path: 'terms', element: <SuspenseWrapper><TermsPage /></SuspenseWrapper> },
      { path: 'shipping', element: <SuspenseWrapper><ShippingPage /></SuspenseWrapper> },
      { path: 'returns', element: <SuspenseWrapper><ReturnsPage /></SuspenseWrapper> },
    ],
  },
  {
    path: '*',
    element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <RequireAdmin><SuspenseWrapper><AdminDashboardPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'products', element: <RequireAdmin><SuspenseWrapper><AdminProductsPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'orders', element: <RequireAdmin><SuspenseWrapper><AdminOrdersPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'categories', element: <RequireAdmin><SuspenseWrapper><AdminCategoriesPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'brands', element: <RequireAdmin><SuspenseWrapper><AdminBrandsPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'coupons', element: <RequireAdmin><SuspenseWrapper><AdminCouponsPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'users', element: <RequireAdmin><SuspenseWrapper><AdminUsersPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'reviews', element: <RequireAdmin><SuspenseWrapper><AdminReviewsPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'notifications', element: <RequireAdmin><SuspenseWrapper><AdminNotificationsPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'settings', element: <RequireAdmin><SuspenseWrapper><AdminSettingsPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'spin-prizes', element: <RequireAdmin><SuspenseWrapper><AdminSpinPrizesPage /></SuspenseWrapper></RequireAdmin> },
      { path: 'accounts', element: <RequireAdmin><SuspenseWrapper><AdminAccountsPage /></SuspenseWrapper></RequireAdmin> },
    ],
  },
  {
    path: '/contacts',
    element: <SuspenseWrapper><ContactUsPage /></SuspenseWrapper>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/login',
    element: <RequireGuest><SuspenseWrapper><LoginPage /></SuspenseWrapper></RequireGuest>,
    errorElement: <RouteErrorBoundary />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
