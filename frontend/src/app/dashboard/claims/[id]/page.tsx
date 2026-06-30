'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { claimsAPI } from '../../../../lib/api';
import { ClaimDetail, FraudFlag, AuditLogEntry, Evidence } from '../../../../types';
import { RiskBadge, StatusBadge } from '../../../../components/ui/Badges';
import FraudGauge from '../../../../components/ui/FraudGauge';
import ClaimPipeline from '../../../../components/claims/ClaimPipeline';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { formatCurrency, formatDate, formatDateTime, cn } from '../../../../lib/utils';
import { useToast } from '../../../../lib/toast';
import {
  ArrowLeft, Brain, AlertTriangle, CheckCircle, Clock, Shield, FileText, User, Loader2,
  RefreshCw, X, Paperclip, Phone, Mail, MapPin, Sparkles, ShieldAlert, ThumbsUp, Gavel,
} from 'lucide-react';

interface ClaimDetailData {
  claim: ClaimDetail;
  evidence: Evidence[];
  fraud_flags: FraudFlag[];
  audit_log: AuditLogEntry[];
}

const SEVERITY: Record<string, { cls: string; label: string }> = {
  low: { cls: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07]', label: 'Low' },
  medium: { cls: 'text-amber-300 border-amber-500/25 bg-amber-500/[0.07]', label: 'Medium' },
  high: { cls: 'text-rose-300 border-rose-500/30 bg-rose-500/[0.07]', label: 'High' },
  critical: { cls: 'text-rose-200 border-rose-500/40 bg-rose-500/[0.12]', label: 'Critical' },
};

