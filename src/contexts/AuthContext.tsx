import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { User, Address } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  defaultAddressId: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_ADDRESS'; payload: Address }
  | { type: 'REMOVE_ADDRESS'; payload: string }
  | { type: 'SET_DEFAULT_ADDRESS'; payload: string };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: 'admin' | 'customer' }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addAddress: (address: Address) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addresses: Address[];
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = 'nawa_user';

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'UPDATE_PROFILE':
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state;
    case 'ADD_ADDRESS':
      return state.user
        ? { ...state, user: { ...state.user, addresses: [...state.user.addresses, action.payload.id] } }
        : state;
    case 'REMOVE_ADDRESS':
      return state.user
        ? { ...state, user: { ...state.user, addresses: state.user.addresses.filter((id) => id !== action.payload) } }
        : state;
    case 'SET_DEFAULT_ADDRESS':
      return { ...state, defaultAddressId: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    defaultAddressId: null,
    loading: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const u = JSON.parse(stored);
        dispatch({ type: 'SET_USER', payload: u });
      }
    } catch {}
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: 'admin' | 'customer' }> => {
    const role: 'admin' | 'customer' = email.includes('admin') ? 'admin' : 'customer';
    const mockUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0] || 'مستخدم نوى',
      email,
      phone: '+201000000000',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role,
      addresses: [],
      orders: [],
      wishlist: [],
      notifications: [],
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    dispatch({ type: 'SET_USER', payload: mockUser });
    return { success: true, role };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const mockUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone: '+201000000000',
      avatar: '',
      role: 'customer',
      addresses: [],
      orders: [],
      wishlist: [],
      notifications: [],
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    dispatch({ type: 'SET_USER', payload: mockUser });
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: data });
    if (state.user) {
      const updated = { ...state.user, ...data };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }
  }, [state.user]);

  const addAddress = useCallback(async (address: Address) => {
    dispatch({ type: 'ADD_ADDRESS', payload: address });
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVE_ADDRESS', payload: id });
  }, []);

  const setDefaultAddress = useCallback(async (id: string) => {
    dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: id });
  }, []);

  const addresses: Address[] = useMemo(() => [
    {
      id: 'addr-default',
      label: 'المنزل',
      fullName: state.user?.name || 'عميل نوى',
      phone: state.user?.phone || '+201000000000',
      street: 'شارع التجاري',
      city: 'القاهرة',
      state: 'القاهرة',
      isDefault: true,
    },
  ], [state.user]);

  const value = useMemo(() => ({
    ...state,
    defaultAddressId: state.defaultAddressId,
    login,
    register,
    logout,
    updateProfile,
    addAddress,
    removeAddress,
    setDefaultAddress,
    addresses,
  }), [state, login, register, logout, updateProfile, addAddress, removeAddress, setDefaultAddress, addresses]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}