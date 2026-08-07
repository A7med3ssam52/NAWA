import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { SpinPrize, SpinHistoryEntry, DailySpinState } from '@/types';
import { adminService } from '@/services';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts';

function genId() {
  return `spin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickPrize(prizes: SpinPrize[]): SpinPrize {
  const active = prizes.filter((p) => p.isActive);
  const totalWeight = active.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const prize of active) {
    rand -= prize.weight;
    if (rand <= 0) return prize;
  }
  return active[active.length - 1];
}

interface SpinState {
  prizes: SpinPrize[];
  lastSpinDate: string | null;
  spinsRemainingToday: number;
  isSpinning: boolean;
  currentPrize: SpinPrize | null;
  showResult: boolean;
  history: SpinHistoryEntry[];
  loaded: boolean;
}

type SpinAction =
  | { type: 'INIT'; payload: { prizes: SpinPrize[]; dailyState: DailySpinState; history: SpinHistoryEntry[] } }
  | { type: 'SPIN_START' }
  | { type: 'SPIN_COMPLETE'; payload: { prize: SpinPrize; couponCode?: string } }
  | { type: 'CLAIM_PRIZE'; payload: string }
  | { type: 'DISMISS_RESULT' }
  | { type: 'RESET_DAILY' }
  | { type: 'UPDATE_PRIZES'; payload: SpinPrize[] };

function spinReducer(state: SpinState, action: SpinAction): SpinState {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload, loaded: true };
    case 'SPIN_START':
      return { ...state, isSpinning: true, showResult: false };
    case 'SPIN_COMPLETE': {
      const entry: SpinHistoryEntry = {
        id: genId(),
        prizeId: action.payload.prize.id,
        prizeLabel: action.payload.prize.label,
        type: action.payload.prize.type,
        value: action.payload.prize.value,
        couponCode: action.payload.couponCode,
        claimed: false,
        spunAt: new Date().toISOString(),
      };
      return {
        ...state,
        isSpinning: false,
        currentPrize: action.payload.prize,
        showResult: true,
        spinsRemainingToday: state.spinsRemainingToday - 1,
        lastSpinDate: getTodayKey(),
        history: [entry, ...state.history],
      };
    }
    case 'CLAIM_PRIZE':
      return {
        ...state,
        history: state.history.map((h) =>
          h.id === action.payload ? { ...h, claimed: true } : h
        ),
      };
    case 'DISMISS_RESULT':
      return { ...state, showResult: false, currentPrize: null };
    case 'RESET_DAILY':
      return { ...state, lastSpinDate: null, spinsRemainingToday: 1 };
    case 'UPDATE_PRIZES':
      return { ...state, prizes: action.payload };
    default:
      return state;
  }
}

const STORAGE_KEY = 'spinState';

function loadInitialState(): SpinState {
  const today = getTodayKey();
  let dailyState: DailySpinState = { lastSpinDate: null, spinsRemainingToday: 1 };
  let history: SpinHistoryEntry[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      history = parsed.history || [];
      const savedDate = parsed.lastSpinDate;
      dailyState = {
        lastSpinDate: savedDate,
        spinsRemainingToday: savedDate === today ? (parsed.spinsRemainingToday ?? 0) : 1,
      };
    }
  } catch {}
  return {
    prizes: [],
    lastSpinDate: dailyState.lastSpinDate,
    spinsRemainingToday: dailyState.spinsRemainingToday,
    isSpinning: false,
    currentPrize: null,
    showResult: false,
    history,
    loaded: false,
  };
}

interface SpinContextType {
  prizes: SpinPrize[];
  isSpinning: boolean;
  currentPrize: SpinPrize | null;
  showResult: boolean;
  spinsRemainingToday: number;
  history: SpinHistoryEntry[];
  loaded: boolean;
  startSpin: () => void;
  completeSpin: () => void;
  claimPrize: () => void;
  dismissResult: () => void;
  refreshPrizes: () => void;
}

const SpinContext = createContext<SpinContextType | null>(null);

const PHONE_STORAGE_KEY = 'spin_guest_phone';

export function SpinProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(spinReducer, undefined, loadInitialState);

  useEffect(() => {
    adminService.getSpinPrizes().then((prizes) => {
      dispatch({ type: 'UPDATE_PRIZES', payload: prizes });
    });
  }, []);

  useEffect(() => {
    if (state.loaded) {
      const toStore = {
        lastSpinDate: state.lastSpinDate,
        spinsRemainingToday: state.spinsRemainingToday,
        history: state.history,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }
  }, [state.lastSpinDate, state.spinsRemainingToday, state.history, state.loaded]);

  useEffect(() => {
    const checkReset = () => {
      const today = getTodayKey();
      if (state.lastSpinDate !== today && state.spinsRemainingToday < 1) {
        dispatch({ type: 'RESET_DAILY' });
      }
    };
    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [state.lastSpinDate, state.spinsRemainingToday]);

  const startSpin = useCallback(() => {
    if (state.spinsRemainingToday <= 0 || state.isSpinning) return;
    dispatch({ type: 'SPIN_START' });
  }, [state.spinsRemainingToday, state.isSpinning]);

  const completeSpin = useCallback(() => {
    const prize = pickPrize(state.prizes);
    let couponCode: string | undefined;
    if (prize.type !== 'tryAgain') {
      couponCode = `SPIN-${genId().slice(-6).toUpperCase()}`;
    }
    dispatch({ type: 'SPIN_COMPLETE', payload: { prize, couponCode } });
    const guestPhone = localStorage.getItem(PHONE_STORAGE_KEY) || '';
    if (user?.id) {
      supabase.from('spin_history').insert({
        user_id: user.id,
        prize_id: prize.id,
        prize_label: prize.label,
        type: prize.type,
        value: prize.value ?? null,
        coupon_code: couponCode ?? null,
        claimed: false,
      }).then(() => {});
    } else if (guestPhone) {
      supabase.from('spin_history').insert({
        guest_phone: guestPhone,
        prize_id: prize.id,
        prize_label: prize.label,
        type: prize.type,
        value: prize.value ?? null,
        coupon_code: couponCode ?? null,
        claimed: false,
      }).then(() => {});
    }
  }, [state.prizes, user?.id]);

  const claimPrize = useCallback(() => {
    if (state.currentPrize?.type === 'tryAgain') {
      dispatch({ type: 'DISMISS_RESULT' });
      return;
    }
    const latest = state.history.find((h) => !h.claimed);
    if (latest) {
      dispatch({ type: 'CLAIM_PRIZE', payload: latest.id });
      if (user?.id && latest.couponCode) {
        supabase.from('spin_history').update({ claimed: true })
          .eq('user_id', user.id)
          .eq('coupon_code', latest.couponCode)
          .then(() => {});
      }
    }
    dispatch({ type: 'DISMISS_RESULT' });
  }, [state.currentPrize, state.history, user?.id]);

  const dismissResult = useCallback(() => {
    dispatch({ type: 'DISMISS_RESULT' });
  }, []);

  const refreshPrizes = useCallback(() => {
    adminService.getSpinPrizes().then((prizes) => {
      dispatch({ type: 'UPDATE_PRIZES', payload: prizes });
    });
  }, []);

  const value = useMemo(() => ({
    prizes: state.prizes,
    isSpinning: state.isSpinning,
    currentPrize: state.currentPrize,
    showResult: state.showResult,
    spinsRemainingToday: state.spinsRemainingToday,
    history: state.history,
    loaded: state.loaded,
    startSpin,
    completeSpin,
    claimPrize,
    dismissResult,
    refreshPrizes,
  }), [state, startSpin, completeSpin, claimPrize, dismissResult, refreshPrizes]);

  return (
    <SpinContext.Provider value={value}>
      {children}
    </SpinContext.Provider>
  );
}

export function useSpin() {
  const ctx = useContext(SpinContext);
  if (!ctx) throw new Error('useSpin must be used within SpinProvider');
  return ctx;
}
