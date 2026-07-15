import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Store, Truck, Megaphone, Phone, Palette, Save } from 'lucide-react';
import { cn } from '@/utils';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { SITE_NAME, SITE_DESCRIPTION } from '@/constants';
import { adminService } from '@/services';
import { toast } from '@/components/ui';

export function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const [storeInfo, setStoreInfo] = useState({ name: SITE_NAME(), description: SITE_DESCRIPTION() });
  const [shipping, setShipping] = useState({ cost: '30', freeThreshold: '500' });
  const [contact, setContact] = useState({ phone: '+201234567890', email: 'info@zahieg.com', address: t('nav.location') });
  const [announcement, setAnnouncement] = useState<{ text: string; enabled: boolean; dismissible: boolean }>({ text: '', enabled: false, dismissible: true });

  useEffect(() => {
    adminService.getAnnouncement().then(setAnnouncement);
    adminService.getStoreSettings().then((s) => {
      if (s) {
        setStoreInfo({ name: s.name || SITE_NAME(), description: s.description || SITE_DESCRIPTION() });
        setShipping({ cost: String(s.shippingCost || 30), freeThreshold: String(s.freeShippingThreshold || 500) });
        setContact({ phone: s.phone || '+201234567890', email: s.email || 'info@zahieg.com', address: s.address || t('nav.location') });
      }
    });
  }, []);

  async function handleSaveAnnouncement() {
    await adminService.updateAnnouncement(announcement);
    window.dispatchEvent(new CustomEvent('announcement-update'));
    toast.success(t('admin.saveAnnouncement'));
  }

  async function handleSaveStore() {
    await adminService.updateStoreSettings({ name: storeInfo.name, description: storeInfo.description });
    toast.success(t('admin.saveStoreInfo'));
  }

  async function handleSaveShipping() {
    await adminService.updateStoreSettings({ shippingCost: Number(shipping.cost), freeShippingThreshold: Number(shipping.freeThreshold) });
    toast.success(t('admin.saveShipping'));
  }

  async function handleSaveContact() {
    await adminService.updateStoreSettings(contact);
    toast.success(t('admin.saveContact'));
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.settings')}</h1>
        <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.settingsDesc')}</p>
      </div>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
            <Store className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900">{t('admin.storeInfo')}</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <Input label={t('admin.storeName')} value={storeInfo.name} onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })} />
          <Textarea label={t('admin.storeDesc')} value={storeInfo.description} onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })} />
          <Button onClick={handleSaveStore}><Save className="w-4 h-4" /> {t('common.save')}</Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Truck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900">{t('admin.shippingTax')}</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <Input label={t('admin.shippingCost')} type="number" value={shipping.cost} onChange={(e) => setShipping({ ...shipping, cost: e.target.value })} />
          <Input label={t('admin.freeShippingThreshold')} type="number" value={shipping.freeThreshold} onChange={(e) => setShipping({ ...shipping, freeThreshold: e.target.value })} />
          <Button onClick={handleSaveShipping}><Save className="w-4 h-4" /> {t('common.save')}</Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
            <Megaphone className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900">{t('admin.announcementBar')}</h2>
        </div>
        <div className="space-y-4 max-w-xl">
          <Textarea
            label={t('admin.announcementText')}
            placeholder={t('admin.announcementPlaceholder')}
            value={announcement.text}
            onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={announcement.enabled}
                onClick={() => setAnnouncement({ ...announcement, enabled: !announcement.enabled })}
                className={cn(
                  'relative w-10 h-6 rounded-full transition-colors duration-200',
                  announcement.enabled ? 'bg-secondary' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  announcement.enabled && 'translate-x-4'
                )} />
              </button>
              <span className="text-sm font-cairo text-gray-700">{t('admin.enableAnnouncement')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={announcement.dismissible}
                onClick={() => setAnnouncement({ ...announcement, dismissible: !announcement.dismissible })}
                className={cn(
                  'relative w-10 h-6 rounded-full transition-colors duration-200',
                  announcement.dismissible ? 'bg-secondary' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  announcement.dismissible && 'translate-x-4'
                )} />
              </button>
              <span className="text-sm font-cairo text-gray-700">{t('admin.dismissible')}</span>
            </label>
          </div>
          <Button onClick={handleSaveAnnouncement}>
            <Save className="w-4 h-4" /> {t('common.save')}
          </Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-success/10 text-success">
            <Phone className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900">{t('admin.contactInfo')}</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <Input label={t('admin.phone')} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} dir="ltr" />
          <Input label={t('admin.email')} type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} dir="ltr" />
          <Input label={t('admin.address')} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          <Button onClick={handleSaveContact}><Save className="w-4 h-4" /> {t('common.save')}</Button>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900">{t('admin.appearance')}</h2>
        </div>
        <p className="text-sm font-cairo text-gray-500 mb-4">{t('admin.appearanceDesc')}</p>
      </Card>
    </motion.div>
  );
}
