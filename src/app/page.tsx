'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FileUploadZone } from '@/components/FileUploadZone';
import { SummaryCards } from '@/components/SummaryCards';
import { MonthSelector } from '@/components/MonthSelector';
import { MembersTable } from '@/components/MembersTable';
import { UnrecognizedPayments } from '@/components/UnrecognizedPayments';
import { TransactionModal } from '@/components/TransactionModal';
import { RulesManagerModal } from '@/components/RulesManagerModal';
import {
  UploadCloud,
  Users,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

import {
  ClubMember,
  BankTransaction,
  MemberReconciliation,
  MappingRule,
} from '@/lib/types';
import { reconcileStatements } from '@/lib/matcher';
import { exportReconciliationToExcel } from '@/lib/export';
import {
  loadSavedRules,
  addMappingRule,
  loadMultiBankCachedData,
  saveMultiBankCachedData,
  clearMembersCache,
  clearTbcCache,
  clearBogCache,
  clearCachedSession,
} from '@/lib/storage';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // 3 distinct datasets
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [tbcTransactions, setTbcTransactions] = useState<BankTransaction[]>([]);
  const [bogTransactions, setBogTransactions] = useState<BankTransaction[]>([]);

  const [membersFileName, setMembersFileName] = useState<string>('');
  const [tbcFileName, setTbcFileName] = useState<string>('');
  const [bogFileName, setBogFileName] = useState<string>('');

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'members' | 'unrecognized'>('members');

  const [rules, setRules] = useState<MappingRule[]>([]);
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});

  // Modals state
  const [selectedMemberForModal, setSelectedMemberForModal] =
    useState<MemberReconciliation | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Initialize theme, saved rules, and restore user data from localStorage
  useEffect(() => {
    // 1. Theme setup
    const savedTheme = localStorage.getItem('membership_tracker_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Rules from localStorage
    const savedRules = loadSavedRules();
    setRules(savedRules);

    // 3. Restore persisted files and overrides from localStorage
    const cached = loadMultiBankCachedData();
    if (cached.members && cached.members.length > 0) {
      setMembers(cached.members);
      if (cached.membersFileName) setMembersFileName(cached.membersFileName);
    }
    if (cached.tbcTransactions && cached.tbcTransactions.length > 0) {
      setTbcTransactions(cached.tbcTransactions);
      if (cached.tbcFileName) setTbcFileName(cached.tbcFileName);
    }
    if (cached.bogTransactions && cached.bogTransactions.length > 0) {
      setBogTransactions(cached.bogTransactions);
      if (cached.bogFileName) setBogFileName(cached.bogFileName);
    }
    if (cached.overrides && Object.keys(cached.overrides).length > 0) {
      setManualOverrides(cached.overrides);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('membership_tracker_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Combine transactions from all banks
  const allTransactions = useMemo(() => {
    return [...tbcTransactions, ...bogTransactions];
  }, [tbcTransactions, bogTransactions]);

  // Extract all distinct months present in all bank transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    allTransactions.forEach((tx) => {
      if (tx.month) monthsSet.add(tx.month);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [allTransactions]);

  // Run reconciliation engine across all banks
  const { reconciledMembers, unrecognizedPayments, summary } = useMemo(() => {
    if (members.length === 0 && allTransactions.length === 0) {
      return {
        reconciledMembers: [],
        unrecognizedPayments: [],
        summary: {
          totalActiveMembers: 0,
          paidCount: 0,
          unpaidCount: 0,
          unrecognizedCount: 0,
          unrecognizedAmount: 0,
          totalCollected: 0,
          totalTransactionsCount: 0,
          tbcCollected: 0,
          bogCollected: 0,
        },
      };
    }

    return reconcileStatements({
      members,
      transactions: allTransactions,
      selectedMonth,
      rules,
      manualOverrides,
    });
  }, [members, allTransactions, selectedMonth, rules, manualOverrides]);

  // Filter reconciled members by search query and status filter
  const filteredReconciledMembers = useMemo(() => {
    return reconciledMembers.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.member.fullName.toLowerCase().includes(q) ||
        (r.member.fullNameLatin && r.member.fullNameLatin.toLowerCase().includes(q)) ||
        r.member.firstName.toLowerCase().includes(q) ||
        r.member.lastName.toLowerCase().includes(q) ||
        r.transactions.some(
          (t) =>
            t.senderName.toLowerCase().includes(q) ||
            t.senderTransliterated.toLowerCase().includes(q) ||
            t.purpose.toLowerCase().includes(q)
        );

      const matchesStatus =
        statusFilter === 'all' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reconciledMembers, searchQuery, statusFilter]);

  // Handlers for loading 3 files with localStorage persistence
  const handleMembersLoaded = (newMembers: ClubMember[], filename: string) => {
    setMembers(newMembers);
    setMembersFileName(filename);
    saveMultiBankCachedData({
      members: newMembers,
      membersFileName: filename,
      tbcTransactions,
      tbcFileName,
      bogTransactions,
      bogFileName,
      overrides: manualOverrides,
    });
  };

  const handleTbcLoaded = (newTxs: BankTransaction[], filename: string) => {
    setTbcTransactions(newTxs);
    setTbcFileName(filename);
    saveMultiBankCachedData({
      members,
      membersFileName,
      tbcTransactions: newTxs,
      tbcFileName: filename,
      bogTransactions,
      bogFileName,
      overrides: manualOverrides,
    });
  };

  const handleBogLoaded = (newTxs: BankTransaction[], filename: string) => {
    setBogTransactions(newTxs);
    setBogFileName(filename);
    saveMultiBankCachedData({
      members,
      membersFileName,
      tbcTransactions,
      tbcFileName,
      bogTransactions: newTxs,
      bogFileName: filename,
      overrides: manualOverrides,
    });
  };

  const handleClearMembers = () => {
    setMembers([]);
    setMembersFileName('');
    clearMembersCache();
  };

  const handleClearTbc = () => {
    setTbcTransactions([]);
    setTbcFileName('');
    clearTbcCache();
  };

  const handleClearBog = () => {
    setBogTransactions([]);
    setBogFileName('');
    clearBogCache();
  };

  const handleReset = () => {
    setMembers([]);
    setTbcTransactions([]);
    setBogTransactions([]);
    setMembersFileName('');
    setTbcFileName('');
    setBogFileName('');
    setManualOverrides({});
    clearCachedSession();
  };

  const handleManualBind = (
    tx: BankTransaction,
    member: ClubMember,
    saveRule: boolean
  ) => {
    const newOverrides = { ...manualOverrides, [tx.id]: member.id };
    setManualOverrides(newOverrides);
    saveMultiBankCachedData({
      members,
      membersFileName,
      tbcTransactions,
      tbcFileName,
      bogTransactions,
      bogFileName,
      overrides: newOverrides,
    });

    if (saveRule) {
      const pattern = tx.cleanSenderName || tx.senderName;
      if (pattern) {
        const createdRule = addMappingRule({
          sourcePattern: pattern,
          patternType: 'sender',
          targetMemberId: member.id,
          targetMemberName: member.fullName,
        });
        setRules((prev) => [
          createdRule,
          ...prev.filter((r) => r.id !== createdRule.id),
        ]);
      }
    }
  };

  const handleUnlinkTransaction = (transactionId: string) => {
    const newOverrides = { ...manualOverrides };
    delete newOverrides[transactionId];
    setManualOverrides(newOverrides);
    saveMultiBankCachedData({
      members,
      membersFileName,
      tbcTransactions,
      tbcFileName,
      bogTransactions,
      bogFileName,
      overrides: newOverrides,
    });

    if (selectedMemberForModal) {
      const updated = reconciledMembers.find(
        (r) => r.member.id === selectedMemberForModal.member.id
      );
      setSelectedMemberForModal(updated || null);
    }
  };

  const handleExportExcel = () => {
    exportReconciliationToExcel({
      reconciledMembers,
      unrecognizedPayments,
      summary,
      selectedMonth,
    });
  };

  const hasData = members.length > 0 || tbcTransactions.length > 0 || bogTransactions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        onOpenRules={() => setIsRulesModalOpen(true)}
        rulesCount={rules.length}
        hasData={hasData}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 3 Upload Dropzones */}
        <FileUploadZone
          members={members}
          tbcTransactions={tbcTransactions}
          bogTransactions={bogTransactions}
          onMembersLoaded={handleMembersLoaded}
          onTbcLoaded={handleTbcLoaded}
          onBogLoaded={handleBogLoaded}
          onClearMembers={handleClearMembers}
          onClearTbc={handleClearTbc}
          onClearBog={handleClearBog}
          membersFileName={membersFileName}
          tbcFileName={tbcFileName}
          bogFileName={bogFileName}
        />

        {/* If no files loaded yet: display clean Getting Started instructions */}
        {!hasData ? (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-6">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Upload Your Files to Begin
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                To start reconciliation across both banks, upload the Active Members list, TBC Bank statement, and BOG statement above.
              </p>
            </div>

            {/* Steps Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                    Active Members
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload `.xlsx`, `.xls` or `.csv` with active members (Georgian or Latin names).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                    TBC Bank Statement
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload TBC statement with member transfers and amounts (₾).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                    BOG Bank Statement
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload Bank of Georgia statement with payments and credits (₾).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <SummaryCards
              summary={summary}
              onFilterStatus={(status) => {
                setStatusFilter(status);
                setActiveTab('members');
              }}
              activeFilter={statusFilter}
              onSelectUnrecognizedTab={() => setActiveTab('unrecognized')}
            />

            {/* Filter Bar & Tabs */}
            <MonthSelector
              availableMonths={availableMonths}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              unrecognizedCount={summary.unrecognizedCount}
              onExportExcel={handleExportExcel}
              hasData={hasData}
            />

            {/* Main Unified Content Body */}
            {activeTab === 'members' ? (
              <MembersTable
                reconciliations={filteredReconciledMembers}
                onSelectMember={(r) => setSelectedMemberForModal(r)}
              />
            ) : (
              <UnrecognizedPayments
                unrecognized={unrecognizedPayments}
                members={members}
                onManualBind={handleManualBind}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          FitPass & Membership Reconciliation Engine • Automated Georgian Alphabet Transliteration (Mkhedruli → Latin) • TBC & BOG Bank Support
        </p>
      </footer>

      {/* Transaction Details Modal */}
      {selectedMemberForModal && (
        <TransactionModal
          reconciliation={
            reconciledMembers.find(
              (r) => r.member.id === selectedMemberForModal.member.id
            ) || selectedMemberForModal
          }
          onClose={() => setSelectedMemberForModal(null)}
          onUnlinkTransaction={handleUnlinkTransaction}
        />
      )}

      {/* Saved Rules Manager Modal */}
      <RulesManagerModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
        members={members}
        onRulesUpdated={(updated) => setRules(updated)}
      />
    </div>
  );
}
