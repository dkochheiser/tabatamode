import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Timer } from 'lucide-react';
import { Config } from '../../types';

interface EditModalProps {
  field: 'reps' | 'work' | 'rest';
  config: Config;
  onClose: () => void;
  onChange: (c: Config) => void;
}

export function EditModal({ field, config, onClose, onChange }: EditModalProps) {
  const [localVal, setLocalVal] = useState(config[field].toString());
  const [mins, setMins] = useState(Math.floor(config[field] / 60).toString());
  const [secs, setSecs] = useState((config[field] % 60).toString());

  const handleSave = () => {
    const parsedLocal = Math.max(1, parseInt(localVal) || 0);
    const parsedMins = parseInt(mins) || 0;
    const parsedSecs = parseInt(secs) || 0;

    if (field === 'reps') {
      onChange({ ...config, reps: parsedLocal });
    } else {
      const totalSecs = Math.max(field === 'work' ? 1 : 0, parsedMins * 60 + parsedSecs);
      onChange({ ...config, [field]: totalSecs });
    }
    onClose();
  };

  const title = {
    reps: 'Total Rounds',
    work: 'Work Duration',
    rest: 'Rest Duration'
  }[field];

  const color = {
    reps: 'bg-indigo-500',
    work: 'bg-emerald-500',
    rest: 'bg-rose-500'
  }[field];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${color} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
            {field === 'reps' ? <ClipboardList size={32} className="text-slate-950" /> : <Timer size={32} className="text-slate-950" />}
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Adjust your session</p>
        </div>

        <div className="flex flex-col items-center gap-6 mb-8">
          {field === 'reps' ? (
            <div className="flex flex-col items-center gap-4">
              <input 
                autoFocus
                type="number" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={localVal}
                onChange={e => setLocalVal(e.target.value)}
                className="bg-transparent border-none text-7xl font-black text-center w-40 outline-none tabular-nums text-white"
              />
              <span className="text-slate-500 font-black uppercase tracking-widest text-sm">Rounds</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <input 
                  autoFocus
                  type="number" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mins}
                  onChange={e => setMins(e.target.value)}
                  className="bg-transparent border-none text-6xl font-black text-center w-24 outline-none tabular-nums text-white"
                />
                <span className="text-slate-500 font-black uppercase tracking-widest text-xs">Min</span>
              </div>
              <span className="text-4xl font-black text-slate-700">:</span>
              <div className="flex flex-col items-center gap-2">
                <input 
                  type="number" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={secs}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                      setSecs(val);
                    }
                  }}
                  className="bg-transparent border-none text-6xl font-black text-center w-24 outline-none tabular-nums text-white"
                />
                <span className="text-slate-500 font-black uppercase tracking-widest text-xs">Sec</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-tighter hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className={`flex-1 py-4 ${color} text-slate-950 rounded-2xl font-black uppercase tracking-tighter hover:brightness-110 shadow-lg transition-all`}
          >
            Set Value
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
