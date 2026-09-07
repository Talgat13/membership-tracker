'use client';
import React, { useState } from 'react';
import {
  MemberReconciliation,
  PaymentStatus,
} from '../lib/types';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface MembersTableProps {
  reconciliations: MemberReconciliation[];
  onSelectMember: (reconciliation: MemberReconciliation) => void;
}

export function MembersTable({
  reconciliations,
  onSelectMember,
}: MembersTableProps) {
  const [sortField, setSortField] = useState<'name' | 'paid' | 'status' | 'count'>('status');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: 'name' | 'paid' | 'status' | 'count') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedData = [...reconciliations].sort((a, b) => {
    let diff = 0;
    if (sortField === 'name') {
      diff = a.member.fullName.localeCompare(b.member.fullName);
    } else if (sortField === 'paid') {
      diff = a.paidAmount - b.paidAmount;
    } else if (sortField === 'count') {
      diff = a.paymentCount - b.paymentCount;
    } else if (sortField === 'status') {
      const order: Record<PaymentStatus, number> = {
        unpaid: 0,
        paid: 1,
      };
      diff = order[a.status] - order[b.status];
    }
    return sortAsc ? diff : -diff;
  });

  const getStatusBadge = (status: PaymentStatus) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30">
        <XCircle className="w-3.5 h-3.5 mr-1" /> Unpaid
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Member Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-center"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('paid')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Paid (₾)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('count')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-center"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Payments</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3.5 px-4 text-left">Matched Transactions (Bank, Sender, Date)</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  No data to display. Please upload members and bank statement files.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row.member.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Member Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-xs flex-shrink-0">
                        {row.member.firstName ? row.member.firstName.charAt(0).toUpperCase() : ''}
                        {row.member.lastName ? row.member.lastName.charAt(0).toUpperCase() : ''}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {row.member.fullName}
                          {row.member.fullNameLatin && row.member.fullNameLatin !== row.member.fullName && (
                            <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                              ({row.member.fullNameLatin})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {row.member.status}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(row.status)}
                  </td>

                  {/* Paid Amount */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`text-base font-bold ${
                        row.paidAmount > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {row.paidAmount.toLocaleString()} ₾
                    </span>
                  </td>

                  {/* Payment Count */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {row.paymentCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {row.paymentCount} {row.paymentCount === 1 ? 'txn' : 'txns'}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Transactions list */}
                  <td className="py-3.5 px-4">
                    {row.transactions.length > 0 ? (
                      <div className="space-y-1.5 max-w-md">
                        {row.transactions.map((t, idx) => (
                          <div key={t.id || idx} className="flex items-center space-x-1.5 text-xs truncate">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                t.bank === 'TBC'
                                  ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400'
                                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                              }`}
                            >
                              {t.bank || 'Bank'}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-200">
                              {t.amount} ₾
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                              ({t.date})
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-[11px] truncate">
                              • {t.senderName || t.payerName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 text-xs italic">
                        No payments recorded
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectMember(row)}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
