'use client';
import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  readWorkbookToRows,
  parseCsvToRows,
  parseMembersFromRows,
  parseBankWorkbook,
  parseBankReportFromRows,
} from '../lib/parsers';
import { ClubMember, BankTransaction, BankSource } from '../lib/types';

interface FileUploadZoneProps {
  members: ClubMember[];
  tbcTransactions: BankTransaction[];
  bogTransactions: BankTransaction[];
  onMembersLoaded: (members: ClubMember[], filename: string) => void;
  onTbcLoaded: (transactions: BankTransaction[], filename: string) => void;
  onBogLoaded: (transactions: BankTransaction[], filename: string) => void;
  onClearMembers: () => void;
  onClearTbc: () => void;
  onClearBog: () => void;
  membersFileName?: string;
  tbcFileName?: string;
  bogFileName?: string;
}

export function FileUploadZone({
  members,
  tbcTransactions,
  bogTransactions,
  onMembersLoaded,
  onTbcLoaded,
  onBogLoaded,
  onClearMembers,
  onClearTbc,
  onClearBog,
  membersFileName,
  tbcFileName,
  bogFileName,
}: FileUploadZoneProps) {
  const [isDraggingMembers, setIsDraggingMembers] = useState(false);
  const [isDraggingTbc, setIsDraggingTbc] = useState(false);
  const [isDraggingBog, setIsDraggingBog] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const membersInputRef = useRef<HTMLInputElement>(null);
  const tbcInputRef = useRef<HTMLInputElement>(null);
  const bogInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (
    file: File,
    type: 'members' | 'tbc' | 'bog'
  ) => {
    setErrorMsg(null);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (type === 'members') {
        let rows: any[][] = [];
        if (extension === 'csv') {
          const text = await file.text();
          rows = await parseCsvToRows(text);
        } else if (extension === 'xlsx' || extension === 'xls') {
          const buffer = await file.arrayBuffer();
          rows = readWorkbookToRows(buffer);
        } else {
          throw new Error('Only .xlsx, .xls, and .csv file formats are supported');
        }

        const parsed = parseMembersFromRows(rows);
        if (parsed.length === 0) {
          throw new Error('No active club members found in the uploaded file');
        }
        onMembersLoaded(parsed, file.name);
      } else {
        const bankType: BankSource = type === 'tbc' ? 'TBC' : 'BOG';
        let txs: BankTransaction[] = [];

        if (extension === 'csv') {
          const text = await file.text();
          const rows = await parseCsvToRows(text);
          txs = parseBankReportFromRows(rows, bankType);
        } else if (extension === 'xlsx' || extension === 'xls') {
          const buffer = await file.arrayBuffer();
          txs = parseBankWorkbook(buffer, bankType);
        } else {
          throw new Error('Only .xlsx, .xls, and .csv file formats are supported');
        }

        if (txs.length === 0) {
          throw new Error(`No incoming transactions found in the ${bankType} bank statement`);
        }

        if (bankType === 'TBC') {
          onTbcLoaded(txs, file.name);
        } else {
          onBogLoaded(txs, file.name);
        }
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

      {/* 3 Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Active Members Dropzone */}
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
          className={`relative rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between ${
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
                  1. Active Members
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Members list (Excel / CSV)
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
              <div className="flex items-center justify-between bg-white dark:bg-slate-950/60 rounded-xl px-3 py-2 border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={membersFileName}>
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
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Members File</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. TBC Bank Statement Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingTbc(true);
          }}
          onDragLeave={() => setIsDraggingTbc(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingTbc(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              await processFile(e.dataTransfer.files[0], 'tbc');
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between ${
            tbcTransactions.length > 0
              ? 'bg-sky-50/40 dark:bg-slate-900/60 border-sky-500/40 shadow-xs'
              : isDraggingTbc
              ? 'bg-sky-100/60 dark:bg-sky-950/30 border-sky-500 scale-[1.01]'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={tbcInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                await processFile(e.target.files[0], 'tbc');
                e.target.value = '';
              }
            }}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tbcTransactions.length > 0
                    ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    2. TBC Bank
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400">
                    TBC
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  TBC statement (Excel / CSV)
                </p>
              </div>
            </div>

            {tbcTransactions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearTbc();
                }}
                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Remove TBC statement"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4">
            {tbcTransactions.length > 0 ? (
              <div className="flex items-center justify-between bg-white dark:bg-slate-950/60 rounded-xl px-3 py-2 border border-sky-200 dark:border-sky-500/20 shadow-xs">
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={tbcFileName}>
                    {tbcFileName || 'report_tbc.xlsx'}
                  </span>
                </div>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 whitespace-nowrap">
                  {tbcTransactions.length} txns
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => tbcInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload TBC Statement</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Bank of Georgia (BOG) Statement Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingBog(true);
          }}
          onDragLeave={() => setIsDraggingBog(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingBog(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              await processFile(e.dataTransfer.files[0], 'bog');
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between ${
            bogTransactions.length > 0
              ? 'bg-amber-50/40 dark:bg-slate-900/60 border-amber-500/40 shadow-xs'
              : isDraggingBog
              ? 'bg-amber-100/60 dark:bg-amber-950/30 border-amber-500 scale-[1.01]'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={bogInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                await processFile(e.target.files[0], 'bog');
                e.target.value = '';
              }
            }}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  bogTransactions.length > 0
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    3. BOG Bank
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400">
                    BOG
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bank of Georgia statement (Excel / CSV)
                </p>
              </div>
            </div>

            {bogTransactions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearBog();
                }}
                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Remove BOG statement"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4">
            {bogTransactions.length > 0 ? (
              <div className="flex items-center justify-between bg-white dark:bg-slate-950/60 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-500/20 shadow-xs">
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={bogFileName}>
                    {bogFileName || 'report_bog.xlsx'}
                  </span>
                </div>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 whitespace-nowrap">
                  {bogTransactions.length} txns
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bogInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload BOG Statement</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
