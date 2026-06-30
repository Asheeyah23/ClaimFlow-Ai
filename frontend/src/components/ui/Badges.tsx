import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { RiskLevel, ClaimStatus } from '../../types';
import { getRiskBadgeClass, getStatusColor, getStatusLabel, cn } from '../../lib/utils';

export const RiskBadge = ({ level }: { level: RiskLevel }) => {
  const icons = {
    low: <CheckCircle className="h-3 w-3" />,
    medium: <AlertTriangle className="h-3 w-3" />,
    high: <XCircle className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
  };

  return (
    <span className={getRiskBadgeClass(level)}>
      {icons[level]}
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  );
};

export const StatusBadge = ({ status }: { status: ClaimStatus }) => (
  <span className={cn('badge', getStatusColor(status))}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
    {getStatusLabel(status)}
  </span>
);

export const FraudScoreBar = ({ score, showValue = true }: { score: number | null; showValue?: boolean }) => {
  if (score === null) return <span className="text-sm text-slate-500">—</span>;

  const color = score < 30 ? 'bg-emerald-400' : score < 60 ? 'bg-amber-400' : 'bg-rose-400';
  const textColor = score < 30 ? 'text-emerald-400' : score < 60 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      {showValue && (
        <span className={cn('w-7 text-right font-mono text-xs font-medium tabular-nums', textColor)}>
          {score.toFixed(0)}
        </span>
      )}
    </div>
  );
};
