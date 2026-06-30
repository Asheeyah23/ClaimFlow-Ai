'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { claimsAPI, policyholdersAPI } from '../../lib/api';
import { Policyholder, Claim } from '../../types';
import { RiskBadge } from '../ui/Badges';
import FraudGauge from '../ui/FraudGauge';
import { useToast } from '../../lib/toast';
import {
  Loader2, AlertCircle, Brain, ArrowRight, RotateCcw, Sparkles, MessageSquare, Smartphone, Globe, UserCog,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  onCancel?: () => void;
}

const CLAIM_TYPES = [
  'Auto Accident', 'Auto Theft', 'Property Damage - Fire', 'Property Damage - Flood',
  'Property Theft', 'Medical Hospitalization', 'Outpatient Consultation',
  'Life Insurance', 'Travel Insurance', 'Agriculture Loss', 'Other',
];

const CHANNELS = [
  { value: 'web', label: 'Web', icon: Globe },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
  { value: 'agent', label: 'Agent', icon: UserCog },
];

interface AnalysisResult {
  claim: Claim;
  fraud_score: number | null;
  risk_level: Claim['risk_level'];
  ai_recommendation: Claim['ai_recommendation'];
  ai_summary: string | null;
}

export default function SubmitClaimForm({ onCancel }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [policyholders, setPolicyholders] = useState<Policyholder[]>([]);
  const [form, setForm] = useState({
    policyholder_id: '',
    claim_type: '',
    incident_date: '',
    incident_description: '',
    claimed_amount: '',
    submission_channel: 'web',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    policyholdersAPI
      .getAll({ limit: 100 })
      .then((res) => setPolicyholders(res.data.policyholders || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (
      !form.policyholder_id ||
      !form.claim_type ||
      !form.incident_date ||
      !form.incident_description ||
      !form.claimed_amount
    ) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await claimsAPI.create({ ...form, claimed_amount: parseFloat(form.claimed_amount) });
      const claim: Claim = res.data.claim;
      const analysis = res.data.ai_analysis || {};
      setResult({
        claim,
        fraud_score: claim.fraud_score ?? analysis.fraud_score ?? null,
        risk_level: claim.risk_level ?? analysis.risk_level ?? 'pending',
        ai_recommendation: claim.ai_recommendation ?? analysis.recommendation ?? null,
        ai_summary: claim.ai_summary ?? analysis.summary ?? null,
      });
      toast({
        type: 'ai',
        title: `Claim ${claim.claim_number} analyzed`,
        description: 'The fraud agent has scored this claim.',
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to submit claim.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setForm({
      policyholder_id: '',
      claim_type: '',
      incident_date: '',
      incident_description: '',
      claimed_amount: '',
      submission_channel: 'web',
    });
  };

  // ---------- Result view ----------
  if (result) {
    const recLabel = result.ai_recommendation?.replace(/_/g, ' ') || 'pending review';
    return (
      <div className="animate-scale-in space-y-6">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-teal-500/20 bg-gradient-to-b from-teal-500/[0.07] to-transparent p-6 sm:flex-row sm:items-center sm:gap-8">
          <FraudGauge score={result.fraud_score} size={150} />
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">
              <Sparkles className="h-3 w-3" /> Analysis complete
            </div>
            <h3 className="font-display text-xl font-bold text-white">{result.claim.claim_number}</h3>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <RiskBadge level={result.risk_level} />
              <span className="badge border-white/10 bg-white/[0.04] capitalize text-slate-300">
                Recommendation: {recLabel}
              </span>
            </div>
          </div>
        </div>

        {result.ai_summary && (
          <div className="rounded-xl border-l-2 border-teal-500 bg-surface-900/50 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-teal-300">
              <Brain className="h-3.5 w-3.5" /> Agent reasoning
            </p>
            <p className="text-sm leading-relaxed text-slate-300">{result.ai_summary}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={reset} className="btn-secondary flex-1">
            <RotateCcw className="h-4 w-4" />
            Submit Another
          </button>
          <button onClick={() => router.push(`/dashboard/claims/${result.claim.id}`)} className="btn-primary flex-1">
            View Full Claim
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---------- Form view ----------
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Policyholder *</label>
        <select
          className="input-field"
          value={form.policyholder_id}
          onChange={(e) => setForm((f) => ({ ...f, policyholder_id: e.target.value }))}
        >
          <option value="">Select policyholder…</option>
          {policyholders.map((ph) => (
            <option key={ph.id} value={ph.id}>
              {ph.full_name} — {ph.policy_number} ({ph.policy_type})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Claim Type *</label>
          <select
            className="input-field"
            value={form.claim_type}
            onChange={(e) => setForm((f) => ({ ...f, claim_type: e.target.value }))}
          >
            <option value="">Select type…</option>
            {CLAIM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Claimed Amount (₦) *</label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 450000"
            value={form.claimed_amount}
            onChange={(e) => setForm((f) => ({ ...f, claimed_amount: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="label">Incident Date *</label>
        <input
          type="date"
          className="input-field"
          value={form.incident_date}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => setForm((f) => ({ ...f, incident_date: e.target.value }))}
        />
      </div>

      <div>
        <label className="label">Submission Channel</label>
        <div className="grid grid-cols-4 gap-2">
          {CHANNELS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, submission_channel: value }))}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-all',
                form.submission_channel === value
                  ? 'border-teal-500/40 bg-teal-500/10 text-teal-300'
                  : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Incident Description *</label>
        <textarea
          className="input-field min-h-[120px] resize-none"
          placeholder="Describe the incident in detail — what happened, when, where, and how the damage occurred…"
          value={form.incident_description}
          onChange={(e) => setForm((f) => ({ ...f, incident_description: e.target.value }))}
        />
        <p className="mt-1.5 text-xs text-slate-500">More detail helps the AI produce a more accurate assessment.</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-teal-500/15 bg-teal-500/[0.06] p-3.5">
        <Brain className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
        <p className="text-xs leading-relaxed text-teal-200/90">
          On submission, the ClaimFlow fraud agent (Claude AI) scores this claim instantly. Low-risk claims may be
          auto-approved; high-risk claims are escalated for investigation.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
        )}
        <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing claim…
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Submit &amp; Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}
