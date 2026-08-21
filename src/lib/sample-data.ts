import { ClubMember, BankTransaction } from './types';
import { transliterateGeorgian, stripBusinessPrefixes } from './transliteration';

export const SAMPLE_ACTIVE_MEMBERS: ClubMember[] = [
  {
    id: 'member-1-nino-kaishauri',
    firstName: 'Nino',
    lastName: 'Kaishauri',
    fullName: 'Nino Kaishauri',
    status: 'Active',
  },
  {
    id: 'member-2-saba-chikhladze',
    firstName: 'Saba',
    lastName: 'Chikhladze',
    fullName: 'Saba Chikhladze',
    status: 'Active',
  },
  {
    id: 'member-3-paata-mushtashvili',
    firstName: 'Paata',
    lastName: 'Mushtashvili',
    fullName: 'Paata Mushtashvili',
    status: 'Active',
  },
  {
    id: 'member-4-giorgi-dvalishvili',
    firstName: 'giorgi',
    lastName: 'dvalishvili',
    fullName: 'giorgi dvalishvili',
    status: 'Active',
  },
  {
    id: 'member-5-giorgi-rekhviashvili',
    firstName: 'giorgi',
    lastName: 'rekhviashvili',
    fullName: 'giorgi rekhviashvili',
    status: 'Active',
  },
  {
    id: 'member-6-mariam-tsanava',
    firstName: 'mariam',
    lastName: 'tsanava',
    fullName: 'mariam tsanava',
    status: 'Active',
  },
];

const RAW_SAMPLE_TRANSACTIONS = [
  {
    date: '2026-07-20',
    amount: 120,
    senderName: 'ი/მ ნინო ბაგალიშვილი',
    payerName: 'შპს მულტიკორე',
    payerId: '01019085817',
    purpose: 'ფიტპასის საფასური ნინო ბაგალიშვილი',
    docNumber: '1784536901',
    account: 'GE20TB7711545061100062',
  },
  {
    date: '2026-07-20',
    amount: 120,
    senderName: 'დვალიშვილი გიორგი',
    payerName: 'გიორგი დვალიშვილი',
    payerId: '01011085624',
    purpose: 'ფიტპასის საფასური',
    docNumber: '989225217',
    account: 'GE03BG0000000538275484GEL',
  },
  {
    date: '2026-07-23',
    amount: 110,
    senderName: 'რეხვიაშვილი გიორგი',
    payerName: 'გიორგი რეხვიაშვილი',
    payerId: '04001004047',
    purpose: 'ფიტ პასის მომსახურება',
    docNumber: '992806893',
    account: 'GE69BG0000000293818000GEL',
  },
  {
    date: '2026-07-24',
    amount: 110,
    senderName: 'ხვიჩია ზურაბ',
    payerName: 'ზურაბ ხვიჩია',
    payerId: '26201039610',
    purpose: 'თანხის გადარიცხვა',
    docNumber: '993365729',
    account: 'GE57BG0000000565612216GEL',
  },
  {
    date: '2026-07-26',
    amount: 110,
    senderName: 'ცანავა მარიამ',
    payerName: 'მარიამ ცანავა',
    payerId: '01024077900',
    purpose: 'თანხის გადარიცხვა',
    docNumber: '994997837',
    account: 'GE35BG0000000162028010GEL',
  },
  {
    date: '2026-07-27',
    amount: 120,
    senderName: 'გიორგი დვალიშვილი',
    payerName: 'შპს მულტიკორე',
    payerId: '01021007270',
    purpose: 'Giorgi Dvalishvili Fitpass',
    docNumber: '1784925748',
    account: 'GE47TB7368845063600008',
  },
];

export const SAMPLE_BANK_TRANSACTIONS: BankTransaction[] = RAW_SAMPLE_TRANSACTIONS.map(
  (t, idx) => {
    const cleanSenderName = stripBusinessPrefixes(t.senderName);
    return {
      id: `sample-tx-${idx + 1}`,
      date: t.date,
      month: t.date.substring(0, 7),
      amount: t.amount,
      currency: 'GEL',
      senderName: t.senderName,
      senderTransliterated: transliterateGeorgian(t.senderName),
      cleanSenderName,
      cleanSenderTransliterated: transliterateGeorgian(cleanSenderName),
      payerName: t.payerName,
      payerTransliterated: transliterateGeorgian(t.payerName),
      payerId: t.payerId,
      purpose: t.purpose,
      purposeTransliterated: transliterateGeorgian(t.purpose),
      docNumber: t.docNumber,
      account: t.account,
    };
  }
);
