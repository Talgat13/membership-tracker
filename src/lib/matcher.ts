import {
  ClubMember,
  BankTransaction,
  MatchResult,
  MemberReconciliation,
  UnrecognizedPayment,
  MappingRule,
  ReconciliationSummary,
} from './types';
import {
  normalizeForComparison,
  tokenizeAndSort,
  cleanPurposeText,
  transliterateGeorgian,
} from './transliteration';

/**
 * Computes Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Calculates similarity ratio (0 to 1) based on Levenshtein distance.
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);
  if (!s1 && !s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Matches a single transaction against active members and saved rules.
 */
export function matchTransaction(
  transaction: BankTransaction,
  members: ClubMember[],
  rules: MappingRule[] = []
): MatchResult {
  const normSender = normalizeForComparison(transaction.cleanSenderTransliterated);
  const normRawSender = normalizeForComparison(transaction.senderTransliterated);
  const normGeorgianSender = normalizeForComparison(transaction.senderName);
  const normCleanGeorgianSender = normalizeForComparison(transaction.cleanSenderName);

  const normPayer = normalizeForComparison(transaction.payerTransliterated);
  const normPurpose = normalizeForComparison(transaction.purposeTransliterated);
  const normRawPurpose = normalizeForComparison(transaction.purpose);
  const payerId = transaction.payerId?.trim();

  // 1. Check custom saved rules
  for (const rule of rules) {
    const pattern = normalizeForComparison(rule.sourcePattern);
    const patternTranslit = normalizeForComparison(transliterateGeorgian(rule.sourcePattern));
    let matched = false;

    if (rule.patternType === 'payer_id' && payerId && rule.sourcePattern === payerId) {
      matched = true;
    } else if (
      rule.patternType === 'sender' &&
      (normSender.includes(pattern) ||
        normRawSender.includes(pattern) ||
        normSender.includes(patternTranslit) ||
        normGeorgianSender.includes(pattern))
    ) {
      matched = true;
    } else if (rule.patternType === 'payer_name' && normPayer.includes(pattern)) {
      matched = true;
    } else if (rule.patternType === 'purpose' && (normPurpose.includes(pattern) || normRawPurpose.includes(pattern))) {
      matched = true;
    } else if (
      normSender === pattern ||
      normRawSender === pattern ||
      normSender === patternTranslit ||
      normGeorgianSender === pattern ||
      normPayer === pattern ||
      normPurpose.includes(pattern)
    ) {
      matched = true;
    }

    if (matched) {
      const target = members.find((m) => m.id === rule.targetMemberId) || {
        id: rule.targetMemberId,
        fullName: rule.targetMemberName,
      };
      return {
        transactionId: transaction.id,
        memberId: target.id,
        memberName: target.fullName,
        confidence: 1.0,
        matchMethod: 'saved_rule',
        matchDetails: `Matched custom rule: "${rule.sourcePattern}" → ${rule.targetMemberName}`,
      };
    }
  }

  let bestMatch: MatchResult = {
    transactionId: transaction.id,
    memberId: null,
    memberName: null,
    confidence: 0,
    matchMethod: 'none',
  };

  for (const member of members) {
    // Normal forms for Latin and Georgian representations
    const fnNorm = normalizeForComparison(member.firstName);
    const lnNorm = normalizeForComparison(member.lastName);
    const directName = `${fnNorm} ${lnNorm}`.trim();
    const invertedName = `${lnNorm} ${fnNorm}`.trim();

    const directLatin = normalizeForComparison(member.fullNameLatin || member.fullName);
    const fnLatin = normalizeForComparison(transliterateGeorgian(member.firstName));
    const lnLatin = normalizeForComparison(transliterateGeorgian(member.lastName));
    const invertedLatin = `${lnLatin} ${fnLatin}`.trim();

    const directGeorgian = normalizeForComparison(member.fullNameGeorgian || member.fullName);
    const invertedGeorgian = `${lnNorm} ${fnNorm}`.trim();

    // 2. Exact matches (transliterated, direct or inverted)
    if (
      normSender === directName ||
      normRawSender === directName ||
      normSender === directLatin ||
      normRawSender === directLatin ||
      normGeorgianSender === directGeorgian ||
      normCleanGeorgianSender === directGeorgian
    ) {
      return {
        transactionId: transaction.id,
        memberId: member.id,
        memberName: member.fullName,
        confidence: 1.0,
        matchMethod: 'exact',
        matchDetails: `Exact match with sender: ${transaction.senderName}`,
      };
    }

    if (
      normSender === invertedName ||
      normRawSender === invertedName ||
      normSender === invertedLatin ||
      normRawSender === invertedLatin ||
      normGeorgianSender === invertedGeorgian ||
      normCleanGeorgianSender === invertedGeorgian
    ) {
      return {
        transactionId: transaction.id,
        memberId: member.id,
        memberName: member.fullName,
        confidence: 1.0,
        matchMethod: 'inverted',
        matchDetails: `Inverted name match (Last First): ${transaction.senderName}`,
      };
    }

    // Check payer name exact
    if (
      normPayer &&
      (normPayer === directName ||
        normPayer === invertedName ||
        normPayer === directLatin ||
        normPayer === invertedLatin)
    ) {
      return {
        transactionId: transaction.id,
        memberId: member.id,
        memberName: member.fullName,
        confidence: 0.98,
        matchMethod: 'transliterated',
        matchDetails: `Exact match with payer: ${transaction.payerName}`,
      };
    }

    // 3. Search in Purpose / Description
    if (
      (directName && normPurpose.includes(directName)) ||
      (invertedName && normPurpose.includes(invertedName)) ||
      (directLatin && normPurpose.includes(directLatin)) ||
      (invertedLatin && normPurpose.includes(invertedLatin)) ||
      (directGeorgian && normRawPurpose.includes(directGeorgian)) ||
      (invertedGeorgian && normRawPurpose.includes(invertedGeorgian)) ||
      (fnNorm.length >= 3 && lnNorm.length >= 3 && normPurpose.includes(fnNorm) && normPurpose.includes(lnNorm)) ||
      (fnLatin.length >= 3 && lnLatin.length >= 3 && normPurpose.includes(fnLatin) && normPurpose.includes(lnLatin))
    ) {
      return {
        transactionId: transaction.id,
        memberId: member.id,
        memberName: member.fullName,
        confidence: 0.95,
        matchMethod: 'purpose',
        matchDetails: `Found name inside transaction purpose: "${transaction.purpose}"`,
      };
    }

    // 4. Token-set check in sender name
    const senderTokens = tokenizeAndSort(normSender);
    const hasFirstName = (fnNorm.length >= 3 && senderTokens.includes(fnNorm)) || (fnLatin.length >= 3 && senderTokens.includes(fnLatin));
    const hasLastName = (lnNorm.length >= 3 && senderTokens.includes(lnNorm)) || (lnLatin.length >= 3 && senderTokens.includes(lnLatin));

    if (hasFirstName && hasLastName) {
      return {
        transactionId: transaction.id,
        memberId: member.id,
        memberName: member.fullName,
        confidence: 0.95,
        matchMethod: 'exact',
        matchDetails: `Matched tokens in sender: ${transaction.senderName}`,
      };
    }

    // 5. Fuzzy string similarity check on sender & payer
    const simDirect = Math.max(stringSimilarity(normSender, directName), stringSimilarity(normSender, directLatin));
    const simInverted = Math.max(stringSimilarity(normSender, invertedName), stringSimilarity(normSender, invertedLatin));
    const simPayerDirect = normPayer ? Math.max(stringSimilarity(normPayer, directName), stringSimilarity(normPayer, directLatin)) : 0;
    const simPayerInverted = normPayer ? Math.max(stringSimilarity(normPayer, invertedName), stringSimilarity(normPayer, invertedLatin)) : 0;

    const maxSim = Math.max(simDirect, simInverted, simPayerDirect, simPayerInverted);

    if (maxSim > bestMatch.confidence) {
      bestMatch = {
        transactionId: transaction.id,
        memberId: maxSim >= 0.8 ? member.id : null,
        memberName: maxSim >= 0.8 ? member.fullName : null,
        confidence: maxSim,
        matchMethod: maxSim >= 0.8 ? 'fuzzy' : 'none',
        matchDetails: `Fuzzy similarity (${Math.round(maxSim * 100)}%) with ${member.fullName}`,
      };
    }
  }

  return bestMatch;
}

