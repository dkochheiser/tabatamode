import React from 'react';

interface TimeInputCardProps {
  label: string;
  seconds: number;
  onChange: (val: number) => void;
  color: string;
  onClick: () => void;
}

export function TimeInputCard({ label, seconds, color, onClick }: TimeInputCardProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  const getStyles = () => {
    if (color.includes('emerald')) return 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.01]';
    if (color.includes('rose')) return 'bg-electric-cyan border-electric-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:scale-[1.01]';
    return 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700';
  };

  return (
    <div 
      onClick={onClick}
      role="button"
      aria-label={`Adjust ${label}. Current value is ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={`${getStyles()} border-b-4 border-black/20 p-8 rounded-xl flex items-center justify-between group transition-all duration-300 cursor-pointer active:scale-[0.98] focus-within:ring-2 ring-white/10`}
    >
      <div className="flex flex-col">
        <label className="font-sans font-black italic text-2xl uppercase tracking-tighter leading-none">{label}</label>
        <span className="text-[10px] opacity-60 font-mono font-bold uppercase tracking-[0.2em] mt-1">Tap to Adjust Duration</span>
      </div>
      <div className="flex items-center gap-1 font-display font-black italic text-5xl tabular-nums">
        <span>{String(mins).padStart(2, '0')}</span>
        <span className="opacity-40 animate-pulse">:</span>
        <span>{String(secs).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

interface InputCardProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  color?: string;
  onClick: () => void;
}

export function InputCard({ label, value, onClick }: InputCardProps) {
  const getStyles = () => {
    return 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:scale-[1.01]';
  };

  return (
    <div 
      onClick={onClick}
      role="button"
      aria-label={`Adjust ${label}. Current value is ${value}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={`${getStyles()} border-b-4 border-black/20 p-8 rounded-xl flex items-center justify-between group transition-all duration-300 cursor-pointer active:scale-[0.98] focus-within:ring-2 ring-white/10`}
    >
      <div className="flex flex-col">
        <label className="font-sans font-black italic text-2xl uppercase tracking-tighter leading-none">{label}</label>
        <span className="text-[10px] opacity-60 font-mono font-bold uppercase tracking-[0.2em] mt-1">Set Number of Rounds</span>
      </div>
      <div className="flex items-center gap-1 font-display font-black italic text-7xl tabular-nums">
        {value}
      </div>
    </div>
  );
}
