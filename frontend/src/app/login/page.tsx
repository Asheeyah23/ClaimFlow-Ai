'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import {
  Shield, Loader2, Eye, EyeOff, Zap, ArrowRight, Brain, GitBranch, Banknote, CheckCircle2,
} from 'lucide-react';

const PIPELINE = [
  { icon: Brain, label: 'Fraud Agent', desc: 'Risk score: 12 · Low', color: 'text-emerald-400', delay: '0s' },
  { icon: GitBranch, label: 'Maestro Case', desc: 'Routed → Auto-adjudicate', color: 'text-teal-400', delay: '1.2s' },
  { icon: Banknote, label: 'Payout', desc: '₦450,000 · Approved', color: 'text-orange-400', delay: '2.4s' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('aisha@claimflow.ai');
  const [password, setPassword] = useState('ClaimFlow2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Brand panel ---------- */}
      <div className="relative hidden overflow-hidden bg-surface-900 lg:block">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute -right-10 bottom-1/4 h-72 w-72 rounded-full bg-orange-500/15 blur-[120px]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-teal shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">ClaimFlow AI</p>
              <p className="text-xs text-teal-400">Claims Intelligence Platform</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tightest text-white xl:text-5xl">
              Smarter claims.
              <br />
              <span className="gradient-text animate-gradient-shift">Faster payouts.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              From submission to payout — AI agents triage every claim, flag fraud in seconds, and keep human
              adjusters in control of what matters. Built for emerging markets.
            </p>

            {/* Animated pipeline preview */}
            <div className="mt-8 space-y-3">
              {PIPELINE.map(({ icon: Icon, label, desc, color, delay }) => (
                <div
                  key={label}
                  className="flex animate-slide-up items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 backdrop-blur-sm"
                  style={{ animationDelay: delay }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-700">
                    <Icon className={`h-4.5 w-4.5 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-teal-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span>UiPath Maestro Case</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>Claude AI Fraud Engine</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>Node · Next.js</span>
          </div>
        </div>
      </div>

      {/* ---------- Form panel ---------- */}
      <div className="relative flex items-center justify-center bg-surface-950 px-5 py-10">
        <div className="absolute inset-0 grid-bg opacity-30 lg:hidden" />
        <div className="relative w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-teal shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-display text-xl font-bold text-white">ClaimFlow AI</h1>
            <p className="text-sm text-slate-400">Smarter Claims. Faster Payouts.</p>
          </div>

          <div className="mb-7">
            <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to the adjuster console.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@claimflow.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-scale-in rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-slate-300">Demo credentials</span>
            </div>
            <p className="font-mono text-xs text-slate-500">aisha@claimflow.ai · ClaimFlow2026!</p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-600">
            Protected console · JWT session · © {new Date().getFullYear()} ClaimFlow AI
          </p>
        </div>
      </div>
    </div>
  );
}
