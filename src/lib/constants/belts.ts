export const OFFICIAL_BELTS = [
  'Putih',
  'Kuning',
  'Hijau',
  'Biru Muda',
  'Biru Tua',
  'Coklat Muda',
  'Coklat Tua',
  'Hitam',
] as const;

export type BeltType = typeof OFFICIAL_BELTS[number] | string;

export interface BeltStyle {
  bg: string;
  text: string;
  border: string;
  hex: string;
  emoji: string;
}

export const BELT_CONFIG: Record<string, BeltStyle> = {
  'Putih': {
    bg: 'bg-slate-200 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-600',
    hex: '#e5e7eb',
    emoji: '🥋',
  },
  'Kuning': {
    bg: 'bg-yellow-300 dark:bg-yellow-900/40',
    text: 'text-yellow-900 dark:text-yellow-300',
    border: 'border-yellow-400 dark:border-yellow-700',
    hex: '#fde68a',
    emoji: '🟡',
  },
  'Hijau': {
    bg: 'bg-green-500 dark:bg-green-900/40',
    text: 'text-white dark:text-green-300',
    border: 'border-green-600 dark:border-green-700',
    hex: '#4ade80',
    emoji: '🟢',
  },
  'Biru Muda': {
    bg: 'bg-blue-400 dark:bg-sky-900/40',
    text: 'text-white dark:text-sky-300',
    border: 'border-blue-500 dark:border-sky-700',
    hex: '#93c5fd',
    emoji: '🔵',
  },
  'Biru Tua': {
    bg: 'bg-blue-700 dark:bg-blue-900/40',
    text: 'text-white dark:text-blue-300',
    border: 'border-blue-800 dark:border-blue-700',
    hex: '#1d4ed8',
    emoji: '💙',
  },
  'Coklat Muda': {
    bg: 'bg-amber-700 dark:bg-amber-900/40',
    text: 'text-white dark:text-amber-300',
    border: 'border-amber-800 dark:border-amber-700',
    hex: '#ca8a04',
    emoji: '🟤',
  },
  'Coklat Tua': {
    bg: 'bg-amber-900 dark:bg-amber-950/60',
    text: 'text-white dark:text-amber-200',
    border: 'border-amber-950 dark:border-amber-800',
    hex: '#78350f',
    emoji: '🟫',
  },
  'Hitam': {
    bg: 'bg-gray-900 dark:bg-gray-800',
    text: 'text-white dark:text-gray-100',
    border: 'border-red-500 dark:border-red-600',
    hex: '#111827',
    emoji: '⬛',
  },
};

const DEFAULT_BELT_STYLE: BeltStyle = {
  bg: 'bg-slate-700 dark:bg-slate-800',
  text: 'text-slate-100 dark:text-slate-200',
  border: 'border-slate-600 dark:border-slate-700',
  hex: '#6b7280',
  emoji: '🥋',
};

export function getBeltStyle(belt?: string): BeltStyle {
  if (!belt) return DEFAULT_BELT_STYLE;
  const lower = belt.toLowerCase().trim();
  
  // Direct match
  for (const [key, style] of Object.entries(BELT_CONFIG)) {
    if (lower === key.toLowerCase()) return style;
  }

  // Substring match
  if (lower.includes('coklat tua') || lower.includes('cokelat tua')) return BELT_CONFIG['Coklat Tua'];
  if (lower.includes('coklat muda') || lower.includes('cokelat muda')) return BELT_CONFIG['Coklat Muda'];
  if (lower.includes('coklat') || lower.includes('cokelat')) return BELT_CONFIG['Coklat Muda']; // fallback ke Coklat Muda
  if (lower.includes('biru tua')) return BELT_CONFIG['Biru Tua'];
  if (lower.includes('biru muda')) return BELT_CONFIG['Biru Muda'];
  if (lower.includes('biru')) return BELT_CONFIG['Biru Muda']; // fallback ke Biru Muda
  if (lower.includes('kuning')) return BELT_CONFIG['Kuning'];
  if (lower.includes('hijau')) return BELT_CONFIG['Hijau'];
  if (lower.includes('putih')) return BELT_CONFIG['Putih'];
  if (lower.includes('hitam') || lower.includes('dan')) return BELT_CONFIG['Hitam'];

  return DEFAULT_BELT_STYLE;
}

export function getBeltEmoji(belt?: string): string {
  return getBeltStyle(belt).emoji;
}

export function getBeltHex(belt?: string): string {
  return getBeltStyle(belt).hex;
}
