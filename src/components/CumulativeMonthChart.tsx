import React, { useState } from 'react';
import { 
  DayChartPoint, 
  MonthTrendProjection, 
  getMonthTrendProjection,
  formatCurrency, 
  formatPercent, 
  getMonthNameFr 
} from '../utils/calculations';
import { DailyEntry, UserGoals } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Megaphone, 
  Calendar, 
  Sparkles, 
  Target, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface CumulativeMonthChartProps {
  data: DayChartPoint[];
  selectedYear: number;
  selectedMonth: number;
  monthRevenue: number;
  monthAds: number;
  monthProfit: number;
  entries?: DailyEntry[];
  goals?: UserGoals;
  compact?: boolean;
  onNavigateToEntry?: () => void;
}

export const CumulativeMonthChart: React.FC<CumulativeMonthChartProps> = ({
  data,
  selectedYear,
  selectedMonth,
  monthRevenue,
  monthAds,
  monthProfit,
  entries = [],
  goals,
  compact = false,
  onNavigateToEntry,
}) => {
  const hasData = monthRevenue > 0 || monthAds > 0 || data.length > 0;
  const monthName = getMonthNameFr(selectedMonth);

  // État de la coche pour afficher ou masquer le pop-up / tooltip au survol
  const [showTooltip, setShowTooltip] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kdp_show_chart_tooltip');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const handleToggleTooltip = (enabled: boolean) => {
    setShowTooltip(enabled);
    try {
      localStorage.setItem('kdp_show_chart_tooltip', String(enabled));
    } catch {
      // ignore
    }
  };

  // Projection de tendance (débloquée dès 3 entrées)
  const projection: MonthTrendProjection = getMonthTrendProjection(entries, selectedYear, selectedMonth);
  const showTrends = projection.hasEnoughData;

  // Infobulle / Pop-up détaillé au survol
  const CustomCumulativeTooltip = ({ active, payload }: any) => {
    if (!showTooltip) return null;
    if (active && payload && payload.length) {
      const point = payload[0].payload as DayChartPoint;
      const isProj = point.isProjected;

      if (isProj) {
        const trendRev = point.trendRevenue ?? 0;
        const trendAds = point.trendAds ?? 0;
        const trendProfit = point.trendProfit ?? (trendRev - trendAds);

        return (
          <div className="bg-white p-3.5 border border-blue-200 rounded-xl shadow-xl text-xs space-y-2 min-w-56 ring-2 ring-blue-500/20 pointer-events-none select-none">
            <div className="flex items-center justify-between border-b border-blue-100 pb-1.5 font-bold text-slate-900">
              <span className="flex items-center gap-1.5 text-blue-700">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>Jour {point.day} {monthName} {selectedYear}</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                Tendance
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Projection fin de mois :
              </div>
              
              <div className="flex justify-between items-center text-blue-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  CA KDP Réel :
                </span>
                <span className="font-mono-numbers">{formatCurrency(trendRev)}</span>
              </div>

              <div className="flex justify-between items-center text-amber-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Amazon Ads :
                </span>
                <span className="font-mono-numbers">{formatCurrency(trendAds)}</span>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  Bénéfice Net Projeté :
                </span>
                <span className="font-mono-numbers text-emerald-700">
                  {formatCurrency(trendProfit)}
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-400">
              Projection à +{point.day - projection.cutoffDay}j de votre dernière saisie
            </div>
          </div>
        );
      }

      // Point réel enregistré
      const revCumul = point.cumulRevenue ?? 0;
      const adsCumul = point.cumulAds ?? 0;
      const profitCumul = point.cumulProfit ?? (revCumul - adsCumul);
      
      return (
        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-lg text-xs space-y-2 min-w-56 pointer-events-none select-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-slate-900">
            <span>{point.day} {monthName} {selectedYear}</span>
            <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 rounded bg-slate-100">
              Jour {point.day} (Cumul)
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Performances cumulées :
            </div>

            <div className="flex justify-between items-center text-blue-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                CA KDP Réel :
              </span>
              <span className="font-mono-numbers">{formatCurrency(revCumul)}</span>
            </div>

            <div className="flex justify-between items-center text-amber-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Pub Ads cumulée :
              </span>
              <span className="font-mono-numbers">{formatCurrency(adsCumul)}</span>
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center font-bold">
              <span className={`flex items-center gap-1.5 ${profitCumul >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${profitCumul >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                Bénéfice Net KDP :
              </span>
              <span className={`font-mono-numbers ${profitCumul >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(profitCumul)}
              </span>
            </div>

            {point.booksSold > 0 && (
              <div className="text-[10px] text-slate-400 pt-0.5">
                Livres vendus ce jour : {point.booksSold} ex.
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      
      {/* Header with Title and Pop-up Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Évolution du CA et de la Publicité cumulés jour par jour
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi factuel des redevances KDP enregistrées et des dépenses Amazon Ads
            {showTrends ? (
              <span className="ml-2 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                ✨ Courbes de tendance jusqu'au {projection.daysInMonth} {monthName}
              </span>
            ) : null}
          </p>
        </div>

        {/* Coche pour afficher ou masquer le pop-up */}
        <label 
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer select-none transition-all shadow-2xs self-start sm:self-auto ${
            showTooltip 
              ? 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/30' 
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
          }`}
          title="Cochez pour afficher le pop-up d'informations au survol, ou décochez pour le masquer complètement et dégager la vue du graphique"
        >
          <input
            type="checkbox"
            checked={showTooltip}
            onChange={(e) => handleToggleTooltip(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
          />
          <span className="flex items-center gap-1.5">
            {showTooltip ? (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Pop-up survol : <strong>Actif</strong></span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Afficher pop-up</span>
              </>
            )}
          </span>
        </label>
      </div>

      {/* KPI Bilan factuel du mois */}
      {hasData && (
        <div className="flex items-center gap-2.5 flex-wrap p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>
              <strong>CA KDP :</strong> <span className="font-mono-numbers font-bold text-blue-700">{formatCurrency(monthRevenue)}</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>
              <strong>Pub Ads :</strong> <span className="font-mono-numbers font-bold text-amber-700">{formatCurrency(monthAds)}</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${monthProfit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`} />
            <span>
              <strong>Bénéfice Net :</strong>{' '}
              <span className={`font-mono-numbers font-bold ${monthProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(monthProfit)}
              </span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-slate-500">TACoS :</span>
            <span className="font-mono-numbers font-bold text-amber-700">
              {monthRevenue > 0 ? `${((monthAds / monthRevenue) * 100).toFixed(1)} %` : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      {!hasData ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Aucun chiffre enregistré pour {monthName} {selectedYear}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Saisissez vos chiffres pour tracer immédiatement l'évolution de vos redevances et bénéfices.
          </p>
        </div>
      ) : (
        <div className={compact ? 'h-64 w-full' : 'h-72 sm:h-84 w-full'}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 15, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulAds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
                tickFormatter={(d) => `${d}`}
                label={{ 
                  value: showTrends ? `Jours du mois (1 au ${projection.daysInMonth} ${monthName})` : 'Jours du mois', 
                  position: 'insideBottom', 
                  offset: -5, 
                  fontSize: 10, 
                  fill: '#94a3b8' 
                }}
              />
              
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
                tickFormatter={(v) => `${v}€`} 
              />
              
              {showTooltip && (
                <Tooltip 
                  content={<CustomCumulativeTooltip />} 
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }} 
                />
              )}
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ fontSize: 11, paddingBottom: 6 }} 
              />

              {/* Dépenses Amazon Ads Cumulées (Zone Ambre) */}
              <Area
                type="monotone"
                dataKey="cumulAds"
                name="Pub Ads cumulée (€)"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulAds)"
                dot={{ r: 2, fill: '#f59e0b' }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />

              {/* CA KDP Réel Cumulé (Ligne Bleue) */}
              <Line
                type="monotone"
                dataKey="cumulRevenue"
                name="CA KDP Réel (€)"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#2563eb' }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />

              {/* Bénéfice Net Réel KDP (Ligne Verte en relief) */}
              <Line
                type="monotone"
                dataKey="cumulProfit"
                name="Bénéfice Net Réel (€)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />

              {/* Courbes de tendances jusqu'à la fin du mois (dès 3 entrées) */}
              {showTrends && (
                <Line
                  type="monotone"
                  dataKey="trendRevenue"
                  name="Tendance CA KDP"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={true}
                />
              )}

              {showTrends && (
                <Line
                  type="monotone"
                  dataKey="trendAds"
                  name="Tendance Pub Ads"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={true}
                />
              )}

              {showTrends && (
                <Line
                  type="monotone"
                  dataKey="trendProfit"
                  name="Tendance Bénéfice"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={true}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SYNTHÈSE DESSOUS LE GRAPHIQUE (DÈS 3 ENTRÉES)                             */}
      {/* ========================================================================= */}
      {showTrends ? (
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-xl border border-blue-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Header de la synthèse */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Synthèse Prévisionnelle Fin de Mois</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Basée sur {projection.entryCount} jours enregistrés
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Projection calculée jusqu'au {projection.daysInMonth} {monthName} {selectedYear} ({projection.daysRemaining} jours restants)
                </p>
              </div>
            </div>

            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 self-start sm:self-auto bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Dernière saisie : Jour {projection.cutoffDay} / {projection.daysInMonth}</span>
            </div>
          </div>

          {/* Grille des indicateurs prévisionnels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* 1. Bénéfice Net Projeté Fin de Mois */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                  Bénéfice Net Projeté
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  Fin de mois
                </span>
              </div>
              <div className={`text-2xl sm:text-3xl font-bold font-mono-numbers mt-1 ${
                projection.projectedEndProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCurrency(projection.projectedEndProfit)}
              </div>
              <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 space-y-0.5">
                <div className="flex justify-between">
                  <span>Marge nette projetée :</span>
                  <span className="font-bold font-mono-numbers text-emerald-700">
                    {formatPercent(projection.projectedEndMargin)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rythme quotidien :</span>
                  <span className="font-mono-numbers">
                    +{formatCurrency(projection.dailyAvgProfit)} / j
                  </span>
                </div>
              </div>
            </div>

            {/* 2. CA Estimé Fin de Mois */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  CA KDP Estimé
                </span>
                <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-numbers text-blue-700 mt-1">
                {formatCurrency(projection.projectedEndRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 space-y-0.5">
                <div className="flex justify-between">
                  <span>Cumul actuel :</span>
                  <span className="font-mono-numbers font-semibold">
                    {formatCurrency(projection.currentCumulRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rythme journalier :</span>
                  <span className="font-mono-numbers">
                    +{formatCurrency(projection.dailyAvgRevenue)} / j
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Amazon Ads Estimé Fin de Mois */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Pub Ads Estimée
                </span>
                <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Megaphone className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-numbers text-amber-600 mt-1">
                {formatCurrency(projection.projectedEndAds)}
              </div>
              <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 space-y-0.5">
                <div className="flex justify-between">
                  <span>TACoS Réel projeté :</span>
                  <span className="font-mono-numbers font-bold text-amber-700">
                    {projection.projectedEndTacos.toFixed(1)} %
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Budget quotidien :</span>
                  <span className="font-mono-numbers">
                    {formatCurrency(projection.dailyAvgAds)} / j
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Comparaison avec les objectifs du mois (si définis) */}
          {goals && (goals.monthlyRevenueGoal > 0 || goals.monthlyProfitGoal > 0) && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trajectoire prévisionnelle vs Objectifs mensuels :</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Cibles : CA {formatCurrency(goals.monthlyRevenueGoal)} · Bénéfice {formatCurrency(goals.monthlyProfitGoal)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Objectif CA */}
                {goals.monthlyRevenueGoal > 0 && (
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-600">CA projeté vs Cible</span>
                      <span className="font-mono-numbers font-bold text-blue-700">
                        {((projection.projectedEndRevenue / goals.monthlyRevenueGoal) * 100).toFixed(0)} %
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (projection.projectedEndRevenue / goals.monthlyRevenueGoal) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {projection.projectedEndRevenue >= goals.monthlyRevenueGoal
                        ? '🎯 La tendance dépasse votre objectif de CA !'
                        : `Manque environ ${formatCurrency(goals.monthlyRevenueGoal - projection.projectedEndRevenue)} pour atteindre la cible`}
                    </p>
                  </div>
                )}

                {/* Objectif Bénéfice */}
                {goals.monthlyProfitGoal > 0 && (
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-600">Bénéfice projeté vs Cible</span>
                      <span className={`font-mono-numbers font-bold ${
                        projection.projectedEndProfit >= goals.monthlyProfitGoal ? 'text-emerald-600' : 'text-slate-700'
                      }`}>
                        {((projection.projectedEndProfit / goals.monthlyProfitGoal) * 100).toFixed(0)} %
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          projection.projectedEndProfit >= goals.monthlyProfitGoal ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (projection.projectedEndProfit / goals.monthlyProfitGoal) * 100))}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {projection.projectedEndProfit >= goals.monthlyProfitGoal
                        ? '🏆 La tendance dépasse votre objectif de bénéfice !'
                        : `Manque environ ${formatCurrency(Math.max(0, goals.monthlyProfitGoal - projection.projectedEndProfit))} pour la cible`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* BANDEAU INDICATEUR SI MOINS DE 3 ENTRÉES */
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                📈
              </span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Débloquez les courbes de tendance jusqu'au {projection.daysInMonth} {monthName}
                </h4>
                <p className="text-slate-500 mt-0.5">
                  Dès <strong>3 entrées enregistrées</strong> pour ce mois, l'application tracera automatiquement les courbes de tendance prévisionnelles (CA KDP, Pub et Bénéfice) jusqu'au dernier jour du mois avec la synthèse complète.
                </p>
              </div>
            </div>

            {onNavigateToEntry && (
              <button
                onClick={onNavigateToEntry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <span>Ajouter une saisie</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stepper Progression (3 étapes) */}
          <div className="pt-2 border-t border-slate-200/70 flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
              Progression : {projection.entryCount} / 3 saisies
            </span>
            <div className="flex-1 flex items-center gap-2 max-w-xs">
              {[1, 2, 3].map((step) => {
                const isCompleted = projection.entryCount >= step;
                return (
                  <div key={step} className="flex-1 flex items-center gap-1.5">
                    <div
                      className={`h-2 flex-1 rounded-full transition-all ${
                        isCompleted ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-[9px] font-bold text-slate-400 flex items-center justify-center shrink-0">
                        {step}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-400">
              {projection.entryCount === 0 && 'Encore 3 entrées'}
              {projection.entryCount === 1 && 'Plus que 2 entrées'}
              {projection.entryCount === 2 && 'Plus qu\'une seule entrée !'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
