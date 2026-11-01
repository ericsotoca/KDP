import { DailyEntry, UserGoals } from '../types';

const STORAGE_KEY_ENTRIES = 'kdp_tracker_entries_v1';
const STORAGE_KEY_GOALS = 'kdp_tracker_goals_v1';

export const DEFAULT_GOALS: UserGoals = {
  monthlyRevenueGoal: 1000,
  monthlyProfitGoal: 500,
};

/**
 * Load entries from LocalStorage
 */
export function loadStoredEntries(): DailyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Clean out any demo data completely so only real user data remains
    const clean = parsed.filter((e: any) => !e.isDemo);
    if (clean.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(clean));
    }

    // Sort descending by date
    return clean.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error('Failed to load entries from LocalStorage:', err);
    return [];
  }
}

/**
 * Save entries to LocalStorage
 */
export function saveStoredEntries(entries: DailyEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save entries to LocalStorage:', err);
  }
}

/**
 * Load goals from LocalStorage
 */
export function loadStoredGoals(): UserGoals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOALS);
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw);
    return {
      monthlyRevenueGoal: Number(parsed.monthlyRevenueGoal) || DEFAULT_GOALS.monthlyRevenueGoal,
      monthlyProfitGoal: Number(parsed.monthlyProfitGoal) || DEFAULT_GOALS.monthlyProfitGoal,
    };
  } catch (err) {
    console.error('Failed to load goals:', err);
    return DEFAULT_GOALS;
  }
}

/**
 * Save goals to LocalStorage
 */
export function saveStoredGoals(goals: UserGoals): void {
  try {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save goals:', err);
  }
}

/**
 * Export entries to CSV file with UTF-8 BOM
 */
