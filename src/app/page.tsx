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
  loadCachedData,
  saveCachedData,
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

  // Initialize theme and cached data
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('membership_tracker_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Rules
    const savedRules = loadSavedRules();
    setRules(savedRules);

    // Cached or Sample Data
    const cached = loadCachedData();
    if (cached.members && cached.members.length > 0) {
      setMembers(cached.members);
      setMembersFileName('Cached Members List');
    } else {
      setMembers(SAMPLE_ACTIVE_MEMBERS);
      setMembersFileName('Active_შპს_ბასა_2026-08-03.xlsx (Demo)');
    }

    if (cached.transactions && cached.transactions.length > 0) {
      setTransactions(cached.transactions);
      setTransactionsFileName('Cached Bank Statement');
    } else {
      setTransactions(SAMPLE_BANK_TRANSACTIONS);
      setTransactionsFileName('Report 20.07.26-03.08.26.xlsx (Demo)');
    }

    if (cached.overrides) {
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

  // Update localStorage when members or transactions change
  useEffect(() => {
    if (members.length > 0 || transactions.length > 0) {
      saveCachedData(members, transactions, manualOverrides);
    }
  }, [members, transactions, manualOverrides]);

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
    saveCachedData(members, transactions, newOverrides);

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
    saveCachedData(members, transactions, newOverrides);

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
