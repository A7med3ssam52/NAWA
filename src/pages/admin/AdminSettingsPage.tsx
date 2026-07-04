import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Truck, Phone, Palette, Save } from 'lucide-react';
import { cn } from '@/utils';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { SITE_NAME, SITE_DESCRIPTION, SHIPPING_COST, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '@/constants';
import { toast } from '@/components/ui';

export function AdminSettingsPage() {
  const [storeInfo, setStoreInfo] = useState({ name: SITE_NAME, description: SITE_DESCRIPTION });
  const [shipping, setShipping] = useState({
    cost: SHIPPING_COST.toString(),
    freeThreshold: FREE_SHIPPING_THRESHOLD.toString(),
    taxRate: (TAX_RATE * 100).toString(),
  });
  const [contact, setContact] = useState({ phone: '+201234567890', email: 'info@zahi.store', address: 'القاهرة، مصر' });

  function handleSaveStore() {
    toast.success('تم حفظ معلومات المتجر بنجاح');
  }

  function handleSaveShipping() {
    toast.success('تم حفظ إعدادات الشحن والضرائب بنجاح');
  }

  function handleSaveContact() {
    toast.success('تم حفظ معلومات الاتصال بنجاح');
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">الإعدادات</h1>
        <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">إعدادات المتجر العامة</p>
      </div>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
            <Store className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">معلومات المتجر</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <Input label="اسم المتجر" value={storeInfo.name} onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })} />
          <Textarea label="وصف المتجر" value={storeInfo.description} onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })} />
          <Button onClick={handleSaveStore}><Save className="w-4 h-4" /> حفظ</Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Truck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">الشحن والضرائب</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <Input label="تكلفة الشحن (ج.م)" type="number" value={shipping.cost} onChange={(e) => setShipping({ ...shipping, cost: e.target.value })} />
          <Input label="الشحن المجاني للطلبات فوق (ج.م)" type="number" value={shipping.freeThreshold} onChange={(e) => setShipping({ ...shipping, freeThreshold: e.target.value })} />
          <Input label="نسبة الضريبة (%)" type="number" value={shipping.taxRate} onChange={(e) => setShipping({ ...shipping, taxRate: e.target.value })} />
          <Button onClick={handleSaveShipping}><Save className="w-4 h-4" /> حفظ</Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-success/10 text-success">
            <Phone className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">جهات الاتصال</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <Input label="رقم الهاتف" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          <Input label="البريد الإلكتروني" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          <Input label="العنوان" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          <Button onClick={handleSaveContact}><Save className="w-4 h-4" /> حفظ</Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">المظهر</h2>
        </div>
        <p className="text-sm font-cairo text-gray-500 dark:text-dark-muted mb-4">يمكنك تغيير المظهر بين الوضع الفاتح والداكن من خلال زر التبديل في الشريط العلوي.</p>
      </Card>
    </motion.div>
  );
}
