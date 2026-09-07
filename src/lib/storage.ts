import { MappingRule, ClubMember, BankTransaction } from './types';

const STORAGE_KEYS = {
  RULES: 'membership_tracker_custom_rules_v1',
  MEMBERS_CACHE: 'membership_tracker_cached_members_v2',
  MEMBERS_FILENAME: 'membership_tracker_members_filename_v2',
  TBC_TXS_CACHE: 'membership_tracker_cached_tbc_v2',
  TBC_FILENAME: 'membership_tracker_tbc_filename_v2',
  BOG_TXS_CACHE: 'membership_tracker_cached_bog_v2',
  BOG_FILENAME: 'membership_tracker_bog_filename_v2',
  MANUAL_OVERRIDES: 'membership_tracker_overrides_v2',
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

export function loadMultiBankCachedData(): {
  members: ClubMember[] | null;
  membersFileName: string | null;
  tbcTransactions: BankTransaction[] | null;
  tbcFileName: string | null;
  bogTransactions: BankTransaction[] | null;
  bogFileName: string | null;
  overrides: Record<string, string>;
} {
  if (typeof window === 'undefined') {
    return {
      members: null,
      membersFileName: null,
      tbcTransactions: null,
      tbcFileName: null,
      bogTransactions: null,
      bogFileName: null,
      overrides: {},
    };
  }
  try {
    const memRaw = localStorage.getItem(STORAGE_KEYS.MEMBERS_CACHE);
    const memFile = localStorage.getItem(STORAGE_KEYS.MEMBERS_FILENAME);
    const tbcRaw = localStorage.getItem(STORAGE_KEYS.TBC_TXS_CACHE);
    const tbcFile = localStorage.getItem(STORAGE_KEYS.TBC_FILENAME);
    const bogRaw = localStorage.getItem(STORAGE_KEYS.BOG_TXS_CACHE);
    const bogFile = localStorage.getItem(STORAGE_KEYS.BOG_FILENAME);
    const ovRaw = localStorage.getItem(STORAGE_KEYS.MANUAL_OVERRIDES);

    return {
      members: memRaw ? JSON.parse(memRaw) : null,
      membersFileName: memFile || null,
      tbcTransactions: tbcRaw ? JSON.parse(tbcRaw) : null,
      tbcFileName: tbcFile || null,
      bogTransactions: bogRaw ? JSON.parse(bogRaw) : null,
      bogFileName: bogFile || null,
      overrides: ovRaw ? JSON.parse(ovRaw) : {},
    };
  } catch (e) {
    console.error('Failed to load multi-bank cached data from localStorage', e);
    return {
      members: null,
      membersFileName: null,
      tbcTransactions: null,
      tbcFileName: null,
      bogTransactions: null,
      bogFileName: null,
      overrides: {},
    };
  }
}

export function saveMultiBankCachedData({
  members,
  membersFileName,
  tbcTransactions,
  tbcFileName,
  bogTransactions,
  bogFileName,
  overrides,
}: {
  members?: ClubMember[] | null;
  membersFileName?: string | null;
  tbcTransactions?: BankTransaction[] | null;
  tbcFileName?: string | null;
  bogTransactions?: BankTransaction[] | null;
  bogFileName?: string | null;
  overrides?: Record<string, string>;
}): void {
  if (typeof window === 'undefined') return;
  try {
    if (members !== undefined) {
      if (members && members.length > 0) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS_CACHE, JSON.stringify(members));
      } else {
        localStorage.removeItem(STORAGE_KEYS.MEMBERS_CACHE);
      }
    }
    if (membersFileName !== undefined) {
      if (membersFileName) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS_FILENAME, membersFileName);
      } else {
        localStorage.removeItem(STORAGE_KEYS.MEMBERS_FILENAME);
      }
    }

    if (tbcTransactions !== undefined) {
      if (tbcTransactions && tbcTransactions.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TBC_TXS_CACHE, JSON.stringify(tbcTransactions));
      } else {
        localStorage.removeItem(STORAGE_KEYS.TBC_TXS_CACHE);
      }
    }
    if (tbcFileName !== undefined) {
      if (tbcFileName) {
        localStorage.setItem(STORAGE_KEYS.TBC_FILENAME, tbcFileName);
      } else {
        localStorage.removeItem(STORAGE_KEYS.TBC_FILENAME);
      }
    }

    if (bogTransactions !== undefined) {
      if (bogTransactions && bogTransactions.length > 0) {
        localStorage.setItem(STORAGE_KEYS.BOG_TXS_CACHE, JSON.stringify(bogTransactions));
      } else {
        localStorage.removeItem(STORAGE_KEYS.BOG_TXS_CACHE);
      }
    }
    if (bogFileName !== undefined) {
      if (bogFileName) {
        localStorage.setItem(STORAGE_KEYS.BOG_FILENAME, bogFileName);
      } else {
        localStorage.removeItem(STORAGE_KEYS.BOG_FILENAME);
      }
    }

    if (overrides !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MANUAL_OVERRIDES, JSON.stringify(overrides));
    }
  } catch (e) {
    console.error('Failed to save multi-bank cache to localStorage', e);
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

export function clearTbcCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.TBC_TXS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.TBC_FILENAME);
  } catch (e) {
    console.error('Failed to clear TBC cache', e);
  }
}

export function clearBogCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.BOG_TXS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.BOG_FILENAME);
  } catch (e) {
    console.error('Failed to clear BOG cache', e);
  }
}

export function clearCachedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS_FILENAME);
    localStorage.removeItem(STORAGE_KEYS.TBC_TXS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.TBC_FILENAME);
    localStorage.removeItem(STORAGE_KEYS.BOG_TXS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.BOG_FILENAME);
    localStorage.removeItem(STORAGE_KEYS.MANUAL_OVERRIDES);
  } catch (e) {
    console.error('Failed to clear cached session', e);
  }
}
