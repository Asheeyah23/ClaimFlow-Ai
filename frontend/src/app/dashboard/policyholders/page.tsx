'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { policyholdersAPI } from '../../../lib/api';
import { Policyholder } from '../../../types';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { Search, Plus, Users, ChevronRight } from 'lucide-react';

export default function PolicyholdersPage() {
  const [policyholders, setPolicyholders] = useState<Policyholder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        const res = await policyholdersAPI.getAll(params);
        setPolicyholders(res.data.policyholders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search]);

  const expiringSoon = (end: string) => {
    const days = (new Date(end).getTime() - Date.now()) / 86400000;
    return days > 0 && days < 30;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Policyholders</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {isLoading ? 'Loading…' : `${policyholders.length} registered policyholders`}
          </p>
        </div>
        <Link href="/dashboard/policyholders/new" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Policyholder
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search by name, policy number, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : policyholders.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <Users className="h-6 w-6 text-slate-500" />
          </div>
          <p className="font-medium text-slate-300">No policyholders found</p>
          <p className="mt-1 text-sm text-slate-500">Add a policyholder to start filing claims.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {policyholders.map((ph) => (
            <Link key={ph.id} href={`/dashboard/policyholders/${ph.id}`} className="card-hover group p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-teal text-sm font-bold text-white">
                  {ph.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{ph.full_name}</p>
                  <p className="font-mono text-xs text-teal-400">{ph.policy_number}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-teal-400" />
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div>
                  <p className="text-slate-500">Type</p>
                  <p className="text-slate-300">{ph.policy_type}</p>
                </div>
                <div>
                  <p className="text-slate-500">Coverage</p>
                  <p className="font-mono text-slate-300">{formatCurrency(ph.coverage_amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Location</p>
                  <p className="text-slate-300">{ph.state || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Expires</p>
                  <p className={expiringSoon(ph.policy_end_date) ? 'text-amber-400' : 'text-slate-300'}>
                    {formatDate(ph.policy_end_date)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
