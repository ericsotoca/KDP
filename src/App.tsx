/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyEntry, UserGoals, ActiveTab } from './types';
import { 
  loadStoredEntries, 
  saveStoredEntries, 
  loadStoredGoals, 
  saveStoredGoals, 
  generateRealisticDemoData 
} from './utils/storage';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DailyEntryForm } from './components/DailyEntryForm';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { GoalsView } from './components/GoalsView';
import { BackupView } from './components/BackupView';
import { ShieldCheck, Sparkles, X, Heart, Zap, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getMonthNameFr } from './utils/calculations';

export default function App() {
  const [entries, setEntries] = useState<DailyEntry[]>(() => {
    return loadStoredEntries();
  });

  const [goals, setGoals] = useState<UserGoals>(() => loadStoredGoals());

  // Le fichier public est la source prioritaire ; LocalStorage sert de secours hors ligne.
  useEffect(() => {
    let cancelled = false;

    const loadSharedData = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}kdp-data.json`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Fichier partagé indisponible');

        const data = await response.json();
        if (!Array.isArray(data.entries)) throw new Error('Format des données partagées invalide');

        const validEntries = data.entries.filter((entry: any) =>
          typeof entry.date === 'string' &&
          typeof entry.revenue === 'number' &&
          typeof entry.adsCost === 'number'
        ) as DailyEntry[];

        if (!cancelled && validEntries.length > 0) {
          const sorted = validEntries.sort((a, b) => b.date.localeCompare(a.date));
          setEntries(sorted);
          saveStoredEntries(sorted);
        }
      } catch {
        // En cas d'indisponibilité du fichier, les données déjà chargées depuis le téléphone restent actives.
      }
    };

    loadSharedData();
    return () => {
      cancelled = true;
    };
  }, []);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
  const [syncToast, setSyncToast] = useState<{
    message: string;
    adsCost?: number;
    revenue?: number;
  } | null>(null);

  // Auto-sync from URL parameters (1-Click Bookmarklet or direct URL sync)
  useEffect(() => {
    try {
      const search = window.location.search;
      if (!search) return;
      const params = new URLSearchParams(search);
      const isSync = params.get('sync') === 'amazon_ads';
      const syncAds = params.get('syncAds') || params.get('syncCost') || params.get('coutTotal') || params.get('cout');
      const syncRev = params.get('syncRev') || params.get('syncRevenue') || params.get('syncSales');
      const paramYear = params.get('year') ? parseInt(params.get('year')!, 10) : null;
      const paramMonth = params.get('month') ? parseInt(params.get('month')!, 10) : null;

      if (isSync || syncAds || syncRev) {
        const adsVal = syncAds ? parseFloat(syncAds.replace(',', '.')) : 0;
        const revVal = syncRev ? parseFloat(syncRev.replace(',', '.')) : 0;
        const targetYear = paramYear && !isNaN(paramYear) ? paramYear : now.getFullYear();
        const targetMonth = paramMonth && !isNaN(paramMonth) ? paramMonth : (now.getMonth() + 1);

        if (!isNaN(adsVal) && (adsVal > 0 || revVal > 0)) {
          const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
          const currentEntry = entries.find((e) => e.date.startsWith(monthPrefix));
          const existingRev = currentEntry?.revenue || 0;
          const existingAds = currentEntry?.adsCost || 0;

          const finalRev = revVal > 0 ? revVal : existingRev;
          const finalAds = adsVal > 0 ? adsVal : existingAds;

          handleSaveMonthlySummary(targetYear, targetMonth, finalRev, finalAds);
          setSelectedYear(targetYear);
          setSelectedMonth(targetMonth);
          setActiveTab('dashboard');

          setSyncToast({
            message: `Synchronisation Amazon Ads réussie pour ${getMonthNameFr(targetMonth)} ${targetYear} !`,
            adsCost: adsVal > 0 ? adsVal : undefined,
            revenue: revVal > 0 ? revVal : undefined,
          });

          // Clean up URL without reload
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          setTimeout(() => {
            setSyncToast(null);
          }, 8000);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save entries whenever updated
  const handleSaveEntry = (
    data: Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const timestamp = new Date().toISOString();
    let updated: DailyEntry[];

    if (existingId) {
      updated = entries.map((item) =>
        item.id === existingId
          ? {
              ...item,
              ...data,
              isDemo: false,
              updatedAt: timestamp,
            }
          : item
      );
    } else {
      const newEntry: DailyEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...data,
        isDemo: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      updated = [newEntry, ...entries];
    }

    // Sort descending by date
    updated.sort((a, b) => b.date.localeCompare(a.date));
    setEntries(updated);
    saveStoredEntries(updated);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveStoredEntries(updated);
    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
  };

  const handleEditEntry = (entry: DailyEntry) => {
    setEditingEntry(entry);
    setActiveTab('entry');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateGoals = (newGoals: UserGoals) => {
    setGoals(newGoals);
    saveStoredGoals(newGoals);
  };

  const handleClearAll = () => {
    setEntries([]);
    saveStoredEntries([]);
    setEditingEntry(null);
  };

  const handleImportSuccess = (importedEntries: DailyEntry[], importedGoals?: UserGoals) => {
    setEntries(importedEntries);
    saveStoredEntries(importedEntries);
    if (importedGoals) {
      setGoals(importedGoals);
      saveStoredGoals(importedGoals);
    }
    setActiveTab('dashboard');
  };

  const handleSaveMonthlySummary = (
    year: number,
    month: number,
    revenue: number,
    adsCost: number,
    booksSold?: number
  ) => {
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    const timestamp = new Date().toISOString();

    const newMonthlyEntry: DailyEntry = {
      id: `monthly-${year}-${monthStr}`,
      date: `${year}-${monthStr}-01`,
      revenue: Math.max(0, revenue),
      adsCost: Math.max(0, adsCost),
      booksSold: booksSold != null && !isNaN(booksSold) ? Math.max(0, booksSold) : undefined,
      comment: `Saisie globale mensuelle`,
      isMonthlyTotal: true,
      isDemo: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Remove any previous entries for that month (e.g. previous monthly entry)
    const remaining = entries.filter((e) => !e.date.startsWith(prefix));
    const updated = [newMonthlyEntry, ...remaining].sort((a, b) => b.date.localeCompare(a.date));

    setEntries(updated);
    saveStoredEntries(updated);
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      
      {/* Toast Notification de Synchronisation Réussie */}
      {syncToast && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 shadow-md border-b border-emerald-500 animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white shadow-2xs">
                ⚡
              </span>
              <div>
                <strong className="text-sm font-bold block">{syncToast.message}</strong>
                <span className="text-xs text-emerald-100">
                  {syncToast.adsCost != null && `Amazon Ads : ${formatCurrency(syncToast.adsCost)} `}
                  {syncToast.revenue != null && `· CA KDP : ${formatCurrency(syncToast.revenue)}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSyncToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewEntry={() => setEditingEntry(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            entries={entries}
            goals={goals}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSelectYear={setSelectedYear}
            onSelectMonth={setSelectedMonth}
            setActiveTab={setActiveTab}
            onEditEntry={handleEditEntry}
            onSaveMonthlySummary={handleSaveMonthlySummary}
          />
        )}

        {activeTab === 'entry' && (
          <DailyEntryForm
            entries={entries}
            editingEntry={editingEntry}
            onSaveEntry={handleSaveEntry}
            onSaveMonthlySummary={handleSaveMonthlySummary}
            onCancelEdit={() => setEditingEntry(null)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            entries={entries}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSelectYear={setSelectedYear}
            onSelectMonth={setSelectedMonth}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            entries={entries}
            goals={goals}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSelectYear={setSelectedYear}
            onSelectMonth={setSelectedMonth}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            onUpdateGoals={handleUpdateGoals}
            entries={entries}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'backup' && (
          <BackupView
            entries={entries}
            goals={goals}
            onImportSuccess={handleImportSuccess}
            onClearAll={handleClearAll}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">KDP Business Tracker</span>
            <span>·</span>
            <span>Suivi quotidien & rentabilité Amazon Ads</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Hors-ligne · Données stockées localement
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
