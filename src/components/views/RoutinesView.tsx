import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Play, Star, Pencil, Trash2, RotateCcw, Clock, Plus, X, Check } from 'lucide-react';
import { Config } from '../../types';
import { formatTime } from '../../lib/utils';

interface RoutinesViewProps {
  routines: Config[];
  onSelect: (r: Config) => void;
  onDelete: (id: string) => void;
  onEdit: (r: Config) => void;
  onAdd: () => void;
  onToggleFavorite: (id: string) => void;
  key?: string;
}

export function RoutinesView({ routines, onSelect, onDelete, onEdit, onAdd, onToggleFavorite }: RoutinesViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto w-full">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-6xl lg:text-[8rem] font-display uppercase italic tracking-tighter leading-none">
            ROUTINES
          </h2>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Your performance blueprints</p>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-neon-lime font-black uppercase tracking-widest text-xs hover:bg-neon-lime hover:text-black hover:border-neon-lime transition-all group"
        >
          <Plus size={20} className="group-hover:scale-125 transition-transform" />
          Create New
        </button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map((routine, index) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative flex items-stretch bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden hover:border-neon-lime/40 transition-all"
          >
            <div className={`w-2 transition-colors ${routine.isFavorite ? 'bg-neon-lime' : 'bg-zinc-900 group-hover:bg-neon-lime/40'}`}></div>
            
            <button 
              onClick={() => onSelect(routine)} 
              aria-label={`Select ${routine.name} routine`}
              className="flex-1 text-left p-6 relative z-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-display uppercase italic text-white group-hover:text-neon-lime transition-colors">
                  {routine.name}
                </h3>
              </div>
              {routine.note && (
                <p className="text-base text-white font-medium mb-4 line-clamp-2 italic">
                  "{routine.note}"
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest">
                 <span className="flex items-center gap-2 text-orange-500">
                  <RotateCcw size={12} className="text-orange-500" />
                  {routine.reps} Rounds
                </span>
                <span className="flex items-center gap-2 text-neon-lime">
                  <Zap size={12} className="text-neon-lime" />
                  {routine.work}s Work
                </span>
                <span className="flex items-center gap-2 text-yellow-400">
                  <Clock size={12} className="text-yellow-400" />
                  {routine.rest}s Rest
                </span>
                <span className="flex items-center gap-2 text-zinc-100 border-l border-zinc-800 pl-4">
                  <Play size={12} className="text-neon-lime fill-neon-lime" />
                  {formatTime((routine.reps * routine.work) + (Math.max(0, routine.reps - 1) * routine.rest))} Total
                </span>
              </div>
            </button>

            <div className="flex flex-col border-l border-zinc-900 relative">
              <AnimatePresence>
                {confirmDeleteId === routine.id && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute inset-0 z-20 bg-red-600 flex flex-col"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(routine.id!);
                        setConfirmDeleteId(null);
                      }}
                      className="flex-1 flex items-center justify-center text-white hover:bg-black/20 transition-colors"
                      aria-label="Confirm delete"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="flex-1 flex items-center justify-center text-white/70 hover:text-white border-t border-white/10 hover:bg-black/20 transition-colors"
                      aria-label="Cancel delete"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => onToggleFavorite(routine.id!)}
                className={`flex-1 px-4 transition-all ${routine.isFavorite ? 'bg-neon-lime text-black' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}
                aria-label={routine.isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star size={18} className={routine.isFavorite ? 'fill-current' : ''} />
              </button>
              <button 
                onClick={() => onEdit(routine)}
                className="flex-1 px-4 text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all border-t border-zinc-900"
                aria-label={`Edit ${routine.name} routine`}
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(routine.id!);
                }}
                className="flex-1 px-4 text-red-500 hover:text-white hover:bg-red-500/20 transition-all border-t border-zinc-900"
                aria-label={`Delete ${routine.name} routine`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