/**
 * Reconciles members and transactions across all uploaded banks (TBC & BOG) for a specified month/period.
 */
export function reconcileStatements({
  members,
  transactions,
  selectedMonth = 'all',
  rules = [],
  manualOverrides = {},
}: {
  members: ClubMember[];
  transactions: BankTransaction[];
  selectedMonth?: string;
  rules?: MappingRule[];
  manualOverrides?: Record<string, string>; // transactionId -> memberId
}): {
  reconciledMembers: MemberReconciliation[];
  unrecognizedPayments: UnrecognizedPayment[];
  summary: ReconciliationSummary;
} {
  const activeMembers = members.filter((m) => {
    const s = (m.status || '').toLowerCase().trim();
    return !s.includes('inactive') && !s.includes('არაქტიური') && !s.includes('გაუქმებული');
  });
  const targetMembers = activeMembers.length > 0 ? activeMembers : members;

  const periodTransactions =
    selectedMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.month === selectedMonth);

  const memberTxMap = new Map<
    string,
    {
      transactions: BankTransaction[];
      details: { transaction: BankTransaction; method: any; confidence: number }[];
    }
  >();

  targetMembers.forEach((m) => {
    memberTxMap.set(m.id, { transactions: [], details: [] });
  });

  const unrecognizedPayments: UnrecognizedPayment[] = [];

  for (const tx of periodTransactions) {
    if (manualOverrides[tx.id]) {
      const overrideMemberId = manualOverrides[tx.id];
      const member = targetMembers.find((m) => m.id === overrideMemberId);
      if (member && memberTxMap.has(member.id)) {
        memberTxMap.get(member.id)!.transactions.push(tx);
        memberTxMap.get(member.id)!.details.push({
          transaction: tx,
          method: 'manual',
          confidence: 1.0,
        });
        continue;
      }
    }

    const match = matchTransaction(tx, targetMembers, rules);

    if (match.memberId && memberTxMap.has(match.memberId)) {
      memberTxMap.get(match.memberId)!.transactions.push(tx);
      memberTxMap.get(match.memberId)!.details.push({
        transaction: tx,
        method: match.matchMethod,
        confidence: match.confidence,
      });
    } else {
      let bestGuessMember: ClubMember | undefined = undefined;
      let highestConf = 0;

      for (const m of targetMembers) {
        const sim = Math.max(
          stringSimilarity(tx.cleanSenderTransliterated, m.fullNameLatin || m.fullName),
          stringSimilarity(tx.senderTransliterated, m.fullNameLatin || m.fullName),
          stringSimilarity(cleanPurposeText(tx.purposeTransliterated), m.fullNameLatin || m.fullName)
        );
        if (sim > highestConf && sim > 0.4) {
          highestConf = sim;
          bestGuessMember = m;
        }
      }

      unrecognizedPayments.push({
        transaction: tx,
        bestGuess:
          bestGuessMember && highestConf > 0.4
            ? {
                member: bestGuessMember,
                confidence: highestConf,
                reason: `Suggested (${Math.round(highestConf * 100)}%)`,
              }
            : undefined,
      });
    }
  }

  let paidCount = 0;
  let unpaidCount = 0;
  let totalCollected = 0;
  let totalMatchedTxs = 0;
  let tbcCollected = 0;
  let bogCollected = 0;

  const reconciledMembers: MemberReconciliation[] = targetMembers.map((member) => {
    const txData = memberTxMap.get(member.id) || { transactions: [], details: [] };
    const paidAmount = txData.transactions.reduce((sum, t) => sum + t.amount, 0);
    const paymentCount = txData.transactions.length;
    const status: 'paid' | 'unpaid' = paidAmount > 0 ? 'paid' : 'unpaid';

    if (status === 'paid') {
      paidCount++;
    } else {
      unpaidCount++;
    }

    totalCollected += paidAmount;
    totalMatchedTxs += paymentCount;

    txData.transactions.forEach((t) => {
      if (t.bank === 'TBC') tbcCollected += t.amount;
      else if (t.bank === 'BOG') bogCollected += t.amount;
    });

    return {
      member,
      paidAmount,
      paymentCount,
      status,
      transactions: txData.transactions,
      matchDetails: txData.details,
    };
  });

  const unrecognizedAmount = unrecognizedPayments.reduce(
    (sum, p) => sum + p.transaction.amount,
    0
  );

  const summary: ReconciliationSummary = {
    totalActiveMembers: targetMembers.length,
    paidCount,
    unpaidCount,
    totalCollected,
    totalTransactionsCount: totalMatchedTxs,
    unrecognizedCount: unrecognizedPayments.length,
    unrecognizedAmount,
    tbcCollected,
    bogCollected,
  };

  return {
    reconciledMembers,
    unrecognizedPayments,
    summary,
  };
}
