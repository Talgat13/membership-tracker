'use client';
import React, { useState } from 'react';
import {
  UnrecognizedPayment,
  ClubMember,
  BankTransaction,
} from '../lib/types';
import {
  HelpCircle,
  Link,
  Sparkles,
  Calendar,
  Check,
  Search,
  X,
} from 'lucide-react';

interface UnrecognizedPaymentsProps {
  unrecognized: UnrecognizedPayment[];
  members: ClubMember[];
  onManualBind: (
    transaction: BankTransaction,
    member: ClubMember,
    saveRule: boolean
  ) => void;
}

export function UnrecognizedPayments({
  unrecognized,
  members,
  onManualBind,
}: UnrecognizedPaymentsProps) {
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [saveAsRule, setSaveAsRule] = useState<boolean>(true);
  const [memberSearch, setMemberSearch] = useState<string>('');

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleOpenBindModal = (payment: UnrecognizedPayment) => {
    setSelectedTx(payment.transaction);
    setTargetMemberId(payment.bestGuess?.member.id || (members[0]?.id ?? ''));
    setSaveAsRule(true);
    setMemberSearch('');
  };

  const handleConfirmBind = () => {
    if (!selectedTx || !targetMemberId) return;
    const targetMember = members.find((m) => m.id === targetMemberId);
    if (!targetMember) return;

    onManualBind(selectedTx, targetMember, saveAsRule);
    setSelectedTx(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
              Unmatched Transactions ({unrecognized.length})
            </h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
              Payments that could not be matched automatically. You can manually link them to a member and save a persistent rule.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Amount (₾)</th>
                <th className="py-3.5 px-4">Sender / Payer (Georgian / Latin)</th>
                <th className="py-3.5 px-4">Payment Purpose</th>
                <th className="py-3.5 px-4">Suggested Match</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
              {unrecognized.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    All payments have been matched successfully! No unmatched transactions.
                  </td>
                </tr>
              ) : (
                unrecognized.map((item) => {
                  const tx = item.transaction;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-mono text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{tx.date}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                          {tx.amount.toLocaleString()} ₾
                        </span>
                      </td>

                      {/* Sender / Payer */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {tx.senderName || tx.payerName || '—'}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                            {tx.senderTransliterated || tx.payerTransliterated}
                          </div>
                          {tx.payerId && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              ID: {tx.payerId}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <div className="text-slate-700 dark:text-slate-300 text-xs truncate" title={tx.purpose}>
                          {tx.purpose || '—'}
                        </div>
                        {tx.purposeTransliterated && tx.purposeTransliterated !== tx.purpose && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {tx.purposeTransliterated}
                          </div>
                        )}
                      </td>

                      {/* Best Guess */}
                      <td className="py-3.5 px-4">
                        {item.bestGuess ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTx(tx);
                              setTargetMemberId(item.bestGuess!.member.id);
                              setSaveAsRule(true);
                            }}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-xs transition-colors text-left cursor-pointer"
                            title="Click to link with recommended member"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="truncate">
                              {item.bestGuess.member.fullName} ({Math.round(item.bestGuess.confidence * 100)}%)
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenBindModal(item)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs cursor-pointer"
                        >
                          <Link className="w-3.5 h-3.5 mr-1" />
                          Link Member
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Bind Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center space-x-2">
                <Link className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Manual Payment Linking
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Payment Details Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Amount & Date:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    {selectedTx.amount.toLocaleString()} ₾ • {selectedTx.date}
                  </span>
                </div>
                <div className="flex justify-between items-start text-slate-800 dark:text-slate-300">
                  <span className="text-slate-500">Sender:</span>
                  <span className="font-semibold text-right">
                    {selectedTx.senderName || selectedTx.payerName}
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      ({selectedTx.cleanSenderTransliterated || selectedTx.senderTransliterated})
                    </span>
                  </span>
                </div>
                {selectedTx.purpose && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Purpose:</span>
                    {selectedTx.purpose}
                  </div>
                )}
              </div>

              {/* Target Member Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select a member to link with:
                </label>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTargetMemberId(m.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        targetMemberId === m.id
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{m.fullName}</span>
                      <span className="text-[11px] opacity-80">{m.status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remember Rule Checkbox */}
              <div className="pt-1">
                <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={saveAsRule}
                    onChange={(e) => setSaveAsRule(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block">
                      Save persistent rule in localStorage
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Automatically link «{selectedTx.cleanSenderName || selectedTx.senderName}» to the selected member in future bank statements.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBind}
                disabled={!targetMemberId}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Link Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