const REC_CONFIG: Record<string, { label: string; cls: string; icon: typeof ThumbsUp }> = {
  auto_approve: { label: 'Recommended: Auto-approve', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', icon: ThumbsUp },
  human_review: { label: 'Recommended: Human review', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300', icon: Gavel },
  escalate: { label: 'Recommended: Escalate to investigation', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-300', icon: ShieldAlert },
};

export default function ClaimDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<ClaimDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [panel, setPanel] = useState(false);
  const [form, setForm] = useState({ status: '', notes: '', approved_amount: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchClaim = async () => {
    try {
      const res = await claimsAPI.getById(id as string);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      await claimsAPI.reAnalyze(id as string);
      await fetchClaim();
      toast({ type: 'ai', title: 'Re-analysis complete', description: 'The fraud agent re-scored this claim.' });
    } catch {
      toast({ type: 'error', title: 'Re-analysis failed', description: 'Could not reach the fraud agent.' });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!form.status) return;
    setIsUpdating(true);
    try {
      await claimsAPI.updateStatus(id as string, {
        status: form.status,
        notes: form.notes || undefined,
        approved_amount: form.approved_amount ? parseFloat(form.approved_amount) : undefined,
      });
      setPanel(false);
      setForm({ status: '', notes: '', approved_amount: '' });
      await fetchClaim();
      toast({ type: 'success', title: 'Claim updated', description: 'Status change recorded in the audit trail.' });
    } catch {
      toast({ type: 'error', title: 'Update failed', description: 'Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="py-16 text-center text-slate-400">Claim not found.</div>;

  const { claim, fraud_flags, audit_log, evidence } = data;
  const rec = claim.ai_recommendation ? REC_CONFIG[claim.ai_recommendation] : null;
  const RecIcon = rec?.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/claims" className="btn-secondary px-3 py-2.5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-xl font-bold text-white">{claim.claim_number}</h1>
              <StatusBadge status={claim.status} />
              <RiskBadge level={claim.risk_level} />
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {claim.claim_type} · Submitted {formatDate(claim.created_at)} · via{' '}
              <span className="capitalize">{claim.submission_channel}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReanalyze} disabled={isReanalyzing} className="btn-secondary text-sm">
            {isReanalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-analyze
          </button>
          <button onClick={() => setPanel((p) => !p)} className="btn-primary text-sm">
            <Gavel className="h-4 w-4" />
            Update Status
          </button>
        </div>
      </div>

      {/* Maestro pipeline */}
      <ClaimPipeline status={claim.status} riskLevel={claim.risk_level} />

      {/* Status update panel */}
      {panel && (
        <div className="card animate-slide-up border-teal-500/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Update Claim Status</h3>
            <button onClick={() => setPanel(false)} className="btn-ghost p-1.5">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label">New Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">Select…</option>
                <option value="under_review">Under Review</option>
                <option value="fraud_investigation">Fraud Investigation</option>
                <option value="approved">Approved</option>
                <option value="partially_approved">Partially Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="label">Approved Amount (₦)</label>
              <input
                type="number"
                className="input-field"
                placeholder="Optional"
                value={form.approved_amount}
                onChange={(e) => setForm((f) => ({ ...f, approved_amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input-field"
                placeholder="Optional"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setPanel(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button onClick={handleStatusUpdate} disabled={isUpdating || !form.status} className="btn-primary text-sm">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirm Update
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-2">
          {/* AI Fraud Analysis */}
          <div className="card card-topline overflow-hidden p-5">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-teal">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white">AI Fraud Analysis</h2>
              <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                <Sparkles className="h-3 w-3 text-orange-400" /> Claude AI
              </span>
            </div>

            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <FraudGauge score={claim.fraud_score} />
              <div className="flex-1 space-y-3">
                {rec && RecIcon && (
                  <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium', rec.cls)}>
                    <RecIcon className="h-4 w-4" />
                    {rec.label}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Risk Level</p>
                    <div className="mt-1.5">
                      <RiskBadge level={claim.risk_level} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Fraud Flags</p>
                    <p className="mt-1 font-display text-lg font-bold text-white">{fraud_flags.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {claim.ai_summary && (
              <div className="mt-5 rounded-xl border-l-2 border-teal-500 bg-surface-900/50 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-teal-300">
                  <Brain className="h-3.5 w-3.5" /> Agent reasoning
                </p>
                <p className="text-sm leading-relaxed text-slate-300">{claim.ai_summary}</p>
              </div>
            )}
          </div>

          {/* Fraud flags */}
          {fraud_flags.length > 0 && (
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h2 className="text-sm font-semibold text-white">Fraud Flags</h2>
                <span className="badge-high ml-1">{fraud_flags.length}</span>
              </div>
              <div className="space-y-3">
                {fraud_flags.map((flag) => {
                  const s = SEVERITY[flag.severity] || SEVERITY.medium;
                  return (
                    <div key={flag.id} className={cn('rounded-xl border p-3.5', s.cls)}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {flag.flag_type.replace(/_/g, ' ')}
                        </span>
                        <span className="ml-auto rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold opacity-80">
                          {s.label}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{flag.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidence */}
          {evidence && evidence.length > 0 && (
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-teal-400" />
                <h2 className="text-sm font-semibold text-white">Evidence ({evidence.length})</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {evidence.map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-teal-500/30 hover:bg-white/[0.04]"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-teal-400" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-200">{ev.file_name}</p>
                      <p className="truncate text-[11px] capitalize text-slate-500">{ev.evidence_type}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Incident details */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Incident Details</h2>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <Field label="Incident Date" value={formatDate(claim.incident_date)} />
              <Field label="Submission Channel" value={claim.submission_channel} capitalize />
              <Field label="Claimed Amount" value={formatCurrency(claim.claimed_amount)} mono />
              <Field
                label="Approved Amount"
                value={claim.approved_amount ? formatCurrency(claim.approved_amount) : '—'}
                mono
              />
            </div>
            <div>
              <p className="label">Description</p>
              <p className="rounded-xl bg-surface-900/50 p-4 text-sm leading-relaxed text-slate-300">
                {claim.incident_description}
              </p>
            </div>
          </div>

          {/* Audit trail */}
          <div className="card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Audit Trail</h2>
            </div>
            <div className="space-y-1">
              {audit_log.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">No history yet.</p>
              ) : (
                audit_log.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500 ring-4 ring-teal-500/15" />
                      {idx < audit_log.length - 1 && <div className="w-px flex-1 bg-white/[0.08]" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-5">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium capitalize text-slate-200">
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        {entry.old_status && entry.new_status && (
                          <span className="font-mono text-[11px] text-slate-500">
                            {entry.old_status} → {entry.new_status}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-slate-500">{formatDateTime(entry.performed_at)}</span>
                      </div>
                      {entry.notes && <p className="mt-0.5 text-xs text-slate-400">{entry.notes}</p>}
                      {entry.performed_by_name && (
                        <p className="mt-0.5 text-xs text-slate-600">by {entry.performed_by_name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Policyholder</h2>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-teal text-sm font-bold text-white">
                {claim.policyholder_name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{claim.policyholder_name}</p>
                <p className="font-mono text-xs text-teal-400">{claim.policy_number}</p>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              {claim.policyholder_phone && (
                <p className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-slate-500" /> {claim.policyholder_phone}
                </p>
              )}
              {claim.policyholder_email && (
                <p className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-slate-500" /> {claim.policyholder_email}
                </p>
              )}
              {(claim.state || claim.country) && (
                <p className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" /> {[claim.state, claim.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Policy Details</h2>
            </div>
            <div className="space-y-3">
              <Field label="Policy Type" value={claim.policy_type || '—'} />
              <Field label="Coverage Amount" value={formatCurrency(claim.coverage_amount || 0)} mono />
              {claim.premium_amount != null && (
                <Field label="Premium" value={formatCurrency(claim.premium_amount)} mono />
              )}
              {(claim.policy_start_date || claim.policy_end_date) && (
                <Field
                  label="Policy Period"
                  value={`${formatDate(claim.policy_start_date || '')} – ${formatDate(claim.policy_end_date || '')}`}
                />
              )}
              {claim.adjuster_name && <Field label="Assigned Adjuster" value={claim.adjuster_name} />}
            </div>
          </div>

          {claim.policyholder_name && (
            <Link
              href="/dashboard/policyholders"
              className="card-hover flex items-center justify-between p-4 text-sm text-slate-300"
            >
              View policyholder history
              <ArrowLeft className="h-4 w-4 rotate-180 text-teal-400" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={cn('text-sm text-slate-200', mono && 'font-mono', capitalize && 'capitalize')}>{value}</p>
    </div>
  );
}