export function exportEntriesToCsv(entries: DailyEntry[]): void {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  
  // Headers in French matching user spec: Date | CA | Publicité | Bénéfice | Livres vendus | Commentaires
  const header = ['Date', 'CA KDP (€)', 'Dépenses Publicitaires (€)', 'Bénéfice Net (€)', 'Marge (%)', 'Livres vendus', 'Commentaires'];
  
  const rows = sorted.map((entry) => {
    const profit = (entry.revenue - entry.adsCost).toFixed(2);
    const margin = entry.revenue > 0 ? (((entry.revenue - entry.adsCost) / entry.revenue) * 100).toFixed(1) : '0.0';
    const cleanComment = (entry.comment || '').replace(/"/g, '""');
    return [
      entry.date,
      entry.revenue.toFixed(2),
      entry.adsCost.toFixed(2),
      profit,
      `${margin}%`,
      entry.booksSold ?? '',
      `"${cleanComment}"`,
    ].join(';');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens accents and special characters without encoding glitches
  const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kdp-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export full backup as JSON
 */
export function exportBackupToJson(entries: DailyEntry[], goals: UserGoals): void {
  const backupData = {
    appName: 'KDP Business Tracker',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    goals,
    entriesCount: entries.length,
    entries,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kdp-tracker-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate and import backup JSON file
 */
export async function importBackupFromJson(
  file: File
): Promise<{ success: boolean; message: string; entries?: DailyEntry[]; goals?: UserGoals }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Can be direct array of entries or full backup object
        let rawEntries: any[] = [];
        let importedGoals: UserGoals | undefined;

        if (Array.isArray(parsed)) {
          rawEntries = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.entries)) {
            rawEntries = parsed.entries;
          }
          if (parsed.goals && typeof parsed.goals === 'object') {
            importedGoals = {
              monthlyRevenueGoal: Number(parsed.goals.monthlyRevenueGoal) || 1000,
              monthlyProfitGoal: Number(parsed.goals.monthlyProfitGoal) || 500,
            };
          }
        } else {
          return resolve({ success: false, message: 'Format de fichier non reconnu.' });
        }

        // Validate entries
        const validEntries: DailyEntry[] = [];
        const seenDates = new Set<string>();

        for (const item of rawEntries) {
          if (!item.date || typeof item.date !== 'string') continue;
          if (typeof item.revenue !== 'number' && isNaN(Number(item.revenue))) continue;
          if (typeof item.adsCost !== 'number' && isNaN(Number(item.adsCost))) continue;

          // Prevent duplicate dates in imported payload
          if (seenDates.has(item.date)) continue;
          seenDates.add(item.date);

          validEntries.push({
            id: item.id || `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            date: item.date,
            revenue: Math.max(0, Number(item.revenue) || 0),
            adsCost: Math.max(0, Number(item.adsCost) || 0),
            booksSold: item.booksSold != null ? Number(item.booksSold) : undefined,
            comment: typeof item.comment === 'string' ? item.comment : undefined,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
          });
        }

        if (validEntries.length === 0 && !importedGoals) {
          return resolve({ success: false, message: 'Aucune donnée valide trouvée dans ce fichier JSON.' });
        }

        return resolve({
          success: true,
          message: `${validEntries.length} saisies importées avec succès${importedGoals ? ' et objectifs mis à jour' : ''}.`,
          entries: validEntries,
          goals: importedGoals,
        });
      } catch (err: any) {
        return resolve({
          success: false,
          message: `Erreur lors de la lecture du fichier JSON: ${err?.message || 'fichier invalide'}`,
        });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: 'Impossible de lire le fichier sélectionné.' });
    };
    reader.readAsText(file);
  });
}

/**
 * Generate realistic demo data for the current month and previous month
 */
export function generateRealisticDemoData(): DailyEntry[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const entries: DailyEntry[] = [];

  // Generate for current month up to current day (or at least 15 days)
  const daysToGenCurrent = Math.max(currentDay, 18);
  for (let d = 1; d <= daysToGenCurrent; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(currentMonth).padStart(2, '0');
    const date = `${currentYear}-${monthStr}-${dayStr}`;

    // Realistic variation: weekends slightly higher, some days high ROAS, some average
    const isWeekend = (d % 7 === 0 || d % 7 === 6);
    const baseRev = isWeekend ? 58 : 42;
    const revVariance = Math.sin(d * 1.3) * 16 + (d % 3 === 0 ? 12 : -4);
    const revenue = Math.max(15, Math.round((baseRev + revVariance) * 10) / 10);
    
    // Ads typically ~25% to 40% of revenue for a solid KDP catalog
    const adsBase = revenue * 0.32;
    const adsVariance = Math.cos(d * 0.9) * 4;
    const adsCost = Math.max(3, Math.round((adsBase + adsVariance) * 10) / 10);

    const avgRoyaltyPerBook = 2.8;
    const booksSold = Math.max(2, Math.round(revenue / avgRoyaltyPerBook));

    let comment = '';
    if (d === 1) comment = 'Début de mois, relance campagnes';
    else if (d === 5) comment = 'Campagne mot-clé automatique boostée';
    else if (d === 10) comment = 'Avis 5 étoiles reçu sur le Bestseller';
    else if (d === 15) comment = 'Optimisation des enchères négatives';
    else if (isWeekend && d % 4 === 0) comment = 'Pic de ventes du week-end';

    entries.push({
      id: `demo-${date}`,
      date,
      revenue,
      adsCost,
      booksSold,
      comment: comment || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    });
  }

  // Generate for previous month (full month) so user can immediately test monthly comparison
  const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

  for (let d = 1; d <= daysInPrevMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(prevMonth).padStart(2, '0');
    const date = `${prevYear}-${monthStr}-${dayStr}`;

    const isWeekend = (d % 7 === 0 || d % 7 === 6);
    const baseRev = isWeekend ? 48 : 36;
    const revVariance = Math.sin(d * 1.1) * 12;
    const revenue = Math.max(12, Math.round((baseRev + revVariance) * 10) / 10);
    const adsCost = Math.max(4, Math.round((revenue * 0.35 + Math.sin(d * 0.8) * 3) * 10) / 10);
    const booksSold = Math.max(1, Math.round(revenue / 2.7));

    let comment = '';
    if (d === 1) comment = 'Test nouvelles couvertures';
    else if (d === 18) comment = 'Campagne Sponsored Brands activée';

    entries.push({
      id: `demo-${date}`,
      date,
      revenue,
      adsCost,
      booksSold,
      comment: comment || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    });
  }

  // Sort descending
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
