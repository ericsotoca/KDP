export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  revenue: number; // CA KDP Réel (€)
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
  monthRevenue: number; // CA Réel
  monthAds: number; // Dépenses Amazon Ads
  monthProfit: number; // Bénéfice Réel = CA Réel - Pub
  marginPercent: number; // (Profit / Revenue) * 100
  monthBooks: number; // Nombre total de livres vendus
  daysLogged: number;
  dailyAverageRevenue: number;
  roas: number; // Revenue / Ads
  acos: number; // (Ads / Revenue) * 100 (Alias TACoS)
  tacos: number; // TACoS Réel = (Ads / CA Réel) * 100
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
  yearTacos: number; // (yearAds / yearRevenue) * 100
  daysLogged: number;
}

export type TacosHealthStatus = 
  | 'no_ads' 
  | 'excellent' 
  | 'healthy' 
  | 'launch_vigilance' 
  | 'caution' 
  | 'high_risk' 
  | 'deficit';

export interface TacosDiagnostic {
  tacos: number;
  status: TacosHealthStatus;
  label: string;
  shortLabel: string;
  badgeClass: string;
  textClass: string;
  bgLightClass: string;
  advice: string;
  marginRemaining: number;
}

export type ActiveTab = 'dashboard' | 'entry' | 'history' | 'analytics' | 'goals' | 'backup';
