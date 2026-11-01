import React, { useState, useMemo } from 'react';
import { DailyEntry, ActiveTab } from '../types';
import { 
  formatCurrency, 
  formatPercent, 
  formatDateFr, 
  getMonthNameFr 
} from '../utils/calculations';
import { exportEntriesToCsv } from '../utils/storage';
import { 
  History as HistoryIcon, 
  Search, 
  Calendar, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  Download, 
  Filter, 
  PlusCircle,
  AlertTriangle,
  X
} from 'lucide-react';

interface HistoryViewProps {
  entries: DailyEntry[];
  selectedYear: number;
  selectedMonth: number;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
  onEditEntry: (entry: DailyEntry) => void;
  onDeleteEntry: (id: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

type SortField = 'date' | 'revenue' | 'adsCost' | 'profit' | 'booksSold';
type SortOrder = 'asc' | 'desc';

export const HistoryView: React.FC<HistoryViewProps> = ({
  entries,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
  onEditEntry,
  onDeleteEntry,
  setActiveTab,
}) => {
  const [filterMode, setFilterMode] = useState<'month' | 'year' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Deletion modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Available years from entries
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    years.add(selectedYear);
    entries.forEach((e) => {
      const y = parseInt(e.date.slice(0, 4), 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [entries, selectedYear]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Date filter
      if (filterMode === 'month') {
        const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        if (!entry.date.startsWith(prefix)) return false;
      } else if (filterMode === 'year') {
        const prefix = `${selectedYear}-`;
        if (!entry.date.startsWith(prefix)) return false;
      }

      // Search query in comment or date
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesComment = (entry.comment || '').toLowerCase().includes(q);
        const matchesDate = entry.date.includes(q);
        if (!matchesComment && !matchesDate) return false;
      }

      return true;
    });
  }, [entries, filterMode, selectedYear, selectedMonth, searchQuery]);

