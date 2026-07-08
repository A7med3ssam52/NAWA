import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  Tabs, Button, Input, Modal, Badge, EmptyState, Divider, Spinner, Select, Textarea,
} from '@/components/ui';
import { formatPrice, formatDate, formatDateTime, getTimeAgo, cn } from '@/utils';
import { PAGES, ORDER_STATUS_MAP } from '@/constants';
import toast from 'react-hot-toast';
import type { Tab } from '@/components/ui/Tabs';
import type { Address, Order, Notification as NotifType } from '@/types';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function MemberSinceBadge({ date }: { date: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/5 text-secondary text-xs font-cairo font-medium">
      <Calendar className="w-3.5 h-3.5" />
      عضو منذ {formatDate(date)}
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
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword) return toast.error('يرجى إدخال كلمة المرور الحالية');
    if (newPassword.length < 6) return toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
    if (newPassword !== confirmPassword) return toast.error('كلمة المرور الجديدة غير متطابقة');
    toast.success('تم تغيير كلمة المرور بنجاح');
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
            <h3 className="text-sm font-bold font-cairo text-gray-900">كلمة المرور</h3>
            <p className="text-xs text-gray-400 font-cairo">تغيير كلمة المرور الخاصة بك</p>
          </div>
        </div>
        <Button variant="outline" size="sm" rounded="xl" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : 'تغيير'}
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
                  label="كلمة المرور الحالية"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showCurrent ? 'إخفاء' : 'إظهار'}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="كلمة المرور الجديدة"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showNew ? 'إخفاء' : 'إظهار'}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="تأكيد كلمة المرور الجديدة"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirm ? 'إخفاء' : 'إظهار'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button variant="secondary" size="md" rounded="xl" onClick={handleChangePassword} fullWidth>
                <Shield className="w-4 h-4" /> حفظ كلمة المرور الجديدة
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
  const [label, setLabel] = useState(editAddress?.label || '');
  const [fullName, setFullName] = useState(editAddress?.fullName || '');
  const [phone, setPhone] = useState(editAddress?.phone || '');
  const [street, setStreet] = useState(editAddress?.street || '');
  const [city, setCity] = useState(editAddress?.city || '');
  const [state, setState] = useState(editAddress?.state || '');
  const [isDefault, setIsDefault] = useState(editAddress?.isDefault || false);

  const labelOptions = [
    { value: 'المنزل', label: 'المنزل' },
    { value: 'العمل', label: 'العمل' },
    { value: 'أخرى', label: 'أخرى' },
  ];

  const handleSubmit = () => {
    if (!label || !fullName || !phone || !street || !city || !state) {
      return toast.error('يرجى ملء جميع الحقول المطلوبة');
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
    <Modal isOpen={isOpen} onClose={onClose} title={editAddress ? 'تعديل العنوان' : 'إضافة عنوان جديد'} size="lg">
      <div className="space-y-4">
        <Select
          label="تصنيف العنوان"
          options={labelOptions}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <Textarea label="العنوان بالتفصيل" value={street} onChange={(e) => setStreet(e.target.value)} rows={2} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="المدينة" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="المنطقة / المحافظة" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary"
          />
          <span className="text-sm font-cairo text-gray-700">تعيين كعنوان افتراضي</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" size="md" rounded="xl" onClick={handleSubmit} fullWidth>
            <Check className="w-4 h-4" /> {editAddress ? 'حفظ التعديلات' : 'إضافة العنوان'}
          </Button>
          <Button variant="ghost" size="md" rounded="xl" onClick={onClose} fullWidth>
            إلغاء
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
                  aria-label="تحديد كمقروء"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(notif.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
                aria-label="حذف الإشعار"
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

const orderStatusFilters = [
  { value: 'all', label: 'الكل' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'confirmed', label: 'مؤكدة' },
  { value: 'processing', label: 'قيد التجهيز' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغية' },
];

export function ProfilePage() {
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
        dir="rtl"
        className="min-h-[70vh] flex items-center justify-center px-4"
      >
        <EmptyState
          icon={<User className="w-20 h-20" />}
          title="يرجى تسجيل الدخول"
          description="قم بتسجيل الدخول لعرض الملف الشخصي وإدارة طلباتك"
          action={{
            label: 'تسجيل الدخول',
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

  const tabs: Tab[] = [
    { id: 'profile', label: 'الملف الشخصي', icon: <User className="w-4 h-4" /> },
    { id: 'addresses', label: 'عناويني', icon: <MapPin className="w-4 h-4" />, count: userAddresses.length },
    { id: 'orders', label: 'طلباتي', icon: <Package className="w-4 h-4" />, count: orders.length },
    { id: 'wishlist', label: 'المفضلة', icon: <Heart className="w-4 h-4" />, count: wishlistItems.length },
    { id: 'notifications', label: 'الإشعارات', icon: <Bell className="w-4 h-4" />, count: unreadNotifs.length },
    { id: 'reviews', label: 'التقييمات', icon: <MessageSquare className="w-4 h-4" />, count: userReviews.length },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSaveProfile = () => {
    updateProfile({ name, email, phone });
    toast.success('تم حفظ التغييرات بنجاح');
  };

  const handleAddAddress = (address: Address) => {
    addAddress(address);
    toast.success('تم إضافة العنوان بنجاح');
  };

  const handleDeleteAddress = (id: string) => {
    removeAddress(id);
    toast.success('تم حذف العنوان');
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddress(id);
    toast.success('تم تعيين العنوان الافتراضي');
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    toast.success('تم تحديد الإشعار كمقروء');
  };

  const handleDeleteNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('تم حذف الإشعار');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('تم تحديد الكل كمقروء');
  };

  const handleLogout = () => {
    logout();
    navigate(PAGES.HOME);
    toast.success('تم تسجيل الخروج');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
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
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-secondary via-blue-500 to-accent flex items-center justify-center text-white text-3xl lg:text-4xl font-bold font-cairo overflow-hidden shadow-lg shadow-secondary/20">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <button
              className="absolute -bottom-1 -left-1 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-secondary hover:border-secondary shadow-soft transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="تغيير الصورة"
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
            label="الطلبات"
            value={orders.length}
            color="bg-gradient-to-br from-secondary to-blue-500"
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-white" />}
            label="المفضلة"
            value={wishlistItems.length}
            color="bg-gradient-to-br from-danger to-red-400"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-white" />}
            label="التقييمات"
            value={userReviews.length}
            color="bg-gradient-to-br from-accent to-yellow-400"
          />
          <StatCard
            icon={<Bell className="w-5 h-5 text-white" />}
            label="الإشعارات"
            value={unreadNotifs.length}
            color="bg-gradient-to-br from-success to-green-400"
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
                  <h2 className="text-lg font-bold font-cairo text-gray-900">البيانات الشخصية</h2>
                  <p className="text-xs text-gray-400 font-cairo">قم بتحديث معلوماتك الشخصية</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <Input label="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} icon={User} />
                <Input label="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" icon={Mail} />
                <Input label="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} icon={Phone} />
              </div>
              <Button variant="secondary" size="md" rounded="xl" onClick={handleSaveProfile}>
                <Save className="w-4 h-4" /> حفظ التغييرات
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
                  <h2 className="text-lg font-bold font-cairo text-gray-900">عناويني</h2>
                  <p className="text-xs text-gray-400 font-cairo">إدارة عناوين التوصيل الخاصة بك</p>
                </div>
              </div>
              <Button variant="secondary" size="md" rounded="xl" onClick={() => { setEditingAddress(null); setAddressModal(true); }}>
                <Plus className="w-4 h-4" /> إضافة عنوان
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
                        افتراضي
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg',
                        addr.label === 'العمل' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'
                      )}>
                        {addr.label === 'العمل' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-bold font-cairo text-gray-900">{addr.label}</span>
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
                        <Edit3 className="w-3.5 h-3.5" /> تعديل
                      </Button>
                      {!addr.isDefault && (
                        <Button variant="ghost" size="sm" rounded="xl" onClick={() => handleSetDefault(addr.id)}>
                          <Star className="w-3.5 h-3.5" /> تعيين كافتراضي
                        </Button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="mr-auto p-2 rounded-xl text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
                        aria-label="حذف العنوان"
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
                title="لا توجد عناوين"
                description="أضف عنواناً لتتمكن من الشحن إليه"
                action={{ label: 'إضافة عنوان', onClick: () => { setEditingAddress(null); setAddressModal(true); } }}
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
                  <h2 className="text-lg font-bold font-cairo text-gray-900">طلباتي</h2>
                  <p className="text-xs text-gray-400 font-cairo">متابعة وتتبع جميع طلباتك</p>
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
                  const statusInfo = ORDER_STATUS_MAP[order.status];
                  const steps = [
                    { key: 'pending', label: 'قيد الانتظار' },
                    { key: 'confirmed', label: 'تم التأكيد' },
                    { key: 'processing', label: 'قيد التجهيز' },
                    { key: 'shipped', label: 'تم الشحن' },
                    { key: 'delivered', label: 'تم التوصيل' },
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
                              <p className="text-xs text-gray-400 font-cairo mb-0.5">رقم الطلب</p>
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
                            <span>{order.items.length} منتج</span>
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
                              عرض التفاصيل
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
                title={orderFilter === 'all' ? 'لا توجد طلبات' : 'لا توجد طلبات بهذه الحالة'}
                description={orderFilter === 'all' ? 'لم تقم بأي طلبات بعد' : 'جرب تغيير فلتر البحث'}
                action={{ label: 'تسوق الآن', onClick: () => navigate(PAGES.PRODUCTS) }}
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
                <h2 className="text-lg font-bold font-cairo text-gray-900">المفضلة</h2>
                <p className="text-xs text-gray-400 font-cairo">المنتجات التي أعجبتك</p>
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
                          onClick={(e) => { e.preventDefault(); removeItem(product.id); toast.success('تمت الإزالة من المفضلة'); }}
                          className="absolute top-3 left-3 p-2 rounded-xl bg-white/80 backdrop-blur-sm text-danger hover:bg-danger hover:text-white transition-all duration-200 shadow-soft"
                          aria-label="إزالة من المفضلة"
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
                title="المفضلة فارغة"
                description="أضف منتجات إلى المفضلة لتتمكن من مشاهدتها هنا"
                action={{ label: 'تصفح المنتجات', onClick: () => navigate(PAGES.PRODUCTS) }}
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
                  <h2 className="text-lg font-bold font-cairo text-gray-900">الإشعارات</h2>
                  <p className="text-xs text-gray-400 font-cairo">
                    {unreadNotifs.length > 0 ? `لديك ${unreadNotifs.length} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
                  </p>
                </div>
              </div>
              {unreadNotifs.length > 0 && (
                <Button variant="ghost" size="sm" rounded="xl" onClick={handleMarkAllRead}>
                  <CheckCircle className="w-4 h-4" /> تحديد الكل مقروء
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
                title="لا توجد إشعارات"
                description="ستظهر الإشعارات هنا عندما تصلك"
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
                <h2 className="text-lg font-bold font-cairo text-gray-900">تقييماتي</h2>
                <p className="text-xs text-gray-400 font-cairo">جميع تقييماتك على المنتجات</p>
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
                title="لا توجد تقييمات"
                description="عندما تقوم بتقييم منتج سيظهر هنا"
                action={{ label: 'تصفح المنتجات', onClick: () => navigate(PAGES.PRODUCTS) }}
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
                <h2 className="text-lg font-bold font-cairo text-gray-900">الإعدادات</h2>
                <p className="text-xs text-gray-400 font-cairo">تخصيص إعدادات الحساب والتطبيق</p>
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
                      <p className="text-sm font-semibold font-cairo text-gray-900">إشعارات الطلبات</p>
                      <p className="text-xs text-gray-400 font-cairo">إشعارات حالة الطلبات والتوصيل</p>
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
                    aria-label="إشعارات الطلبات"
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
                      <p className="text-sm font-semibold font-cairo text-gray-900">إشعارات العروض</p>
                      <p className="text-xs text-gray-400 font-cairo">إشعارات العروض والتخفيضات</p>
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
                    aria-label="إشعارات العروض"
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
                      <p className="text-sm font-semibold font-cairo text-gray-900">سياسة الخصوصية</p>
                      <p className="text-xs text-gray-400 font-cairo">تعرف على كيفية حماية بياناتك</p>
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
                      <p className="text-sm font-semibold font-cairo text-gray-900">الشروط والأحكام</p>
                      <p className="text-xs text-gray-400 font-cairo">شروط استخدام المتجر</p>
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
                      <p className="text-sm font-semibold font-cairo text-danger">تسجيل الخروج</p>
                      <p className="text-xs text-gray-400 font-cairo">تسجيل الخروج من الحساب</p>
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
                      <p className="text-sm font-semibold font-cairo text-danger">حذف الحساب</p>
                      <p className="text-xs text-gray-400 font-cairo">حذف الحساب وجميع البيانات نهائياً</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <p className="text-xs text-gray-400 font-cairo text-center pt-4">
                زاهي - الإصدار 1.0.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
