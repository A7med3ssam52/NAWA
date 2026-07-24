import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  User, MapPin, Package, Heart, Bell, Settings, Star, Camera,
  Save, Plus, Trash2, LogOut, Shield, Mail, Phone,
  ChevronLeft, Clock, CheckCircle, X, Tag, Edit3, CreditCard,
  Map, Home, Briefcase, MoreHorizontal, AlertCircle, Eye,
  EyeOff, Star as StarIcon, MessageSquare, RefreshCw, Filter,
  Check, XCircle, Search, Download, Calendar, FileText,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useWishlist } from '@/contexts';
import {
  getUserOrders, getUserNotifications, getUserAddresses,
  orders as allOrders, reviews as allReviews,
} from '@/data';
import { adminService } from '@/services';
import {
  Tabs, Button, Input, Modal, Badge, EmptyState, Divider, Spinner, Select, Textarea,
} from '@/components/ui';
import { formatPrice, formatDate, formatDateTime, getTimeAgo, cn } from '@/utils';
import { PAGES, getOrderStatusMap, EGYPT_GOVERNORATES } from '@/constants';
import toast from 'react-hot-toast';
import type { Tab } from '@/components/ui/Tabs';
import type { Address, Order, Notification as NotifType } from '@/types';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function MemberSinceBadge({ date }: { date: string }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/5 text-secondary text-xs font-cairo font-medium">
      <Calendar className="w-3.5 h-3.5" />
      {t('profile.memberSince', { date: formatDate(date) })}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-soft-lg transition-all duration-300"
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${color} shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold font-cairo text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 font-cairo">{label}</p>
      </div>
    </motion.div>
  );
}

