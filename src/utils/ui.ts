export const actionButtonStyles = {
  primary: 'border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition-colors',
  neutral: 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm transition-colors',
  info: 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 shadow-sm transition-colors',
  success: 'border border-green-600 bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors',
  successSubtle: 'border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 shadow-sm transition-colors',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm transition-colors',
  warning: 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-sm transition-colors',
} as const;

export const statusToneStyles = {
  pending: 'bg-amber-50 border border-amber-100 text-amber-800',
  draft: 'bg-amber-50 border border-amber-100 text-amber-800',
  sent: 'bg-blue-50 border border-blue-100 text-blue-700',
  awaiting: 'bg-blue-50 border border-blue-100 text-blue-700',
  approved: 'bg-green-50 border border-green-200 text-green-800',
  accepted: 'bg-green-50 border border-green-200 text-green-800',
  received: 'bg-green-50 border border-green-200 text-green-800',
  completed: 'bg-green-50 border border-green-200 text-green-800',
  passed: 'bg-green-50 border border-green-200 text-green-800',
  rejected: 'bg-red-50 border border-red-200 text-red-700',
  failed: 'bg-red-50 border border-red-200 text-red-700',
  in_progress: 'bg-blue-50 border border-blue-100 text-blue-700',
  planned: 'bg-amber-50 border border-amber-100 text-amber-800',
} as const;
