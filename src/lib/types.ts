export interface ClubMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: 'Active' | 'Inactive' | string;
  fullNameLatin?: string;
  fullNameGeorgian?: string;
  raw?: Record<string, any>;
}

export type BankSource = 'TBC' | 'BOG' | 'Other';

export interface BankTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  rawDate?: string | number;
  month: string; // YYYY-MM
  amount: number;
  currency: string;
  senderName: string;
  senderTransliterated: string;
  cleanSenderName: string;
  cleanSenderTransliterated: string;
  payerName: string;
  payerTransliterated: string;
  payerId?: string;
  purpose: string;
  purposeTransliterated: string;
  docNumber?: string;
  account?: string;
  bank?: BankSource;
  raw?: Record<string, any>;
}

export type MatchMethod =
  | 'saved_rule'
  | 'exact'
  | 'transliterated'
  | 'inverted'
  | 'purpose'
  | 'fuzzy'
  | 'manual'
  | 'none';

export interface MatchResult {
  transactionId: string;
  memberId: string | null;
  memberName: string | null;
  confidence: number; // 0 to 1
  matchMethod: MatchMethod;
  matchDetails?: string;
}

export type PaymentStatus = 'paid' | 'unpaid';

export interface MemberReconciliation {
  member: ClubMember;
  paidAmount: number;
  paymentCount: number;
  status: PaymentStatus;
  transactions: BankTransaction[];
  matchDetails: {
    transaction: BankTransaction;
    method: MatchMethod;
    confidence: number;
  }[];
}

export interface UnrecognizedPayment {
  transaction: BankTransaction;
  bestGuess?: {
    member: ClubMember;
    confidence: number;
    reason: string;
  };
}

export interface MappingRule {
  id: string;
  sourcePattern: string;
  patternType: 'sender' | 'payer_id' | 'payer_name' | 'purpose';
  targetMemberId: string;
  targetMemberName: string;
  createdAt: string;
}

export interface ReconciliationSummary {
  totalActiveMembers: number;
  paidCount: number;
  unpaidCount: number;
  totalCollected: number;
  totalTransactionsCount: number;
  unrecognizedCount: number;
  unrecognizedAmount: number;
  tbcCollected?: number;
  bogCollected?: number;
}
