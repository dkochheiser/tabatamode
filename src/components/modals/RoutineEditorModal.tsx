import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings2 } from 'lucide-react';
import { Config } from '../../types';

interface RoutineEditorModalProps {
  routine: Config;
  onClose: () => void;
  onSave: (updated: Config) => void;
}

export function RoutineEditorModal({ routine, onClose, onSave }: RoutineEditorModalProps) {
  const [name, setName] = useState(routine.name || '');
  const [reps, setReps] = useState(routine.reps.toString());
  const [workMins, setWorkMins] = useState(Math.floor(routine.work / 60).toString());
  const [workSecs, setWorkSecs] = useState((routine.work % 60).toString());
  const [restMins, setRestMins] = useState(Math.floor(routine.rest / 60).toString());
  const [restSecs, setRestSecs] = useState((routine.rest % 60).toString());

  const handleSave = () => {
    const parsedReps = Math.max(1, parseInt(reps) || 1);
    const parsedWork = (parseInt(workMins) || 0) * 60 + (parseInt(workSecs) || 0);
    const parsedRest = (parseInt(restMins) || 0) * 60 + (parseInt(restSecs) || 0);
    
    onSave({ 
      ...routine, 
      name, 
      reps: parsedReps, 
      work: Math.max(1, parsedWork), 
      rest: parsedRest 
    });
  };

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
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Settings2 size={32} className="text-slate-950" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Edit Routine</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Refine your session</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Routine Name</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-xl font-bold outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-tighter">Total Rounds</span>
              <input 
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={reps}
                onChange={e => setReps(e.target.value)}
                className="bg-transparent border-none text-2xl font-black text-right w-20 outline-none tabular-nums text-blue-400"
              />
            </div>

            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-tighter">Work Time</span>
              <div className="flex items-center gap-1 font-black text-2xl text-green-400 tabular-nums">
                <input 
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={workMins}
                  onChange={e => setWorkMins(e.target.value)}
                  className="bg-transparent border-none text-right w-12 outline-none"
                />
                <span className="opacity-30">:</span>
                <input 
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={workSecs}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                      setWorkSecs(val);
                    }
                  }}
                  className="bg-transparent border-none text-left w-12 outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-tighter">Rest Time</span>
              <div className="flex items-center gap-1 font-black text-2xl text-red-400 tabular-nums">
                <input 
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={restMins}
                  onChange={e => setRestMins(e.target.value)}
                  className="bg-transparent border-none text-right w-12 outline-none"
                />
                <span className="opacity-30">:</span>
                <input 
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={restSecs}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                      setRestSecs(val);
                    }
                  }}
                  className="bg-transparent border-none text-left w-12 outline-none"
                />
              </div>
            </div>
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
            onClick={handleSave}
            className={`flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase tracking-tighter hover:brightness-110 shadow-lg transition-all`}
          >
            Update
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
