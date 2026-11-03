import { DailyEntry, MonthMetrics, DayMetrics, YearMetrics, TacosDiagnostic, TacosHealthStatus } from '../types';

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
    const rev = entry.revenue || 0;
    const ads = entry.adsCost || 0;
    const profit = rev - ads;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;

    return {
      todayRevenue: rev,
      todayAds: ads,
      todayProfit: profit,
      todayBooks: entry.booksSold || 0,
      marginPercent: margin,
    };
  }

  // If no single day entry found, check if there is a monthly summary for this month
  const targetPrefix = targetDate.slice(0, 7);
  const monthlySummary = entries.find((e) => e.date.startsWith(targetPrefix) && e.isMonthlyTotal);
  if (monthlySummary) {
    const [y, m] = targetDate.split('-').map(Number);
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
  const tacos = acos; // TACoS Réel = (Dépenses Ads / CA Réel KDP) * 100

  return {
    monthRevenue,
    monthAds,
    monthProfit,
    marginPercent,
    monthBooks,
    daysLogged: effectiveDaysLogged,
    dailyAverageRevenue,
    roas,
    acos,
    tacos,
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
  const yearTacos = yearRevenue > 0 ? (yearAds / yearRevenue) * 100 : 0;

  return {
    yearRevenue,
    yearAds,
    yearProfit,
    yearBooks,
    marginPercent,
    yearTacos,
    daysLogged: yearEntries.length,
  };
}

export interface DayChartPoint {
  day: number;
  date: string;
  formattedDate: string;
  revenue: number; // CA Réel du jour
  adsCost: number; // Pub Ads du jour
  profit: number; // Bénéfice Réel du jour
  cumulProfit: number | null; // Bénéfice Réel cumulé
  cumulRevenue: number | null; // CA Réel cumulé
  cumulAds: number | null; // Dépenses Ads cumulées
  booksSold: number;
  // Trend curves (from cutoff day to end of month)
  trendRevenue?: number | null;
  trendAds?: number | null;
  trendProfit?: number | null;
  isProjected?: boolean;
}

export interface MonthTrendProjection {
  hasEnoughData: boolean; // true if entry count >= 3
  entryCount: number;
  daysLogged: number;
  daysInMonth: number;
  daysRemaining: number;
  cutoffDay: number;
  
  // Current real cumulative
  currentCumulRevenue: number;
  currentCumulAds: number;
  currentCumulProfit: number;
  currentMargin: number;
  
  // Daily run rate
  dailyAvgRevenue: number;
  dailyAvgAds: number;
  dailyAvgProfit: number;
  
  // Projected End-of-Month totals (at day daysInMonth)
  projectedEndRevenue: number;
  projectedEndAds: number;
  projectedEndProfit: number;
  projectedEndMargin: number;
  projectedEndAcos: number;
  projectedEndRoas: number;
  
  // TACoS fields (Total Advertising Cost of Sales)
  currentTacos: number;
  projectedEndTacos: number;
  
  // Deltas to end of month
  projectedRemainingRevenue: number;
  projectedRemainingAds: number;
  projectedRemainingProfit: number;
}

/**
 * Compute trend projections for a given month
 */
export function getMonthTrendProjection(
  entries: DailyEntry[],
  year: number,
  month: number
): MonthTrendProjection {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthEntries = entries.filter((e) => e.date.startsWith(prefix));
  const distinctDailyEntries = monthEntries.filter((e) => !e.isMonthlyTotal);
  const monthlyTotalEntry = monthEntries.find((e) => e.isMonthlyTotal);
  const hasOnlyMonthlyTotal = monthlyTotalEntry && distinctDailyEntries.length === 0;

  const now = new Date();
  const isCurrentMonthYear = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = isCurrentMonthYear ? Math.max(1, now.getDate()) : daysInMonth;

  let entryCount = distinctDailyEntries.length;
  let cutoffDay = 0;
  let currentCumulRevenue = 0;
  let currentCumulAds = 0;

  if (hasOnlyMonthlyTotal) {
    cutoffDay = currentDay;
    entryCount = cutoffDay;
    currentCumulRevenue = monthlyTotalEntry.revenue;
    currentCumulAds = monthlyTotalEntry.adsCost;
  } else {
    const loggedDayNumbers = distinctDailyEntries
      .map((e) => parseInt(e.date.split('-')[2], 10))
      .filter((n) => !isNaN(n));
    cutoffDay = loggedDayNumbers.length > 0 ? Math.max(...loggedDayNumbers) : 0;
    if (isCurrentMonthYear && currentDay > cutoffDay && cutoffDay > 0) {
      cutoffDay = currentDay;
    }
    distinctDailyEntries.forEach((e) => {
      currentCumulRevenue += e.revenue || 0;
      currentCumulAds += e.adsCost || 0;
    });
  }

  const currentCumulProfit = currentCumulRevenue - currentCumulAds;
  const currentMargin = currentCumulRevenue > 0 ? (currentCumulProfit / currentCumulRevenue) * 100 : 0;
  const hasEnoughData = entryCount >= 3;

  const effectiveDivisor = Math.max(1, cutoffDay || 1);
  const dailyAvgRevenue = currentCumulRevenue / effectiveDivisor;
  const dailyAvgAds = currentCumulAds / effectiveDivisor;
  const dailyAvgProfit = currentCumulProfit / effectiveDivisor;

  const daysRemaining = Math.max(0, daysInMonth - cutoffDay);

  const projectedEndRevenue = Math.round((currentCumulRevenue + daysRemaining * dailyAvgRevenue) * 100) / 100;
  const projectedEndAds = Math.round((currentCumulAds + daysRemaining * dailyAvgAds) * 100) / 100;
  const projectedEndProfit = Math.round((projectedEndRevenue - projectedEndAds) * 100) / 100;

  const projectedEndMargin = projectedEndRevenue > 0 ? (projectedEndProfit / projectedEndRevenue) * 100 : 0;
  const projectedEndAcos = projectedEndRevenue > 0 ? (projectedEndAds / projectedEndRevenue) * 100 : 0;
  const projectedEndRoas = projectedEndAds > 0 ? projectedEndRevenue / projectedEndAds : 0;

  const currentTacos = currentCumulRevenue > 0 ? (currentCumulAds / currentCumulRevenue) * 100 : 0;
  const projectedEndTacos = projectedEndRevenue > 0 ? (projectedEndAds / projectedEndRevenue) * 100 : 0;

  return {
    hasEnoughData,
    entryCount,
    daysLogged: entryCount,
    daysInMonth,
    daysRemaining,
    cutoffDay,
    currentCumulRevenue,
    currentCumulAds,
    currentCumulProfit,
    currentMargin,
    dailyAvgRevenue,
    dailyAvgAds,
    dailyAvgProfit,
    projectedEndRevenue,
    projectedEndAds,
    projectedEndProfit,
    projectedEndMargin,
    projectedEndAcos,
    projectedEndRoas,
    currentTacos,
    projectedEndTacos,
    projectedRemainingRevenue: Math.max(0, projectedEndRevenue - currentCumulRevenue),
    projectedRemainingAds: Math.max(0, projectedEndAds - currentCumulAds),
    projectedRemainingProfit: projectedEndProfit - currentCumulProfit,
  };
}

/**
 * Generate daily chart data for a month, filling missing days if appropriate or extending to the end of month with trend curves
 */
export function getDailyChartData(
  entries: DailyEntry[],
  year: number,
  month: number
): DayChartPoint[] {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  // Get total days in this month (e.g. 28, 30, 31)
  const daysInMonth = new Date(year, month, 0).getDate();

  // Map of existing entries
  const entryMap = new Map<string, DailyEntry>();
  const monthEntries = entries.filter((e) => e.date.startsWith(prefix));
  const distinctDailyEntries = monthEntries.filter((e) => !e.isMonthlyTotal);
  const monthlyTotalEntry = monthEntries.find((e) => e.isMonthlyTotal);
  const hasOnlyMonthlyTotal = monthlyTotalEntry && distinctDailyEntries.length === 0;

  if (!hasOnlyMonthlyTotal) {
    distinctDailyEntries.forEach((e) => entryMap.set(e.date, e));
  }

  const now = new Date();
  const isCurrentMonthYear = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = isCurrentMonthYear ? Math.max(1, now.getDate()) : daysInMonth;

  // Determine cutoff day
  let cutoffDay = 0;
  let entryCount = distinctDailyEntries.length;

  if (hasOnlyMonthlyTotal) {
    cutoffDay = currentDay;
    entryCount = cutoffDay;
  } else {
    const loggedDayNumbers = distinctDailyEntries
      .map((e) => parseInt(e.date.split('-')[2], 10))
      .filter((n) => !isNaN(n));
    cutoffDay = loggedDayNumbers.length > 0 ? Math.max(...loggedDayNumbers) : 0;
    if (isCurrentMonthYear && currentDay > cutoffDay && cutoffDay > 0) {
      cutoffDay = currentDay;
    }
  }

  const hasEnoughDataForTrend = entryCount >= 3;
  const points: DayChartPoint[] = [];
  let runningCumulProfit = 0;
  let runningCumulRevenue = 0;
  let runningCumulAds = 0;

  // First pass: accumulate real values up to cutoffDay
  const realCutoff = Math.max(1, cutoffDay || 1);
  for (let d = 1; d <= realCutoff; d++) {
    const dayStr = String(d).padStart(2, '0');
    const fullDate = `${year}-${monthStr}-${dayStr}`;

    let rev = 0;
    let ads = 0;
    let books = 0;

    if (hasOnlyMonthlyTotal) {
      rev = monthlyTotalEntry.revenue / realCutoff;
      ads = monthlyTotalEntry.adsCost / realCutoff;
      books = monthlyTotalEntry.booksSold ? Math.round(monthlyTotalEntry.booksSold / realCutoff) : 0;
    } else {
      const entry = entryMap.get(fullDate);
      rev = entry ? (entry.revenue || 0) : 0;
      ads = entry ? (entry.adsCost || 0) : 0;
      books = entry ? (entry.booksSold || 0) : 0;
    }

    const profit = rev - ads;
    runningCumulProfit += profit;
    runningCumulRevenue += rev;
    runningCumulAds += ads;

    // Anchor trend curves at cutoffDay so lines connect seamlessly
    const isAnchor = hasEnoughDataForTrend && d === realCutoff;

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
      trendRevenue: isAnchor ? Math.round(runningCumulRevenue * 100) / 100 : null,
      trendAds: isAnchor ? Math.round(runningCumulAds * 100) / 100 : null,
      trendProfit: isAnchor ? Math.round(runningCumulProfit * 100) / 100 : null,
      isProjected: false,
    });
  }

  // Second pass: if >= 3 entries, extend trend curves to the end of the month
  if (hasEnoughDataForTrend && realCutoff < daysInMonth) {
    const dailyAvgRev = runningCumulRevenue / realCutoff;
    const dailyAvgAds = runningCumulAds / realCutoff;
    const dailyAvgProfit = runningCumulProfit / realCutoff;

    for (let d = realCutoff + 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const fullDate = `${year}-${monthStr}-${dayStr}`;
      const daysAhead = d - realCutoff;

      const projectedRev = Math.round((runningCumulRevenue + daysAhead * dailyAvgRev) * 100) / 100;
      const projectedAds = Math.round((runningCumulAds + daysAhead * dailyAvgAds) * 100) / 100;
      const projectedProfit = Math.round((runningCumulProfit + daysAhead * dailyAvgProfit) * 100) / 100;

      points.push({
        day: d,
        date: fullDate,
        formattedDate: `${d} ${getMonthNameFr(month).slice(0, 4)}.`,
        revenue: 0,
        adsCost: 0,
        profit: 0,
        cumulProfit: null,
        cumulRevenue: null,
        cumulAds: null,
        booksSold: 0,
        trendRevenue: projectedRev,
        trendAds: projectedAds,
        trendProfit: projectedProfit,
        isProjected: true,
      });
    }
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

/**
 * Diagnostic de santé et recommandations pour le TACoS (Total Advertising Cost of Sales)
 * adapté aux auteurs et auto-éditeurs Amazon KDP.
 * 
 * Formule : TACoS = (Dépenses Ads / Chiffre d'Affaires Global KDP) * 100
 */
export function getTacosDiagnostic(
  tacos: number,
  ads = 0,
  revenue = 0
): TacosDiagnostic {
  if (ads <= 0 || revenue <= 0) {
    return {
      tacos: 0,
      status: 'no_ads',
      label: 'Aucune dépense publicitaire',
      shortLabel: 'Pas de pub',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      textClass: 'text-slate-600',
      bgLightClass: 'bg-slate-50',
      advice: '100% de vos redevances sont d\'origine organique. Vous ne dépensez rien en publicité sur cette période.',
      marginRemaining: 100,
    };
  }

  const marginRemaining = Math.max(0, Math.round((100 - tacos) * 10) / 10);

  if (tacos < 15) {
    return {
      tacos,
      status: 'excellent',
      label: 'Excellente rentabilité (< 15 %)',
      shortLabel: 'Excellent',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      textClass: 'text-emerald-700',
      bgLightClass: 'bg-emerald-50',
      advice: 'Votre catalogue est très autonome ! Les ventes organiques portent vos redevances et la pub agit comme un amplificateur à coût très modéré.',
      marginRemaining,
    };
  }

  if (tacos <= 25) {
    return {
      tacos,
      status: 'healthy',
      label: 'Idéal & Équilibré (15 à 25 %)',
      shortLabel: 'Sain & Rentable',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      textClass: 'text-blue-700',
      bgLightClass: 'bg-blue-50',
      advice: 'Zone cible optimale pour un auteur KDP en vitesse de croisière. Vos campagnes stimulent le classement (BSR) tout en préservant un bénéfice net élevé.',
      marginRemaining,
    };
  }

  if (tacos <= 35) {
    return {
      tacos,
      status: 'launch_vigilance',
      label: 'Phase de lancement / Vigilance (25 à 35 %)',
      shortLabel: 'Lancement / Vigilance',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      textClass: 'text-amber-700',
      bgLightClass: 'bg-amber-50',
      advice: 'Normal si vous lancez un nouveau livre ou ciblez des mots-clés compétitifs. En vitesse de croisière, travaillez à optimiser vos enchères pour viser < 25%.',
      marginRemaining,
    };
  }

  if (tacos <= 50) {
    return {
      tacos,
      status: 'caution',
      label: 'Zone de prudence (35 à 50 %)',
      shortLabel: 'Zone de prudence',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      textClass: 'text-orange-700',
      bgLightClass: 'bg-orange-50',
      advice: 'La publicité consomme plus du tiers de vos redevances KDP. Surveillez vos cibles, baissez le CPC et éliminez les mots-clés sans vente.',
      marginRemaining,
    };
  }

  if (tacos <= 100) {
    return {
      tacos,
      status: 'high_risk',
      label: 'Marge critique (50 à 100 %)',
      shortLabel: 'Marge critique',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      textClass: 'text-rose-700',
      bgLightClass: 'bg-rose-50',
      advice: 'Attention : il ne vous reste que peu de marge nette après pub. Vos annonces risquent de cannibaliser vos redevances. Une revue approfondie s\'impose.',
      marginRemaining,
    };
  }

  return {
    tacos,
    status: 'deficit',
    label: 'Déficitaire (> 100 %)',
    shortLabel: 'Déficitaire',
    badgeClass: 'bg-rose-200 text-rose-900 border-rose-300 font-bold',
    textClass: 'text-rose-800',
    bgLightClass: 'bg-rose-50',
    advice: 'Vous dépensez plus en publicité que ce que KDP vous rapporte au total. Vos campagnes détruisent de la valeur : mettez en pause les campagnes déficitaires.',
    marginRemaining: 0,
  };
}
