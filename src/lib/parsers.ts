import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ClubMember, BankTransaction, BankSource } from './types';
import {
  transliterateGeorgian,
  stripBusinessPrefixes,
  normalizeForComparison,
} from './transliteration';

/**
 * Converts an Excel serial date number or date string into standard ISO YYYY-MM-DD.
 */
export function parseExcelDate(val: any): { dateStr: string; monthStr: string } {
  if (!val) {
    const today = new Date();
    const dStr = today.toISOString().split('T')[0];
    return { dateStr: dStr, monthStr: dStr.substring(0, 7) };
  }

  // If number (Excel date code)
  if (
    typeof val === 'number' ||
    (!isNaN(Number(val)) &&
      !String(val).includes('-') &&
      !String(val).includes('.') &&
      !String(val).includes('/'))
  ) {
    const num = Number(val);
    if (num > 30000 && num < 70000) {
      // Excel serial date code
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const y = date_info.getUTCFullYear();
      const m = String(date_info.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date_info.getUTCDate()).padStart(2, '0');
      return { dateStr: `${y}-${m}-${d}`, monthStr: `${y}-${m}` };
    }
  }

  const str = String(val).trim();

  // Match DD.MM.YYYY or DD.MM.YY
  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0');
    const month = dotMatch[2].padStart(2, '0');
    let year = dotMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    return { dateStr: `${year}-${month}-${day}`, monthStr: `${year}-${month}` };
  }

  // Match DD/MM/YYYY or DD/MM/YY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    let year = slashMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    return { dateStr: `${year}-${month}-${day}`, monthStr: `${year}-${month}` };
  }

  // Match YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return { dateStr: `${year}-${month}-${day}`, monthStr: `${year}-${month}` };
  }

  // Fallback to JS Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, monthStr: `${y}-${m}` };
  }

  const fallback = new Date().toISOString().split('T')[0];
  return { dateStr: fallback, monthStr: fallback.substring(0, 7) };
}

/**
 * Parses numeric amount from mixed string/number.
 */
export function parseAmount(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val)
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Reads binary ArrayBuffer / Uint8Array into 2D array of rows from all sheets.
 */
export function readWorkbookToAllSheetsRows(data: ArrayBuffer | Uint8Array): { sheetName: string; rows: any[][] }[] {
  const wb = XLSX.read(data, { type: 'array', cellDates: false });
  const result: { sheetName: string; rows: any[][] }[] = [];
  for (const sn of wb.SheetNames) {
    const sheet = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    result.push({ sheetName: sn, rows });
  }
  return result;
}

/**
 * Reads first sheet rows for backward compatibility.
 */
export function readWorkbookToRows(data: ArrayBuffer | Uint8Array): any[][] {
  const allSheets = readWorkbookToAllSheetsRows(data);
  if (allSheets.length === 0) return [];
  // If multiple sheets exist, concatenate non-empty rows
  let combined: any[][] = [];
  for (const s of allSheets) {
    const valid = s.rows.filter((r) => r.some((c) => c !== ''));
    combined = combined.concat(valid);
  }
  return combined.length > 0 ? combined : allSheets[0].rows;
}

/**
 * Parses CSV text into 2D array of rows.
 */
export function parseCsvToRows(csvText: string): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      skipEmptyLines: false,
      complete: (results) => resolve(results.data as any[][]),
      error: (err: any) => reject(err),
    });
  });
}

/**
 * Parses Active Members data from raw 2D array.
 * Supports both Georgian and English / Latin names.
 */
