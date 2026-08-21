'use client';
import React from 'react';
import {
  X,
  CreditCard,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MemberReconciliation, BankTransaction, MatchMethod } from '../lib/types';

interface TransactionModalProps {
  reconciliation: MemberReconciliation | null;
  onClose: () => void;
  onUnlinkTransaction?: (transactionId: string) => void;
}

export function TransactionModal({
  reconciliation,
  onClose,
  onUnlinkTransaction,
}: TransactionModalProps) {
  if (!reconciliation) return null;

  const { member, transactions, matchDetails, paidAmount, paymentCount, status } =
    reconciliation;

  const getMethodBadge = (method: MatchMethod, confidence: number) => {
    switch (method) {
      case 'saved_rule':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
            <Sparkles className="w-3 h-3 mr-1" /> Saved Rule
          </span>
        );
      case 'exact':
      case 'transliterated':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Exact Match
          </span>
        );
      case 'inverted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
            Last Name First
          </span>
        );
      case 'purpose':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
            Found in Purpose
          </span>
        );
      case 'fuzzy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            Fuzzy Match ({Math.round(confidence * 100)}%)
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
            Manual Link
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {method}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              {member.firstName.charAt(0)}
              {member.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {member.fullName}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Club Status: {member.status}</span>
                <span>•</span>
                <span>Payments: {paymentCount}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="p-4 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Received Payments</span>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {paidAmount.toLocaleString()} ₾
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
              }`}
            >
              {status === 'paid' ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </div>

        {/* Transactions List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Matched Transactions ({transactions.length})
          </h3>

          {transactions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              No payments recorded for this member in the selected period.
            </div>
          ) : (
            transactions.map((tx, idx) => {
              const detail = matchDetails[idx];
              return (
                <div
                  key={tx.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {tx.amount.toLocaleString()} ₾
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {tx.date}
                      </span>
                    </div>

                    {detail && getMethodBadge(detail.method, detail.confidence)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                        Sender (Georgian)
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {tx.senderName || tx.payerName}
                      </span>
                      {tx.senderTransliterated && (
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-mono">
                          → {tx.senderTransliterated}
                        </span>
                      )}
                    </div>

                    {tx.payerName && tx.payerName !== tx.senderName && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                          Payer / Company
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-200">
                          {tx.payerName}
                        </span>
                        {tx.payerTransliterated && (
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-mono">
                            → {tx.payerTransliterated}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {tx.purpose && (
                    <div className="text-xs bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">
                        Payment Purpose
                      </span>
                      {tx.purpose}
                      {tx.purposeTransliterated && tx.purposeTransliterated !== tx.purpose && (
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          → {tx.purposeTransliterated}
                        </div>
                      )}
                    </div>
                  )}

                  {onUnlinkTransaction && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => onUnlinkTransaction(tx.id)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline cursor-pointer"
                      >
                        Unlink Payment
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
