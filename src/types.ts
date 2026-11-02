export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  revenue: number; // CA KDP Réel (€)
  expectedRevenue?: number; // CA Espéré / Projeté avec ventes Ads estimées (€)
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
  monthExpectedRevenue: number; // CA Espéré (avec ventes Ads)
  monthAds: number; // Dépenses Amazon Ads
  monthProfit: number; // Bénéfice Réel = CA Réel - Pub
  monthExpectedProfit: number; // Bénéfice Espéré = CA Espéré - Pub
  marginPercent: number; // (Profit / Revenue) * 100
  expectedMarginPercent: number; // (ExpectedProfit / ExpectedRevenue) * 100
  monthBooks: number; // Nombre total de livres vendus
  daysLogged: number;
  dailyAverageRevenue: number;
  dailyAverageExpectedRevenue: number;
  roas: number; // Revenue / Ads
  expectedRoas: number; // ExpectedRevenue / Ads
  acos: number; // (Ads / Revenue) * 100 (Alias TACoS)
  expectedAcos: number; // (Ads / ExpectedRevenue) * 100
  tacos: number; // TACoS Réel = (Ads / CA Réel) * 100
  expectedTacos: number; // TACoS Espéré = (Ads / CA Espéré) * 100
}


export interface DayMetrics {
  todayRevenue: number;
  todayExpectedRevenue: number;
  todayAds: number;
  todayProfit: number;
  todayExpectedProfit: number;
  todayBooks: number;
  marginPercent: number;
  expectedMarginPercent: number;
}

export interface YearMetrics {
  yearRevenue: number;
  yearExpectedRevenue: number;
  yearAds: number;
  yearProfit: number;
  yearExpectedProfit: number;
  yearBooks: number;
  marginPercent: number;
  expectedMarginPercent: number;
  yearTacos: number; // (yearAds / yearRevenue) * 100
  yearExpectedTacos: number; // (yearAds / yearExpectedRevenue) * 100
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

