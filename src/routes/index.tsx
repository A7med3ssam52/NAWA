import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout, AdminLayout } from '@/components/layout';
import { Spinner } from '@/components/ui';

function lazyPage(path: string, name: string) {
  return lazy(() => import(`@/pages/${path}.tsx`).then((m) => ({ default: m[name as keyof typeof m] as unknown as React.ComponentType })));
}

function lazyAdmin(path: string, name: string) {
  return lazy(() => import(`@/pages/admin/${path}.tsx`).then((m) => ({ default: m[name as keyof typeof m] as unknown as React.ComponentType })));
}

const HomePage = lazyPage('HomePage', 'HomePage');
const ProductsPage = lazyPage('ProductsPage', 'ProductsPage');
const ProductDetailsPage = lazyPage('ProductDetailsPage', 'ProductDetailsPage');
const CategoriesPage = lazyPage('CategoriesPage', 'CategoriesPage');
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
    children: [
      { index: true, element: <SuspenseWrapper><HomePage /></SuspenseWrapper> },
      { path: 'products', element: <SuspenseWrapper><ProductsPage /></SuspenseWrapper> },
      { path: 'products/:slug', element: <SuspenseWrapper><ProductDetailsPage /></SuspenseWrapper> },
      { path: 'categories', element: <SuspenseWrapper><CategoriesPage /></SuspenseWrapper> },
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
    ],
  },
  {
    path: '/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
