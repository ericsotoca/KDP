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
  formatLastUpdated,
  getDailyChartData,
  getTacosDiagnostic,
  getMonthTrendProjection,
  MonthTrendProjection
} from '../utils/calculations';
import { CumulativeMonthChart } from './CumulativeMonthChart';
import { TacosCalculatorModal } from './TacosCalculatorModal';
import { AmazonSyncModal } from './AmazonSyncModal';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Megaphone, 
  Calendar, 
  Target, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  RotateCw,
  Check,
  Calculator,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Clipboard
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
  onSaveMonthlySummary?: (
    year: number,
    month: number,
    revenue: number,
    adsCost: number,
    booksSold?: number
  ) => void;
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
  const dailyPoints = getDailyChartData(entries, selectedYear, selectedMonth);
  const projection: MonthTrendProjection = getMonthTrendProjection(entries, selectedYear, selectedMonth);

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

  // Quick 2-number state for dashboard (Revenue & Ads)
  const [quickRevenue, setQuickRevenue] = useState<string>('');
  const [quickAds, setQuickAds] = useState<string>('');
  const [quickSaved, setQuickSaved] = useState<boolean>(false);
  const [isTacosModalOpen, setIsTacosModalOpen] = useState<boolean>(false);
  const [isAmazonSyncModalOpen, setIsAmazonSyncModalOpen] = useState<boolean>(false);
  const [isFetchingDirect, setIsFetchingDirect] = useState<boolean>(false);
  const [directSyncSuccess, setDirectSyncSuccess] = useState<string | null>(null);
  const [directSyncError, setDirectSyncError] = useState<string | null>(null);

  // 1-Click Direct Fetch directly from the dashboard
  const handleDirectAmazonFetch = async (simulate: boolean = false) => {
    setIsFetchingDirect(true);
    setDirectSyncError(null);
    setDirectSyncSuccess(null);

    try {
      const savedEntity = localStorage.getItem('kdp_amazon_entity_id') || 'ENTITY10NY3ZV74DMDV';
      const savedCookie = localStorage.getItem('kdp_amazon_cookie') || '';

      // If no session cookie is configured and not forced simulate, open modal to configure or test
      if (!savedCookie.trim() && !simulate) {
        setIsFetchingDirect(false);
        setIsAmazonSyncModalOpen(true);
        return;
      }

      const response = await fetch('/api/amazon/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-amazon-cookie': savedCookie.trim(),
        },
        body: JSON.stringify({
          entityId: savedEntity.trim(),
          year: selectedYear,
          month: selectedMonth,
          cookie: savedCookie.trim(),
          simulate,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'AUTH_REQUIRED' || data.code === 'SESSION_EXPIRED') {
          setIsAmazonSyncModalOpen(true);
        } else {
          setDirectSyncError(data.message || 'Erreur lors de la récupération Amazon Ads.');
          setTimeout(() => setDirectSyncError(null), 6000);
        }
        setIsFetchingDirect(false);
        return;
      }

      const finalRev = data.revenue != null ? data.revenue : monthMetrics.monthRevenue;
      const finalAds = data.adsCost != null ? data.adsCost : monthMetrics.monthAds;

      if (onSaveMonthlySummary) {
        onSaveMonthlySummary(selectedYear, selectedMonth, finalRev, finalAds);
      }
      setQuickRevenue(finalRev.toString());
      setQuickAds(finalAds.toString());

      setDirectSyncSuccess(
        `Synchronisé en 1 Clic ! Dépenses Ads : ${formatCurrency(finalAds)} · CA KDP : ${formatCurrency(finalRev)}`
      );
      setTimeout(() => setDirectSyncSuccess(null), 6000);

    } catch (err: any) {
      setDirectSyncError(`Erreur de connexion : ${err.message}`);
      setTimeout(() => setDirectSyncError(null), 6000);
    } finally {
      setIsFetchingDirect(false);
    }
  };

  // Extraction automatique du chiffre après "Coût total" ou redevances
  const handleExtractFromText = (text: string): boolean => {
    if (!text || !text.trim()) return false;

    // 1. Recherche prioritaire du chiffre après "Coût total"
    const coutTotalPatterns = [
      /Co[uû]t\s+total\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
      /Co[uû]t\s+total[^\d\n\r]{0,40}?([0-9\s]+[,.][0-9]{2})/i,
      /Total\s+des\s+co[uû]ts\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
      /Total\s+cost\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
      /Co[uû]t\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /D[ée]penses?\s*(?:totales?)?\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Spend\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
    ];

    let extractedAdsCost: number | null = null;
    for (const rx of coutTotalPatterns) {
      const match = text.match(rx);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
          extractedAdsCost = val;
          break;
        }
      }
    }

    // 2. Recherche du CA KDP (Ventes, Redevances)
    const revPatterns = [
      /Redevances?\s*(?:estim[ée]es?)?\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Chiffre\s+d'affaires\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Ventes\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Royalties\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Sales\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
    ];

    let extractedRev: number | null = null;
    for (const rx of revPatterns) {
      const match = text.match(rx);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
          extractedRev = val;
          break;
        }
      }
    }

    if (extractedAdsCost !== null || extractedRev !== null) {
      const newRev = extractedRev !== null ? extractedRev : parsedQuickRev;
      const newAds = extractedAdsCost !== null ? extractedAdsCost : parsedQuickAds;

      if (extractedAdsCost !== null) {
        setQuickAds(extractedAdsCost.toString());
      }
      if (extractedRev !== null) {
        setQuickRevenue(extractedRev.toString());
      }

      if (onSaveMonthlySummary) {
        onSaveMonthlySummary(selectedYear, selectedMonth, newRev, newAds);
      }

      setDirectSyncSuccess(
        `Chiffre après "Coût total" détecté et ajouté automatiquement : ${
          extractedAdsCost !== null ? formatCurrency(extractedAdsCost) : ''
        }${extractedRev !== null ? ` (et CA : ${formatCurrency(extractedRev)})` : ''}`
      );
      setTimeout(() => setDirectSyncSuccess(null), 6000);
      return true;
    }

    return false;
  };

  const handlePasteClipboardAds = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          const success = handleExtractFromText(clipboardText);
          if (!success) {
            setDirectSyncError(
              'Aucun montant après "Coût total" détecté dans le texte copié.'
            );
            setTimeout(() => setDirectSyncError(null), 5000);
          }
        }
      }
    } catch {
      setIsAmazonSyncModalOpen(true);
    }
  };

  const tacosDiagnostic = getTacosDiagnostic(
    monthMetrics.tacos,
    monthMetrics.monthAds,
    monthMetrics.monthRevenue
  );

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
      onSaveMonthlySummary(selectedYear, selectedMonth, rev, ads, undefined);
      setQuickSaved(true);
      setTimeout(() => setQuickSaved(false), 3000);
    }
  };

  const parsedQuickRev = parseFloat(quickRevenue.replace(',', '.')) || 0;
  const parsedQuickAds = parseFloat(quickAds.replace(',', '.')) || 0;
  const quickProfit = parsedQuickRev - parsedQuickAds;
  const quickMargin = parsedQuickRev > 0 ? (quickProfit / parsedQuickRev) * 100 : 0;
  const quickTacos = parsedQuickRev > 0 ? (parsedQuickAds / parsedQuickRev) * 100 : 0;

  // Find current month entry to show last update timestamp
  const currentMonthEntry = entries.find((e) => e.date.startsWith(monthPrefix));
  const lastUpdatedStr = currentMonthEntry ? formatLastUpdated(currentMonthEntry.updatedAt) : null;

  return (
    <div className="space-y-6">
      
      {/* Notifications de synchronisation 1-Clic en direct */}
      {directSyncSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white shadow-2xs">
              ⚡
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-emerald-100 font-semibold">Amazon Ads (ENTITY10NY3ZV74DMDV) :</span>
              <span>{directSyncSuccess}</span>
            </div>
          </div>
          <button
            onClick={() => setDirectSyncSuccess(null)}
            className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {directSyncError && (
        <div className="bg-rose-600 text-white px-4 py-3 rounded-xl shadow-md text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-rose-100 font-semibold">Récupération Amazon :</span>
              <span>{directSyncError}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAmazonSyncModalOpen(true)}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-bold underline transition-colors cursor-pointer"
            >
              Configurer
            </button>
            <button
              onClick={() => setDirectSyncError(null)}
              className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
              Vue synthétique et factuelle des performances KDP & Amazon Ads
            </p>
          </div>
        </div>

        {/* Date Navigation & 1-Click Sync Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => handleDirectAmazonFetch(false)}
            disabled={isFetchingDirect}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 hover:from-amber-700 hover:to-orange-600 active:scale-[0.98] text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
            title="Aller chercher directement et récupérer les données depuis Amazon Ads ENTITY10NY3ZV74DMDV d'un seul clic"
          >
            {isFetchingDirect ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Récupération...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-100 fill-amber-100" />
                <span>⚡ Récupérer Amazon Ads (1 Clic)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsAmazonSyncModalOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Options de synchronisation et réglages du compte"
            aria-label="Options de synchronisation"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
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

      {/* SECTION HÉROS : BÉNÉFICE NET PROJETÉ (AFFICHÉ EN HAUT DE PAGE DÈS QUE POSSIBLE) */}
      <div
        className={`rounded-xl border p-5 shadow-xs transition-all ${
          projection.hasEnoughData
            ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-emerald-300 ring-2 ring-emerald-500/15'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bénéfice Net Projeté</span>
              </span>
              <span className="text-xs font-semibold text-slate-700">
                Fin de mois ({getMonthNameFr(selectedMonth)} {selectedYear})
              </span>
              {projection.hasEnoughData ? (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Calculé sur {projection.cutoffDay} jours saisis ({projection.daysRemaining} j restants)
                </span>
              ) : null}
            </div>

            {projection.hasEnoughData ? (
              <div className="pt-1 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold font-mono-numbers tracking-tight ${
                    projection.projectedEndProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(projection.projectedEndProfit)}
                </span>
                <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Rythme quotidien moyen :</span>
                  <strong className="font-mono-numbers text-emerald-700 font-bold">
                    +{formatCurrency(projection.dailyAvgProfit)} / j
                  </strong>
                </span>
              </div>
            ) : (
              <div className="pt-2 text-xs text-slate-600 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">
                    Projection débloquée dès 3 jours de saisie dans le mois.
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Actuellement {projection.entryCount} / 3 jours enregistrés. Encore{' '}
                    <strong>{Math.max(1, 3 - projection.entryCount)} saisie{3 - projection.entryCount > 1 ? 's' : ''}</strong> pour afficher automatiquement votre bénéfice net prévisionnel de fin de mois.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Indicateurs clés associés au projeté */}
          {projection.hasEnoughData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/95 p-3 rounded-xl border border-emerald-200/80 shadow-2xs text-xs">
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Déjà réalisé
                </span>
                <span
                  className={`font-mono-numbers font-bold text-sm sm:text-base ${
                    monthMetrics.monthProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(monthMetrics.monthProfit)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Reste : +{formatCurrency(projection.projectedRemainingProfit)}
                </span>
              </div>

              <div className="space-y-0.5 px-2 border-l border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Marge projetée
                </span>
                <span className="font-mono-numbers font-bold text-sm sm:text-base text-slate-800">
                  {formatPercent(projection.projectedEndMargin)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Actuelle : {formatPercent(monthMetrics.marginPercent)}
                </span>
              </div>

              <div className="space-y-0.5 px-2 border-l border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  CA KDP projeté
                </span>
                <span className="font-mono-numbers font-bold text-sm sm:text-base text-blue-700">
                  {formatCurrency(projection.projectedEndRevenue)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  +{formatCurrency(projection.dailyAvgRevenue)} / j
                </span>
              </div>

              <div className="space-y-0.5 pl-2 border-l border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Pub Ads projetée
                </span>
                <span className="font-mono-numbers font-bold text-sm sm:text-base text-amber-700">
                  {formatCurrency(projection.projectedEndAds)}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold block">
                  TACoS : {projection.projectedEndTacos.toFixed(1)} %
                </span>
              </div>
            </div>
          )}
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

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => handleDirectAmazonFetch(false)}
              disabled={isFetchingDirect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 rounded-md transition-all shadow-2xs cursor-pointer disabled:opacity-60"
              title="Aller chercher directement les dépenses depuis Amazon Ads (ENTITY10NY3ZV74DMDV) d'un seul clic"
            >
              {isFetchingDirect ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Récupération...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-100 fill-amber-100" />
                  <span>⚡ 1 Clic Amazon Ads</span>
                </>
              )}
            </button>

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
          
          {/* Chiffre 1: CA KDP Réel */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                1. CA KDP Réel du mois (€)
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
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  if (/redevance|vente|chiffre|ca|co[uû]t\s+total/i.test(text)) {
                    const handled = handleExtractFromText(text);
                    if (handled) {
                      e.preventDefault();
                    }
                  }
                }}
                className="w-full pl-8 pr-3 py-2 text-base font-bold font-mono-numbers bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-blue-700 shadow-2xs"
              />
            </div>
            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-1 mt-1 text-[11px]">
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
                  title={`Ajouter +${amt} € au CA KDP`}
                >
                  +{amt}€
                </button>
              ))}
            </div>
          </div>

          {/* Chiffre 2: Amazon Ads */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <span>2. Amazon Ads du mois (€)</span>
              </label>

              <div className="flex items-center gap-1.5">
                {Math.abs(parsedQuickAds - monthMetrics.monthAds) >= 0.01 && monthMetrics.monthAds > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    {parsedQuickAds >= monthMetrics.monthAds ? '+' : ''}
                    {(parsedQuickAds - monthMetrics.monthAds).toFixed(2)} €
                  </span>
                )}
                <button
                  type="button"
                  onClick={handlePasteClipboardAds}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[10px] transition-colors cursor-pointer border border-amber-300/80"
                  title="Recherche et extrait automatiquement le chiffre après 'Coût total' dans le presse-papier"
                >
                  <Clipboard className="w-3 h-3 text-amber-700" />
                  <span>Détecter "Coût total"</span>
                </button>
              </div>
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
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  if (/co[uû]t\s+total|dépense|spend/i.test(text)) {
                    const handled = handleExtractFromText(text);
                    if (handled) {
                      e.preventDefault();
                    }
                  }
                }}
                className="w-full pl-8 pr-3 py-2 text-base font-bold font-mono-numbers bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-amber-700 shadow-2xs"
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span>TACoS :</span>
                <strong className="font-mono-numbers text-amber-700">
                  {quickTacos > 0 ? quickTacos.toFixed(1) : 0}%
                </strong>
                <span className="text-[10px] text-slate-400 font-normal">(Part pub/CA)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTacosModalOpen(true)}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline flex items-center gap-0.5 cursor-pointer"
                title="Ouvrir le simulateur de TACoS"
              >
                <Calculator className="w-3 h-3" />
                <span>Simuler</span>
              </button>
            </div>
          </div>

          {/* Bouton d'actualisation */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Actualiser</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Touche Entrée
            </p>
          </div>

        </div>

        {/* Live calculation preview right below inputs */}
        <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bilan en direct :
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Bénéfice Net :</span>
              <strong className={`font-mono-numbers ${quickProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(quickProfit)}
              </strong>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1.5">
              <span>Marge bénéficiaire :</span>
              <strong className="font-mono-numbers text-slate-800">
                {parsedQuickRev > 0 ? formatPercent(quickMargin) : '0%'}
              </strong>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1.5">
              <span>TACoS :</span>
              <strong className="font-mono-numbers text-amber-700">
                {parsedQuickRev > 0 ? `${quickTacos.toFixed(1)} %` : '—'}
              </strong>
            </span>

            {projection.hasEnoughData && (
              <>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5 text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">Bénéfice Net Projeté (Fin de mois) :</span>
                  <strong className={`font-mono-numbers font-bold ${
                    projection.projectedEndProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatCurrency(projection.projectedEndProfit)}
                  </strong>
                </span>
              </>
            )}
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
              CA du mois (KDP)
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

        {/* 3. PUBLICITÉ & TACOS DU MOIS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Publicité & TACoS
              </span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl lg:text-3xl font-bold font-mono-numbers text-amber-600">
                {formatCurrency(monthMetrics.monthAds)}
              </div>
              
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                {/* TACoS Réel avec son ratio et badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">TACoS Réel :</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-numbers font-bold text-amber-700 text-sm">
                      {monthMetrics.monthRevenue > 0 ? `${monthMetrics.tacos.toFixed(1)} %` : '—'}
                    </span>
                  </div>
                </div>

                {/* Badge de diagnostic de santé du TACoS */}
                {monthMetrics.monthAds > 0 && monthMetrics.monthRevenue > 0 && (
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-slate-400">Santé KDP :</span>
                    <span className={`px-2 py-0.5 rounded-md font-semibold border text-[10px] ${tacosDiagnostic.badgeClass}`}>
                      {tacosDiagnostic.shortLabel}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>ROAS (Retour pub) :</span>
                  <span className="font-mono-numbers font-medium text-slate-700">
                    {monthMetrics.roas > 0 ? `${monthMetrics.roas.toFixed(2)}x` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action : TACoS & Sync Amazon Ads */}
          <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDirectAmazonFetch(false)}
              disabled={isFetchingDirect}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
              title="Récupérer directement depuis Amazon Ads ENTITY10NY3ZV74DMDV d'un seul clic"
            >
              {isFetchingDirect ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Récupération...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-100 fill-amber-100" />
                  <span>1 Clic Ads</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsTacosModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>Calculateur</span>
            </button>
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

            {projection.hasEnoughData ? (
              <div className="mt-2.5 p-2 bg-emerald-50/90 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Projeté fin de mois :</span>
                  </span>
                  <span className={`font-mono-numbers font-bold text-xs ${
                    projection.projectedEndProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatCurrency(projection.projectedEndProfit)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-700/90 mt-0.5">
                  <span>Rythme : +{formatCurrency(projection.dailyAvgProfit)}/j</span>
                  <span>Marge proj. : {formatPercent(projection.projectedEndMargin)}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Marge bénéficiaire :</span>
              <span className="font-mono-numbers font-bold text-slate-800">
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

      {/* COURBE D'ÉVOLUTION DU CA ET DE LA PUB CUMULÉS JOUR PAR JOUR AVEC TENDANCES & SYNTHÈSE */}
      <CumulativeMonthChart
        data={dailyPoints}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        monthRevenue={monthMetrics.monthRevenue}
        monthAds={monthMetrics.monthAds}
        monthProfit={monthMetrics.monthProfit}
        entries={entries}
        goals={goals}
        onNavigateToEntry={() => setActiveTab('entry')}
      />

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
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
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
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
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

      {/* MODAL CALCULATEUR & SIMULATEUR TACOS */}
      <TacosCalculatorModal
        isOpen={isTacosModalOpen}
        onClose={() => setIsTacosModalOpen(false)}
        defaultRevenue={monthMetrics.monthRevenue}
        defaultAds={monthMetrics.monthAds}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* MODAL SYNCHRONISATION AUTOMATIQUE AMAZON ADS & KDP */}
      <AmazonSyncModal
        isOpen={isAmazonSyncModalOpen}
        onClose={() => setIsAmazonSyncModalOpen(false)}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        currentRevenue={monthMetrics.monthRevenue}
        currentAds={monthMetrics.monthAds}
        onApplySync={(year, month, revenue, adsCost) => {
          if (onSaveMonthlySummary) {
            onSaveMonthlySummary(year, month, revenue, adsCost);
            setQuickSaved(true);
            setTimeout(() => setQuickSaved(false), 3000);
          }
        }}
      />

    </div>
  );
};
