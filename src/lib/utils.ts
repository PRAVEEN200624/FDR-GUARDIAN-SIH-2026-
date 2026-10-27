import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FDRWorkflowStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Indian Rupee currency with standard Indian Numbering system (Lakhs & Crores)
 * e.g., 3500000 -> ₹35,00,000
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date in DD MMM YYYY Indian administrative style
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format timestamp with time in 24hr format
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate days remaining until maturity or days passed since maturity
 */
export function getMaturityDaysInfo(maturityDateStr: string): {
  days: number;
  isOverdue: boolean;
  label: string;
  badgeClass: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const matDate = new Date(maturityDateStr);
  matDate.setHours(0, 0, 0, 0);

  const diffTime = matDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      isOverdue: true,
      label: `${Math.abs(diffDays)} days overdue`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      label: 'Matures today',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  } else if (diffDays <= 7) {
    return {
      days: diffDays,
      isOverdue: false,
      label: `Matures in ${diffDays}d (Urgent)`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    };
  } else if (diffDays <= 30) {
    return {
      days: diffDays,
      isOverdue: false,
      label: `Matures in ${diffDays} days`,
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    };
  } else {
    return {
      days: diffDays,
      isOverdue: false,
      label: `${diffDays} days remaining`,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }
}

/**
 * Map workflow status to appropriate e-Gov color badges
 */
export function getStatusBadge(status: FDRWorkflowStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'Approved':
    case 'Released':
      return {
        label: status,
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
      };
    case 'Bank Confirmed':
      return {
        label: status,
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-300',
      };
    case 'Bank Mismatch':
    case 'Rejected':
      return {
        label: status,
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-300',
      };
    case 'Clarification Required':
    case 'Correction Required':
    case 'Awaiting Information':
      return {
        label: status,
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
      };
    case 'Under Regulatory Review':
    case 'Bank Verification Pending':
    case 'Ready for Bank Verification':
      return {
        label: status,
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-300',
      };
    case 'Renewal Pending':
    case 'Replacement Pending':
    case 'Release Pending':
      return {
        label: status,
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-300',
      };
    case 'Matured':
      return {
        label: status,
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-300',
      };
    case 'Draft':
    case 'Submitted':
    case 'OCR Processing':
    default:
      return {
        label: status,
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
      };
  }
}

/**
 * Generate simulated SHA-256 hash from file name and size
 */
export function generateMockSha256(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}49afbf4c8996fb92427ae41e4649b934ca495991b7852b85567a8b9c0d1e2f3a`.slice(0, 64);
}
