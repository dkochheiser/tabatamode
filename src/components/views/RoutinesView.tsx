import React from 'react';
import { motion } from 'motion/react';
import { Zap, Play, Star, Pencil, Trash2, RotateCcw, Clock } from 'lucide-react';
import { Config } from '../../types';

interface RoutinesViewProps {
  routines: Config[];
  onSelect: (r: Config) => void;
  onDelete: (id: string) => void;
  onEdit: (r: Config) => void;
  onToggleFavorite: (id: string) => void;
  key?: string;
}

export function RoutinesView({ routines, onSelect, onDelete, onEdit, onToggleFavorite }: RoutinesViewProps) {
  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto w-full">
      <header className="flex flex-col gap-2 mb-12">
        <h2 className="text-6xl lg:text-[8rem] font-display uppercase italic tracking-tighter leading-none">
          Saved <span className="text-neon-lime">Presets</span>
        </h2>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Your performance blueprints</p>
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
                <p className="text-sm text-white font-medium mb-4 line-clamp-2 italic">
                  "{routine.note}"
                </p>
              )}
              <div className="flex items-center gap-6 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest">
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
              </div>
            </button>

            <div className="flex flex-col border-l border-zinc-900">
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
                  onDelete(routine.id!);
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
