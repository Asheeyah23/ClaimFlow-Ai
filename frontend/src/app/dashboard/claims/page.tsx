'use client';
import { useEffect, useState, useCallback } from 'react';
import { claimsAPI } from '../../../lib/api';
import { Claim, RiskLevel } from '../../../types';
import ClaimsTable from '../../../components/claims/ClaimsTable';
import { Search, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';

const RISK_FILTERS: { value: '' | RiskLevel; label: string; dot: string }[] = [
  { value: '', label: 'All Risk', dot: 'bg-slate-400' },
  { value: 'low', label: 'Low', dot: 'bg-emerald-400' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-400' },
  { value: 'high', label: 'High', dot: 'bg-rose-400' },
];

const STATUS_OPTIONS = [
  ['', 'All Statuses'],
  ['submitted', 'Submitted'],
  ['under_review', 'Under Review'],
  ['fraud_investigation', 'Fraud Investigation'],
  ['approved', 'Approved'],
  ['partially_approved', 'Partially Approved'],
  ['rejected', 'Rejected'],
  ['paid', 'Paid'],
];

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<'' | RiskLevel>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.risk_level = riskFilter;
      const res = await claimsAPI.getAll(params);
      setClaims(res.data.claims || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, riskFilter]);

  useEffect(() => {
    const t = setTimeout(fetchClaims, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchClaims, search]);

  const totalPages = Math.ceil(total / limit) || 1;
  const hasFilters = search || statusFilter || riskFilter;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Claims</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {isLoading ? 'Loading…' : `${total.toLocaleString()} claims in the pipeline`}
          </p>
        </div>
        <Link href="/dashboard/claims/new" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New Claim
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search by claim number, policyholder, policy…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Risk chips */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {RISK_FILTERS.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setRiskFilter(r.value);
                  setPage(1);
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                  riskFilter === r.value ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', r.dot)} />
                {r.label}
              </button>
            ))}
          </div>

          <select
            className="input-field w-auto py-2"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setRiskFilter('');
                setPage(1);
              }}
              className="btn-ghost px-3 py-2 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <ClaimsTable claims={claims} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="text-slate-300">{(page - 1) * limit + 1}</span>–
            <span className="text-slate-300">{Math.min(page * limit, total)}</span> of{' '}
            <span className="text-slate-300">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              Previous
            </button>
            <span className="px-2 font-mono text-sm text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
