import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Address } from '@/types';
import { mapProfile } from '@/lib/mappers';
import { useAddresses } from '@/api';

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
        const profile = await loadProfile(session.user.id);
        if (profile) dispatch({ type: 'SET_USER', payload: profile });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          const profile = await loadProfile(session.user.id);
          if (profile) dispatch({ type: 'SET_USER', payload: profile });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (authId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', authId).maybeSingle();
      if (!error && data) return mapProfile(data);
    } catch {
      return null;
    }
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: 'admin' | 'customer' }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        try {
          const profile = await loadProfile(data.user.id);
          if (profile) {
            dispatch({ type: 'SET_USER', payload: profile });
            return { success: true, role: profile.role };
          }
        } catch {
          return { success: true };
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  }, [loadProfile]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, avatar: '' } },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        let profile: User | null = null;
        for (let i = 0; i < 8 && !profile; i++) {
          profile = await loadProfile(data.user.id);
          if (!profile && i < 7) await new Promise((r) => setTimeout(r, 250));
        }
        if (!profile) {
          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, name, email, avatar: '', role: 'customer' })
            .select()
            .single();
          if (insertError) {
            return { success: true, error: undefined };
          }
          if (inserted) profile = mapProfile(inserted);
        }
        if (profile) dispatch({ type: 'SET_USER', payload: profile });
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' };
    }
  }, [loadProfile]);

  const logout = useCallback(() => {
    supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;
      if (Object.keys(updateData).length > 0) {
        await supabase.from('profiles').update(updateData).eq('id', session.user.id);
      }
      if (data.email !== undefined) {
        await supabase.auth.updateUser({ email: data.email });
      }
      const profile = await loadProfile(session.user.id);
      if (profile) dispatch({ type: 'SET_USER', payload: profile });
      else dispatch({ type: 'UPDATE_PROFILE', payload: data });
    }
  }, [loadProfile]);

  const addAddress = useCallback(async (address: Address) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('addresses').insert({
        id: address.id, user_id: session.user.id, label: address.label,
        full_name: address.fullName, phone: address.phone,
        street: address.street, city: address.city, state: address.state,
        is_default: address.isDefault,
      });
    }
    dispatch({ type: 'ADD_ADDRESS', payload: address });
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id).eq('user_id', state.user?.id || '');
    dispatch({ type: 'REMOVE_ADDRESS', payload: id });
  }, [state.user]);

  const setDefaultAddress = useCallback(async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('addresses').update({ is_default: true }).eq('id', id).eq('user_id', session.user.id);
    }
    dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: id });
  }, []);

  const { data: dbAddresses } = useAddresses(state.user?.id);

  const addresses = useMemo(() => dbAddresses || [], [dbAddresses]);

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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};