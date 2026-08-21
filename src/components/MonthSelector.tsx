'use client';
import React from 'react';
import {
  Calendar,
  Search,
  Download,
  Filter,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface MonthSelectorProps {
  availableMonths: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  activeTab: 'members' | 'unrecognized';
  onTabChange: (tab: 'members' | 'unrecognized') => void;
  unrecognizedCount: number;
  onExportExcel: () => void;
  hasData: boolean;
}

export function MonthSelector({
  availableMonths,
  selectedMonth,
  onSelectMonth,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  activeTab,
  onTabChange,
  unrecognizedCount,
  onExportExcel,
  hasData,
}: MonthSelectorProps) {
  const formatMonthLabel = (m: string) => {
    if (m === 'all') return 'All Periods';
    const [year, month] = m.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4 transition-colors">
      {/* Top Bar: Navigation Tabs & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onTabChange('members')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Members Reconciliation</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('unrecognized')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'unrecognized'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Unmatched Payments</span>
            {unrecognizedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                {unrecognizedCount}
              </span>
            )}
          </button>
        </div>

        {/* Export to Excel */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onExportExcel}
            disabled={!hasData}
            className={`inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              hasData
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/20 cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Filter Row: Month, Search, Status Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Month Selector Dropdown */}
        <div className="sm:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none capitalize cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
          >
            <option value="all">All Periods (All Transactions)</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)} ({m})
              </option>
            ))}
          </select>
        </div>

        {/* Member Search */}
        <div className="sm:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by member name or Georgian text..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-slate-300 dark:hover:border-slate-700"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid (Green)</option>
            <option value="unpaid">Unpaid (Red)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
