export interface Department {
  id: string;
  name: string;
  shortName: string;
  categories: string[];
  sla_days: number; // target resolution days
  color: string;
  icon: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'pwd',
    name: 'Public Works Department',
    shortName: 'PWD',
    categories: ['roads'],
    sla_days: 7,
    color: '#f97316',
    icon: '🛣️'
  },
  {
    id: 'water_board',
    name: 'Water & Sanitation Board',
    shortName: 'BWSSB',
    categories: ['water', 'sanitation'],
    sla_days: 3,
    color: '#38bdf8',
    icon: '💧'
  },
  {
    id: 'discom',
    name: 'Power Distribution Company',
    shortName: 'DISCOM',
    categories: ['electricity'],
    sla_days: 2,
    color: '#fbbf24',
    icon: '⚡'
  },
  {
    id: 'health_dept',
    name: 'State Health Department',
    shortName: 'NHM',
    categories: ['health'],
    sla_days: 1,
    color: '#f43f5e',
    icon: '🏥'
  },
  {
    id: 'education_dept',
    name: 'District Education Office',
    shortName: 'DEO',
    categories: ['education'],
    sla_days: 14,
    color: '#34d399',
    icon: '📚'
  },
  {
    id: 'municipal',
    name: 'Municipal Corporation',
    shortName: 'ULB',
    categories: ['other'],
    sla_days: 10,
    color: '#a855f7',
    icon: '🏛️'
  },
];

export function getDepartmentForCategory(category: string): Department {
  return DEPARTMENTS.find(d => d.categories.includes(category)) 
    || DEPARTMENTS[DEPARTMENTS.length - 1];
}

export function getSLADeadline(
  category: string, 
  createdAt: Date
): Date {
  const dept = getDepartmentForCategory(category);
  const deadline = new Date(createdAt);
  deadline.setDate(deadline.getDate() + dept.sla_days);
  return deadline;
}

export function getSLAStatus(
  category: string,
  createdAt: Date,
  status: string
): 'on_track' | 'at_risk' | 'breached' {
  if (status === 'resolved') return 'on_track';
  const deadline = getSLADeadline(category, createdAt);
  const now = new Date();
  const hoursLeft = (deadline.getTime() - now.getTime()) / 36e5;
  if (hoursLeft < 0) return 'breached';
  if (hoursLeft < 24) return 'at_risk';
  return 'on_track';
}
