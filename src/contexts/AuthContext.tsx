import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { User, Address } from '@/types';
import { users, getUserAddresses } from '@/data';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  defaultAddressId: string | null;
}

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_ADDRESS'; payload: Address }
  | { type: 'REMOVE_ADDRESS'; payload: string }
  | { type: 'SET_DEFAULT_ADDRESS'; payload: string };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addresses: Address[];
}

const AuthContext = createContext<AuthContextType | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false };
    case 'UPDATE_PROFILE':
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state;
    case 'ADD_ADDRESS':
      return state.user
        ? {
            ...state,
            user: {
              ...state.user,
              addresses: [...state.user.addresses, action.payload.id],
            },
          }
        : state;
    case 'REMOVE_ADDRESS':
      return state.user
        ? {
            ...state,
            user: {
              ...state.user,
              addresses: state.user.addresses.filter((id) => id !== action.payload),
            },
          }
        : state;
    case 'SET_DEFAULT_ADDRESS':
      return { ...state, defaultAddressId: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, isAuthenticated: false, defaultAddressId: null }, (initial) => {
    try {
      const saved = localStorage.getItem('auth');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initial;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('auth', JSON.stringify(state));
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const stored = localStorage.getItem('registeredUsers');
    const registered: { name: string; email: string; password: string }[] = stored ? JSON.parse(stored) : [];

    const registeredUser = registered.find((u) => u.email === email);
    if (registeredUser) {
      if (registeredUser.password !== password && simpleHash(password) !== registeredUser.password) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        dispatch({ type: 'LOGIN', payload: existingUser });
        return { success: true };
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: registeredUser.name,
        email: registeredUser.email,
        phone: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(registeredUser.name)}&background=2563EB&color=fff`,
        addresses: [],
        orders: [],
        wishlist: [],
        notifications: [],
      };
      dispatch({ type: 'LOGIN', payload: newUser });
      return { success: true };
    }

    const user = users.find((u) => u.email === email);
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      return { success: true };
    }
    return { success: false, error: 'البريد الإلكتروني غير مسجل' };
  }, [dispatch]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const stored = localStorage.getItem('registeredUsers');
    const registered: { name: string; email: string; password: string }[] = stored ? JSON.parse(stored) : [];

    if (registered.some((u) => u.email === email) || users.some((u) => u.email === email)) {
      return { success: false, error: 'البريد الإلكتروني مسجل بالفعل' };
    }

    registered.push({ name, email, password: simpleHash(password) });
    localStorage.setItem('registeredUsers', JSON.stringify(registered));

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone: '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`,
      addresses: [],
      orders: [],
      wishlist: [],
      notifications: [],
    };
    dispatch({ type: 'LOGIN', payload: newUser });
    return { success: true };
  }, [dispatch]);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  const updateProfile = useCallback((data: Partial<User>) =>
    dispatch({ type: 'UPDATE_PROFILE', payload: data }), []);

  const addAddress = useCallback((address: Address) =>
    dispatch({ type: 'ADD_ADDRESS', payload: address }), []);

  const removeAddress = useCallback((id: string) =>
    dispatch({ type: 'REMOVE_ADDRESS', payload: id }), []);

  const setDefaultAddress = useCallback((id: string) =>
    dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: id }), []);

  const addresses = useMemo(() =>
    state.user ? getUserAddresses(state.user.id) : [],
    [state.user]
  );

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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
