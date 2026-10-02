import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import type { VerificationStatus } from '../types/news.js';

interface Props {
  status: VerificationStatus;
  reason?: string;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<Props> = ({ status, reason, size = 'sm' }) => {
  const configs = {
    verified: {
      label: 'Verified Fact',
      bg: 'bg-[#2b593f]/10 text-[#215736] border-[#2b593f]/30',
      icon: CheckCircle2,
      desc: 'Corroborated by official filings, multiple reputable wires, or primary documents.',
    },
    developing: {
      label: 'Developing',
      bg: 'bg-[#881326]/10 text-[#881326] border-[#881326]/30',
      icon: Clock,
      desc: 'Ongoing situation; preliminary data subject to further confirmation.',
    },
    unverified: {
      label: 'Unverified Claim',
      bg: 'bg-[#92400e]/10 text-[#92400e] border-[#92400e]/30',
      icon: AlertTriangle,
      desc: 'Single anonymous leak or rumor without secondary independent corroboration.',
    },
    disputed: {
      label: 'Disputed Report',
      bg: 'bg-[#5b21b6]/10 text-[#5b21b6] border-[#5b21b6]/30',
      icon: AlertCircle,
      desc: 'Contradicting accounts or conflicting figures reported by different major parties.',
    },
    corrected: {
      label: 'Corrected / Retracted',
      bg: 'bg-[#b91c1c]/10 text-[#b91c1c] border-[#b91c1c]/30',
      icon: RefreshCw,
      desc: 'Previous preliminary report revised or officially clarified.',
    },
  };

  const current = configs[status] || configs.verified;
  const Icon = current.icon;

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1 font-medium' 
    : 'text-sm px-2.5 py-1 gap-1.5 font-semibold';

  return (
    <div 
      className={`inline-flex items-center rounded-full border ${current.bg} ${sizeClasses} transition-all duration-200`}
      title={reason || current.desc}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{current.label}</span>
    </div>
  );
};
