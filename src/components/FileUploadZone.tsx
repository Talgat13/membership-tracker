'use client';
import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { readWorkbookToRows, parseCsvToRows, parseMembersFromRows, parseBankReportFromRows } from '../lib/parsers';
import { ClubMember, BankTransaction } from '../lib/types';

interface FileUploadZoneProps {
  members: ClubMember[];
  transactions: BankTransaction[];
  onMembersLoaded: (members: ClubMember[], filename: string) => void;
  onTransactionsLoaded: (transactions: BankTransaction[], filename: string) => void;
  onClearMembers: () => void;
  onClearTransactions: () => void;
  membersFileName?: string;
  transactionsFileName?: string;
}

export function FileUploadZone({
  members,
  transactions,
  onMembersLoaded,
  onTransactionsLoaded,
  onClearMembers,
  onClearTransactions,
  membersFileName,
  transactionsFileName,
}: FileUploadZoneProps) {
  const [isDraggingMembers, setIsDraggingMembers] = useState(false);
  const [isDraggingTransactions, setIsDraggingTransactions] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const membersInputRef = useRef<HTMLInputElement>(null);
  const transactionsInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (
    file: File,
    type: 'members' | 'transactions'
  ) => {
    setErrorMsg(null);
    try {
      let rows: any[][] = [];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        const text = await file.text();
        rows = await parseCsvToRows(text);
      } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        rows = readWorkbookToRows(buffer);
      } else {
        throw new Error('Only .xlsx, .xls, and .csv file formats are supported');
      }

      if (type === 'members') {
        const parsed = parseMembersFromRows(rows);
        if (parsed.length === 0) {
          throw new Error('No active club members found in the uploaded file');
        }
        onMembersLoaded(parsed, file.name);
      } else {
        const parsed = parseBankReportFromRows(rows);
        if (parsed.length === 0) {
          throw new Error('No incoming transactions found in the bank statement');
        }
        onTransactionsLoaded(parsed, file.name);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error processing file');
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Members Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingMembers(true);
          }}
          onDragLeave={() => setIsDraggingMembers(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingMembers(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              await processFile(e.dataTransfer.files[0], 'members');
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed p-5 transition-all duration-200 ${
            members.length > 0
              ? 'bg-emerald-50/40 dark:bg-slate-900/60 border-emerald-500/40 shadow-xs'
              : isDraggingMembers
              ? 'bg-emerald-100/60 dark:bg-emerald-950/30 border-emerald-500 scale-[1.01]'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={membersInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                await processFile(e.target.files[0], 'members');
                e.target.value = '';
              }
            }}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  members.length > 0
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  1. Club Members List
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Active members database (Excel / CSV)
                </p>
              </div>
            </div>

            {members.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearMembers();
                }}
                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Remove members file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4">
            {members.length > 0 ? (
              <div className="flex items-center justify-between bg-white dark:bg-slate-950/60 rounded-xl px-3.5 py-2.5 border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {membersFileName || 'active_members.xlsx'}
                  </span>
                </div>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                  {members.length} members
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => membersInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Drag & drop Excel / CSV or click to browse</span>
              </button>
            )}
          </div>
        </div>

        {/* Bank Statement Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingTransactions(true);
          }}
          onDragLeave={() => setIsDraggingTransactions(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingTransactions(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              await processFile(e.dataTransfer.files[0], 'transactions');
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed p-5 transition-all duration-200 ${
            transactions.length > 0
              ? 'bg-teal-50/40 dark:bg-slate-900/60 border-teal-500/40 shadow-xs'
              : isDraggingTransactions
              ? 'bg-teal-100/60 dark:bg-teal-950/30 border-teal-500 scale-[1.01]'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={transactionsInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                await processFile(e.target.files[0], 'transactions');
                e.target.value = '';
              }
            }}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  transactions.length > 0
                    ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  2. Bank Statement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  TBC / BOG statement (Georgian names, dates, GEL)
                </p>
              </div>
            </div>

            {transactions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearTransactions();
                }}
                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Remove statement file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4">
            {transactions.length > 0 ? (
              <div className="flex items-center justify-between bg-white dark:bg-slate-950/60 rounded-xl px-3.5 py-2.5 border border-teal-200 dark:border-teal-500/20 shadow-xs">
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {transactionsFileName || 'bank_statement.xlsx'}
                  </span>
                </div>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 whitespace-nowrap">
                  {transactions.length} transactions
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => transactionsInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Drag & drop Excel / CSV or click to browse</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
