import { MappingRule, ClubMember, BankTransaction } from './types';

const STORAGE_KEYS = {
  RULES: 'membership_tracker_custom_rules_v1',
  MEMBERS_CACHE: 'membership_tracker_cached_members_v1',
  TRANSACTIONS_CACHE: 'membership_tracker_cached_txs_v1',
  MEMBERS_FILENAME: 'membership_tracker_members_filename_v1',
  TRANSACTIONS_FILENAME: 'membership_tracker_txs_filename_v1',
  MANUAL_OVERRIDES: 'membership_tracker_overrides_v1',
};

export function loadSavedRules(): MappingRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RULES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load saved rules from localStorage', e);
    return [];
  }
}

export function saveRules(rules: MappingRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save rules to localStorage', e);
  }
}

export function addMappingRule(rule: Omit<MappingRule, 'id' | 'createdAt'>): MappingRule {
  const rules = loadSavedRules();
  const newRule: MappingRule = {
    ...rule,
    id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // Remove any conflicting old rule with same pattern
  const filtered = rules.filter(
    (r) => r.sourcePattern.trim().toLowerCase() !== rule.sourcePattern.trim().toLowerCase()
  );

  filtered.unshift(newRule);
  saveRules(filtered);
  return newRule;
}

export function deleteMappingRule(ruleId: string): void {
  const rules = loadSavedRules();
  const updated = rules.filter((r) => r.id !== ruleId);
  saveRules(updated);
}

export function loadCachedData(): {
  members: ClubMember[] | null;
  transactions: BankTransaction[] | null;
  membersFileName: string | null;
  transactionsFileName: string | null;
  overrides: Record<string, string>;
} {
  if (typeof window === 'undefined') {
    return {
      members: null,
      transactions: null,
      membersFileName: null,
      transactionsFileName: null,
      overrides: {},
    };
  }
  try {
    const memRaw = localStorage.getItem(STORAGE_KEYS.MEMBERS_CACHE);
    const txRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_CACHE);
    const memFile = localStorage.getItem(STORAGE_KEYS.MEMBERS_FILENAME);
    const txFile = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_FILENAME);
    const ovRaw = localStorage.getItem(STORAGE_KEYS.MANUAL_OVERRIDES);

    return {
      members: memRaw ? JSON.parse(memRaw) : null,
      transactions: txRaw ? JSON.parse(txRaw) : null,
      membersFileName: memFile || null,
      transactionsFileName: txFile || null,
      overrides: ovRaw ? JSON.parse(ovRaw) : {},
    };
  } catch (e) {
    console.error('Failed to load cached session from localStorage', e);
    return {
      members: null,
      transactions: null,
      membersFileName: null,
      transactionsFileName: null,
      overrides: {},
    };
  }
}

export function saveCachedData(
  members: ClubMember[] | null,
  transactions: BankTransaction[] | null,
  membersFileName?: string | null,
  transactionsFileName?: string | null,
  overrides?: Record<string, string>
): void {
  if (typeof window === 'undefined') return;
  try {
    if (members && members.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS_CACHE, JSON.stringify(members));
      if (membersFileName) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS_FILENAME, membersFileName);
      }
    }
    if (transactions && transactions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_CACHE, JSON.stringify(transactions));
      if (transactionsFileName) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_FILENAME, transactionsFileName);
      }
    }
    if (overrides) {
      localStorage.setItem(STORAGE_KEYS.MANUAL_OVERRIDES, JSON.stringify(overrides));
    }
  } catch (e) {
    console.error('Failed to save cache to localStorage', e);
  }
}

export function clearMembersCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS_FILENAME);
  } catch (e) {
    console.error('Failed to clear members cache', e);
  }
}

export function clearTransactionsCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS_FILENAME);
  } catch (e) {
    console.error('Failed to clear transactions cache', e);
  }
}

export function clearCachedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS_FILENAME);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS_FILENAME);
    localStorage.removeItem(STORAGE_KEYS.MANUAL_OVERRIDES);
  } catch (e) {
    console.error('Failed to clear cached session', e);
  }
}
