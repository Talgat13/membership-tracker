'use client';
import React from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Coins,
  HelpCircle,
} from 'lucide-react';
import { ReconciliationSummary } from '../lib/types';

interface SummaryCardsProps {
  summary: ReconciliationSummary;
  onFilterStatus?: (status: string) => void;
  activeFilter?: string;
  onSelectUnrecognizedTab?: () => void;
}

export function SummaryCards({
  summary,
  onFilterStatus,
  activeFilter = 'all',
  onSelectUnrecognizedTab,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Total Active */}
      <button
        type="button"
        onClick={() => onFilterStatus?.('all')}
        className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
          activeFilter === 'all'
            ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400 dark:ring-slate-500 shadow-sm'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Members
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {summary.totalActiveMembers}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">total</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
          In club database
        </div>
      </button>

      {/* 2. Paid */}
      <button
        type="button"
        onClick={() => onFilterStatus?.('paid')}
        className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
          activeFilter === 'paid'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 shadow-sm'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-slate-800/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Paid
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {summary.paidCount}
          </span>
          <span className="text-xs text-emerald-700/80 dark:text-emerald-500/80">members</span>
        </div>
        <div className="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-400/70 truncate">
          Payment confirmed
        </div>
      </button>

      {/* 3. Unpaid */}
      <button
        type="button"
        onClick={() => onFilterStatus?.('unpaid')}
        className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
          activeFilter === 'unpaid'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/50 shadow-sm'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-rose-500/30 hover:bg-rose-50/50 dark:hover:bg-slate-800/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
            Unpaid
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
            {summary.unpaidCount}
          </span>
          <span className="text-xs text-rose-700/80 dark:text-rose-500/80">members</span>
        </div>
        <div className="mt-1 text-[11px] text-rose-700/70 dark:text-rose-400/70 truncate">
          0 ₾ received
        </div>
      </button>

      {/* 4. Unmatched Payments */}
      <button
        type="button"
        onClick={onSelectUnrecognizedTab}
        className="text-left p-4 rounded-2xl border bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Unmatched
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {summary.unrecognizedCount}
          </span>
          <span className="text-xs text-amber-700/80 dark:text-amber-500/80">txns</span>
        </div>
        <div className="mt-1 text-[11px] text-amber-700/70 dark:text-amber-400/70 truncate">
          {summary.unrecognizedAmount.toLocaleString()} ₾ awaiting match
        </div>
      </button>

      {/* 5. Total Collected (₾) */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-slate-900/90 dark:via-slate-900/70 dark:to-emerald-950/30 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-800 dark:text-slate-300">
            Total Collected
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-200 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-white tracking-tight">
            {summary.totalCollected.toLocaleString()} ₾
          </span>
        </div>

        <div className="mt-1 text-[11px] text-emerald-800/80 dark:text-slate-400 truncate">
          {summary.totalTransactionsCount} payment(s) matched
        </div>
      </div>
    </div>
  );
}
