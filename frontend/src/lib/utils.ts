import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel, ClaimStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number | string | null, currency = '₦') => {
  if (amount === null || amount === undefined) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${currency}${num.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRiskBadgeClass = (risk: RiskLevel) => {
  switch (risk) {
    case 'low': return 'badge-low';
    case 'medium': return 'badge-medium';
    case 'high': return 'badge-high';
    default: return 'badge-pending';
  }
};

export const getStatusColor = (status: ClaimStatus) => {
  const map: Record<ClaimStatus, string> = {
    submitted: 'text-slate-300 bg-slate-500/10 border-slate-500/25',
    under_review: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    fraud_investigation: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    approved: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    partially_approved: 'text-teal-300 bg-teal-500/10 border-teal-500/25',
    rejected: 'text-rose-400 bg-rose-500/[0.07] border-rose-500/25',
    paid: 'text-teal-200 bg-teal-500/15 border-teal-400/30',
  };
  return map[status] || 'text-slate-300 bg-slate-500/10 border-slate-500/25';
};

export const getStatusLabel = (status: ClaimStatus) => {
  const map: Record<ClaimStatus, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    fraud_investigation: 'Fraud Investigation',
    approved: 'Approved',
    partially_approved: 'Partially Approved',
    rejected: 'Rejected',
    paid: 'Paid',
  };
  return map[status] || status;
};

export const getFraudScoreColor = (score: number | null) => {
  if (score === null) return 'text-slate-400';
  if (score < 30) return 'text-emerald-400';
  if (score < 60) return 'text-amber-400';
  return 'text-red-400';
};

export const getFraudScoreBarColor = (score: number | null) => {
  if (score === null) return 'bg-slate-600';
  if (score < 30) return 'bg-emerald-500';
  if (score < 60) return 'bg-amber-500';
  return 'bg-red-500';
};
