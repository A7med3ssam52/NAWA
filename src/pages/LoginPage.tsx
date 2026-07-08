import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowLeft,
  ShoppingBag,
} from 'lucide-react';
import { SITE_NAME } from '@/constants';
import { cn } from '@/utils';

function FloatingInput({ label, type, icon, error, register, name, showToggle, onToggle, value }: {
  label: string;
  type: string;
  icon: React.ReactNode;
  error?: string;
  register: ReturnType<UseFormRegister<any>>;
  name: string;
  showToggle?: boolean;
  onToggle?: () => void;
  value?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = focused || (value !== undefined && value.length > 0);

  return (
    <div className="space-y-1.5">
      <div className="relative group transition-all duration-200">
        <div className={cn(
          'absolute right-3.5 top-1/2 -translate-y-1/2 z-10 transition-all duration-200 pointer-events-none',
          focused ? 'text-secondary' : 'text-gray-400'
        )}>
          {icon}
        </div>
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {type === 'password' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <input
          type={type}
          {...register}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'w-full h-12 px-10 bg-gray-50 border-2 rounded-2xl text-sm font-cairo text-gray-900 placeholder-transparent transition-all duration-200',
            focused
              ? 'border-secondary/40 shadow-[0_0_0_4px_rgba(255,107,0,0.08)][0_0_0_4px_rgba(255,107,0,0.06)]'
              : 'border-transparent hover:border-gray-200',
            error && '!border-danger/60 !shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
          )}
        />
        <label className={cn(
          'absolute right-10 top-1/2 -translate-y-1/2 text-sm font-cairo pointer-events-none transition-all duration-200',
          hasValue || focused
            ? '-translate-y-[26px] right-3 text-xs text-secondary font-medium'
            : 'text-gray-400'
        )}>
          {label}
        </label>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs text-danger font-cairo pr-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loginSchema = useMemo(() => z.object({
    email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
    password: z.string().min(1, t('auth.passwordRequired')).min(6, t('auth.passwordMin')),
  }), [t]);

  const registerSchema = useMemo(() => z.object({
    name: z.string().min(1, t('auth.nameRequired')).min(2, t('auth.nameMin')),
    email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
    password: z.string().min(1, t('auth.passwordRequired')).min(6, t('auth.passwordMin')),
    confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordMismatch'),
    path: ['confirmPassword'],
  }), [t]);

  type LoginForm = z.infer<typeof loginSchema>;
  type RegisterForm = z.infer<typeof registerSchema>;

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  if (isAuthenticated) return null;

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onLogin = useCallback(async (data: LoginForm) => {
    setLoading(true);
    setError('');
    const result = await login(data.email, data.password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || t('auth.loginFailed'));
    }
  }, [login, navigate, from, t]);

  const onRegister = useCallback(async (data: RegisterForm) => {
    setLoading(true);
    setError('');
    const result = await registerUser(data.name, data.email, data.password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || t('auth.registerFailed'));
    }
  }, [registerUser, navigate, from, t]);

  const switchMode = useCallback(() => {
    setIsRegister((prev) => !prev);
    setError('');
    loginForm.clearErrors();
    registerForm.clearErrors();
  }, [loginForm, registerForm]);

  const loginEmail = loginForm.watch('email');
  const loginPassword = loginForm.watch('password');
  const registerName = registerForm.watch('name');
  const registerEmail = registerForm.watch('email');
  const registerPassword = registerForm.watch('password');
  const registerConfirm = registerForm.watch('confirmPassword');

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="ios-font-smooth min-h-screen flex flex-col lg:flex-row">
      {/* Left Brand Panel - Desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-secondary via-[#e85d00] to-accent overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-white/[0.03]" />
          <div className="absolute bottom-1/3 right-1/3 w-60 h-60 rounded-full bg-white/[0.02]" />
        </div>
        <div className="relative z-10 text-center px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="w-24 h-24 mx-auto mb-8 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-xl shadow-black/10">
              <ShoppingBag className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white font-cairo mb-4 leading-tight">
              {SITE_NAME}
            </h1>
            <p className="text-xl text-white/80 font-cairo mb-8 leading-relaxed">
              {t('auth.brandSubtitle')}
            </p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">10K+</p>
                <p className="text-sm text-white/70 font-cairo mt-1">{t('auth.productLabel')}</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="text-sm text-white/70 font-cairo mt-1">{t('auth.customerLabel')}</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">4.9</p>
                <p className="text-sm text-white/70 font-cairo mt-1">{t('auth.ratingLabel')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-white min-h-screen relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-secondary/[0.02] to-transparent[0.03]" />
        </div>

        <div className="relative z-10 w-full max-w-md px-4 sm:px-6 ios-safe-area-inset">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:hidden text-center mb-4"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/20">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-cairo">
              {SITE_NAME}
            </h1>
          </motion.div>

          {/* Form Card */}
          <div className="sm:bg-white/80 sm: sm:backdrop-blur-xl sm:border sm:border-gray-100 sm: sm:rounded-3xl sm:shadow-soft-lg sm:p-6 lg:p-8 lg:border-0 lg:bg-transparent lg: lg:shadow-none lg:backdrop-blur-none lg:p-0">
            <motion.div
              key={isRegister ? 'register' : 'login'}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 sm:space-y-6"
            >
              {/* Header */}
              <motion.div variants={itemVariants}>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cairo">
                  {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
                </h2>
                <p className="text-sm text-gray-500 font-cairo mt-1">
                  {isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
                </p>
              </motion.div>

              {/* Error */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="bg-danger/8 border border-danger/15 rounded-2xl px-4 py-3 flex items-center gap-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                    <span className="text-sm text-danger font-cairo">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              {!isRegister && (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FloatingInput
                    label={t('auth.emailLabel')}
                    type="email"
                    icon={<Mail className="w-4.5 h-4.5" />}
                    error={loginForm.formState.errors.email?.message}
                    register={loginForm.register('email')}
                    name="email"
                    value={loginEmail}
                  />
                  <FloatingInput
                    label={t('auth.passwordLabel')}
                    type={showPassword ? 'text' : 'password'}
                    icon={<Lock className="w-4.5 h-4.5" />}
                    error={loginForm.formState.errors.password?.message}
                    register={loginForm.register('password')}
                    name="password"
                    showToggle
                    onToggle={() => setShowPassword((prev) => !prev)}
                    value={loginPassword}
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {}}
                      className="text-xs font-cairo text-secondary hover:text-secondary/80 transition-colors"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'relative w-full h-12 rounded-2xl font-bold font-cairo text-[15px] sm:text-base transition-all duration-200 overflow-hidden text-nowrap',
                      'bg-gradient-to-l from-secondary via-secondary to-accent/80 text-white',
                      'shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40 active:shadow-sm',
                      'hover:-translate-y-0.5 active:translate-y-0',
                      loading && 'opacity-90 cursor-not-allowed hover:translate-y-0 hover:shadow-lg'
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                            className="w-5 h-5 border-[2.5px] border-white/25 border-t-white rounded-full"
                          />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {t('auth.loginButton')}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </form>
              )}

              {/* Register Form */}
              {isRegister && (
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FloatingInput
                    label={t('auth.nameLabel')}
                    type="text"
                    icon={<User className="w-4.5 h-4.5" />}
                    error={registerForm.formState.errors.name?.message}
                    register={registerForm.register('name')}
                    name="name"
                    value={registerName}
                  />
                  <FloatingInput
                    label={t('auth.emailLabel')}
                    type="email"
                    icon={<Mail className="w-4.5 h-4.5" />}
                    error={registerForm.formState.errors.email?.message}
                    register={registerForm.register('email')}
                    name="email"
                    value={registerEmail}
                  />
                  <FloatingInput
                    label={t('auth.passwordLabel')}
                    type={showPassword ? 'text' : 'password'}
                    icon={<Lock className="w-4.5 h-4.5" />}
                    error={registerForm.formState.errors.password?.message}
                    register={registerForm.register('password')}
                    name="password"
                    showToggle
                    onToggle={() => setShowPassword((prev) => !prev)}
                    value={registerPassword}
                  />
                  <FloatingInput
                    label={t('auth.confirmPasswordLabel')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    icon={<Lock className="w-4.5 h-4.5" />}
                    error={registerForm.formState.errors.confirmPassword?.message}
                    register={registerForm.register('confirmPassword')}
                    name="confirmPassword"
                    showToggle
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                    value={registerConfirm}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'relative w-full h-12 rounded-2xl font-bold font-cairo text-[15px] sm:text-base transition-all duration-200 overflow-hidden text-nowrap',
                      'bg-gradient-to-l from-secondary via-secondary to-accent/80 text-white',
                      'shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40 active:shadow-sm',
                      'hover:-translate-y-0.5 active:translate-y-0',
                      loading && 'opacity-90 cursor-not-allowed hover:translate-y-0 hover:shadow-lg'
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                            className="w-5 h-5 border-[2.5px] border-white/25 border-t-white rounded-full"
                          />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {t('auth.registerButton')}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </form>
              )}

              {/* Divider */}
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-cairo shrink-0">{t('common.or')}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </motion.div>

              {/* Social Login */}
              <motion.div variants={itemVariants} className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 h-12 sm:h-11 rounded-2xl font-medium font-cairo text-sm transition-all duration-200 active:scale-[0.97] text-nowrap bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </button>
                <button
                  type="button"
                  className="flex-1 h-12 sm:h-11 rounded-2xl font-medium font-cairo text-sm transition-all duration-200 active:scale-[0.97] text-nowrap bg-white text-gray-700 border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </motion.div>

              {/* Toggle mode */}
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-sm text-gray-500 font-cairo">
                  {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-secondary font-bold hover:text-secondary/80 transition-colors"
                  >
                    {isRegister ? t('auth.loginTitle') : t('auth.registerTitle')}
                  </button>
                </p>
              </motion.div>

            </motion.div>
          </div>

          {/* Back to store */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 sm:mt-8"
          >
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-cairo transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('nav.backToStore')}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
