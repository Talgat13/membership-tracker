import * as XLSX from 'xlsx';
import {
  MemberReconciliation,
  UnrecognizedPayment,
  ReconciliationSummary,
} from './types';

/**
 * Exports reconciliation data into a beautifully formatted Excel (.xlsx) file.
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
    ['ОТЧЕТ ПО ЧЛЕНСКИМ ВЗНОСАМ И ВЫПИСКАМ'],
    ['Дата генерации:', new Date().toLocaleString()],
    ['Период:', selectedMonth === 'all' ? 'Все периоды' : selectedMonth],
    [],
    ['ПОКАЗАТЕЛЬ', 'ЗНАЧЕНИЕ'],
    ['Всего членов клуба', summary.totalActiveMembers],
    ['С оплатой (Оплатили)', summary.paidCount],
    ['Без оплаты (Не оплатили)', summary.unpaidCount],
    ['Всего собрано (GEL)', summary.totalCollected],
    ['Сопоставлено транзакций', summary.totalTransactionsCount],
    ['Неопознанных транзакций', summary.unrecognizedCount],
    ['Сумма неопознанных платежей (GEL)', summary.unrecognizedAmount],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

  // 2. Members Reconciliation Sheet
  const membersHeaders = [
    'Имя',
    'Фамилия',
    'Полное имя',
    'Статус в клубе',
    'Поступило оплат (GEL)',
    'Количество платежей',
    'Статус оплаты',
    'Даты платежей',
    'Отправители в выписке',
    'Детали транзакций',
  ];

  const membersRows = reconciledMembers.map((r) => {
    const dates = r.transactions.map((t) => t.date).join(', ');
    const senders = r.transactions.map((t) => t.senderName || t.payerName).filter(Boolean).join('; ');
    const details = r.matchDetails
      .map((d) => `[${d.transaction.date}] ${d.transaction.amount} GEL (${d.method} - ${Math.round(d.confidence * 100)}%)`)
      .join('; ');

    const statusLabel = r.status === 'paid' ? 'Оплачено' : 'Не оплачено';

    return [
      r.member.firstName,
      r.member.lastName,
      r.member.fullName,
      r.member.status,
      r.paidAmount,
      r.paymentCount,
      statusLabel,
      dates,
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
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
    { wch: 32 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Члены клуба');

  // 3. Unrecognized Payments Sheet
  const unmatchedHeaders = [
    'Дата',
    'Сумма (GEL)',
    'Отправитель (Грузинский)',
    'Транслитерация (Латиница)',
    'Код плательщика (ID)',
    'Назначение платежа',
    'Номер документа',
    'Номер счета',
  ];

  const unmatchedRows = unrecognizedPayments.map((u) => [
    u.transaction.date,
    u.transaction.amount,
    u.transaction.senderName || u.transaction.payerName,
    u.transaction.senderTransliterated || u.transaction.payerTransliterated,
    u.transaction.payerId || '',
    u.transaction.purpose,
    u.transaction.docNumber || '',
    u.transaction.account || '',
  ]);

  const wsUnmatched = XLSX.utils.aoa_to_sheet([unmatchedHeaders, ...unmatchedRows]);
  wsUnmatched['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 32 },
    { wch: 32 },
    { wch: 20 },
    { wch: 45 },
    { wch: 16 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsUnmatched, 'Неопознанные платежи');

  const filename = `Membership_Report_${selectedMonth === 'all' ? 'All' : selectedMonth}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