export function parseMembersFromRows(rows: any[][]): ClubMember[] {
  if (!rows || rows.length === 0) return [];

  // Find header row
  let headerRowIndex = -1;
  let fnIdx = -1;
  let lnIdx = -1;
  let fullIdx = -1;
  let statusIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i] || [];
    for (let c = 0; c < row.length; c++) {
      const colName = String(row[c] || '').trim().toLowerCase();
      if (
        colName === 'first name' ||
        colName === 'firstname' ||
        colName === 'სახელი' ||
        colName.startsWith('სახელ')
      )
        fnIdx = c;
      if (
        colName === 'last name' ||
        colName === 'lastname' ||
        colName === 'გვარი' ||
        colName.startsWith('გვარ')
      )
        lnIdx = c;
      if (
        colName === 'full name' ||
        colName === 'fullname' ||
        colName === 'name' ||
        colName === 'სახელი და გვარი'
      )
        fullIdx = c;
      if (
        colName === 'status' ||
        colName === 'სტატუსი' ||
        colName.includes('active')
      )
        statusIdx = c;
    }

    if (fnIdx !== -1 || fullIdx !== -1) {
      headerRowIndex = i;
      break;
    }
  }

  // If no clear header found, default to col 0: First Name, col 1: Last Name, col 2: Status
  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  if (fnIdx === -1 && fullIdx === -1) {
    fnIdx = 0;
    lnIdx = 1;
    statusIdx = 2;
  }

  const members: ClubMember[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    let firstName = '';
    let lastName = '';
    let status = 'Active';

    if (fnIdx !== -1) {
      firstName = String(row[fnIdx] || '').trim();
    }
    if (lnIdx !== -1) {
      lastName = String(row[lnIdx] || '').trim();
    }
    if (fullIdx !== -1 && (!firstName || !lastName)) {
      const full = String(row[fullIdx] || '').trim();
      const parts = full.split(/\s+/);
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        firstName = parts[0];
      }
    }

    if (statusIdx !== -1 && row[statusIdx] !== undefined) {
      const s = String(row[statusIdx]).trim();
      if (s) status = s;
    }

    // Skip empty rows or header duplicates
    if (!firstName && !lastName) continue;
    const lowerFn = firstName.toLowerCase();
    const lowerLn = lastName.toLowerCase();
    if (
      lowerFn === 'first name' ||
      lowerLn === 'last name' ||
      lowerFn.startsWith('სახელ') ||
      lowerLn.startsWith('გვარ')
    )
      continue;

    const fullName = `${firstName} ${lastName}`.trim();
    const hasGeorgian = /[\u10A0-\u10FF]/.test(fullName);

    const fullNameLatin = hasGeorgian
      ? transliterateGeorgian(fullName)
      : fullName;
    const fullNameGeorgian = hasGeorgian
      ? fullName
      : undefined;

    members.push({
      id: `member-${members.length + 1}-${normalizeForComparison(fullName).replace(/\s+/g, '-')}`,
      firstName,
      lastName,
      fullName,
      status,
      fullNameLatin,
      fullNameGeorgian,
      raw: row,
    });
  }

  return members;
}

/**
 * Parses Bank Statement from Excel Workbook (all sheets) or raw rows.
 * Dedicated recognition for TBC Bank and Bank of Georgia (BOG).
 */
