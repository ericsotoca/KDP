import React, { useState } from 'react';
import { UserGoals, DailyEntry, ActiveTab } from '../types';
import { 
  formatCurrency, 
  formatPercent, 
  getMonthMetrics, 
  getMonthNameFr 
} from '../utils/calculations';
import { 
  Target, 
  Trophy, 
  TrendingUp, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  ArrowRight,
  Flame
} from 'lucide-react';

interface GoalsViewProps {
  goals: UserGoals;
  onUpdateGoals: (newGoals: UserGoals) => void;
  entries: DailyEntry[];
  selectedYear: number;
  selectedMonth: number;
  setActiveTab: (tab: ActiveTab) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onUpdateGoals,
  entries,
  selectedYear,
  selectedMonth,
  setActiveTab,
}) => {
  const [revenueGoalInput, setRevenueGoalInput] = useState<string>(
    goals.monthlyRevenueGoal.toString()
  );
  const [profitGoalInput, setProfitGoalInput] = useState<string>(
    goals.monthlyProfitGoal.toString()
  );
  const [savedNotification, setSavedNotification] = useState<boolean>(false);

  const monthMetrics = getMonthMetrics(entries, selectedYear, selectedMonth);

  // Days in month calculation for projection
  const now = new Date();
  const isCurrentMonth = 
    now.getFullYear() === selectedYear && (now.getMonth() + 1) === selectedMonth;
  const currentDay = isCurrentMonth ? now.getDate() : new Date(selectedYear, selectedMonth, 0).getDate();
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Projection end of month based on daily average
  const projectedRevenue = currentDay > 0 
    ? (monthMetrics.monthRevenue / currentDay) * totalDaysInMonth 
    : 0;
  const projectedProfit = currentDay > 0 
    ? (monthMetrics.monthProfit / currentDay) * totalDaysInMonth 
    : 0;

  // Percentage completion
  const revPct = goals.monthlyRevenueGoal > 0 
    ? (monthMetrics.monthRevenue / goals.monthlyRevenueGoal) * 100 
    : 0;
  const profitPct = goals.monthlyProfitGoal > 0 
    ? (monthMetrics.monthProfit / goals.monthlyProfitGoal) * 100 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRev = parseFloat(revenueGoalInput.replace(',', '.')) || 1000;
    const newProfit = parseFloat(profitGoalInput.replace(',', '.')) || 500;

    onUpdateGoals({
      monthlyRevenueGoal: Math.max(0, newRev),
      monthlyProfitGoal: Math.max(0, newProfit),
    });

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Objectifs Mensuels
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi et configuration de vos cibles de chiffre d'affaires et de rentabilité
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          {getMonthNameFr(selectedMonth)} {selectedYear}
        </span>
      </div>

      {/* Success Notification */}
      {savedNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">Objectifs enregistrés avec succès !</span>
        </div>
      )}

      {/* Main Visual Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Jauge Objectif CA */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Objectif Chiffre d'Affaires
              </h3>
            </div>
            <span className="text-xs font-bold font-mono-numbers text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              {revPct.toFixed(1)} %
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-2xl font-bold font-mono-numbers text-blue-700">
                {formatCurrency(monthMetrics.monthRevenue)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                sur {formatCurrency(goals.monthlyRevenueGoal)}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, revPct))}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Montant restant à générer :</span>
              <span className="font-mono-numbers font-semibold text-slate-900">
                {monthMetrics.monthRevenue >= goals.monthlyRevenueGoal
                  ? 'Atteint ! 🎉'
                  : formatCurrency(Math.max(0, goals.monthlyRevenueGoal - monthMetrics.monthRevenue))}
              </span>
            </div>
            {isCurrentMonth && (
              <div className="flex justify-between text-slate-600">
                <span>Projection fin de mois :</span>
                <span className="font-mono-numbers font-semibold text-blue-700">
                  ≈ {formatCurrency(projectedRevenue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Jauge Objectif Bénéfice */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Objectif Bénéfice après Pub
              </h3>
            </div>
            <span className={`text-xs font-bold font-mono-numbers px-2 py-0.5 rounded-md ${
              monthMetrics.monthProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {profitPct.toFixed(1)} %
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-sm">
              <span className={`text-2xl font-bold font-mono-numbers ${
                monthMetrics.monthProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCurrency(monthMetrics.monthProfit)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                sur {formatCurrency(goals.monthlyProfitGoal)}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  monthMetrics.monthProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, profitPct))}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Reste pour cible bénéfice :</span>
              <span className="font-mono-numbers font-semibold text-slate-900">
                {monthMetrics.monthProfit >= goals.monthlyProfitGoal
                  ? 'Objectif dépassé ! 🏆'
                  : formatCurrency(Math.max(0, goals.monthlyProfitGoal - monthMetrics.monthProfit))}
              </span>
            </div>
            {isCurrentMonth && (
              <div className="flex justify-between text-slate-600">
                <span>Projection fin de mois :</span>
                <span className={`font-mono-numbers font-semibold ${
                  projectedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  ≈ {formatCurrency(projectedProfit)}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Formulaire de configuration des objectifs */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Modifier vos objectifs mensuels
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Définissez vos propres seuils de rentabilité pour guider vos efforts d'optimisation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Objectif de Chiffre d'Affaires (€ / mois)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                value={revenueGoalInput}
                onChange={(e) => setRevenueGoalInput(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono-numbers text-slate-900"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                €
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Valeur initiale recommandée : 1 000 € / mois
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Objectif de Bénéfice après publicité (€ / mois)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                value={profitGoalInput}
                onChange={(e) => setProfitGoalInput(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono-numbers text-slate-900"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                €
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Valeur initiale recommandée : 500 € / mois
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Mettre à jour les objectifs</span>
          </button>
        </div>
      </form>

    </div>
  );
};
