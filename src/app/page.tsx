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
  FileSpreadsheet,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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
  SAMPLE_ACTIVE_MEMBERS,
  SAMPLE_BANK_TRANSACTIONS,
} from '@/lib/sample-data';
import {
  loadSavedRules,
  addMappingRule,
  clearCachedSession,
} from '@/lib/storage';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [membersFileName, setMembersFileName] = useState<string>('');
  const [transactionsFileName, setTransactionsFileName] = useState<string>('');

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

  // Initialize theme and saved rules (clean start without preloaded demo data)
  useEffect(() => {
    const savedTheme = localStorage.getItem('membership_tracker_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Rules from localStorage
    const savedRules = loadSavedRules();
    setRules(savedRules);
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

  // Extract all distinct months present in transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.month) monthsSet.add(tx.month);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  // Run reconciliation engine
  const { reconciledMembers, unrecognizedPayments, summary } = useMemo(() => {
    if (members.length === 0 && transactions.length === 0) {
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
        },
      };
    }

    return reconcileStatements({
      members,
      transactions,
      selectedMonth,
      rules,
      manualOverrides,
    });
  }, [members, transactions, selectedMonth, rules, manualOverrides]);

  // Filter reconciled members by search query and status filter
  const filteredReconciledMembers = useMemo(() => {
    return reconciledMembers.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.member.fullName.toLowerCase().includes(q) ||
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

  // Actions
  const handleLoadSamples = () => {
    setMembers(SAMPLE_ACTIVE_MEMBERS);
    setTransactions(SAMPLE_BANK_TRANSACTIONS);
    setMembersFileName('Active_შპს_ბასა_2026-08-03.xlsx (Demo)');
    setTransactionsFileName('Report 20.07.26-03.08.26.xlsx (Demo)');
    setSelectedMonth('all');
    setManualOverrides({});
  };

  const handleReset = () => {
    setMembers([]);
    setTransactions([]);
    setMembersFileName('');
    setTransactionsFileName('');
    setManualOverrides({});
    clearCachedSession();
  };

  const handleMembersLoaded = (newMembers: ClubMember[], filename: string) => {
    setMembers(newMembers);
    setMembersFileName(filename);
  };

  const handleTransactionsLoaded = (newTxs: BankTransaction[], filename: string) => {
    setTransactions(newTxs);
    setTransactionsFileName(filename);
  };

  const handleManualBind = (
    tx: BankTransaction,
    member: ClubMember,
    saveRule: boolean
  ) => {
    const newOverrides = { ...manualOverrides, [tx.id]: member.id };
    setManualOverrides(newOverrides);

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

  const hasData = members.length > 0 || transactions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <Header
        onLoadSamples={handleLoadSamples}
        onReset={handleReset}
        onOpenRules={() => setIsRulesModalOpen(true)}
        rulesCount={rules.length}
        hasData={hasData}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upload Dropzones */}
        <FileUploadZone
          members={members}
          transactions={transactions}
          onMembersLoaded={handleMembersLoaded}
          onTransactionsLoaded={handleTransactionsLoaded}
          onClearMembers={() => {
            setMembers([]);
            setMembersFileName('');
          }}
          onClearTransactions={() => {
            setTransactions([]);
            setTransactionsFileName('');
          }}
          membersFileName={membersFileName}
          transactionsFileName={transactionsFileName}
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
                To start reconciliation, upload the Active Members list and the Georgian Bank Statement above.
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
                  Upload `.xlsx`, `.xls` or `.csv` with member names (Latin / English).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                    Bank Statement
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload TBC or BOG statement with Georgian sender names and amounts (₾).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                    Auto-Match
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant Georgian transliteration, fuzzy matching, and exportable report.
                </p>
              </div>
            </div>

            {/* Quick Demo Shortcut */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleLoadSamples}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Or click here to load sample demo data</span>
              </button>
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
          FitPass & Membership Reconciliation Engine • Automated Georgian Alphabet Transliteration (Mkhedruli → Latin)
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
