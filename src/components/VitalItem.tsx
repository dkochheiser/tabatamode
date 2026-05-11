import React from 'react';

interface VitalItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  unit: string;
  color: string;
}

export function VitalItem({ icon, value, label, unit, color }: VitalItemProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 px-1.5 bg-white/5 rounded-sm border border-white/10">
          {icon}
        </div>
        <span className={`text-xs font-black uppercase tracking-[0.2em] ${color}`}>{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-mono font-extrabold ${color} tracking-tighter`}>{value}</span>
        <span className={`text-2xl font-bold uppercase tracking-widest ${color} opacity-60`}>{unit}</span>
      </div>
    </div>
  );
}
