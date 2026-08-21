'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Sparkles,
  RotateCcw,
  Sliders,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onLoadSamples: () => void;
  onReset: () => void;
  onOpenRules: () => void;
  rulesCount: number;
  hasData: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({
  onLoadSamples,
  onReset,
  onOpenRules,
  rulesCount,
  hasData,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                FitPass & Membership Matcher
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                ₾ GEL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Automated reconciliation of Georgian bank statements with club members
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            type="button"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <button
            onClick={onLoadSamples}
            type="button"
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            title="Load sample data from data-samples folder"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-emerald-200" />
            <span>Load Demo</span>
          </button>

          <button
            onClick={onOpenRules}
            type="button"
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 cursor-pointer"
          >
            <Sliders className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400" />
            <span>Rules</span>
            {rulesCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {rulesCount}
              </span>
            )}
          </button>

          {hasData && (
            <button
              onClick={onReset}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Clear all loaded files"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Logout / Lock Button */}
          <button
            onClick={handleLogout}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
            title="Lock application (Log out)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
