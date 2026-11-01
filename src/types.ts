export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  revenue: number; // CA KDP (€)
  adsCost: number; // Dépenses Amazon Ads (€)
  booksSold?: number; // Nombre de livres vendus
  comment?: string; // Commentaire facultatif
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  isMonthlyTotal?: boolean; // Saisie globale pour le mois entier
}

export interface UserGoals {
  monthlyRevenueGoal: number; // default 1000 €
  monthlyProfitGoal: number; // default 500 €
}

export interface MonthMetrics {
  monthRevenue: number;
  monthAds: number;
  monthProfit: number;
  monthBooks: number;
  marginPercent: number; // (Profit / Revenue) * 100
  daysLogged: number;
  dailyAverageRevenue: number;
  roas: number; // Revenue / Ads
  acos: number; // (Ads / Revenue) * 100
}

export interface DayMetrics {
  todayRevenue: number;
  todayAds: number;
  todayProfit: number;
  todayBooks: number;
  marginPercent: number;
}

export interface YearMetrics {
  yearRevenue: number;
  yearAds: number;
  yearProfit: number;
  yearBooks: number;
  marginPercent: number;
  daysLogged: number;
}

export type ActiveTab = 'dashboard' | 'entry' | 'history' | 'analytics' | 'goals' | 'backup';