function PasswordSection() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword) return toast.error(t('profile.currentPasswordRequired'));
    if (newPassword.length < 6) return toast.error(t('auth.passwordMin'));
    if (newPassword !== confirmPassword) return toast.error(t('profile.newPasswordMismatch'));
    toast.success(t('profile.passwordChanged'));
    setShowForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-cairo text-gray-900">{t('profile.password')}</h3>
            <p className="text-xs text-gray-400 font-cairo">{t('profile.changePasswordDesc')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" rounded="xl" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('common.cancel') : t('profile.changePassword')}
        </Button>
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Divider className="mb-4" />
            <div className="space-y-3">
              <div className="relative">
                <Input
                  label={t('profile.currentPassword')}
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showCurrent ? t('profile.hide') : t('profile.show')}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label={t('profile.newPassword')}
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showNew ? t('profile.hide') : t('profile.show')}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label={t('profile.confirmNewPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirm ? t('profile.hide') : t('profile.show')}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button variant="secondary" size="md" rounded="xl" onClick={handleChangePassword} fullWidth>
                <Shield className="w-4 h-4" /> {t('profile.saveNewPassword')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddressFormModal({
  isOpen,
  onClose,
  onSave,
  editAddress,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  editAddress: Address | null;
}) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(editAddress?.label || '');
  const [fullName, setFullName] = useState(editAddress?.fullName || '');
  const [phone, setPhone] = useState(editAddress?.phone || '');
  const [street, setStreet] = useState(editAddress?.street || '');
  const [city, setCity] = useState(editAddress?.city || '');
  const [state, setState] = useState(editAddress?.state || '');
  const [isDefault, setIsDefault] = useState(editAddress?.isDefault || false);

  const labelOptions = [
    { value: 'home', label: t('profile.labelHome') },
    { value: 'work', label: t('profile.labelWork') },
    { value: 'other', label: t('profile.labelOther') },
  ];

  const handleSubmit = () => {
    if (!label || !fullName || !phone || !street || !city || !state) {
      return toast.error(t('profile.requiredFields'));
    }
    onSave({
      id: editAddress?.id || generateId(),
      label,
      fullName,
      phone,
      street,
      city,
      state,
      isDefault,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editAddress ? t('addresses.editAddress') : t('addresses.addNewAddress')} size="lg">
      <div className="space-y-4">
        <Select
          label={t('profile.addressLabel')}
          options={labelOptions}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('profile.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label={t('nav.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <Textarea label={t('profile.addressDetail')} value={street} onChange={(e) => setStreet(e.target.value)} rows={2} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('checkout.city')} value={city} onChange={(e) => setCity(e.target.value)} />
          <Select
            label={t('profile.region')}
            placeholder={t('checkout.statePlaceholder')}
            options={EGYPT_GOVERNORATES.map((g) => ({ value: g, label: g }))}
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary"
          />
          <span className="text-sm font-cairo text-gray-700">{t('profile.setAsDefaultCheckbox')}</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" size="md" rounded="xl" onClick={handleSubmit} fullWidth>
            <Check className="w-4 h-4" /> {editAddress ? t('profile.saveChanges') : t('addresses.addAddress')}
          </Button>
          <Button variant="ghost" size="md" rounded="xl" onClick={onClose} fullWidth>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function NotificationItem({ notif, onMarkRead, onDelete }: {
  notif: NotifType;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const typeIcons: Record<string, React.ReactNode> = {
    order: <Package className="w-4 h-4" />,
    promo: <Tag className="w-4 h-4" />,
    system: <Bell className="w-4 h-4" />,
  };

  const typeColors: Record<string, string> = {
    order: 'bg-secondary/10 text-secondary',
    promo: 'bg-accent/10 text-accent',
    system: 'bg-gray-100 text-gray-500',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative p-4 rounded-2xl border transition-all duration-200',
        notif.read
          ? 'bg-white border-gray-100'
          : 'bg-secondary/[0.03][0.06] border-secondary/20 shadow-soft'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0', typeColors[notif.type] || typeColors.system)}>
          {typeIcons[notif.type] || typeIcons.system}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn('text-sm font-cairo', notif.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900')}>
                {notif.title}
              </p>
              <p className="text-xs text-gray-500 font-cairo mt-1 leading-relaxed">{notif.message}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-gray-400 font-cairo flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeAgo(notif.createdAt)}
            </span>
            <div className="flex items-center gap-1">
              {!notif.read && (
                <button
                  onClick={() => onMarkRead(notif.id)}
                  className="p-1.5 rounded-lg text-secondary hover:bg-secondary/5 transition-colors"
                  aria-label={t('admin.markAsRead')}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(notif.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
                aria-label={t('admin.deleteNotification')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {!notif.read && <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-2" />}
      </div>
    </motion.div>
  );
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, addresses: userAddresses, updateProfile, addAddress, removeAddress, setDefaultAddress, logout } = useAuth();
  const { items: wishlistItems, removeItem } = useWishlist();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [orderFilter, setOrderFilter] = useState('all');

  const [addressModal, setAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [notifications, setNotifications] = useState<NotifType[]>(
    user ? getUserNotifications(user.id) : [],
  );

  const [orderNotif, setOrderNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(true);

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        className="min-h-[70vh] flex items-center justify-center px-4"
      >
        <EmptyState
          icon={<User className="w-20 h-20" />}
          title={t('notifications.loginRequired')}
          description={t('profile.loginRequiredDesc')}
          action={{
            label: t('nav.login'),
            onClick: () => navigate('/login'),
          }}
        />
      </motion.div>
    );
  }

  const orders = getUserOrders(user.id);
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);
  const memberSince = orders.length > 0
    ? [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt
    : new Date().toISOString();

  const userReviews = allReviews.filter((r) => r.userId === user.id);
  const unreadNotifs = notifications.filter((n) => !n.read);

  const orderStatusFilters = [
    { value: 'all', label: t('orders.allOrders') },
    { value: 'pending', label: t('orders.pending') },
    { value: 'confirmed', label: t('orders.confirmed') },
    { value: 'processing', label: t('orders.processing') },
    { value: 'shipped', label: t('orders.shipped') },
    { value: 'delivered', label: t('orders.delivered') },
    { value: 'cancelled', label: t('orders.cancelled') },
  ];

  const tabs: Tab[] = [
    { id: 'profile', label: t('profile.title'), icon: <User className="w-4 h-4" /> },
    { id: 'addresses', label: t('profile.myAddresses'), icon: <MapPin className="w-4 h-4" />, count: userAddresses.length },
    { id: 'orders', label: t('profile.myOrders'), icon: <Package className="w-4 h-4" />, count: orders.length },
    { id: 'wishlist', label: t('profile.wishlist'), icon: <Heart className="w-4 h-4" />, count: wishlistItems.length },
    { id: 'notifications', label: t('profile.notifications'), icon: <Bell className="w-4 h-4" />, count: unreadNotifs.length },
    { id: 'reviews', label: t('profile.reviews'), icon: <MessageSquare className="w-4 h-4" />, count: userReviews.length },
    { id: 'settings', label: t('profile.settings'), icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSaveProfile = () => {
    updateProfile({ name, email, phone });
    toast.success(t('profile.profileUpdated'));
  };

  const handleAddAddress = (address: Address) => {
    addAddress(address);
    toast.success(t('profile.addressAdded'));
  };

  const handleDeleteAddress = (id: string) => {
    removeAddress(id);
    toast.success(t('profile.addressDeleted'));
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddress(id);
    toast.success(t('profile.defaultSet'));
  };

  const handleMarkRead = async (id: string) => {
    await adminService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    toast.success(t('profile.notifMarkedRead'));
  };

  const handleDeleteNotif = async (id: string) => {
    await adminService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success(t('profile.notifDeleted'));
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((n) => !n.read)) {
      await adminService.markNotificationRead(n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success(t('profile.allMarkedRead'));
  };

  const handleLogout = () => {
    logout();
    navigate(PAGES.HOME);
    toast.success(t('profile.loggedOut'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-soft-lg p-6 lg:p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-secondary flex items-center justify-center text-white text-3xl lg:text-4xl font-bold font-cairo overflow-hidden shadow-lg shadow-black/20">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <button
              className="absolute -bottom-1 -left-1 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-secondary hover:border-secondary shadow-soft transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label={t('profile.changePhoto')}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-right">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
                {user.name}
              </h1>
              <MemberSinceBadge date={memberSince} />
            </div>
            <p className="text-sm text-gray-500 font-cairo flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
            {user.phone && (
              <p className="text-sm text-gray-500 font-cairo flex items-center justify-center sm:justify-start gap-2">
                <Phone className="w-4 h-4" /> {user.phone}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          <StatCard
            icon={<Package className="w-5 h-5 text-white" />}
            label={t('profile.statsOrders')}
            value={orders.length}
            color="bg-secondary"
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-white" />}
            label={t('profile.statsWishlist')}
            value={wishlistItems.length}
            color="bg-danger"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-white" />}
            label={t('profile.statsReviews')}
            value={userReviews.length}
            color="bg-secondary/70"
          />
          <StatCard
            icon={<Bell className="w-5 h-5 text-white" />}
            label={t('profile.statsNotifications')}
            value={unreadNotifs.length}
            color="bg-success"
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8 overflow-x-auto scrollbar-hide" />

      <AnimatePresence mode="wait">
        {/* ========== TAB: PROFILE ========== */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cairo text-gray-900">{t('profile.personalInfo')}</h2>
                  <p className="text-xs text-gray-400 font-cairo">{t('profile.personalInfoDesc')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <Input label={t('profile.fullName')} value={name} onChange={(e) => setName(e.target.value)} icon={User} />
                <Input label={t('nav.email')} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" icon={Mail} />
                <Input label={t('nav.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} icon={Phone} />
              </div>
              <Button variant="secondary" size="md" rounded="xl" onClick={handleSaveProfile}>
                <Save className="w-4 h-4" /> {t('common.saveChanges')}
              </Button>
            </div>
            <PasswordSection />
          </motion.div>
        )}

        {/* ========== TAB: ADDRESSES ========== */}
        {activeTab === 'addresses' && (
          <motion.div
            key="addresses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cairo text-gray-900">{t('profile.myAddresses')}</h2>
                  <p className="text-xs text-gray-400 font-cairo">{t('profile.addressesDesc')}</p>
                </div>
              </div>
              <Button variant="secondary" size="md" rounded="xl" onClick={() => { setEditingAddress(null); setAddressModal(true); }}>
                <Plus className="w-4 h-4" /> {t('profile.addAddress')}
              </Button>
            </div>
            {userAddresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userAddresses.map((addr, i) => (
                  <motion.div
                    key={addr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'relative p-5 bg-white rounded-2xl border shadow-soft transition-all duration-200 hover:shadow-soft-lg',
                      addr.isDefault
                        ? 'border-secondary/30 ring-1 ring-secondary/20'
                        : 'border-gray-100'
                    )}
                  >
                    {addr.isDefault && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-cairo font-medium">
                        <Star className="w-3 h-3 fill-secondary" />
                        {t('profile.default')}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg',
                        addr.label === 'work' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'
                      )}>
                        {addr.label === 'work' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-bold font-cairo text-gray-900">{addr.label === 'home' ? t('profile.labelHome') : addr.label === 'work' ? t('profile.labelWork') : t('profile.labelOther')}</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500 font-cairo">
                      <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {addr.fullName}</p>
                      <p className="flex items-center gap-1.5" dir="ltr"><Phone className="w-3.5 h-3.5" /> {addr.phone}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {addr.street}، {addr.city}، {addr.state}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        rounded="xl"
                        onClick={() => { setEditingAddress(addr); setAddressModal(true); }}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> {t('profile.editAddress')}
                      </Button>
                      {!addr.isDefault && (
                        <Button variant="ghost" size="sm" rounded="xl" onClick={() => handleSetDefault(addr.id)}>
                          <Star className="w-3.5 h-3.5" /> {t('profile.setAsDefault')}
                        </Button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="mr-auto p-2 rounded-xl text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
                        aria-label={t('profile.deleteAddress')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<MapPin className="w-16 h-16" />}
                title={t('profile.noAddressesTitle')}
                description={t('profile.noAddressesDesc')}
                action={{ label: t('profile.addAddress'), onClick: () => { setEditingAddress(null); setAddressModal(true); } }}
              />
            )}
            <AddressFormModal
              isOpen={addressModal}
              onClose={() => setAddressModal(false)}
              onSave={handleAddAddress}
              editAddress={editingAddress}
            />
          </motion.div>
        )}

        {/* ========== TAB: ORDERS ========== */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cairo text-gray-900">{t('profile.ordersTitle')}</h2>
                  <p className="text-xs text-gray-400 font-cairo">{t('profile.ordersDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {orderStatusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setOrderFilter(f.value)}
                    className={cn(
                      'whitespace-nowrap px-3 py-1.5 text-xs font-cairo font-medium rounded-xl transition-all duration-200',
                      orderFilter === f.value
                        ? 'bg-secondary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order, i) => {
                  const statusInfo = getOrderStatusMap()[order.status];
                  const steps = [
                    { key: 'pending', label: t('orders.pending') },
                    { key: 'confirmed', label: t('orders.confirmed') },
                    { key: 'processing', label: t('orders.processing') },
                    { key: 'shipped', label: t('orders.shipped') },
                    { key: 'delivered', label: t('orders.delivered') },
                  ];
                  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={PAGES.ORDER_DETAILS.replace(':orderId', order.id)}
                        className="block bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-soft-lg transition-all duration-300 group"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-400 font-cairo mb-0.5">{t('profile.orderNumber')}</p>
                              <p className="text-sm font-bold font-cairo text-gray-900 font-mono" dir="ltr">
                                {order.orderNumber}
                              </p>
                            </div>
                            <Badge
                              variant={
                                order.status === 'delivered' ? 'success' :
                                order.status === 'cancelled' ? 'danger' :
                                order.status === 'pending' ? 'warning' : 'info'
                              }
                              size="md"
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-cairo mb-4">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}</span>
                            <span>{order.items.length} {t('orders.productCount', { count: order.items.length }).replace(/^\d+ /, '')}</span>
                            <span>{formatPrice(order.total)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                              {order.items.slice(0, 4).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="w-10 h-10 rounded-xl border-2 border-white bg-gray-50 overflow-hidden"
                                >
                                  <img src={item.productImage} alt={item.productName} loading="lazy" className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {order.items.length > 4 && (
                                <div className="w-10 h-10 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold font-cairo text-gray-500">
                                  +{order.items.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                          {!isCancelled && (
                            <div className="flex items-center gap-1 mb-4">
                              {steps.map((step, idx) => {
                                const isCompleted = idx <= currentStepIndex;
                                return (
                                  <div key={step.key} className="flex-1 flex items-center gap-1">
                                    <div
                                      className={cn(
                                        'h-1.5 rounded-full flex-1 transition-colors duration-300',
                                        isCompleted ? 'bg-success' : 'bg-gray-200'
                                      )}
                                    />
                                    {isCompleted && idx === currentStepIndex && (
                                      <div className="w-2 h-2 rounded-full bg-success" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-sm font-medium font-cairo text-secondary group-hover:gap-2.5 transition-all">
                              {t('profile.viewDetails')}
                              <ChevronLeft className="w-4 h-4" />
                            </div>
                            <div className="text-xs text-gray-400 font-cairo flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {getTimeAgo(order.updatedAt || order.createdAt)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Package className="w-16 h-16" />}
                title={orderFilter === 'all' ? t('profile.noOrders') : t('profile.noOrdersFiltered')}
                description={orderFilter === 'all' ? t('profile.noOrdersDesc') : t('profile.noOrdersFilteredDesc')}
                action={{ label: t('profile.shopNow'), onClick: () => navigate(PAGES.PRODUCTS) }}
              />
            )}
          </motion.div>
        )}

        {/* ========== TAB: WISHLIST ========== */}
        {activeTab === 'wishlist' && (
          <motion.div
            key="wishlist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-danger/10 text-danger">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-cairo text-gray-900">{t('profile.wishlist')}</h2>
                <p className="text-xs text-gray-400 font-cairo">{t('profile.wishlistDesc')}</p>
              </div>
            </div>
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden"
                  >
                    <Link to={PAGES.PRODUCT_DETAILS.replace(':slug', product.slug)} className="block">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.discount && (
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-danger text-white text-[10px] font-cairo font-bold">
                            -{product.discount}%
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); removeItem(product.id); toast.success(t('profile.removeFromWishlist')); }}
                          className="absolute top-3 left-3 p-2 rounded-xl bg-white/80 backdrop-blur-sm text-danger hover:bg-danger hover:text-white transition-all duration-200 shadow-soft"
                          aria-label={t('products.removeFromWishlist')}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-bold font-cairo text-gray-900 truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-base font-bold font-cairo text-secondary">{formatPrice(product.price)}</span>
                          {product.oldPrice && (
                            <span className="text-xs text-gray-400 line-through font-cairo">{formatPrice(product.oldPrice)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <StarIcon className="w-3.5 h-3.5 fill-accent text-accent" />
                          <span className="text-xs font-medium font-cairo text-gray-600">{product.rating}</span>
                          <span className="text-xs text-gray-400 font-cairo">({product.reviewsCount})</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Heart className="w-16 h-16" />}
                title={t('profile.wishlistEmpty')}
                description={t('profile.wishlistEmptyDesc')}
                action={{ label: t('profile.browseProducts'), onClick: () => navigate(PAGES.PRODUCTS) }}
              />
            )}
          </motion.div>
        )}

        {/* ========== TAB: NOTIFICATIONS ========== */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cairo text-gray-900">{t('profile.notifications')}</h2>
                  <p className="text-xs text-gray-400 font-cairo">
                    {unreadNotifs.length > 0 ? t('profile.youHaveUnread', { count: unreadNotifs.length }) : t('profile.allRead')}
                  </p>
                </div>
              </div>
              {unreadNotifs.length > 0 && (
                <Button variant="ghost" size="sm" rounded="xl" onClick={handleMarkAllRead}>
                  <CheckCircle className="w-4 h-4" /> {t('profile.markAllRead')}
                </Button>
              )}
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notif={n}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDeleteNotif}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                icon={<Bell className="w-16 h-16" />}
                title={t('profile.noNotificationsTitle')}
                description={t('profile.noNotificationsDesc')}
              />
            )}
          </motion.div>
        )}

        {/* ========== TAB: REVIEWS ========== */}
        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-cairo text-gray-900">{t('profile.reviews')}</h2>
                <p className="text-xs text-gray-400 font-cairo">{t('profile.reviewsDesc')}</p>
              </div>
            </div>
            {userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                        <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold font-cairo text-gray-900">{review.userName}</h4>
                          <span className="text-xs text-gray-400 font-cairo">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <StarIcon
                              key={idx}
                              className={cn('w-3.5 h-3.5', idx < review.rating ? 'fill-accent text-accent' : 'text-gray-300')}
                            />
                          ))}
                        </div>
                        {review.title && (
                          <p className="text-sm font-semibold font-cairo text-gray-800 mb-1">{review.title}</p>
                        )}
                        <p className="text-xs text-gray-500 font-cairo leading-relaxed">{review.comment}</p>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                          <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-secondary transition-colors font-cairo">
                            <Heart className="w-3.5 h-3.5" />
                            {review.likes}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<MessageSquare className="w-16 h-16" />}
                title={t('profile.noReviewsYet')}
                description={t('profile.noReviewsDesc')}
                action={{ label: t('profile.browseProducts'), onClick: () => navigate(PAGES.PRODUCTS) }}
              />
            )}
          </motion.div>
        )}

        {/* ========== TAB: SETTINGS ========== */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-cairo text-gray-900">{t('profile.settings')}</h2>
                <p className="text-xs text-gray-400 font-cairo">{t('profile.settingsDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden divide-y divide-gray-100">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-cairo text-gray-900">{t('profile.orderNotifications')}</p>
                      <p className="text-xs text-gray-400 font-cairo">{t('profile.orderNotificationsDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOrderNotif(!orderNotif)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors duration-200',
                      orderNotif ? 'bg-secondary' : 'bg-gray-300'
                    )}
                    role="switch"
                    aria-checked={orderNotif}
                    aria-label={t('profile.orderNotificationAria')}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                      orderNotif ? 'translate-x-[26px]' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-cairo text-gray-900">{t('profile.promoNotifications')}</p>
                      <p className="text-xs text-gray-400 font-cairo">{t('profile.promoNotificationsDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPromoNotif(!promoNotif)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors duration-200',
                      promoNotif ? 'bg-secondary' : 'bg-gray-300'
                    )}
                    role="switch"
                    aria-checked={promoNotif}
                    aria-label={t('profile.promoNotificationAria')}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                      promoNotif ? 'translate-x-[26px]' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden divide-y divide-gray-100">
                <button
                  onClick={() => navigate(PAGES.PRIVACY)}
                  className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold font-cairo text-gray-900">{t('profile.privacyPolicy')}</p>
                      <p className="text-xs text-gray-400 font-cairo">{t('profile.privacyPolicyDesc')}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => navigate(PAGES.TERMS)}
                  className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold font-cairo text-gray-900">{t('profile.termsLink')}</p>
                      <p className="text-xs text-gray-400 font-cairo">{t('profile.termsDesc')}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-danger/10 text-danger">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold font-cairo text-danger">{t('profile.logout')}</p>
                      <p className="text-xs text-gray-400 font-cairo">{t('profile.logoutDesc')}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>

                <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-danger/10 text-danger">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold font-cairo text-danger">{t('profile.deleteAccount')}</p>
                      <p className="text-xs text-gray-400 font-cairo">{t('profile.deleteAccountDesc')}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <p className="text-xs text-gray-400 font-cairo text-center pt-4">
                {t('profile.appVersion')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
