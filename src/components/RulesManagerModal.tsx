'use client';
import React, { useState } from 'react';
import {
  X,
  Sliders,
  Trash2,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { MappingRule, ClubMember } from '../lib/types';
import { addMappingRule, deleteMappingRule } from '../lib/storage';

interface RulesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: MappingRule[];
  members: ClubMember[];
  onRulesUpdated: (updatedRules: MappingRule[]) => void;
}

export function RulesManagerModal({
  isOpen,
  onClose,
  rules,
  members,
  onRulesUpdated,
}: RulesManagerModalProps) {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newPattern, setNewPattern] = useState('');
  const [newTargetMemberId, setNewTargetMemberId] = useState(members[0]?.id || '');
  const [newPatternType, setNewPatternType] = useState<'sender' | 'payer_id' | 'payer_name' | 'purpose'>('sender');

  if (!isOpen) return null;

  const filteredRules = rules.filter(
    (r) =>
      r.sourcePattern.toLowerCase().includes(search.toLowerCase()) ||
      r.targetMemberName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddRule = () => {
    if (!newPattern.trim() || !newTargetMemberId) return;
    const targetMember = members.find((m) => m.id === newTargetMemberId);
    if (!targetMember) return;

    const created = addMappingRule({
      sourcePattern: newPattern.trim(),
      patternType: newPatternType,
      targetMemberId: targetMember.id,
      targetMemberName: targetMember.fullName,
    });

    onRulesUpdated([created, ...rules.filter((r) => r.id !== created.id)]);
    setNewPattern('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    deleteMappingRule(id);
    onRulesUpdated(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Saved Matching Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stored locally in browser (localStorage)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search rules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </button>
          </div>

          {/* Add Rule Form */}
          {isAdding && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-emerald-300 dark:border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                New Rule
              </h4>
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Sender text or Payer ID in statement (e.g. «ი/მ ნინო ბაგალიშვილი»):
                </label>
                <input
                  type="text"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  placeholder="Enter name, company or ID..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Field Type:
                  </label>
                  <select
                    value={newPatternType}
                    onChange={(e: any) => setNewPatternType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="sender">Sender Name</option>
                    <option value="payer_id">Payer ID Code</option>
                    <option value="payer_name">Payer Company / Name</option>
                    <option value="purpose">Payment Purpose</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Club Member:
                  </label>
                  <select
                    value={newTargetMemberId}
                    onChange={(e) => setNewTargetMemberId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={!newPattern.trim() || !newTargetMemberId}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Save Rule
                </button>
              </div>
            </div>
          )}

          {/* List of Rules */}
          {filteredRules.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
              {rules.length === 0
                ? 'No saved rules. Rules are automatically created when you manually link unmatched payments.'
                : 'No rules found matching your search.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        «{rule.sourcePattern}»
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                        {rule.patternType}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                      <span>→ Linked to:</span>
                      <span className="font-bold">{rule.targetMemberName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
