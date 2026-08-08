import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, User } from 'lucide-react';
import { Modal, IosBottomSheet, Button } from '@/components/ui';
import { useMediaQuery } from '@/hooks';
import { PAGES } from '@/constants';

interface AccountGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
  onContinueGuest?: () => void;
}

export function AccountGateModal({ isOpen, onClose, onLogin, onContinueGuest }: AccountGateModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleLogin = () => {
    onClose();
    if (onLogin) {
      onLogin();
    } else {
      navigate(PAGES.LOGIN, { state: { from: PAGES.CHECKOUT } });
    }
  };

  const handleContinueGuest = () => {
    onClose();
    if (onContinueGuest) {
      onContinueGuest();
    } else {
      navigate(`${PAGES.CHECKOUT}?guest=1`);
    }
  };

  const content = (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/10 mb-4 mx-auto">
        <ShieldCheck className="w-7 h-7 text-secondary" />
      </div>
      <p className="text-sm text-gray-500 font-cairo mb-5 leading-relaxed">{t('checkout.accountGateDesc')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" rounded="xl" fullWidth onClick={handleLogin}>
          <LogIn className="w-4 h-4" />
          {t('checkout.yesHaveAccount')}
        </Button>
        <Button variant="outline" size="lg" rounded="xl" fullWidth onClick={handleContinueGuest}>
          <User className="w-4 h-4" />
          {t('checkout.noAccountContinue')}
        </Button>
      </div>
      <p className="text-xs text-gray-400 font-cairo mt-4 leading-relaxed">{t('checkout.accountGateNote')}</p>
    </div>
  );

  return isMobile ? (
    <IosBottomSheet isOpen={isOpen} onClose={onClose} title={t('checkout.accountGateTitle')}>
      <div className="pt-2">{content}</div>
    </IosBottomSheet>
  ) : (
    <Modal isOpen={isOpen} onClose={onClose} title={t('checkout.accountGateTitle')} size="sm">
      {content}
    </Modal>
  );
}