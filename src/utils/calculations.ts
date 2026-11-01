import { DailyEntry, MonthMetrics, DayMetrics, YearMetrics } from '../types';

/**
 * Format a number to Euro currency string (e.g., 1 250,50 €)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number to compact Euro currency string (e.g., 1,2 k€)
 */
export function formatCompactCurrency(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '0 €';
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.', ',')} k€`;
  }
  return `${amount.toFixed(0)} €`;
}

/**
 * Format a number to percentage string (e.g., 45,2 %)
 */
export function formatPercent(percent: number): string {
  if (isNaN(percent) || !isFinite(percent)) return '0,0 %';
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1).replace('.', ',')} %`;
}

/**
 * Format a date YYYY-MM-DD into a localized French string
 */
export function formatDateFr(dateStr: string, options?: { showDayName?: boolean }): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (options?.showDayName) {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format timestamp to a French relative/time string (e.g. "Aujourd'hui à 14:32")
 */
export function formatLastUpdated(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return `Aujourd'hui à ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Hier à ${timeStr}`;
  }

  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${timeStr}`;
}

/**
 * Format a month number (1-12) to French month name
 */
export function getMonthNameFr(monthNumber: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[monthNumber - 1] || '';
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compute Day metrics for a given date (defaults to today)
 */
export function getDayMetrics(entries: DailyEntry[], targetDate: string): DayMetrics {
  const entry = entries.find((e) => e.date === targetDate);
  if (entry && !entry.isMonthlyTotal) {
    const profit = entry.revenue - entry.adsCost;
    const margin = entry.revenue > 0 ? (profit / entry.revenue) * 100 : 0;
    return {
      todayRevenue: entry.revenue,
      todayAds: entry.adsCost,
      todayProfit: profit,
      todayBooks: entry.booksSold || 0,
      marginPercent: margin,
    };
  }

  // If no single day entry found, check if there is a monthly summary for this month
  const targetPrefix = targetDate.slice(0, 7);
  const monthlySummary = entries.find((e) => e.date.startsWith(targetPrefix) && e.isMonthlyTotal);
  if (monthlySummary) {
    const [y, m, d] = targetDate.split('-').map(Number);
    const now = new Date();
    const isCurrent = now.getFullYear() === y && (now.getMonth() + 1) === m;
    const daysElapsed = isCurrent ? Math.max(1, now.getDate()) : new Date(y, m, 0).getDate();
    
    const proratedRev = monthlySummary.revenue / daysElapsed;
    const proratedAds = monthlySummary.adsCost / daysElapsed;
    const proratedProfit = proratedRev - proratedAds;
    const proratedBooks = monthlySummary.booksSold ? Math.round(monthlySummary.booksSold / daysElapsed) : 0;
    const margin = proratedRev > 0 ? (proratedProfit / proratedRev) * 100 : 0;

    return {
      todayRevenue: proratedRev,
      todayAds: proratedAds,
      todayProfit: proratedProfit,
      todayBooks: proratedBooks,
      marginPercent: margin,
    };
  }

  return {
    todayRevenue: 0,
    todayAds: 0,
    todayProfit: 0,
    todayBooks: 0,
    marginPercent: 0,
  };
}

/**
 * Compute Month metrics for a specific month and year
 */
export function getMonthMetrics(
  entries: DailyEntry[],
  year: number,
  month: number
): MonthMetrics {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const monthEntries = entries.filter((e) => e.date.startsWith(prefix));

  let monthRevenue = 0;
  let monthAds = 0;
  let monthBooks = 0;
  let hasMonthlyTotal = false;

  for (const entry of monthEntries) {
    monthRevenue += entry.revenue || 0;
    monthAds += entry.adsCost || 0;
    monthBooks += entry.booksSold || 0;
    if (entry.isMonthlyTotal) hasMonthlyTotal = true;
  }

  const monthProfit = monthRevenue - monthAds;
  const marginPercent = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

  // Days logged: if entered as a monthly total, daysLogged is either days in month or days elapsed
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
  const daysInMonth = new Date(year, month, 0).getDate();
  const effectiveDaysLogged = hasMonthlyTotal
    ? (isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth)
    : monthEntries.length;

  const dailyAverageRevenue = effectiveDaysLogged > 0 ? monthRevenue / effectiveDaysLogged : 0;
  const roas = monthAds > 0 ? monthRevenue / monthAds : 0;
  const acos = monthRevenue > 0 ? (monthAds / monthRevenue) * 100 : 0;

  return {
    monthRevenue,
    monthAds,
    monthProfit,
    monthBooks,
    marginPercent,
    daysLogged: effectiveDaysLogged,
    dailyAverageRevenue,
    roas,
    acos,
  };
}

/**
 * Compute Year-To-Date metrics
 */
export function getYearMetrics(entries: DailyEntry[], year: number): YearMetrics {
  const yearStr = `${year}-`;
  const yearEntries = entries.filter((e) => e.date.startsWith(yearStr));

  let yearRevenue = 0;
  let yearAds = 0;
  let yearBooks = 0;

  for (const entry of yearEntries) {
    yearRevenue += entry.revenue || 0;
    yearAds += entry.adsCost || 0;
    yearBooks += entry.booksSold || 0;
  }

  const yearProfit = yearRevenue - yearAds;
  const marginPercent = yearRevenue > 0 ? (yearProfit / yearRevenue) * 100 : 0;

  return {
    yearRevenue,
    yearAds,
    yearProfit,
    yearBooks,
    marginPercent,
    daysLogged: yearEntries.length,
  };
}

export interface DayChartPoint {
  day: number;
  date: string;
  formattedDate: string;
  revenue: number;
  adsCost: number;
  profit: number;
  cumulProfit: number;
  cumulRevenue: number;
  cumulAds: number;
  booksSold: number;
}

/**
 * Generate daily chart data for a month, filling missing days if appropriate or showing logged days
 */
export function getDailyChartData(
  entries: DailyEntry[],
  year: number,
  month: number
): DayChartPoint[] {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  // Get total days in this month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Map of existing entries
  const entryMap = new Map<string, DailyEntry>();
  const monthEntries = entries.filter((e) => e.date.startsWith(prefix));
  const monthlyTotalEntry = monthEntries.find((e) => e.isMonthlyTotal);
  const hasOnlyMonthlyTotal = monthlyTotalEntry && monthEntries.length === 1;

  if (!hasOnlyMonthlyTotal) {
    monthEntries.forEach((e) => entryMap.set(e.date, e));
  }

  const points: DayChartPoint[] = [];
  let runningCumulProfit = 0;
  let runningCumulRevenue = 0;
  let runningCumulAds = 0;

  // If there are entries, we iterate either up to today (if current month) or total days with data
  const isCurrentMonthYear =
    new Date().getFullYear() === year && new Date().getMonth() + 1 === month;
  const currentDay = isCurrentMonthYear ? Math.max(1, new Date().getDate()) : daysInMonth;

  for (let d = 1; d <= currentDay; d++) {
    const dayStr = String(d).padStart(2, '0');
    const fullDate = `${year}-${monthStr}-${dayStr}`;
    
    let rev = 0;
    let ads = 0;
    let books = 0;

    if (hasOnlyMonthlyTotal) {
      rev = monthlyTotalEntry.revenue / currentDay;
      ads = monthlyTotalEntry.adsCost / currentDay;
      books = monthlyTotalEntry.booksSold ? Math.round(monthlyTotalEntry.booksSold / currentDay) : 0;
    } else {
      const entry = entryMap.get(fullDate);
      rev = entry ? entry.revenue : 0;
      ads = entry ? entry.adsCost : 0;
      books = entry ? (entry.booksSold || 0) : 0;
    }

    const profit = rev - ads;
    runningCumulProfit += profit;
    runningCumulRevenue += rev;
    runningCumulAds += ads;

    points.push({
      day: d,
      date: fullDate,
      formattedDate: `${d} ${getMonthNameFr(month).slice(0, 4)}.`,
      revenue: Math.round(rev * 100) / 100,
      adsCost: Math.round(ads * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      cumulProfit: Math.round(runningCumulProfit * 100) / 100,
      cumulRevenue: Math.round(runningCumulRevenue * 100) / 100,
      cumulAds: Math.round(runningCumulAds * 100) / 100,
      booksSold: books,
    });
  }

  return points;
}

export interface MonthlyComparisonPoint {
  monthIndex: number;
  monthName: string;
  shortName: string;
  revenue: number;
  adsCost: number;
  profit: number;
  marginPercent: number;
  booksSold: number;
  daysLogged: number;
}

/**
 * Generate 12-month comparison data for an entire year
 */
export function getYearlyMonthlyComparison(
  entries: DailyEntry[],
  year: number
): MonthlyComparisonPoint[] {
  const monthsData: MonthlyComparisonPoint[] = [];

  for (let m = 1; m <= 12; m++) {
    const metrics = getMonthMetrics(entries, year, m);
    monthsData.push({
      monthIndex: m,
      monthName: getMonthNameFr(m),
      shortName: getMonthNameFr(m).slice(0, 3),
      revenue: metrics.monthRevenue,
      adsCost: metrics.monthAds,
      profit: metrics.monthProfit,
      marginPercent: metrics.marginPercent,
      booksSold: metrics.monthBooks,
      daysLogged: metrics.daysLogged,
    });
  }

  return monthsData;
}
