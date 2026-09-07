import * as XLSX from 'xlsx';
import {
  MemberReconciliation,
  UnrecognizedPayment,
  ReconciliationSummary,
} from './types';

/**
 * Exports multi-bank reconciliation data into an Excel (.xlsx) file.
 */
export function exportReconciliationToExcel({
  reconciledMembers,
  unrecognizedPayments,
  summary,
  selectedMonth,
}: {
  reconciledMembers: MemberReconciliation[];
  unrecognizedPayments: UnrecognizedPayment[];
  summary: ReconciliationSummary;
  selectedMonth: string;
}): void {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryRows = [
    ['MEMBERSHIP FEE & MULTI-BANK RECONCILIATION REPORT'],
    ['Generated At:', new Date().toLocaleString()],
    ['Period:', selectedMonth === 'all' ? 'All Periods' : selectedMonth],
    [],
    ['METRIC', 'VALUE'],
    ['Total Active Members', summary.totalActiveMembers],
    ['Paid Members (Payment confirmed)', summary.paidCount],
    ['Unpaid Members (0 GEL)', summary.unpaidCount],
    ['Total Collected (GEL)', summary.totalCollected],
    ['TBC Bank Collections (GEL)', summary.tbcCollected || 0],
    ['Bank of Georgia (BOG) Collections (GEL)', summary.bogCollected || 0],
    ['Total Matched Transactions', summary.totalTransactionsCount],
    ['Unmatched Transactions Count', summary.unrecognizedCount],
    ['Unmatched Amount (GEL)', summary.unrecognizedAmount],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. Members Reconciliation Sheet
  const membersHeaders = [
    'First Name',
    'Last Name',
    'Full Name',
    'Club Status',
    'Paid Amount (GEL)',
    'Payment Count',
    'Payment Status',
    'Payment Dates',
    'Banks (TBC/BOG)',
    'Statement Senders',
    'Transaction Details',
  ];

  const membersRows = reconciledMembers.map((r) => {
    const dates = r.transactions.map((t) => t.date).join(', ');
    const banks = Array.from(new Set(r.transactions.map((t) => t.bank).filter(Boolean))).join(', ');
    const senders = r.transactions.map((t) => t.senderName || t.payerName).filter(Boolean).join('; ');
    const details = r.matchDetails
      .map((d) => `[${d.transaction.bank || 'Bank'} ${d.transaction.date}] ${d.transaction.amount} GEL (${d.method})`)
      .join('; ');

    const statusLabel = r.status === 'paid' ? 'Paid' : 'Unpaid';

    return [
      r.member.firstName,
      r.member.lastName,
      r.member.fullName,
      r.member.status,
      r.paidAmount,
      r.paymentCount,
      statusLabel,
      dates,
      banks,
      senders,
      details,
    ];
  });

  const wsMembers = XLSX.utils.aoa_to_sheet([membersHeaders, ...membersRows]);
  wsMembers['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 32 },
    { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Club Members');

  // 3. Unrecognized Payments Sheet
  const unmatchedHeaders = [
    'Bank',
    'Date',
    'Amount (GEL)',
    'Sender Name',
    'Sender Transliterated',
    'Payer ID Code',
    'Payment Purpose',
    'Document Number',
  ];

  const unmatchedRows = unrecognizedPayments.map((u) => [
    u.transaction.bank || 'Other',
    u.transaction.date,
    u.transaction.amount,
    u.transaction.senderName || u.transaction.payerName,
    u.transaction.senderTransliterated || u.transaction.payerTransliterated,
    u.transaction.payerId || '',
    u.transaction.purpose,
    u.transaction.docNumber || '',
  ]);

  const wsUnmatched = XLSX.utils.aoa_to_sheet([unmatchedHeaders, ...unmatchedRows]);
  wsUnmatched['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 32 },
    { wch: 32 },
    { wch: 20 },
    { wch: 50 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsUnmatched, 'Unmatched Payments');

  const filename = `Membership_Report_${selectedMonth === 'all' ? 'All' : selectedMonth}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
