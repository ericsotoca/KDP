import React, { useState, useEffect } from 'react';
import { DailyEntry, UserGoals, ActiveTab } from '../types';
import { 
  formatCurrency, 
  formatPercent, 
  getMonthMetrics, 
  getDayMetrics, 
  getYearMetrics,
  getMonthNameFr,
  getTodayDateString,
  formatDateFr,
  formatLastUpdated
} from '../utils/calculations';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Megaphone, 
  Calendar, 
  BookOpen, 
  Target, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Clock,
  RotateCw,
  Check,
  Percent,
  HelpCircle
} from 'lucide-react';

interface DashboardViewProps {
  entries: DailyEntry[];
  goals: UserGoals;
  selectedYear: number;
  selectedMonth: number;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onEditEntry: (entry: DailyEntry) => void;
  onSaveMonthlySummary?: (year: number, month: number, revenue: number, adsCost: number, booksSold?: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  entries,
  goals,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
  setActiveTab,
  onEditEntry,
  onSaveMonthlySummary,
}) => {
  const todayStr = getTodayDateString();
  const dayMetrics = getDayMetrics(entries, todayStr);
  const monthMetrics = getMonthMetrics(entries, selectedYear, selectedMonth);
  const yearMetrics = getYearMetrics(entries, selectedYear);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onSelectMonth(12);
      onSelectYear(selectedYear - 1);
    } else {
      onSelectMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onSelectMonth(1);
      onSelectYear(selectedYear + 1);
    } else {
      onSelectMonth(selectedMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    onSelectYear(now.getFullYear());
    onSelectMonth(now.getMonth() + 1);
  };

  // Goals progress calculation
  const revenueGoalPct = Math.min(
    100,
    goals.monthlyRevenueGoal > 0 ? (monthMetrics.monthRevenue / goals.monthlyRevenueGoal) * 100 : 0
  );
  const profitGoalPct = Math.min(
    100,
    goals.monthlyProfitGoal > 0 ? Math.max(0, (monthMetrics.monthProfit / goals.monthlyProfitGoal) * 100) : 0
  );

  // Filter entries for the selected month to show recent activity
  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthEntries = entries
    .filter((e) => e.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date));

  const recentEntries = monthEntries.slice(0, 5);

  const isCurrentMonth = 
    new Date().getFullYear() === selectedYear && 
    new Date().getMonth() + 1 === selectedMonth;

  // Quick 2-number state for dashboard
  const [quickRevenue, setQuickRevenue] = useState<string>('');
  const [quickAds, setQuickAds] = useState<string>('');
  const [quickSaved, setQuickSaved] = useState<boolean>(false);

  // Sync quick inputs with current month metrics
  useEffect(() => {
    if (monthMetrics.monthRevenue > 0 || monthMetrics.monthAds > 0) {
      setQuickRevenue(monthMetrics.monthRevenue ? monthMetrics.monthRevenue.toString() : '');
      setQuickAds(monthMetrics.monthAds ? monthMetrics.monthAds.toString() : '');
    } else {
      setQuickRevenue('');
      setQuickAds('');
    }
  }, [selectedYear, selectedMonth, monthMetrics.monthRevenue, monthMetrics.monthAds]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rev = parseFloat(quickRevenue.replace(',', '.')) || 0;
    const ads = parseFloat(quickAds.replace(',', '.')) || 0;

    if (onSaveMonthlySummary) {
      onSaveMonthlySummary(selectedYear, selectedMonth, rev, ads);
      setQuickSaved(true);
      setTimeout(() => setQuickSaved(false), 3000);
    }
  };

  const parsedQuickRev = parseFloat(quickRevenue.replace(',', '.')) || 0;
  const parsedQuickAds = parseFloat(quickAds.replace(',', '.')) || 0;
  const quickProfit = parsedQuickRev - parsedQuickAds;
  const quickMargin = parsedQuickRev > 0 ? (quickProfit / parsedQuickRev) * 100 : 0;

  // Find current month entry to show last update timestamp
  const currentMonthEntry = entries.find((e) => e.date.startsWith(monthPrefix));
  const lastUpdatedStr = currentMonthEntry ? formatLastUpdated(currentMonthEntry.updatedAt) : null;

  return (
    <div className="space-y-6">
      
      {/* Month Selector & Context Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {getMonthNameFr(selectedMonth)} {selectedYear}
              </h2>
              {isCurrentMonth && (
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  En cours
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vue synthétique des performances et de la rentabilité
            </p>
          </div>
        </div>

        {/* Date Navigation Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isCurrentMonth && (
            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              Mois actuel
            </button>
          )}

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
              title="Mois précédent"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-700 min-w-28 text-center">
              {getMonthNameFr(selectedMonth).slice(0, 4)}. {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
              title="Mois suivant"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK 2-NUMBER ENTRY WIDGET FOR THE MONTH */}
      <form
        onSubmit={handleQuickSubmit}
        className="bg-gradient-to-br from-blue-50/90 via-white to-amber-50/60 rounded-xl border border-blue-200/90 p-5 shadow-xs transition-all space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              ⚡
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Saisie express du mois ({getMonthNameFr(selectedMonth)} {selectedYear}) : 2 chiffres
              </h3>
              <p className="text-[11px] text-slate-500">
                Actualisable à tout moment dès que votre CA KDP progresse au fil de la journée
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {quickSaved ? (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chiffres actualisés !</span>
              </span>
            ) : lastUpdatedStr ? (
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Dernière mise à jour : {lastUpdatedStr}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-1">
          
          {/* Chiffre 1: CA KDP */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                1. Chiffre d'affaires KDP du mois (€)
              </label>
              {Math.abs(parsedQuickRev - monthMetrics.monthRevenue) >= 0.01 && monthMetrics.monthRevenue > 0 && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  parsedQuickRev >= monthMetrics.monthRevenue
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {parsedQuickRev >= monthMetrics.monthRevenue ? '+' : ''}
                  {(parsedQuickRev - monthMetrics.monthRevenue).toFixed(2)} €
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-blue-600 pointer-events-none">
                €
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={quickRevenue}
                onChange={(e) => setQuickRevenue(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-base font-bold font-mono-numbers bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-blue-700 shadow-2xs"
              />
            </div>
            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-1 mt-1.5 text-[11px]">
              <span className="text-slate-400 text-[10px] mr-0.5">Ajout rapide :</span>
              {[2, 5, 10, 25].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    const current = parseFloat(quickRevenue.replace(',', '.')) || 0;
                    setQuickRevenue((Math.round((current + amt) * 100) / 100).toFixed(2));
                  }}
                  className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 font-mono-numbers font-medium transition-colors cursor-pointer"
                  title={`Ajouter +${amt} € au CA`}
                >
                  +{amt}€
                </button>
              ))}
            </div>
          </div>

          {/* Chiffre 2: Amazon Ads */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                2. Amazon Ads du mois (€)
              </label>
              {Math.abs(parsedQuickAds - monthMetrics.monthAds) >= 0.01 && monthMetrics.monthAds > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  {parsedQuickAds >= monthMetrics.monthAds ? '+' : ''}
                  {(parsedQuickAds - monthMetrics.monthAds).toFixed(2)} €
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-amber-600 pointer-events-none">
                €
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={quickAds}
                onChange={(e) => setQuickAds(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-base font-bold font-mono-numbers bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-amber-700 shadow-2xs"
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
              <span>Bénéfice : <strong className={`font-mono-numbers ${quickProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(quickProfit)}</strong></span>
              <span>Marge : <strong className="font-mono-numbers">{parsedQuickRev > 0 ? formatPercent(quickMargin) : '0%'}</strong></span>
            </div>
          </div>

          {/* Bouton d'actualisation */}
          <div className="lg:col-span-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Actualiser les chiffres</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Touche Entrée pour valider
            </p>
          </div>

        </div>
      </form>

      {/* 4 PRIMARY INDICATOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. CA DU JOUR */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              CA du jour
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold font-mono-numbers text-blue-600">
              {formatCurrency(dayMetrics.todayRevenue)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Bénéfice jour :</span>
              <span className={`font-mono-numbers font-semibold ${dayMetrics.todayProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(dayMetrics.todayProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Livres vendus :</span>
              <span className="font-mono-numbers font-medium text-slate-700">
                {dayMetrics.todayBooks} ex.
              </span>
            </div>
          </div>
        </div>

        {/* 2. CA DU MOIS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              CA du mois
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold font-mono-numbers text-blue-700">
              {formatCurrency(monthMetrics.monthRevenue)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Moyenne quotidienne :</span>
              <span className="font-mono-numbers font-medium text-slate-700">
                {formatCurrency(monthMetrics.dailyAverageRevenue)} / j
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Ventes totales :</span>
              <span className="font-mono-numbers font-medium text-slate-700">
                {monthMetrics.monthBooks} livres
              </span>
            </div>
          </div>
        </div>

        {/* 3. PUBLICITÉ DU MOIS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Publicité du mois
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold font-mono-numbers text-amber-600">
              {formatCurrency(monthMetrics.monthAds)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>ACOS (Part pub/CA) :</span>
              <span className="font-mono-numbers font-semibold text-amber-700">
                {monthMetrics.acos > 0 ? `${monthMetrics.acos.toFixed(1)} %` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>ROAS (Retour pub) :</span>
              <span className="font-mono-numbers font-medium text-slate-700">
                {monthMetrics.roas > 0 ? `${monthMetrics.roas.toFixed(2)}x` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. BÉNÉFICE DU MOIS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bénéfice du mois
            </span>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              monthMetrics.monthProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {monthMetrics.monthProfit >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl lg:text-3xl font-bold font-mono-numbers ${
              monthMetrics.monthProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {formatCurrency(monthMetrics.monthProfit)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Marge bénéficiaire :</span>
              <span className={`font-mono-numbers font-bold ${
                monthMetrics.marginPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatPercent(monthMetrics.marginPercent)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Jours saisis :</span>
              <span className="font-mono-numbers font-medium text-slate-700">
                {monthMetrics.daysLogged} jours
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: OBJECTIFS DU MOIS & BILAN ANNUEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OBJECTIFS DU MOIS (2 COLUMNS) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">
                Objectifs mensuels ({getMonthNameFr(selectedMonth)})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('goals')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Personnaliser</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Objectif Chiffre d'Affaires */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-700 font-medium">Chiffre d'affaires mensuel</span>
                <span className="font-mono-numbers text-xs font-semibold text-slate-900">
                  {formatCurrency(monthMetrics.monthRevenue)} / {formatCurrency(goals.monthlyRevenueGoal)}
                  <span className="ml-2 text-blue-600">({revenueGoalPct.toFixed(0)} %)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, revenueGoalPct))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>
                  {monthMetrics.monthRevenue >= goals.monthlyRevenueGoal
                    ? '🎉 Objectif CA atteint !'
                    : `Reste ${formatCurrency(Math.max(0, goals.monthlyRevenueGoal - monthMetrics.monthRevenue))} pour l'objectif`}
                </span>
                <span>Cible : {formatCurrency(goals.monthlyRevenueGoal)}</span>
              </div>
            </div>

            {/* Objectif Bénéfice */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-700 font-medium">Bénéfice net après publicité</span>
                <span className="font-mono-numbers text-xs font-semibold text-slate-900">
                  {formatCurrency(monthMetrics.monthProfit)} / {formatCurrency(goals.monthlyProfitGoal)}
                  <span className={`ml-2 ${monthMetrics.monthProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ({profitGoalPct.toFixed(0)} %)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    monthMetrics.monthProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, profitGoalPct))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>
                  {monthMetrics.monthProfit >= goals.monthlyProfitGoal
                    ? '🏆 Objectif Bénéfice dépassé !'
                    : `Reste ${formatCurrency(Math.max(0, goals.monthlyProfitGoal - monthMetrics.monthProfit))} pour atteindre la cible`}
                </span>
                <span>Cible : {formatCurrency(goals.monthlyProfitGoal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BILAN ANNUEL CUMULÉ (YTD) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm">
                Cumul Année {selectedYear} (YTD)
              </h3>
              <span className="text-[11px] font-mono-numbers text-slate-500">
                {yearMetrics.daysLogged} jours saisis
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">CA Annuel cumulé</span>
                <span className="font-mono-numbers font-semibold text-blue-700 text-sm">
                  {formatCurrency(yearMetrics.yearRevenue)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Dépenses Amazon Ads</span>
                <span className="font-mono-numbers font-semibold text-amber-600 text-sm">
                  {formatCurrency(yearMetrics.yearAds)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-medium text-slate-700">Bénéfice Annuel net</span>
                <span className={`font-mono-numbers font-bold text-base ${
                  yearMetrics.yearProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {formatCurrency(yearMetrics.yearProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Marge annuelle :</span>
            <span className={`font-mono-numbers font-semibold ${
              yearMetrics.marginPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {formatPercent(yearMetrics.marginPercent)}
            </span>
          </div>
        </div>
      </div>

      {/* RECENT ENTRIES TABLE & QUICK ACTIONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Dernières saisies de {getMonthNameFr(selectedMonth)} {selectedYear}
            </h3>
            <p className="text-xs text-slate-500">
              Accès rapide aux dernières données journalières enregistrées
            </p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <span>Voir tout l'historique</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Aucune saisie pour ce mois pour le moment.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Commencez à enregistrer vos chiffres KDP quotidiens pour voir apparaître vos statistiques et graphiques.
            </p>
            <button
              onClick={() => setActiveTab('entry')}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Faire une saisie aujourd'hui
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 px-4 text-right">CA KDP</th>
                  <th className="py-2.5 px-4 text-right">Amazon Ads</th>
                  <th className="py-2.5 px-4 text-right">Bénéfice</th>
                  <th className="py-2.5 px-4 text-right">Livres</th>
                  <th className="py-2.5 px-4 text-left">Commentaire</th>
                  <th className="py-2.5 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEntries.map((item) => {
                  const profit = item.revenue - item.adsCost;
                  const isPositive = profit >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 pr-4 text-xs font-medium text-slate-900 whitespace-nowrap">
                        {formatDateFr(item.date, { showDayName: true })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers text-xs font-semibold text-blue-700 whitespace-nowrap">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers text-xs font-semibold text-amber-600 whitespace-nowrap">
                        {formatCurrency(item.adsCost)}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono-numbers text-xs font-bold whitespace-nowrap ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers text-xs text-slate-600 whitespace-nowrap">
                        {item.booksSold != null ? `${item.booksSold} ex.` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-500 truncate max-w-xs">
                        {item.comment || '—'}
                      </td>
                      <td className="py-2.5 pl-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onEditEntry(item)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* IMPORTANT FISCAL / ACCOUNTING DISCLAIMER */}
      <div className="rounded-xl bg-slate-100/90 border border-slate-200/90 p-4 text-slate-700 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            Avertissement comptable important :
          </p>
          <p className="text-slate-600 leading-relaxed">
            Le « bénéfice » calculé dans cette application correspond au <strong>chiffre d'affaires KDP diminué uniquement des dépenses publicitaires Amazon Ads</strong>. 
            Il ne doit pas être confondu avec votre résultat net comptable ou fiscal : les autres charges de votre activité (cotisations sociales URSSAF / micro-entreprise, impôt sur le revenu, frais bancaires, logiciels, frais de graphisme ou de correction) ne sont pas déduits dans ce calcul quotidien.
          </p>
        </div>
      </div>
    </div>
  );
};
