'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('claimflow_token');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-teal shadow-glow">
        <span className="absolute inset-0 animate-glow-pulse rounded-2xl border border-teal-400/40" />
        <Shield className="h-8 w-8 text-white" />
      </div>
      <p className="font-display text-sm font-medium text-slate-400">ClaimFlow AI</p>
    </div>
  );
}
