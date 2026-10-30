import { GreenMartUser, CashierProfile, CashierDutyLog, CashierShiftType } from '../types';

const AUTH_USER_KEY = 'greenmart_auth_user_v1';
const CASHIERS_ROSTER_KEY = 'greenmart_cashiers_roster_v1';
const ACTIVE_CASHIER_KEY = 'greenmart_active_cashier_v1';
const DUTY_HISTORY_KEY = 'greenmart_cashier_duty_history_v1';

// Preset default cashiers for school koperasi/mart
export const DEFAULT_CASHIERS: CashierProfile[] = [
  {
    id: 'csh-01',
    name: 'Dewi Sartika',
    nis: '20241001',
    studentClass: 'XII BDP 1',
    shift: 'Pagi',
    phone: '0812-3456-7890',
    isActiveDuty: true,
    addedAt: '2026-01-01'
  },
  {
    id: 'csh-02',
    name: 'Budi Santoso',
    nis: '20241002',
    studentClass: 'XI AKL 2',
    shift: 'Siang',
    phone: '0813-9876-5432',
    isActiveDuty: false,
    addedAt: '2026-01-01'
  },
  {
    id: 'csh-03',
    name: 'Siti Rahmawati',
    nis: '20241003',
    studentClass: 'XII BDP 2',
    shift: 'Sore',
    phone: '0821-4567-8901',
    isActiveDuty: false,
    addedAt: '2026-01-01'
  },
  {
    id: 'csh-04',
    name: 'Ahmad Fauzi',
    nis: '20241004',
    studentClass: 'XI OTKP 1',
    shift: 'Full Day',
    phone: '0857-1122-3344',
    isActiveDuty: false,
    addedAt: '2026-01-01'
  }
];

// Load current authenticated user session
export function loadAuthUser(): GreenMartUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string' && typeof parsed.nis === 'string') {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse auth user:', e);
  }
  return null;
}

// Save authenticated user
export function saveAuthUser(user: GreenMartUser): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('Failed to save auth user:', e);
  }
}

// Clear user session (logout)
export function clearAuthUser(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (e) {
    console.warn('Failed to clear auth user:', e);
  }
}

// Load cashiers roster
export function loadCashiersRoster(): CashierProfile[] {
  try {
    const raw = localStorage.getItem(CASHIERS_ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load cashiers roster:', e);
  }
  return DEFAULT_CASHIERS;
}

// Save cashiers roster
export function saveCashiersRoster(cashiers: CashierProfile[]): void {
  try {
    localStorage.setItem(CASHIERS_ROSTER_KEY, JSON.stringify(cashiers));
  } catch (e) {
    console.warn('Failed to save cashiers roster:', e);
  }
}

// Load current active on-duty cashier
export function loadActiveCashier(): CashierProfile {
  try {
    const raw = localStorage.getItem(ACTIVE_CASHIER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name && parsed.nis) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load active cashier:', e);
  }
  const roster = loadCashiersRoster();
  return roster.find(c => c.isActiveDuty) || roster[0] || DEFAULT_CASHIERS[0];
}

// Set active on-duty cashier and record duty log
export function setActiveCashier(cashier: CashierProfile): void {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5); // HH:mm

    const updatedCashier: CashierProfile = {
      ...cashier,
      isActiveDuty: true,
      assignedDate: todayStr
    };

    localStorage.setItem(ACTIVE_CASHIER_KEY, JSON.stringify(updatedCashier));

    // Also update roster so only this cashier is marked active
    const currentRoster = loadCashiersRoster();
    const updatedRoster = currentRoster.map(c => ({
      ...c,
      isActiveDuty: c.id === cashier.id || (c.nis === cashier.nis && c.name.toLowerCase() === cashier.name.toLowerCase())
    }));
    saveCashiersRoster(updatedRoster);

    // Append to duty history
    recordDutyLog({
      id: `duty-${Date.now()}`,
      date: todayStr,
      cashierName: cashier.name,
      cashierNis: cashier.nis,
      studentClass: cashier.studentClass,
      shift: cashier.shift,
      startedAt: nowTimeStr
    });
  } catch (e) {
    console.warn('Failed to set active cashier:', e);
  }
}

// Load duty history log
export function loadDutyHistory(): CashierDutyLog[] {
  try {
    const raw = localStorage.getItem(DUTY_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load duty history:', e);
  }
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'duty-initial',
      date: today,
      cashierName: DEFAULT_CASHIERS[0].name,
      cashierNis: DEFAULT_CASHIERS[0].nis,
      studentClass: DEFAULT_CASHIERS[0].studentClass,
      shift: DEFAULT_CASHIERS[0].shift,
      startedAt: '07:30'
    }
  ];
}

// Record a duty log
export function recordDutyLog(log: CashierDutyLog): void {
  try {
    const history = loadDutyHistory();
    // Keep max 50 entries
    const newHistory = [log, ...history.filter(h => h.id !== log.id)].slice(0, 50);
    localStorage.setItem(DUTY_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.warn('Failed to record duty log:', e);
  }
}

// Helper to ensure a user exists in the cashier roster
export function ensureUserInRoster(user: GreenMartUser, defaultShift: CashierShiftType = 'Pagi'): CashierProfile {
  const roster = loadCashiersRoster();
  const existing = roster.find(
    c => c.nis === user.nis || c.name.toLowerCase().trim() === user.name.toLowerCase().trim()
  );

  if (existing) {
    // If studentClass was provided and wasn't set, update it
    if (user.studentClass && (!existing.studentClass || existing.studentClass !== user.studentClass)) {
      const updatedProfile = { ...existing, studentClass: user.studentClass };
      const updatedRoster = roster.map(c => c.id === existing.id ? updatedProfile : c);
      saveCashiersRoster(updatedRoster);
      return updatedProfile;
    }
    return existing;
  }

  // Create new cashier profile from logged-in user
  const newProfile: CashierProfile = {
    id: `csh-${Date.now()}`,
    name: user.name.trim(),
    nis: user.nis.trim(),
    studentClass: user.studentClass ? user.studentClass.trim() : undefined,
    shift: defaultShift,
    isActiveDuty: true,
    addedAt: new Date().toISOString().split('T')[0]
  };

  const updatedRoster = [newProfile, ...roster];
  saveCashiersRoster(updatedRoster);
  return newProfile;
}
