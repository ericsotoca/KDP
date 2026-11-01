import React from 'react';
import { DayChartPoint } from '../utils/calculations';
import { formatCurrency, formatPercent, getMonthNameFr } from '../utils/calculations';
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
import { TrendingUp, DollarSign, Megaphone, Calendar } from 'lucide-react';

interface CumulativeMonthChartProps {
  data: DayChartPoint[];
  selectedYear: number;
  selectedMonth: number;
  monthRevenue: number;
  monthAds: number;
  monthProfit: number;
  compact?: boolean;
}

export const CumulativeMonthChart: React.FC<CumulativeMonthChartProps> = ({
  data,
  selectedYear,
  selectedMonth,
  monthRevenue,
  monthAds,
  monthProfit,
  compact = false,
}) => {
  const hasData = monthRevenue > 0 || monthAds > 0;
  const monthName = getMonthNameFr(selectedMonth);

  // Custom detailed tooltip
  const CustomCumulativeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as DayChartPoint;
      const profitCumul = point.cumulRevenue - point.cumulAds;
      const marginCumul = point.cumulRevenue > 0 ? (profitCumul / point.cumulRevenue) * 100 : 0;
      
      return (
        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-lg text-xs space-y-2 min-w-56">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-slate-900">
            <span>{point.day} {monthName} {selectedYear}</span>
            <span className="text-[10px] text-slate-400 font-normal">Jour {point.day}</span>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cumul depuis le 1er du mois :
            </div>
            <div className="flex justify-between items-center text-blue-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                CA KDP cumulé :
              </span>
              <span className="font-mono-numbers">{formatCurrency(point.cumulRevenue)}</span>
            </div>

            <div className="flex justify-between items-center text-amber-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Pub Ads cumulée :
              </span>
              <span className="font-mono-numbers">{formatCurrency(point.cumulAds)}</span>
            </div>

            <div className="flex justify-between items-center font-bold pt-1 border-t border-slate-100">
              <span className={`flex items-center gap-1.5 ${profitCumul >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${profitCumul >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                Bénéfice net cumulé :
              </span>
              <span className={`font-mono-numbers ${profitCumul >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(profitCumul)}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Marge cumulée :</span>
              <span className="font-mono-numbers font-medium">{formatPercent(marginCumul)}</span>
            </div>
          </div>

          {(point.revenue > 0 || point.adsCost > 0) && (
            <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Journée seule :</span>
              <span>
                CA <strong className="text-blue-700 font-mono-numbers">{formatCurrency(point.revenue)}</strong> · Pub <strong className="text-amber-600 font-mono-numbers">{formatCurrency(point.adsCost)}</strong>
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header with Title and Cumulative Badges */}
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
            Cumul quotidien à partir du 1er {monthName} {selectedYear}
          </p>
        </div>

        {/* Current Month Final Totals Badges */}
        {hasData && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>CA : {formatCurrency(monthRevenue)}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pub : {formatCurrency(monthAds)}</span>
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border ${
              monthProfit >= 0 
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${monthProfit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`} />
              <span>Bénéfice : {formatCurrency(monthProfit)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      {!hasData ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Aucun chiffre enregistré pour {monthName} {selectedYear}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Entrez vos 2 chiffres (CA KDP et Amazon Ads) ci-dessus pour afficher la courbe d'évolution cumulée jour par jour.
          </p>
        </div>
      ) : (
        <div className={compact ? 'h-64 w-full' : 'h-72 sm:h-80 w-full'}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 15, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorCumulAds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
                tickFormatter={(d) => `${d}`}
                label={{ value: 'Jours du mois (du 1er au dernier jour)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
              />
              
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
                tickFormatter={(v) => `${v}€`} 
              />
              
              <Tooltip content={<CustomCumulativeTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ fontSize: 12, paddingBottom: 6 }} 
              />

              {/* Area 1: Chiffre d'Affaires Cumulé (Bleu) */}
              <Area
                type="monotone"
                dataKey="cumulRevenue"
                name="CA KDP Cumulé (€)"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCumulRev)"
                dot={{ r: 2.5, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              />

              {/* Area 2: Dépenses Amazon Ads Cumulées (Orange) */}
              <Area
                type="monotone"
                dataKey="cumulAds"
                name="Publicité Ads Cumulée (€)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCumulAds)"
                dot={{ r: 2.5, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />

              {/* Line 3: Bénéfice Net Cumulé (Vert) */}
              <Line
                type="monotone"
                dataKey="cumulProfit"
                name="Bénéfice Net Cumulé (€)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
