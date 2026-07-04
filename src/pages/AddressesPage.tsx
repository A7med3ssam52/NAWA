import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/contexts';
import { addresses as allAddresses } from '@/data';
import { Button, Modal, Input, EmptyState } from '@/components/ui';
import toast from 'react-hot-toast';

export function AddressesPage() {
  const { user, removeAddress, setDefaultAddress } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const userAddresses = allAddresses.filter((a) => user?.addresses.includes(a.id));

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl" className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState icon={<MapPin className="w-16 h-16" />} title="يرجى تسجيل الدخول" />
      </motion.div>
    );
  }

  const handleDelete = (id: string) => {
    removeAddress(id);
    toast.success('تم حذف العنوان');
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddress(id);
    toast.success('تم تعيين العنوان الافتراضي');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 dark:text-dark-text">
          عناويني
        </h1>
        <Button variant="secondary" size="md" rounded="xl" onClick={() => { setEditId(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> إضافة عنوان
        </Button>
      </div>

      {userAddresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userAddresses.map((addr) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-5 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft"
            >
              {addr.isDefault && (
                <div className="absolute top-3 left-3">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">{addr.label}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">{addr.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">{addr.phone}</p>
              <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo mt-1">{addr.street}، {addr.city}، {addr.state}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                {!addr.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>تعيين كافتراضي</Button>
                )}
                <button onClick={() => handleDelete(addr.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors" aria-label="حذف العنوان">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<MapPin className="w-16 h-16" />} title="لا توجد عناوين" description="أضف عنواناً لتتمكن من الشحن إليه" />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'تعديل العنوان' : 'إضافة عنوان جديد'} size="lg">
        <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo text-center py-4">نموذج إضافة عنوان</p>
      </Modal>
    </motion.div>
  );
}
