import React, { useState } from 'react';
import { DailyEntry, ActiveTab, UserGoals } from '../types';
import { 
  getDailyChartData, 
  getYearlyMonthlyComparison, 
  getMonthMetrics, 
  formatCurrency, 
  formatPercent, 
  getMonthNameFr 
} from '../utils/calculations';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { CumulativeMonthChart } from './CumulativeMonthChart';
import { 
  BarChart3, 
  TrendingUp, 
  Megaphone, 
  DollarSign, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  PieChart,
  HelpCircle
} from 'lucide-react';

interface AnalyticsViewProps {
  entries: DailyEntry[];
  goals?: UserGoals;
  selectedYear: number;
  selectedMonth: number;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  entries,
  goals,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
  setActiveTab,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'comparison'>('daily');

  // Respecte la préférence de pop-up (mémorisée dans localStorage)
  const [showTooltip] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kdp_show_chart_tooltip');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const dailyPoints = getDailyChartData(entries, selectedYear, selectedMonth);
  const monthlyPoints = getYearlyMonthlyComparison(entries, selectedYear);
  const monthMetrics = getMonthMetrics(entries, selectedYear, selectedMonth);

  // Month navigation
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

  // Custom tooltips
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (!showTooltip) return null;
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg text-xs space-y-1 min-w-44 pointer-events-none select-none">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">
            {point.formattedDate} {selectedYear}
          </p>
          <div className="flex justify-between items-center text-blue-700">
            <span>CA KDP :</span>
            <span className="font-mono-numbers font-semibold">{formatCurrency(point.revenue)}</span>
          </div>
          <div className="flex justify-between items-center text-amber-600">
            <span>Amazon Ads :</span>
            <span className="font-mono-numbers font-semibold">{formatCurrency(point.adsCost)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-100 font-bold">
            <span className={point.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              Bénéfice du jour :
            </span>
            <span className={`font-mono-numbers ${point.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(point.profit)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>Cumul mois :</span>
            <span className="font-mono-numbers">{formatCurrency(point.cumulProfit)}</span>
          </div>
          {point.booksSold > 0 && (
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Livres vendus :</span>
              <span className="font-mono-numbers">{point.booksSold} ex.</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (!showTooltip) return null;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg text-xs space-y-1 min-w-48 pointer-events-none select-none">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">
            {data.monthName} {selectedYear}
          </p>
          <div className="flex justify-between items-center text-blue-700">
            <span>Chiffre d'affaires :</span>
            <span className="font-mono-numbers font-semibold">{formatCurrency(data.revenue)}</span>
          </div>
          <div className="flex justify-between items-center text-amber-600">
            <span>Dépenses Ads :</span>
            <span className="font-mono-numbers font-semibold">{formatCurrency(data.adsCost)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-100 font-bold">
            <span className={data.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              Bénéfice net :
            </span>
            <span className={`font-mono-numbers ${data.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(data.profit)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>Marge :</span>
            <span className="font-mono-numbers">{formatPercent(data.marginPercent)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>Livres :</span>
            <span className="font-mono-numbers">{data.booksSold} ex.</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Header and View Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Graphiques & Analyses
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisez l'évolution quotidienne et la comparaison mensuelle de votre activité
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveChartTab('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeChartTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Évolution du mois ({getMonthNameFr(selectedMonth).slice(0, 4)}.)
            </button>
            <button
              onClick={() => setActiveChartTab('comparison')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeChartTab === 'comparison'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comparaison annuelle ({selectedYear})
            </button>
          </div>

          {activeChartTab === 'daily' && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Efficiency Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Marge nette moyenne
          </span>
          <span className={`text-xl font-bold font-mono-numbers mt-1 block ${
            monthMetrics.marginPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {formatPercent(monthMetrics.marginPercent)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Bénéfice / CA mensuel
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            ACOS Mensuel
          </span>
          <span className="text-xl font-bold font-mono-numbers text-amber-600 mt-1 block">
            {monthMetrics.acos > 0 ? `${monthMetrics.acos.toFixed(1)} %` : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Part du budget pub dans le CA
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            ROAS (Retour sur Ads)
          </span>
          <span className="text-xl font-bold font-mono-numbers text-blue-700 mt-1 block">
            {monthMetrics.roas > 0 ? `${monthMetrics.roas.toFixed(2)}x` : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            1 € investi génère {monthMetrics.roas > 0 ? `${monthMetrics.roas.toFixed(2)} €` : '—'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Bénéfice moyen / jour
          </span>
          <span className={`text-xl font-bold font-mono-numbers mt-1 block ${
            monthMetrics.monthProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {formatCurrency(monthMetrics.daysLogged > 0 ? monthMetrics.monthProfit / monthMetrics.daysLogged : 0)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Sur {monthMetrics.daysLogged} jours saisis
          </span>
        </div>
      </div>

      {activeChartTab === 'daily' ? (
        <div className="space-y-6">
          
          {/* GRAPHIQUE VEDETTE : Courbe d'évolution du CA et Pub cumulés jour par jour avec 2 tendances & synthèse */}
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

          {/* GRAPHIQUE 2 : Évolution quotidienne du chiffre d'affaires */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  2. Détail journalier du chiffre d'affaires (€)
                </h3>
                <p className="text-xs text-slate-500">
                  Revenus journaliers en euros (€) pour {getMonthNameFr(selectedMonth)} {selectedYear}
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                CA : {formatCurrency(monthMetrics.monthRevenue)}
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}€`} />
                  {showTooltip && <Tooltip content={<CustomDailyTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />}
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Chiffre d'affaires (€)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPHIQUE 2 : Comparaison CA / Dépenses Publicitaires */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  2. Comparaison CA KDP vs Dépenses Amazon Ads
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisez jour par jour l'écart entre vos revenus et vos dépenses publicitaires
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  CA KDP
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Amazon Ads
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}€`} />
                  {showTooltip && <Tooltip content={<CustomDailyTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />}
                  <Bar dataKey="revenue" name="CA KDP" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="adsCost" name="Amazon Ads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPHIQUE 3 : Évolution du bénéfice cumulé au cours du mois */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  3. Évolution du bénéfice cumulé au cours du mois
                </h3>
                <p className="text-xs text-slate-500">
                  Progression de votre trésorerie nette cumulée jour après jour
                </p>
              </div>
              <span className={`text-xs font-bold font-mono-numbers px-2.5 py-1 rounded-md ${
                monthMetrics.monthProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                Cumul fin de mois : {formatCurrency(monthMetrics.monthProfit)}
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}€`} />
                  {showTooltip && <Tooltip content={<CustomDailyTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />}
                  <Line
                    type="monotone"
                    dataKey="cumulProfit"
                    name="Bénéfice cumulé (€)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        /* VUE COMPARAISON MOIS PAR MOIS */
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Comparaison des 12 mois de l'année {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi de la progression globale et de la saisonnalité de votre catalogue de livres
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPoints} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}€`} />
                {showTooltip && <Tooltip content={<CustomMonthlyTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />}
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="revenue" name="Chiffre d'affaires (€)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adsCost" name="Dépenses Amazon Ads (€)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Bénéfice net (€)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tableau de synthèse des mois */}
          <div className="overflow-x-auto pt-4 border-t border-slate-100">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2 px-3">Mois</th>
                  <th className="py-2 px-3 text-right">CA (€)</th>
                  <th className="py-2 px-3 text-right">Ads (€)</th>
                  <th className="py-2 px-3 text-right">TACoS</th>
                  <th className="py-2 px-3 text-right">Bénéfice (€)</th>
                  <th className="py-2 px-3 text-right">Marge</th>
                  <th className="py-2 px-3 text-right">Livres</th>
                  <th className="py-2 px-3 text-right">Jours saisis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyPoints.map((m) => {
                  const tacos = m.revenue > 0 ? (m.adsCost / m.revenue) * 100 : 0;
                  return (
                    <tr key={m.monthIndex} className={m.daysLogged > 0 ? 'hover:bg-slate-50' : 'opacity-40'}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{m.monthName}</td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-blue-700 font-semibold">
                        {formatCurrency(m.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-amber-600 font-semibold">
                        {formatCurrency(m.adsCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-semibold text-amber-700">
                        {tacos > 0 ? `${tacos.toFixed(1)} %` : '—'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono-numbers font-bold ${
                        m.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(m.profit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-700">
                        {m.revenue > 0 ? formatPercent(m.marginPercent) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-600">
                        {m.booksSold > 0 ? `${m.booksSold} ex.` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-500">
                        {m.daysLogged} j
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
