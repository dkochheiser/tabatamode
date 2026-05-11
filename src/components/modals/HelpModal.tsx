import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Zap, Timer, Save, CheckCircle2, X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  showDismissOption?: boolean;
}

export function HelpModal({ isOpen, onClose, showDismissOption = true }: HelpModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('tabata_x_hide_help', 'true');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          onClick={handleClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_100px_rgba(223,255,0,0.1)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neon-lime flex items-center justify-center rounded-sm">
                  <HelpCircle className="text-black" size={28} />
                </div>
                <div>
                  <h2 className="text-4xl font-display uppercase italic tracking-tighter leading-none">Command <span className="text-neon-lime">Center</span></h2>
                  <p className="text-xs font-mono font-bold text-zinc-600 uppercase tracking-widest mt-1">System Operation Manual</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-zinc-900 rounded-sm text-zinc-600 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto space-y-12 custom-scrollbar">
              <section className="space-y-6">
                <h3 className="text-xs font-mono font-bold text-neon-lime uppercase tracking-[0.3em] border-l-2 border-neon-lime pl-4">01 // BASIC OPERATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/50 p-6 rounded border border-zinc-900 group hover:border-zinc-700 transition-colors">
                    <Timer className="text-electric-cyan mb-4" size={24} />
                    <h4 className="font-display uppercase text-xl italic mb-2">Setup</h4>
                    <p className="text-white text-base leading-relaxed">Adjust your rounds, work time, and rest intervals by tapping the value cards on the main screen.</p>
                  </div>
                  <div className="bg-zinc-900/50 p-6 rounded border border-zinc-900 group hover:border-zinc-700 transition-colors">
                    <Zap className="text-neon-lime mb-4" size={24} />
                    <h4 className="font-display uppercase text-xl italic mb-2">Execute</h4>
                    <p className="text-white text-base leading-relaxed">Hit "START SESSION" to begin. Use the center timer to pause or resume at any time.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xs font-mono font-bold text-neon-lime uppercase tracking-[0.3em] border-l-2 border-neon-lime pl-4">02 // DATA & ROUTINES</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/50 p-6 rounded border border-zinc-900 group hover:border-zinc-700 transition-colors">
                    <Save className="text-white mb-4" size={24} />
                    <h4 className="font-display uppercase text-xl italic mb-2">Save Routines</h4>
                    <p className="text-white text-base leading-relaxed">Save your favorite intervals as Routines for one-tap access in future sessions.</p>
                  </div>
                  <div className="bg-zinc-900/50 p-6 rounded border border-zinc-900 group hover:border-zinc-700 transition-colors">
                    <CheckCircle2 className="text-emerald-500 mb-4" size={24} />
                    <h4 className="font-display uppercase text-xl italic mb-2">Work Logs</h4>
                    <p className="text-white text-base leading-relaxed">Completed sessions are automatically logged in your Journal for performance tracking.</p>
                  </div>
                </div>
              </section>
              
              <div className="bg-neon-lime/5 p-6 rounded-lg border border-neon-lime/20 flex gap-4">
                <HelpCircle className="text-neon-lime shrink-0" size={24} />
                <p className="text-zinc-400 text-xs leading-loose">
                  <span className="text-neon-lime font-bold">PRO TIP:</span> Keep your audio ON for vocal cues and interval signals. The system is designed for high-intensity focus.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-zinc-900 bg-zinc-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              {showDismissOption ? (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={dontShowAgain}
                      onChange={() => setDontShowAgain(!dontShowAgain)}
                    />
                    <div className={`w-6 h-6 border-2 rounded-sm transition-all flex items-center justify-center ${dontShowAgain ? 'bg-neon-lime border-neon-lime' : 'border-zinc-800 bg-black group-hover:border-zinc-700'}`}>
                      {dontShowAgain && <CheckCircle2 className="text-black" size={14} />}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-white transition-colors">Don't show this at startup</span>
                </label>
              ) : <div />}
              
              <button 
                onClick={handleClose}
                className="w-full sm:w-auto px-10 py-4 bg-neon-lime text-black rounded-sm font-display text-xl uppercase italic hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-neon-lime/10"
              >
                Acknowledge
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
