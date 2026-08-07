import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { Button, Modal, Input, EmptyState } from '@/components/ui';
import toast from 'react-hot-toast';

export function AddressesPage() {
  const { t, i18n } = useTranslation();
  const { user, addresses, addAddress, removeAddress, setDefaultAddress } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [label, setLabel] = useState('home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const userAddresses = addresses.filter((a) => user?.addresses.includes(a.id) || a.userId === user?.id);

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl" className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState icon={<MapPin className="w-16 h-16" />} title={t('addresses.loginRequired')} />
      </motion.div>
    );
  }

  const handleDelete = (id: string) => {
    removeAddress(id);
    toast.success(t('addresses.deleted'));
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddress(id);
    toast.success(t('addresses.defaultSet'));
  };

  const handleSave = () => {
    if (!fullName || !phone || !street || !city) {
      toast.error(t('profile.requiredFields'));
      return;
    }
    addAddress({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId: user.id,
      label,
      fullName,
      phone,
      street,
      city,
      state,
      isDefault: addresses.length === 0,
    });
    toast.success(t('addresses.added'));
    setShowModal(false);
    setFullName(''); setPhone(''); setStreet(''); setCity(''); setState('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
          {t('addresses.title')}
        </h1>
        <Button variant="secondary" size="md" rounded="xl" onClick={() => { setEditId(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> {t('addresses.addAddress')}
        </Button>
      </div>

      {userAddresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userAddresses.map((addr) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-5 bg-white rounded-2xl border border-gray-100 shadow-soft"
            >
              {addr.isDefault && (
                <div className="absolute top-3 left-3">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold font-cairo text-gray-900">{addr.label}</span>
              </div>
              <p className="text-xs text-gray-500 font-cairo">{addr.fullName}</p>
              <p className="text-xs text-gray-500 font-cairo">{addr.phone}</p>
              <p className="text-xs text-gray-500 font-cairo mt-1">{addr.street}، {addr.city}، {addr.state}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {!addr.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>{t('addresses.setDefault')}</Button>
                )}
                <button onClick={() => handleDelete(addr.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors" aria-label={t('addresses.deleteLabel')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<MapPin className="w-16 h-16" />} title={t('addresses.noAddresses')} description={t('addresses.noAddressesDesc')} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('addresses.addNewAddress')} size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('profile.addressLabel')} value={label} onChange={(e) => setLabel(e.target.value)} />
            <Input label={t('profile.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Input label={t('nav.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          <Input label={t('profile.addressDetail')} value={street} onChange={(e) => setStreet(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('checkout.city')} value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label={t('profile.region')} value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <Button variant="secondary" size="md" rounded="xl" fullWidth onClick={handleSave}>
            {t('addresses.addAddress')}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}