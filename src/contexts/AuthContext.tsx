import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Address } from '@/types';
import { users, getUserAddresses, loadAllData, setUsersData, addresses as allAddresses, setAddressesData } from '@/data';
import i18n from '@/i18n';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addAddress: (address: Address) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addresses: Address[];
}

const AuthContext = createContext<AuthContextType | null>(null);

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
    user: null, isAuthenticated: false, defaultAddressId: null, loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadAllData();
        const profile = await loadProfile(session.user.id, session.user.email || '');
        if (profile) dispatch({ type: 'SET_USER', payload: profile });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadAllData();
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const profile = await loadProfile(session.user.id, session.user.email || '');
          if (profile) dispatch({ type: 'SET_USER', payload: profile });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('auth', JSON.stringify({ user: state.user, isAuthenticated: state.isAuthenticated, defaultAddressId: state.defaultAddressId }));
    }, 300);
    return () => clearTimeout(timer);
  }, [state.user, state.isAuthenticated, state.defaultAddressId]);

  const loadProfile = useCallback(async (authId: string, email: string): Promise<User | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', authId).single();
    if (data) return mapProfile(data);
    const existing = users.find((u) => u.email === email);
    if (existing) return existing;
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        phone: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`,
        role: 'customer',
        addresses: [],
        orders: [],
        wishlist: [],
        notifications: [],
      };
      await supabase.from('profiles').insert({
        id: data.user.id, name, email,
        avatar: newUser.avatar, role: 'customer',
      });
      setUsersData([...users, newUser]);
      dispatch({ type: 'SET_USER', payload: newUser });
    }
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;
      await supabase.from('profiles').update(updateData).eq('id', session.user.id);
    }
    dispatch({ type: 'UPDATE_PROFILE', payload: data });
  }, []);

  const addAddress = useCallback(async (address: Address) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
      if (profile) {
        await supabase.from('addresses').insert({
          id: address.id, user_id: profile.id, label: address.label,
          full_name: address.fullName, phone: address.phone,
          street: address.street, city: address.city, state: address.state,
          is_default: address.isDefault,
        });
        const updatedAddrs = [...(state.user?.addresses || []), address.id];
        await supabase.from('profiles').update({ addresses: updatedAddrs }).eq('id', session.user.id);
        setAddressesData([...allAddresses, address as never]);
      }
    }
    dispatch({ type: 'ADD_ADDRESS', payload: address });
  }, [state.user]);

  const removeAddress = useCallback(async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && state.user) {
      const updatedAddrs = state.user.addresses.filter((a) => a !== id);
      await supabase.from('profiles').update({ addresses: updatedAddrs }).eq('id', session.user.id);
      setAddressesData(allAddresses.filter((a) => a.id !== id));
    }
    dispatch({ type: 'REMOVE_ADDRESS', payload: id });
  }, [state.user]);

  const setDefaultAddress = useCallback(async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
      if (profile) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', profile.id);
        await supabase.from('addresses').update({ is_default: true }).eq('id', id);
        setAddressesData(allAddresses.map((a) =>
          a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }
        ));
      }
    }
    dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: id });
  }, []);

  const addresses = useMemo(() =>
    state.user ? getUserAddresses(state.user.id) : [],
    [state.user]
  );

  const value = useMemo(() => ({
    ...state,
    defaultAddressId: state.defaultAddressId,
    login, register, logout, updateProfile,
    addAddress, removeAddress, setDefaultAddress, addresses,
  }), [state, login, register, logout, updateProfile, addAddress, removeAddress, setDefaultAddress, addresses]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function mapProfile(data: any): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    avatar: data.avatar || '',
    role: data.role || 'customer',
    addresses: data.addresses || [],
    orders: data.orders || [],
    wishlist: data.wishlist || [],
    notifications: data.notifications || [],
  };
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
