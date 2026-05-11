import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save } from 'lucide-react';
import { Config } from '../../types';

interface SaveModalProps {
  config: Config;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SaveModal({ config, onClose, onSave }: SaveModalProps) {
  const [name, setName] = useState('');

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
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Save size={32} className="text-slate-950" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Save Routine</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Name your masterpiece</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <input 
              autoFocus
              type="text"
              placeholder="e.g. My Morning Fire"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name && onSave(name)}
              className="w-full bg-transparent border-none text-2xl font-bold text-center outline-none placeholder:text-slate-700"
            />
          </div>
          
          <div className="flex justify-center gap-4 text-xs font-black uppercase tracking-widest text-slate-500">
            <span>{config.reps} Rounds</span>
            <span>•</span>
            <span>{config.work}s Work</span>
            <span>•</span>
            <span>{config.rest}s Rest</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-tighter hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => name && onSave(name)}
            disabled={!name}
            className="flex-1 py-4 bg-emerald-500 disabled:opacity-50 disabled:grayscale text-slate-950 rounded-2xl font-black uppercase tracking-tighter hover:brightness-110 shadow-lg transition-all"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
