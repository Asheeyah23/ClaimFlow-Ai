'use client';
import { useRouter } from 'next/navigation';
import SubmitClaimForm from '../../../../components/claims/SubmitClaimForm';
import { ArrowLeft, Brain, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

const HIGHLIGHTS = [
  { icon: Brain, title: 'Instant AI scoring', desc: 'Claude analyzes the claim the moment you submit.' },
  { icon: ShieldCheck, title: 'Fraud flags', desc: 'Anomalies and policy mismatches surfaced automatically.' },
  { icon: Zap, title: 'Smart routing', desc: 'Auto-adjudicate, review, or escalate — decided for you.' },
];

export default function NewClaimPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/claims" className="btn-secondary px-3 py-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Submit New Claim</h1>
          <p className="mt-0.5 text-sm text-slate-400">AI fraud analysis runs live on submission.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card card-topline p-6">
          <SubmitClaimForm onCancel={() => router.push('/dashboard/claims')} />
        </div>

        <div className="space-y-4">
          <div className="card overflow-hidden p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-teal">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white">How analysis works</h2>
            </div>
            <div className="space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-teal-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{title}</p>
                    <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500/[0.08] to-transparent p-5">
            <p className="text-sm font-medium text-slate-200">Human-in-the-loop</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              The AI never settles a claim alone. Adjusters review every escalation with the agent&apos;s reasoning and
              evidence attached.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