export function parseBankReportFromRows(
  rows: any[][],
  defaultBank?: BankSource
): BankTransaction[] {
  if (!rows || rows.length === 0) return [];

  // Look for header row
  let headerRowIndex = -1;
  let dateIdx = -1;
  let amountIdx = -1;
  let creditIdx = -1;
  let senderIdx = -1;
  let payerIdx = -1;
  let payerIdIdx = -1;
  let purposeIdx = -1;
  let addInfoIdx = -1;
  let docIdx = -1;
  let accountIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i] || [];
    let matchCount = 0;

    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim().toLowerCase();

      if (val === 'თარიღი' || val.includes('date') || val === 'operation date') {
        dateIdx = c;
        matchCount++;
      }
      if (val === 'თანხა' || val.includes('paid in') || val === 'შემოსული თანხა') {
        amountIdx = c;
        matchCount++;
      }
      if (val === 'კრედიტი' || val === 'credit' || val === 'შემოსავალი') {
        creditIdx = c;
        matchCount++;
      }
      if (
        val === 'გამგზავნის დასახელება' ||
        val === 'გამგზავნი' ||
        val === 'sender' ||
        val === 'sender name'
      ) {
        senderIdx = c;
        matchCount++;
      }
      if (
        val === 'გადამხდელის დასახელება' ||
        val === 'გადამხდელი' ||
        val === 'payer' ||
        val === 'payer name'
      ) {
        payerIdx = c;
        matchCount++;
      }
      if (
        val.includes('საიდენტიფიკაციო კოდი') ||
        val.includes('საინდენტიფიკაციო') ||
        val.includes('payer id') ||
        val.includes('პირადი ნომერი')
      ) {
        payerIdIdx = c;
        matchCount++;
      }
      if (
        val === 'დანიშნულება' ||
        val.includes('description') ||
        val.includes('purpose') ||
        val === 'ოპერაციის შინაარსი'
      ) {
        if (purposeIdx === -1) {
          purposeIdx = c;
          matchCount++;
        }
      }
      if (
        val.includes('დამატებითი ინფორმაცია') ||
        val.includes('additional information')
      ) {
        addInfoIdx = c;
        matchCount++;
      }
      if (val.includes('საბუთის') || val.includes('doc') || val.includes('document')) {
        docIdx = c;
      }
      if (val.includes('ანგარიში') || val.includes('account') || val.includes('iban')) {
        accountIdx = c;
      }
    }

    if (matchCount >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const transactions: BankTransaction[] = [];
  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawDate = dateIdx !== -1 ? row[dateIdx] : row[0];
    if (rawDate === undefined || rawDate === null || rawDate === '') continue;

    // Skip repeat headers
    const rawDateStr = String(rawDate).trim().toLowerCase();
    if (rawDateStr.includes('date') || rawDateStr.includes('თარიღი')) continue;

    const { dateStr, monthStr } = parseExcelDate(rawDate);

    // Extract amount
    let amount = 0;
    if (creditIdx !== -1 && row[creditIdx] !== undefined) {
      amount = parseAmount(row[creditIdx]);
    }
    if (amount === 0 && amountIdx !== -1 && row[amountIdx] !== undefined) {
      amount = parseAmount(row[amountIdx]);
    }

    // Special auto-fallbacks for TBC tables
    if (amount === 0) {
      if (row[8] && parseAmount(row[8]) > 0) {
        amount = parseAmount(row[8]);
      } else if (row[4] && parseAmount(row[4]) > 0) {
        amount = parseAmount(row[4]);
      } else if (row[3] && parseAmount(row[3]) > 0) {
        amount = parseAmount(row[3]);
      }
    }

    // Skip outgoing transactions or 0 amounts
    if (amount <= 0) continue;

    // Extract sender name
    let senderName = '';
    if (senderIdx !== -1 && row[senderIdx]) {
      senderName = String(row[senderIdx]).trim();
    }
    if (!senderName && addInfoIdx !== -1 && row[addInfoIdx]) {
      const fullAddInfo = String(row[addInfoIdx]).trim();
      senderName = fullAddInfo.split(',')[0].trim();
    }
    if (!senderName && row[6]) {
      const col6 = String(row[6]).trim();
      if (col6.includes(',') || /[\u10A0-\u10FF]/.test(col6)) {
        senderName = col6.split(',')[0].trim();
      }
    }
    if (!senderName && row[2]) {
      const col2 = String(row[2]).trim();
      if (col2.includes(',') || /[\u10A0-\u10FF]/.test(col2)) {
        senderName = col2.split(',')[0].trim();
      }
    }
    if (!senderName && row[9]) {
      senderName = String(row[9]).trim();
    }

    // Extract payer / company
    let payerName = '';
    if (payerIdx !== -1 && row[payerIdx]) {
      payerName = String(row[payerIdx]).trim();
    }

    // Extract payer ID
    let payerId = '';
    if (payerIdIdx !== -1 && row[payerIdIdx]) {
      payerId = String(row[payerIdIdx]).trim();
    } else if (row[10] && /^\d{9,11}$/.test(String(row[10]).trim())) {
      payerId = String(row[10]).trim();
    }

    // Extract purpose
    let purpose = '';
    if (purposeIdx !== -1 && row[purposeIdx]) {
      purpose = String(row[purposeIdx]).trim();
    }
    if (!purpose && row[1]) {
      purpose = String(row[1]).trim();
    }
    if (!purpose && row[5]) {
      purpose = String(row[5]).trim();
    }

    // Extract document number
    let docNumber = '';
    if (docIdx !== -1 && row[docIdx]) {
      docNumber = String(row[docIdx]).trim();
    }

    // Clean names
    const cleanSenderName = stripBusinessPrefixes(senderName);
    const senderTransliterated = transliterateGeorgian(senderName);
    const cleanSenderTransliterated = transliterateGeorgian(cleanSenderName);
    const payerTransliterated = transliterateGeorgian(payerName);
    const purposeTransliterated = transliterateGeorgian(purpose);

    // Determine bank
    let bank: BankSource = defaultBank || 'Other';
    if (!defaultBank) {
      const fullRowText = JSON.stringify(row).toLowerCase();
      if (fullAddInfoHas(fullRowText, 'tbc') || fullRowText.includes('tbcbge')) {
        bank = 'TBC';
      } else if (fullRowText.includes('bagage') || fullRowText.includes('საქართველოს ბანკი')) {
        bank = 'BOG';
      }
    }

    transactions.push({
      id: `tx-${transactions.length + 1}-${dateStr}-${amount}-${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      rawDate,
      month: monthStr,
      amount,
      currency: 'GEL',
      senderName,
      senderTransliterated,
      cleanSenderName,
      cleanSenderTransliterated,
      payerName,
      payerTransliterated,
      payerId,
      purpose,
      purposeTransliterated,
      docNumber,
      bank,
      raw: row,
    });
  }

  return transactions;
}

function fullAddInfoHas(text: string, sub: string): boolean {
  return text.toLowerCase().includes(sub.toLowerCase());
}

/**
 * Universal parser that parses all sheets in an Excel buffer.
 */
export function parseBankWorkbook(
  data: ArrayBuffer | Uint8Array,
  bank: BankSource
): BankTransaction[] {
  const allSheets = readWorkbookToAllSheetsRows(data);
  let allTxs: BankTransaction[] = [];

  for (const s of allSheets) {
    const sheetTxs = parseBankReportFromRows(s.rows, bank);
    allTxs = allTxs.concat(sheetTxs);
  }

  return allTxs;
}
