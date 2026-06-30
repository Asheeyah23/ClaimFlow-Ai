'use client';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  score: number | null;
  size?: number;
  label?: string;
}

function colorFor(score: number) {
  if (score < 30) return { stroke: '#34d399', text: 'text-emerald-400', glow: 'rgba(52,211,153,0.45)' };
  if (score < 60) return { stroke: '#fbbf24', text: 'text-amber-400', glow: 'rgba(251,191,36,0.45)' };
  return { stroke: '#fb7185', text: 'text-rose-400', glow: 'rgba(251,113,133,0.5)' };
}

/** Animated 270° radial gauge for the AI fraud score. */
export default function FraudGauge({ score, size = 160, label = 'Fraud Score' }: Props) {
  const target = score ?? 0;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1300;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const stroke = 11;
  const r = (size - stroke) / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const arc = 270; // degrees of sweep
  const startAngle = 135; // bottom-left start
  const circumference = 2 * Math.PI * r;
  const arcLength = (arc / 360) * circumference;
  const progress = (animated / 100) * arcLength;
  const c = colorFor(target);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.stroke} stopOpacity="0.7" />
            <stop offset="100%" stopColor={c.stroke} />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        {/* value */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 6px ${c.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-mono text-4xl font-bold tabular-nums', score === null ? 'text-slate-500' : c.text)}>
          {score === null ? '—' : Math.round(animated)}
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</span>
      </div>
    </div>
  );
}