  // Sorted entries
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'revenue') {
        comparison = a.revenue - b.revenue;
      } else if (sortField === 'adsCost') {
        comparison = a.adsCost - b.adsCost;
      } else if (sortField === 'profit') {
        const profitA = a.revenue - a.adsCost;
        const profitB = b.revenue - b.adsCost;
        comparison = profitA - profitB;
      } else if (sortField === 'booksSold') {
        comparison = (a.booksSold || 0) - (b.booksSold || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredEntries, sortField, sortOrder]);

  // Summary row totals
  const totals = useMemo(() => {
    let rev = 0;
    let ads = 0;
    let books = 0;

    for (const e of filteredEntries) {
      rev += e.revenue;
      ads += e.adsCost;
      books += e.booksSold || 0;
    }

    const profit = rev - ads;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;

    return { rev, ads, profit, books, margin, count: filteredEntries.length };
  }, [filteredEntries]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    );
  };

  const entryToDelete = entries.find((e) => e.id === deletingId);

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteEntry(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Historique des saisies
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez, modifiez, filtrez ou exportez vos enregistrements quotidiens
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportEntriesToCsv(sortedEntries)}
              disabled={sortedEntries.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Exporter ces données au format CSV compatible Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV ({sortedEntries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('entry')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nouvelle saisie</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* Mode Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Période
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mois
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('year')}
                className={`py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Année
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tout
              </button>
            </div>
          </div>

          {/* Month selector (if month mode) */}
          {filterMode === 'month' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Mois
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(parseInt(e.target.value, 10))}
                className="w-full py-1.5 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthNameFr(m)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year selector */}
          {filterMode !== 'all' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Année
              </label>
              <select
                value={selectedYear}
                onChange={(e) => onSelectYear(parseInt(e.target.value, 10))}
                className="w-full py-1.5 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Text Search */}
          <div className={filterMode === 'all' ? 'sm:col-span-3' : ''}>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Recherche dans les notes
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Ex : promo, mot-clé, avis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">
              Aucune saisie trouvée pour cette période
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Changez les filtres de date ci-dessus ou ajoutez une nouvelle saisie pour commencer.
            </p>
            <button
              onClick={() => setActiveTab('entry')}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Créer une saisie
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 select-none">
                  <th 
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 group whitespace-nowrap"
                  >
                    <span>Date</span>
                    {getSortIcon('date')}
                  </th>
                  <th 
                    onClick={() => handleSort('revenue')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 group whitespace-nowrap"
                  >
                    <span>CA KDP (€)</span>
                    {getSortIcon('revenue')}
                  </th>
                  <th 
                    onClick={() => handleSort('adsCost')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 group whitespace-nowrap"
                  >
                    <span>Amazon Ads (€)</span>
                    {getSortIcon('adsCost')}
                  </th>
                  <th 
                    onClick={() => handleSort('profit')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 group whitespace-nowrap"
                  >
                    <span>Bénéfice Net (€)</span>
                    {getSortIcon('profit')}
                  </th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Marge (%)
                  </th>
                  <th 
                    onClick={() => handleSort('booksSold')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 group whitespace-nowrap"
                  >
                    <span>Livres</span>
                    {getSortIcon('booksSold')}
                  </th>
                  <th className="py-3 px-4 text-left">
                    Commentaire
                  </th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedEntries.map((item) => {
                  const profit = item.revenue - item.adsCost;
                  const margin = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;
                  const isPositive = profit >= 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {item.isMonthlyTotal ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-700 font-bold">
                              {getMonthNameFr(parseInt(item.date.slice(5, 7), 10))} {item.date.slice(0, 4)}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">
                              Total mois
                            </span>
                          </div>
                        ) : (
                          formatDateFr(item.date, { showDayName: true })
                        )}
                      </td>

                      {/* CA */}
                      <td className="py-3 px-4 text-right font-mono-numbers text-xs font-bold text-blue-700 whitespace-nowrap">
                        {formatCurrency(item.revenue)}
                      </td>

                      {/* Amazon Ads */}
                      <td className="py-3 px-4 text-right font-mono-numbers text-xs font-bold text-amber-600 whitespace-nowrap">
                        {formatCurrency(item.adsCost)}
                      </td>

                      {/* Bénéfice */}
                      <td className={`py-3 px-4 text-right font-mono-numbers text-xs font-bold whitespace-nowrap ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(profit)}
                      </td>

                      {/* Marge */}
                      <td className={`py-3 px-4 text-right font-mono-numbers text-xs font-semibold whitespace-nowrap ${
                        margin >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {item.revenue > 0 ? formatPercent(margin) : '0,0 %'}
                      </td>

                      {/* Livres vendus */}
                      <td className="py-3 px-4 text-right font-mono-numbers text-xs text-slate-600 whitespace-nowrap">
                        {item.booksSold != null ? `${item.booksSold} ex.` : '—'}
                      </td>

                      {/* Commentaire */}
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={item.comment || ''}>
                        {item.comment || <span className="text-slate-300 italic">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditEntry(item)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Modifier cette saisie"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Supprimer cette saisie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Footer Row */}
              <tfoot>
                <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                  <td className="py-3 px-4">
                    TOTAL ({totals.count} {totals.count > 1 ? 'jours' : 'jour'})
                  </td>
                  <td className="py-3 px-4 text-right font-mono-numbers text-blue-700">
                    {formatCurrency(totals.rev)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-numbers text-amber-600">
                    {formatCurrency(totals.ads)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono-numbers ${
                    totals.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatCurrency(totals.profit)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono-numbers ${
                    totals.margin >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {totals.rev > 0 ? formatPercent(totals.margin) : '0,0 %'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-numbers text-slate-800">
                    {totals.books} ex.
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right text-slate-500 text-[11px] font-normal">
                    Moyenne CA : {formatCurrency(totals.count > 0 ? totals.rev / totals.count : 0)} / j
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Confirmer la suppression
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cette action est définitive pour cette journée
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Date :</span>
                <strong className="text-slate-900">{formatDateFr(entryToDelete.date)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Chiffre d'affaires :</span>
                <strong className="text-blue-700 font-mono-numbers">{formatCurrency(entryToDelete.revenue)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Dépenses publicitaires :</span>
                <strong className="text-amber-600 font-mono-numbers">{formatCurrency(entryToDelete.adsCost)}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Êtes-vous certain de vouloir supprimer définitivement cette saisie du {formatDateFr(entryToDelete.date)} ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
