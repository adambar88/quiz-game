import type { Category } from '../types/quiz.ts';

export interface CategoryMeta {
  id: Category;
  icon: string;
  gradient: string;
  accentColor: string;
  bgTint: string;
}

export const CATEGORY_METADATA: Record<Category, CategoryMeta> = {
  'Computer Science': {
    id: 'Computer Science',
    icon: '💻',
    gradient: 'from-blue-500 to-cyan-400',
    accentColor: '#3b82f6',
    bgTint: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  'Web Dev': {
    id: 'Web Dev',
    icon: '🌐',
    gradient: 'from-emerald-500 to-teal-400',
    accentColor: '#10b981',
    bgTint: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  'AI & Machine Learning': {
    id: 'AI & Machine Learning',
    icon: '🤖',
    gradient: 'from-purple-500 to-indigo-400',
    accentColor: '#8b5cf6',
    bgTint: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  },
  'Cybersecurity': {
    id: 'Cybersecurity',
    icon: '🛡️',
    gradient: 'from-cyan-500 to-blue-400',
    accentColor: '#06b6d4',
    bgTint: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  },
  'Gaming & Esports': {
    id: 'Gaming & Esports',
    icon: '🎮',
    gradient: 'from-fuchsia-500 to-pink-400',
    accentColor: '#d946ef',
    bgTint: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
  },
  'Science': {
    id: 'Science',
    icon: '🧪',
    gradient: 'from-green-500 to-emerald-400',
    accentColor: '#22c55e',
    bgTint: 'bg-green-500/10 border-green-500/30 text-green-400',
  },
  'Physics & Astronomy': {
    id: 'Physics & Astronomy',
    icon: '🌌',
    gradient: 'from-violet-500 to-purple-400',
    accentColor: '#7c3aed',
    bgTint: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
  },
  'Mathematics': {
    id: 'Mathematics',
    icon: '📐',
    gradient: 'from-indigo-500 to-blue-400',
    accentColor: '#6366f1',
    bgTint: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  },
  'Geography & Earth': {
    id: 'Geography & Earth',
    icon: '🌍',
    gradient: 'from-teal-500 to-emerald-400',
    accentColor: '#14b8a6',
    bgTint: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  },
  'Medicine & Health': {
    id: 'Medicine & Health',
    icon: '🩺',
    gradient: 'from-rose-500 to-red-400',
    accentColor: '#f43f5e',
    bgTint: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  },
  'History': {
    id: 'History',
    icon: '🏛️',
    gradient: 'from-amber-500 to-orange-400',
    accentColor: '#f59e0b',
    bgTint: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  'Polish History': {
    id: 'Polish History',
    icon: '🦅',
    gradient: 'from-red-600 to-rose-500',
    accentColor: '#dc2626',
    bgTint: 'bg-red-500/10 border-red-500/30 text-red-400',
  },
  'Mythology & Folklore': {
    id: 'Mythology & Folklore',
    icon: '⚡',
    gradient: 'from-yellow-500 to-amber-400',
    accentColor: '#eab308',
    bgTint: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  },
  'Politics & Civics': {
    id: 'Politics & Civics',
    icon: '⚖️',
    gradient: 'from-slate-500 to-gray-400',
    accentColor: '#64748b',
    bgTint: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
  },
  'Philosophy & Psychology': {
    id: 'Philosophy & Psychology',
    icon: '🧠',
    gradient: 'from-sky-500 to-indigo-400',
    accentColor: '#0ea5e9',
    bgTint: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
  },
  'Pop Culture': {
    id: 'Pop Culture',
    icon: '🍿',
    gradient: 'from-pink-500 to-rose-400',
    accentColor: '#ec4899',
    bgTint: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  },
  'Cinema & Television': {
    id: 'Cinema & Television',
    icon: '🎬',
    gradient: 'from-red-500 to-amber-400',
    accentColor: '#ef4444',
    bgTint: 'bg-red-500/10 border-red-500/30 text-red-400',
  },
  'Music': {
    id: 'Music',
    icon: '🎵',
    gradient: 'from-purple-500 to-pink-400',
    accentColor: '#a855f7',
    bgTint: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  },
  'Literature & Books': {
    id: 'Literature & Books',
    icon: '📚',
    gradient: 'from-emerald-600 to-teal-500',
    accentColor: '#059669',
    bgTint: 'bg-emerald-600/10 border-emerald-600/30 text-emerald-400',
  },
  'Art & Architecture': {
    id: 'Art & Architecture',
    icon: '🎨',
    gradient: 'from-orange-500 to-amber-400',
    accentColor: '#f97316',
    bgTint: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  },
  'Sports': {
    id: 'Sports',
    icon: '⚽',
    gradient: 'from-lime-500 to-green-400',
    accentColor: '#84cc16',
    bgTint: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
  },
  'Food & Culinary': {
    id: 'Food & Culinary',
    icon: '🍳',
    gradient: 'from-amber-500 to-yellow-400',
    accentColor: '#f59e0b',
    bgTint: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  'Business & Finance': {
    id: 'Business & Finance',
    icon: '📈',
    gradient: 'from-emerald-500 to-cyan-400',
    accentColor: '#10b981',
    bgTint: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  'Automotive & Transport': {
    id: 'Automotive & Transport',
    icon: '🚗',
    gradient: 'from-blue-600 to-indigo-500',
    accentColor: '#2563eb',
    bgTint: 'bg-blue-600/10 border-blue-600/30 text-blue-400',
  },
};
