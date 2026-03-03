export type TabType = 'overview' | 'forecast';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'orange' | 'muted';
  alert?: boolean;
  trend?: string | {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export interface ColorTheme {
  blue: string;
  emerald: string;
  orange: string;
  muted: string;
}

export interface DashboardStats {
  valuation: number;
  health: number;
  lowStock: number;
  totalUnits: number;
}
