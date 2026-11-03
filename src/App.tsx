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
import { ShieldCheck, Sparkles, X, Heart } from 'lucide-react';

export default function App() {
  const [entries, setEntries] = useState<DailyEntry[]>(() => {
    return loadStoredEntries();
  });

  const [goals, setGoals] = useState<UserGoals>(() => loadStoredGoals());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);

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
