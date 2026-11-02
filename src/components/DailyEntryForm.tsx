import React, { useState, useEffect } from 'react';
import { DailyEntry, ActiveTab } from '../types';
import { 
  formatCurrency, 
  formatPercent, 
  getTodayDateString, 
  formatDateFr,
  getMonthNameFr,
  getMonthMetrics
} from '../utils/calculations';
import { 
  Calendar, 
  DollarSign, 
  Megaphone, 
  BookOpen, 
  MessageSquare, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Zap,
  Clock,
  Sparkles,
  TrendingUp,
  Layers
} from 'lucide-react';
import { AdsGrossToNetConverter } from './AdsGrossToNetConverter';

interface DailyEntryFormProps {
  entries: DailyEntry[];
  editingEntry: DailyEntry | null;
  onSaveEntry: (entry: Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onSaveMonthlySummary: (
    year: number, 
    month: number, 
    revenue: number, 
    adsCost: number, 
    booksSold?: number, 
    expectedRevenue?: number
  ) => void;
  onCancelEdit: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({
  entries,
  editingEntry,
  onSaveEntry,
  onSaveMonthlySummary,
  onCancelEdit,
  setActiveTab,
}) => {
  // Mode: 'monthly' (just 2-3 numbers for the month) vs 'daily' (day-by-day)
  const [entryMode, setEntryMode] = useState<'monthly' | 'daily'>('monthly');

  // --- State for Mode 1: Saisie rapide mensuelle ---
  const now = new Date();
  const [monthlyYear, setMonthlyYear] = useState<number>(now.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState<number>(now.getMonth() + 1);
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>('');
  const [monthlyExpectedRevenue, setMonthlyExpectedRevenue] = useState<string>('');
  const [monthlyAds, setMonthlyAds] = useState<string>('');
  const [monthlyBooks, setMonthlyBooks] = useState<string>('');

  // Pre-load existing month figures if already present
  useEffect(() => {
    const metrics = getMonthMetrics(entries, monthlyYear, monthlyMonth);
    if (metrics.monthRevenue > 0 || metrics.monthExpectedRevenue > 0 || metrics.monthAds > 0) {
      setMonthlyRevenue(metrics.monthRevenue ? metrics.monthRevenue.toString() : '');
      setMonthlyExpectedRevenue(
        metrics.monthExpectedRevenue && metrics.monthExpectedRevenue !== metrics.monthRevenue
          ? metrics.monthExpectedRevenue.toString()
          : ''
      );
      setMonthlyAds(metrics.monthAds ? metrics.monthAds.toString() : '');
      setMonthlyBooks(metrics.monthBooks ? metrics.monthBooks.toString() : '');
    } else {
      setMonthlyRevenue('');
      setMonthlyExpectedRevenue('');
      setMonthlyAds('');
      setMonthlyBooks('');
    }
  }, [monthlyYear, monthlyMonth, entries]);

  // --- State for Mode 2: Saisie quotidienne ---
  const [date, setDate] = useState<string>(getTodayDateString());
  const [revenue, setRevenue] = useState<string>('');
  const [expectedRevenue, setExpectedRevenue] = useState<string>('');
  const [adsCost, setAdsCost] = useState<string>('');
  const [booksSold, setBooksSold] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If editing an existing daily entry, switch to daily mode and populate
  useEffect(() => {
    if (editingEntry) {
      setEntryMode('daily');
      setDate(editingEntry.date);
      setRevenue(editingEntry.revenue.toString());
      setExpectedRevenue(
        editingEntry.expectedRevenue && editingEntry.expectedRevenue !== editingEntry.revenue
          ? editingEntry.expectedRevenue.toString()
          : ''
      );
      setAdsCost(editingEntry.adsCost.toString());
      setBooksSold(editingEntry.booksSold != null ? editingEntry.booksSold.toString() : '');
      setComment(editingEntry.comment || '');
    }
  }, [editingEntry]);

  // Check if chosen date already exists (for daily mode)
  const existingForDate = entries.find(
    (e) => e.date === date && (!editingEntry || e.id !== editingEntry.id)
  );

  const handleLoadExistingDaily = () => {
    if (existingForDate) {
      setRevenue(existingForDate.revenue.toString());
      setExpectedRevenue(
        existingForDate.expectedRevenue && existingForDate.expectedRevenue !== existingForDate.revenue
          ? existingForDate.expectedRevenue.toString()
          : ''
      );
      setAdsCost(existingForDate.adsCost.toString());
      setBooksSold(existingForDate.booksSold != null ? existingForDate.booksSold.toString() : '');
      setComment(existingForDate.comment || '');
    }
  };

  // Calculations for Monthly Mode (Dual calculations: Real vs Expected)
  const numMonthlyRev = parseFloat(monthlyRevenue.replace(',', '.')) || 0;
  const numMonthlyExpRev = monthlyExpectedRevenue 
    ? parseFloat(monthlyExpectedRevenue.replace(',', '.')) || numMonthlyRev 
    : numMonthlyRev;
  const numMonthlyAds = parseFloat(monthlyAds.replace(',', '.')) || 0;
  const numMonthlyBooks = monthlyBooks ? parseInt(monthlyBooks, 10) : undefined;
  
  // Calcul 1 : Réalisé KDP
  const monthlyProfit = numMonthlyRev - numMonthlyAds;
  const monthlyMargin = numMonthlyRev > 0 ? (monthlyProfit / numMonthlyRev) * 100 : 0;
  const monthlyAcos = numMonthlyRev > 0 ? (numMonthlyAds / numMonthlyRev) * 100 : 0;
  const monthlyTacos = monthlyAcos;
  const monthlyRoas = numMonthlyAds > 0 ? numMonthlyRev / numMonthlyAds : 0;

  // Calcul 2 : Espéré avec Ads
  const monthlyExpectedProfit = numMonthlyExpRev - numMonthlyAds;
  const monthlyExpectedMargin = numMonthlyExpRev > 0 ? (monthlyExpectedProfit / numMonthlyExpRev) * 100 : 0;
  const monthlyExpectedTacos = numMonthlyExpRev > 0 ? (numMonthlyAds / numMonthlyExpRev) * 100 : 0;

  // Calculations for Daily Mode
  const numRevenue = parseFloat(revenue.replace(',', '.')) || 0;
  const numExpectedRevenue = expectedRevenue 
    ? parseFloat(expectedRevenue.replace(',', '.')) || numRevenue 
    : numRevenue;
  const numAds = parseFloat(adsCost.replace(',', '.')) || 0;
  const numBooks = booksSold ? parseInt(booksSold, 10) : undefined;
  const estimatedProfit = numRevenue - numAds;
  const estimatedExpectedProfit = numExpectedRevenue - numAds;
  const estimatedMargin = numRevenue > 0 ? (estimatedProfit / numRevenue) * 100 : 0;

  // Handlers for Ads Gross -> Net Royalty Converter
  const handleApplyNetToMonthly = (netAmount: number, target: 'real' | 'expected', mode: 'add' | 'replace') => {
    if (target === 'expected') {
      const current = monthlyExpectedRevenue 
        ? parseFloat(monthlyExpectedRevenue.replace(',', '.')) || 0
        : numMonthlyRev;
      const nextVal = mode === 'add' ? Math.round((current + netAmount) * 100) / 100 : netAmount;
      setMonthlyExpectedRevenue(nextVal.toFixed(2));
    } else {
      const current = numMonthlyRev;
      const nextVal = mode === 'add' ? Math.round((current + netAmount) * 100) / 100 : netAmount;
      setMonthlyRevenue(nextVal.toFixed(2));
    }
  };

  const handleApplyNetToDaily = (netAmount: number, target: 'real' | 'expected', mode: 'add' | 'replace') => {
    if (target === 'expected') {
      const current = expectedRevenue 
        ? parseFloat(expectedRevenue.replace(',', '.')) || 0
        : numRevenue;
      const nextVal = mode === 'add' ? Math.round((current + netAmount) * 100) / 100 : netAmount;
      setExpectedRevenue(nextVal.toFixed(2));
    } else {
      const current = numRevenue;
      const nextVal = mode === 'add' ? Math.round((current + netAmount) * 100) / 100 : netAmount;
      setRevenue(nextVal.toFixed(2));
    }
  };

  // Handle submit Monthly Mode
  const handleMonthlySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMonthlySummary(
      monthlyYear,
      monthlyMonth,
      numMonthlyRev,
      numMonthlyAds,
      numMonthlyBooks,
      numMonthlyExpRev !== numMonthlyRev ? numMonthlyExpRev : undefined
    );

    setSuccessMessage(
      `Vos chiffres pour ${getMonthNameFr(monthlyMonth)} ${monthlyYear} ont été enregistrés ! Les 2 calculs et les 2 courbes sont synchronisés.`
    );

    setTimeout(() => {
      setSuccessMessage(null);
      setActiveTab('dashboard');
    }, 2200);
  };

  // Handle submit Daily Mode
  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const targetId = editingEntry ? editingEntry.id : existingForDate?.id;

    onSaveEntry(
      {
        date,
        revenue: Math.max(0, numRevenue),
        expectedRevenue: numExpectedRevenue !== numRevenue ? Math.max(0, numExpectedRevenue) : undefined,
        adsCost: Math.max(0, numAds),
        booksSold: numBooks !== undefined && !isNaN(numBooks) ? Math.max(0, numBooks) : undefined,
        comment: comment.trim() || undefined,
      },
      targetId
    );

    setSuccessMessage(
      targetId 
        ? `Données du ${formatDateFr(date)} mises à jour avec succès !`
        : `Saisie du ${formatDateFr(date)} enregistrée avec succès !`
    );

    setTimeout(() => {
      setSuccessMessage(null);
    }, 3500);

    if (editingEntry) {
      onCancelEdit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Saisie des chiffres KDP & Ads (Deux Calculs)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez à la fois votre <strong>CA Réel KDP</strong> et votre <strong>CA Espéré</strong> (ventes Ads) pour alimenter les 2 courbes
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setEntryMode('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              entryMode === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Saisie rapide du mois</span>
          </button>
          
          <button
            type="button"
            onClick={() => setEntryMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              entryMode === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Saisie quotidienne</span>
          </button>
        </div>
      </div>

      {/* Success alert message */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1 : SAISIE RAPIDE MENSUELLE                         */}
      {/* ======================================================== */}
      {entryMode === 'monthly' && (
        <form onSubmit={handleMonthlySubmit} className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 space-y-6">
          
          {/* Badge & Month selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                ⚡
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Saisie directe du mois avec Double Calcul
                </h3>
                <p className="text-xs text-slate-500">
                  Enregistrez vos chiffres réels et espérés pour tracer instantanément vos 2 courbes
                </p>
              </div>
            </div>

            {/* Select Month and Year */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(parseInt(e.target.value, 10))}
                className="py-1.5 px-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthNameFr(m)}
                  </option>
                ))}
              </select>

              <select
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(parseInt(e.target.value, 10))}
                className="py-1.5 px-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* THE 3 INPUTS (Real Rev, Expected Rev, Ads Cost) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. CHIFFRE D'AFFAIRES KDP RÉEL DU MOIS */}
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  CA KDP Réel (€)
                </label>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                  Confirmé
                </span>
              </div>
              <p className="text-[11px] text-blue-700/80 mb-2">
                Redevances validées sur KDP
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600 font-bold text-sm">
                  €
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xl font-bold font-mono-numbers bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-blue-700"
                  autoFocus
                />
              </div>
            </div>

            {/* 2. CHIFFRE D'AFFAIRES ESPÉRÉ DU MOIS */}
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  CA Espéré Total (€)
                </label>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                  2ème Courbe
                </span>
              </div>
              <p className="text-[11px] text-purple-700/80 mb-2">
                CA Réel + redevances Ads en attente
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-600 font-bold text-sm">
                  €
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={monthlyRevenue || '0.00'}
                  value={monthlyExpectedRevenue}
                  onChange={(e) => setMonthlyExpectedRevenue(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xl font-bold font-mono-numbers bg-white border border-purple-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-purple-800"
                />
              </div>
            </div>

            {/* 3. DÉPENSES AMAZON ADS DU MOIS */}
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  Amazon Ads du mois (€)
                </label>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                  Dépenses
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 mb-2">
                Dépenses publicitaires totales
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-600 font-bold text-sm">
                  €
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={monthlyAds}
                  onChange={(e) => setMonthlyAds(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xl font-bold font-mono-numbers bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-amber-700"
                />
              </div>
            </div>

          </div>

          {/* Proposition 1 : Convertisseur intelligent CA Brut Ads -> Redevance Nette Estimée */}
          <AdsGrossToNetConverter
            currentRevenue={numMonthlyRev}
            currentExpectedRevenue={numMonthlyExpRev}
            onApplyNetRevenue={handleApplyNetToMonthly}
          />

          {/* Champ facultatif : Livres vendus */}
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre total de livres vendus (facultatif)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Ex : 45"
                value={monthlyBooks}
                onChange={(e) => setMonthlyBooks(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono-numbers"
              />
            </div>
          </div>

          {/* Real-time Result Preview with the 2 Calculations */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Les deux calculs du bilan pour {getMonthNameFr(monthlyMonth)} {monthlyYear} :</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Calcul 1 : Bénéfice Réel */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-semibold text-emerald-800">
                  1. Bénéfice Réel (KDP)
                </span>
                <span className={`text-xl font-bold font-mono-numbers ${
                  monthlyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {formatCurrency(monthlyProfit)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Marge : {numMonthlyRev > 0 ? formatPercent(monthlyMargin) : '0,0 %'}
                </span>
              </div>

              {/* Calcul 2 : Bénéfice Espéré */}
              <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-200">
                <span className="text-[11px] text-purple-900 block font-semibold">
                  2. Bénéfice Espéré (+ Ads)
                </span>
                <span className={`text-xl font-bold font-mono-numbers ${
                  monthlyExpectedProfit >= 0 ? 'text-purple-700' : 'text-rose-600'
                }`}>
                  {formatCurrency(monthlyExpectedProfit)}
                </span>
                <span className="text-[10px] text-purple-600 block mt-0.5 font-mono-numbers">
                  Écart : +{formatCurrency(Math.max(0, monthlyExpectedProfit - monthlyProfit))}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">TACoS (Part pub/CA)</span>
                <span className="text-xl font-bold font-mono-numbers text-amber-600">
                  {monthlyTacos > 0 ? `${monthlyTacos.toFixed(1)} %` : '—'}
                </span>
                {Math.abs(numMonthlyExpRev - numMonthlyRev) >= 0.01 && (
                  <span className="text-[10px] text-purple-600 block mt-0.5">
                    Espéré : {monthlyExpectedTacos.toFixed(1)} %
                  </span>
                )}
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">ROAS (Retour pub)</span>
                <span className="text-xl font-bold font-mono-numbers text-blue-700">
                  {monthlyRoas > 0 ? `${monthlyRoas.toFixed(2)}x` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              ℹ️ L'enregistrement mettra à jour l'ensemble des graphiques et tracera les <strong>2 courbes</strong>.
            </p>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer pour {getMonthNameFr(monthlyMonth)}</span>
            </button>
          </div>

        </form>
      )}

      {/* ======================================================== */}
      {/* MODE 2 : SAISIE QUOTIDIENNE (JOUR PAR JOUR)              */}
      {/* ======================================================== */}
      {entryMode === 'daily' && (
        <form onSubmit={handleDailySubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingEntry ? 'Modifier une saisie journalière' : 'Saisie quotidienne (jour par jour)'}
              </h3>
              <p className="text-xs text-slate-500">
                Enregistrez vos statistiques au jour le jour avec CA Réel et CA Espéré
              </p>
            </div>

            {editingEntry && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Annuler modification</span>
              </button>
            )}
          </div>

          {/* Duplicate date alert */}
          {existingForDate && !editingEntry && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
              <div className="flex items-start sm:items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Une entrée existe déjà pour le <strong>{formatDateFr(date)}</strong> (CA : {formatCurrency(existingForDate.revenue)}, Ads : {formatCurrency(existingForDate.adsCost)}).
                </span>
              </div>
              <button
                type="button"
                onClick={handleLoadExistingDaily}
                className="px-3 py-1.5 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold shrink-0 transition-colors"
              >
                Charger les données
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date de l'activité <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={date}
                  max={getTodayDateString()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Nombre de livres vendus */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Livres vendus (facultatif)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex : 14"
                  value={booksSold}
                  onChange={(e) => setBooksSold(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono-numbers"
                />
              </div>
            </div>

            {/* Chiffre d'affaires KDP Réel du jour (€) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                CA KDP Réel du jour (€) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono-numbers text-blue-700 text-lg"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                  €
                </span>
              </div>
            </div>

            {/* CA Espéré du jour (€) */}
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1.5 flex items-center justify-between">
                <span>CA Espéré du jour (€) (avec ventes Ads)</span>
                <span className="text-[10px] font-normal text-purple-600">Alimente la 2ème courbe</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={revenue || '0.00'}
                  value={expectedRevenue}
                  onChange={(e) => setExpectedRevenue(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm font-semibold bg-purple-50/50 border border-purple-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-mono-numbers text-purple-800 text-lg"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                  €
                </span>
              </div>
            </div>

            {/* Dépenses Amazon Ads du jour (€) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dépenses Amazon Ads du jour (€) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                  <Megaphone className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={adsCost}
                  onChange={(e) => setAdsCost(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono-numbers text-amber-700 text-lg"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                  €
                </span>
              </div>
            </div>
          </div>

          {/* Proposition 1 : Convertisseur intelligent CA Brut Ads -> Redevance Nette Estimée */}
          <AdsGrossToNetConverter
            currentRevenue={numRevenue}
            currentExpectedRevenue={numExpectedRevenue}
            onApplyNetRevenue={handleApplyNetToDaily}
          />

          {/* Commentaire facultatif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Commentaire (facultatif)
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 flex items-center pointer-events-none text-slate-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ex : Lancement promo, nouveau mot-clé..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Live Calculation: Dual Result Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 block">1. Bénéfice Réel :</span>
                <span className={`text-lg font-bold font-mono-numbers ${
                  estimatedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {formatCurrency(estimatedProfit)}
                </span>
              </div>
              <div>
                <span className="text-purple-700 block font-semibold">2. Bénéfice Espéré :</span>
                <span className={`text-lg font-bold font-mono-numbers ${
                  estimatedExpectedProfit >= 0 ? 'text-purple-700' : 'text-rose-600'
                }`}>
                  {formatCurrency(estimatedExpectedProfit)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Marge réelle :</span>
                <span className="text-sm font-bold font-mono-numbers text-slate-700">
                  {numRevenue > 0 ? formatPercent(estimatedMargin) : '0,0 %'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingEntry || existingForDate ? 'Mettre à jour' : 'ENREGISTRER LE JOUR'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
