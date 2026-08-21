import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ClubMember, BankTransaction } from './types';
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
  if (typeof val === 'number' || (!isNaN(Number(val)) && !String(val).includes('-') && !String(val).includes('.') && !String(val).includes('/'))) {
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
 * Reads binary ArrayBuffer / Uint8Array into 2D array of rows.
 */
export function readWorkbookToRows(data: ArrayBuffer | Uint8Array): any[][] {
  const wb = XLSX.read(data, { type: 'array', cellDates: false });
  const firstSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
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
 */
export function parseMembersFromRows(rows: any[][]): ClubMember[] {
  if (!rows || rows.length === 0) return [];

  // Find header row
  let headerRowIndex = -1;
  let fnIdx = -1;
  let lnIdx = -1;
  let fullIdx = -1;
  let statusIdx = -1;
  let feeIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] || [];
    for (let c = 0; c < row.length; c++) {
      const colName = String(row[c] || '').trim().toLowerCase();
      if (colName === 'first name' || colName === 'firstname' || colName === 'სახელი') fnIdx = c;
      if (colName === 'last name' || colName === 'lastname' || colName === 'გვარი') lnIdx = c;
      if (colName === 'full name' || colName === 'fullname' || colName === 'name' || colName === 'სახელი და გვარი') fullIdx = c;
      if (colName === 'status' || colName === 'სტატუსი') statusIdx = c;
      if (colName.includes('fee') || colName.includes('თანხა') || colName.includes('amount') || colName.includes('ფასი')) feeIdx = c;
    }

    if (fnIdx !== -1 || fullIdx !== -1) {
      headerRowIndex = i;
      break;
    }
  }

  // If no clear header found, assume standard 0: First Name, 1: Last Name, 2: Status
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
    let fee: number | undefined = undefined;

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

    if (feeIdx !== -1 && row[feeIdx] !== undefined) {
      const parsedFee = parseAmount(row[feeIdx]);
      if (parsedFee > 0) fee = parsedFee;
    }

    // Skip empty rows or header duplicates
    if (!firstName && !lastName) continue;
    if (firstName.toLowerCase() === 'first name' || lastName.toLowerCase() === 'last name') continue;

    const fullName = `${firstName} ${lastName}`.trim();

    members.push({
      id: `member-${members.length + 1}-${normalizeForComparison(fullName).replace(/\s+/g, '-')}`,
      firstName,
      lastName,
      fullName,
      status,
      raw: row,
    });
  }

  return members;
}

/**
 * Parses Bank Statement from raw 2D array (e.g. TBC, BOG, Liberty Bank reports).
 */
export function parseBankReportFromRows(rows: any[][]): BankTransaction[] {
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
  let docIdx = -1;
  let accountIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i] || [];
    let matchCount = 0;

    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim().toLowerCase();

      if (val === 'თარიღი' || val === 'date' || val === 'operation date') {
        dateIdx = c;
        matchCount++;
      }
      if (val === 'თანხა' || val === 'amount') {
        amountIdx = c;
        matchCount++;
      }
      if (val === 'კრედიტი' || val === 'credit' || val === 'შემოსავალი') {
        creditIdx = c;
        matchCount++;
      }
      if (val === 'გამგზავნის დასახელება' || val === 'გამგზავნი' || val === 'sender' || val === 'sender name') {
        senderIdx = c;
        matchCount++;
      }
      if (val === 'გადამხდელის დასახელება' || val === 'გადამხდელი' || val === 'payer' || val === 'payer name') {
        payerIdx = c;
        matchCount++;
      }
      if (val.includes('საინდენტიფიკაციო კოდი') || val.includes('payer id') || val.includes('პირადი ნომერი')) {
        payerIdIdx = c;
        matchCount++;
      }
      if (val === 'დანიშნულება' || val === 'ოპერაციის შინაარსი' || val === 'purpose' || val === 'description' || val === 'details') {
        if (purposeIdx === -1 || val === 'დანიშნულება') {
          purposeIdx = c;
        }
        matchCount++;
      }
      if (val === 'საბუთის n' || val === 'doc number' || val === 'ოპერაციის იდ') {
        docIdx = c;
      }
      if (val.includes('ანგარიში') || val.includes('account')) {
        accountIdx = c;
      }
    }

    if (matchCount >= 3) {
      headerRowIndex = i;
      break;
    }
  }

  const effectiveHeaderRow = headerRowIndex >= 0 ? headerRowIndex : 0;
  const transactions: BankTransaction[] = [];

  for (let i = effectiveHeaderRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Determine amount: Prefer Credit column if available, else Amount column
    let amount = 0;
    if (creditIdx !== -1 && row[creditIdx] !== undefined && row[creditIdx] !== '') {
      amount = parseAmount(row[creditIdx]);
    } else if (amountIdx !== -1 && row[amountIdx] !== undefined) {
      amount = parseAmount(row[amountIdx]);
    }

    // Skip empty or 0 / negative transactions (we only reconcile incoming revenue)
    if (amount <= 0) continue;

    const rawDateVal = dateIdx !== -1 ? row[dateIdx] : undefined;
    const { dateStr, monthStr } = parseExcelDate(rawDateVal);

    const senderName = senderIdx !== -1 ? String(row[senderIdx] || '').trim() : '';
    const payerName = payerIdx !== -1 ? String(row[payerIdx] || '').trim() : '';
    const payerId = payerIdIdx !== -1 ? String(row[payerIdIdx] || '').trim() : undefined;
    const purpose = purposeIdx !== -1 ? String(row[purposeIdx] || '').trim() : '';
    const docNumber = docIdx !== -1 ? String(row[docIdx] || '').trim() : undefined;
    const account = accountIdx !== -1 ? String(row[accountIdx] || '').trim() : undefined;

    // Transliterate names and purposes
    const senderTransliterated = transliterateGeorgian(senderName);
    const cleanSenderName = stripBusinessPrefixes(senderName);
    const cleanSenderTransliterated = transliterateGeorgian(cleanSenderName);
    const payerTransliterated = transliterateGeorgian(payerName);
    const purposeTransliterated = transliterateGeorgian(purpose);

    transactions.push({
      id: `tx-${i}-${docNumber || Math.random().toString(36).substring(2, 8)}`,
      date: dateStr,
      rawDate: rawDateVal,
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
      account,
      raw: row,
    });
  }

  return transactions;
}
