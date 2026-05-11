import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, X, RotateCcw, Zap, ChevronRight, AlertTriangle,
  Volume2, VolumeX, Clock, ClipboardList, Settings2, Save, Plus, Trash2, History, Timer, Info, Star, Menu, HelpCircle
} from 'lucide-react';
import { TimerPhase, AppView, View, Config, HistoryRecord } from './types';
import { STORAGE_KEYS, INITIAL_CONFIG, PREPARE_TIME, DEFAULT_ROUTINES, QUOTES, MAX_HISTORY_RECORDS } from './constants';
import { formatTime } from './lib/utils';
import { VitalItem } from './components/VitalItem';
import { InputCard, TimeInputCard } from './components/training/Cards';
import { EditModal } from './components/modals/EditModal';
import { SaveModal } from './components/modals/SaveModal';
import { RoutineEditorModal } from './components/modals/RoutineEditorModal';
import { HelpModal } from './components/modals/HelpModal';
import { HistoryView } from './components/views/HistoryView';
import { RoutinesView } from './components/views/RoutinesView';
import { PrivacyView } from './components/views/PrivacyView';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.TRAINING);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [currentRep, setCurrentRep] = useState(1);
  const [phase, setPhase] = useState<TimerPhase>(TimerPhase.PREPARE);
  const [timeLeft, setTimeLeft] = useState(PREPARE_TIME);
  const [isPaused, setIsPaused] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [pausedCount, setPausedCount] = useState(0);
  const [wasPaused, setWasPaused] = useState(false);
  const [quote, setQuote] = useState('');
  const [editingField, setEditingField] = useState<'reps' | 'work' | 'rest' | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Config | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    
    // Load favorite routine on start
    const favorite = routines.find(r => r.isFavorite);
    if (favorite) {
      setConfig({
        reps: favorite.reps,
        work: favorite.work,
        rest: favorite.rest,
        name: favorite.name,
        id: favorite.id,
        isFavorite: true
      });
    }

    // Check if help should be shown on load
    const hideHelp = localStorage.getItem(STORAGE_KEYS.HIDE_HELP);
    if (hideHelp !== 'true') {
      setIsHelpOpen(true);
    }
  }, []);

  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [routines, setRoutines] = useState<Config[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  }, [routines]);

  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContext.current = new AudioCtx();
        }
      } catch (e) {
        console.error("AudioContext not supported", e);
        return;
      }
    }
    
    const playSilentNote = () => {
      const ctx = audioContext.current;
      if (ctx) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.01);
        } catch (e) {
          console.error("Failed to play silent note", e);
        }
      }
    };

    if (audioContext.current?.state === 'suspended') {
      audioContext.current.resume().catch(console.error);
    }
    playSilentNote();
  }, []);

  useEffect(() => {
    const unlock = () => {
      initAudio();
      // Remove event listeners once unlock has been called to prevent multiple silent notes
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('mousedown', unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };
  }, [initAudio]);

  const playSound = (type: 'tick' | 'work' | 'rest' | 'done') => {
    if (!soundEnabled) return;
    
    if (!audioContext.current) {
      initAudio();
    }
    
    const ctx = audioContext.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'tick':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'work':
        // High double beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1100, now + 0.2);
        gain2.gain.setValueAtTime(0, now + 0.2);
        gain2.gain.linearRampToValueAtTime(0.4, now + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.5);
        break;
      case 'rest':
        // Lower soothing beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      case 'done':
        // Ascending melody
        [440, 554, 659, 880].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.15);
          g.gain.setValueAtTime(0, now + i * 0.15);
          g.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
          o.start(now + i * 0.15);
          o.stop(now + i * 0.15 + 0.4);
        });
        break;
    }
  };

  function repFromLS() {
    return null; // For safety in this environment
  }

  const togglePause = useCallback(() => {
    initAudio();
    if (phase === TimerPhase.DONE) return;
    if (!isPaused) {
      setPausedCount(prev => prev + 1);
      setWasPaused(true);
    }
    setIsPaused(prev => !prev);
  }, [isPaused, phase]);

  const startWorkout = (targetConfig?: Config) => {
    initAudio();
    // Check if targetConfig is a valid Config object (and not a MouseEvent)
    const isValidConfig = targetConfig && 'reps' in targetConfig;
    const activeConfig = isValidConfig ? targetConfig : config;
    if (isValidConfig) setConfig(targetConfig);
    
    setStartTime(new Date().toISOString());
    setPausedCount(0);
    setWasPaused(false);
    setCurrentRep(1);
    setPhase(TimerPhase.PREPARE);
    setTimeLeft(PREPARE_TIME);
    setTotalElapsed(0);
    setTotalSessionTime(PREPARE_TIME + activeConfig.reps * (activeConfig.work + activeConfig.rest));
    setIsPaused(true);
    setIsStarted(true);
    setView(AppView.TRAINING);
  };

  const saveToHistory = useCallback((wasTerminated: boolean = false) => {
    if (!startTime) return;

    const record: HistoryRecord = {
      id: crypto.randomUUID(),
      routineName: config.name || "Custom Workout",
      startTime: startTime,
      endTime: new Date().toISOString(),
      repsCompleted: currentRep,
      totalReps: config.reps,
      workTime: config.work,
      restTime: config.rest,
      totalElapsed: totalElapsed,
      wasPaused: wasPaused,
      pausedCount: pausedCount,
      wasTerminated: wasTerminated
    };
    setHistory(prev => [record, ...prev].slice(0, MAX_HISTORY_RECORDS));
  }, [config, totalElapsed, startTime, wasPaused, pausedCount, currentRep]);

  const exitWorkout = () => {
    if (phase !== TimerPhase.DONE) {
      saveToHistory(true);
    }
    setIsStarted(false);
    setIsPaused(false);
    setStartTime(null);
  };

  const checkRoundAdvance = useCallback(() => {
    if (currentRep >= config.reps) {
      setPhase(TimerPhase.DONE);
      setTimeLeft(0);
      saveToHistory(false);
    } else {
      setCurrentRep((prev) => prev + 1);
      setPhase(TimerPhase.WORK);
      setTimeLeft(config.work);
    }
  }, [currentRep, config.reps, config.work, saveToHistory]);

  const nextPhase = useCallback(() => {
    if (phase === TimerPhase.PREPARE) {
      setPhase(TimerPhase.WORK);
      setTimeLeft(config.work);
    } else if (phase === TimerPhase.WORK) {
      if (currentRep >= config.reps) {
        setPhase(TimerPhase.DONE);
        setTimeLeft(0);
        saveToHistory(false);
      } else if (config.rest > 0) {
        setPhase(TimerPhase.REST);
        setTimeLeft(config.rest);
      } else {
        checkRoundAdvance();
      }
    } else if (phase === TimerPhase.REST) {
      checkRoundAdvance();
    }
  }, [phase, config, currentRep, checkRoundAdvance, saveToHistory]);

  useEffect(() => {
    let interval: number | undefined;

    if (isStarted && !isPaused && phase !== TimerPhase.DONE) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, isPaused, phase]);

  useEffect(() => {
    if (isStarted && phase !== TimerPhase.DONE) {
      if (timeLeft <= 0) {
        nextPhase();
      } else if (timeLeft <= 3 && !isPaused) {
        playSound('tick');
      }
    }
  }, [timeLeft, isStarted, isPaused, phase, nextPhase]);

  useEffect(() => {
    if (isStarted) {
      if (phase === TimerPhase.WORK) playSound('work');
      if (phase === TimerPhase.REST) playSound('rest');
      if (phase === TimerPhase.DONE) playSound('done');
    }
  }, [phase, isStarted]);

  const [flash, setFlash] = useState(false);
  const prevPhase = useRef(phase);

  useEffect(() => {
    if (prevPhase.current !== phase) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      prevPhase.current = phase;
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const getBgGlow = () => {
    switch (phase) {
      case TimerPhase.PREPARE: return '#2563eb';
      case TimerPhase.WORK: return 'rgba(34, 197, 94, 0.35)';
      case TimerPhase.REST: return 'rgba(250, 204, 21, 0.35)';
      case TimerPhase.DONE: return 'rgba(220, 38, 38, 0.4)';
      default: return 'rgba(34, 197, 94, 0.35)';
    }
  };

  const getPhaseColorClass = () => {
    switch (phase) {
      case TimerPhase.PREPARE: return 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]';
      case TimerPhase.WORK: return 'text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.7)] font-black italic';
      case TimerPhase.REST: return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]';
      case TimerPhase.DONE: return 'text-white drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]';
      default: return 'text-white';
    }
  };

  const getColorClass = () => {
    switch (phase) {
      case TimerPhase.PREPARE:
      case TimerPhase.WORK:
      case TimerPhase.REST: return 'text-white';
      case TimerPhase.DONE: return 'text-zinc-500';
      default: return 'text-white';
    }
  };

  const getBorderColor = () => {
    switch (phase) {
      case TimerPhase.PREPARE: return 'border-blue-600 timer-glow-prepare shadow-[0_0_50px_rgba(30,64,175,0.5)]';
      case TimerPhase.WORK: return 'border-green-500/40 timer-glow-work';
      case TimerPhase.REST: return 'border-yellow-400/40 timer-glow-rest';
      case TimerPhase.DONE: return 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]';
      default: return 'border-zinc-800';
    }
  };

  const toggleFavorite = (id: string) => {
    setRoutines(prev => {
      const updated = prev.map(r => ({
        ...r,
        isFavorite: r.id === id ? !r.isFavorite : false
      }));
      
      // Update loaded config if it matches the toggled routine
      const routine = updated.find(r => r.id === id);
      if (config.id === id && routine) {
        setConfig(prevConfig => ({ ...prevConfig, isFavorite: routine.isFavorite }));
      } else if (config.isFavorite && routine?.isFavorite && routine.id !== id) {
        // If some other routine became favorite, and current is marked favorite, unmark it
        setConfig(prevConfig => ({ ...prevConfig, isFavorite: false }));
      }
      
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon-lime/30 flex flex-col">
      {/* Navigation */}
      <nav className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-md shrink-0 sticky top-0 z-40">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none group"
        >
          <div className="w-10 h-10 bg-neon-lime rounded-sm flex items-center justify-center group-active:scale-95 transition-transform">
            {isMenuOpen ? <X className="w-6 h-6 text-black" /> : <Zap className="w-6 h-6 text-black fill-current" />}
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-2xl font-display uppercase italic tracking-tighter text-white">TABATA<span className="text-neon-lime">MODE</span></span>
          </div>
        </button>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => {
              const newState = !soundEnabled;
              setSoundEnabled(newState);
              if (newState) initAudio();
            }}
            onTouchStart={() => {
              if (!soundEnabled) initAudio();
            }}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 group ${
              soundEnabled 
                ? 'bg-neon-lime/10 border-neon-lime/20 text-neon-lime' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {soundEnabled ? (
              <Volume2 size={18} className="group-hover:scale-110 transition-transform" />
            ) : (
              <VolumeX size={18} />
            )}
            <span className="text-xs font-mono font-bold uppercase tracking-widest hidden md:inline">
              {soundEnabled ? 'AUDIO' : 'MUTED'}
            </span>
          </button>

          <div className="hidden md:flex gap-10 text-sm font-bold uppercase tracking-[0.2em] text-white">
            <button 
              onClick={() => { setView(AppView.TRAINING); setIsStarted(false); setIsMenuOpen(false); }}
              className={`${view === AppView.TRAINING ? 'text-neon-lime font-black' : 'hover:text-neon-lime transition-colors'} py-2 relative group`}
            >
              Train
              <motion.div 
                className={`absolute bottom-0 left-0 h-0.5 bg-neon-lime transition-all ${view === AppView.TRAINING ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <button 
              onClick={() => { setView(AppView.HISTORY); setIsStarted(false); setIsMenuOpen(false); }}
              className={`${view === AppView.HISTORY ? 'text-neon-lime font-black' : 'hover:text-neon-lime transition-colors'} py-2 relative group`}
            >
              Journal
              <motion.div 
                className={`absolute bottom-0 left-0 h-0.5 bg-neon-lime transition-all ${view === AppView.HISTORY ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <button 
              onClick={() => { setView(AppView.ROUTINES); setIsStarted(false); setIsMenuOpen(false); }}
              className={`${view === AppView.ROUTINES ? 'text-neon-lime font-black' : 'hover:text-neon-lime transition-colors'} py-2 relative group`}
            >
              Presets
              <motion.div 
                className={`absolute bottom-0 left-0 h-0.5 bg-neon-lime transition-all ${view === AppView.ROUTINES ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <button 
              onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }}
              className="p-2.5 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2 group"
            >
              <HelpCircle size={18} className="text-neon-lime group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest hidden md:inline">
                Help
              </span>
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2.5 bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all outline-none"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingField && (
          <EditModal 
            field={editingField}
            config={config}
            onClose={() => setEditingField(null)}
            onChange={(newConfig) => setConfig(newConfig)}
          />
        )}
        {isSavingTemplate && (
          <SaveModal
            config={config}
            onClose={() => setIsSavingTemplate(false)}
            onSave={(name) => {
              setRoutines(prev => [...prev, { ...config, id: crypto.randomUUID(), name }]);
              setIsSavingTemplate(false);
            }}
          />
        )}
        {editingRoutine && (
          <RoutineEditorModal
            routine={editingRoutine}
            onClose={() => setEditingRoutine(null)}
            onSave={(updated) => {
              setRoutines(prev => prev.map(r => r.id === updated.id ? updated : r));
              setEditingRoutine(null);
            }}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!isStarted ? (
            view === AppView.TRAINING ? (
              <motion.div
                key="setup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="min-h-full flex flex-col items-center justify-center p-6 lg:p-12 max-w-4xl mx-auto w-full"
              >
                <div className="w-full flex flex-col gap-8">
                   <div className="flex flex-col gap-6">
                    <h1 className="text-7xl lg:text-[10rem] font-display uppercase italic tracking-tighter leading-none">
                      TABATA<span className="text-neon-lime">MODE</span>
                    </h1>
                    <div className="bg-yellow-400 border-2 border-yellow-500 rounded-xl p-4 sm:p-6 flex items-center gap-4 sm:gap-6 max-w-3xl shadow-[0_4px_20px_rgba(250,204,21,0.2)]">
                      <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-black" size={28} />
                      </div>
                      <p className="text-black font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-sm lg:text-base leading-tight">
                        // UPDATE THE ROUNDS, WORK, AND REST DURATIONS BELOW TO CUSTOMIZE YOUR SESSION
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="md:col-span-2">
                      <InputCard
                        label="Rounds"
                        value={config.reps}
                        onClick={() => setEditingField('reps')}
                        onChange={() => {}}
                      />
                    </div>
                    <TimeInputCard
                      label="Work"
                      color="emerald"
                      seconds={config.work}
                      onClick={() => setEditingField('work')}
                      onChange={() => {}}
                    />
                    <TimeInputCard
                      label="Rest"
                      color="rose"
                      seconds={config.rest}
                      onClick={() => setEditingField('rest')}
                      onChange={() => {}}
                    />
                  </div>

                  {/* Total Estimated Time Indicator */}
                  <div className="flex items-center justify-center py-2 px-6 rounded-full bg-zinc-900/50 border border-zinc-800/50 w-fit mx-auto gap-4 group transition-all duration-300">
                    <span className="text-yellow-400 font-display italic text-3xl tracking-tight uppercase">// TOTAL_TIME:</span>
                    <span className="text-yellow-400 font-display italic text-3xl tracking-tight">
                      {(() => {
                        const total = (config.reps * config.work) + (Math.max(0, config.reps - 1) * config.rest);
                        return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
                      })()}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => startWorkout()}
                      onTouchStart={() => initAudio()}
                      className="flex-[2] h-24 bg-neon-lime text-black rounded-lg font-display text-4xl uppercase italic hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-neon-lime/20 flex items-center justify-center gap-4 group"
                    >
                      LETS DO IT! <Play className="fill-current group-hover:translate-x-1 transition-transform" size={32} />
                    </button>
                    <button
                      onClick={() => setIsSavingTemplate(true)}
                      className="flex-1 h-24 bg-zinc-950 border border-zinc-800 text-white rounded-lg font-display text-2xl uppercase italic hover:bg-zinc-900 transition-all flex items-center justify-center gap-3"
                    >
                      Save Preset <Save size={24} />
                    </button>
                  </div>

                  <div className="text-center px-4">
                    <p className="text-yellow-400 font-mono text-xs uppercase tracking-[0.3em] font-black drop-shadow-[0_2px_10px_rgba(250,204,21,0.3)]">
                      // {quote}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : view === AppView.HISTORY ? (
              <HistoryView key="history" history={history} onClear={() => setHistory([])} />
            ) : view === AppView.ROUTINES ? (
              <RoutinesView 
                key="routines" 
                routines={routines} 
                onSelect={(routine) => startWorkout(routine)} 
                onDelete={(id) => setRoutines(prev => prev.filter(r => r.id !== id))}
                onEdit={(routine) => setEditingRoutine(routine)}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <PrivacyView key="privacy" onBack={() => setView(AppView.TRAINING)} />
            )
          ) : (
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full flex flex-col p-4 gap-4 sm:gap-8 max-w-7xl mx-auto w-full"
            >
              {/* Header Stats */}
              <div className="flex items-center justify-between gap-4 px-2 sm:px-4">
                <div className="flex items-center gap-6 sm:gap-12">
                   <VitalItem 
                    icon={<Zap className="text-electric-cyan w-4 h-4" />} 
                    value={`${currentRep}`} 
                    label="ROUND" 
                    unit={`of ${config.reps}`} 
                    color="text-electric-cyan" 
                  />
                  <div className="w-px h-10 bg-zinc-800 hidden xs:block"></div>
                   <VitalItem 
                    icon={<Clock className="text-white w-4 h-4" />} 
                    value={formatTime(totalElapsed)} 
                    label="ELAPSED" 
                    unit="" 
                    color="text-white" 
                  />
                  <div className="w-px h-10 bg-zinc-800 hidden sm:block"></div>
                  <VitalItem 
                    icon={<RotateCcw className="text-neon-lime w-4 h-4" />} 
                    value={formatTime(Math.max(0, totalSessionTime - totalElapsed))} 
                    label="TOTAL REMAINING" 
                    unit="" 
                    color="text-neon-lime" 
                  />
                </div>
                
                <div className="hidden lg:flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-white uppercase tracking-[0.3em]">Next Phase</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-display uppercase italic ${phase === TimerPhase.WORK ? 'text-yellow-400' : 'text-green-400'}`}>
                      {phase === TimerPhase.WORK ? 'Rest' : 'GO!'}
                    </span>
                    <ChevronRight size={20} className="text-zinc-800" />
                  </div>
                </div>
              </div>

              {/* Central Display */}
              <motion.div 
                animate={isStarted && !isPaused ? { 
                  scale: phase === TimerPhase.PREPARE ? [1, 1.01, 1] : [1, 1.002, 1],
                  boxShadow: phase === TimerPhase.PREPARE ? [
                    '0 0 20px rgba(59, 130, 246, 0.1)', 
                    '0 0 40px rgba(59, 130, 246, 0.3)', 
                    '0 0 20px rgba(59, 130, 246, 0.1)'
                  ] : []
                } : {}}
                transition={{ repeat: Infinity, duration: phase === TimerPhase.PREPARE ? 1 : 2 }}
                onClick={togglePause}
                onTouchStart={() => initAudio()}
                role="button"
                aria-label={isPaused ? "Resume workout" : "Pause workout"}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') togglePause(); }}
                className={`flex-1 flex flex-col justify-center items-center rounded-xl border-4 transition-all duration-700 relative py-6 sm:py-12 lg:py-0 cursor-pointer group/timer overflow-hidden ${getBorderColor()}`} 
                style={{ backgroundColor: getBgGlow() }}
              >
                {/* Technical Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                </div>

                {/* Phase Change Flash */}
                <AnimatePresence mode="wait">
                  {flash && (
                    <motion.div 
                      key="flash-overlay"
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 z-40 bg-white pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {isPaused && phase !== TimerPhase.DONE && (
                  <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center transition-colors duration-300 ${
                    phase === TimerPhase.PREPARE && totalElapsed === 0 
                      ? 'bg-blue-600' 
                      : 'bg-black/60 backdrop-blur-xl'
                  }`}>
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-8"
                    >
                      <span className="font-display text-5xl sm:text-7xl uppercase italic tracking-tighter text-white">
                        {phase === TimerPhase.PREPARE && totalElapsed === 0 ? 'START' : 'PAUSED'}
                      </span>
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border-4 border-white/20 bg-white/10">
                        <Play size={48} className="text-white fill-current ml-2" />
                      </div>
                    </motion.div>
                  </div>
                )}

                <div className="relative z-10 p-4 sm:p-6 w-full flex flex-col items-center gap-2 sm:gap-6">
                  {/* Phase Label Container */}
                  <div className="h-10 sm:h-12 w-full flex items-center justify-center relative">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div 
                        key={phase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex flex-col items-center gap-1 sm:gap-2 absolute inset-0 justify-center"
                      >
                        <div className="h-0.5 w-12 sm:w-16 bg-white/20 rounded-full mb-1 sm:mb-2"></div>
                        <h2 className={`font-display text-2xl sm:text-3xl lg:text-5xl italic tracking-tighter uppercase ${getPhaseColorClass()}`}>
                          {phase === TimerPhase.PREPARE ? 'Ready' : (phase === TimerPhase.WORK ? 'GO!' : phase)}
                        </h2>
                        {phase === TimerPhase.PREPARE && totalElapsed === 0 && (
                          <motion.span 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 0.6, y: 0 }}
                            className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.4em] text-white absolute -bottom-4 sm:-bottom-6"
                          >
                            Prepare for Round 1
                          </motion.span>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  {/* Countdown Timer Container */}
                  <div className="relative flex justify-center items-center h-[clamp(6rem,35vw,18rem)] w-full">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div 
                        key={`${phase}-${timeLeft}`}
                        initial={{ 
                          opacity: 0, 
                          scale: phase === TimerPhase.PREPARE && timeLeft <= 5 ? 1.4 : 0.9,
                          filter: phase === TimerPhase.PREPARE && timeLeft <= 5 ? 'blur(10px)' : 'blur(0px)'
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          filter: 'blur(0px)'
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: phase === TimerPhase.PREPARE && timeLeft <= 5 ? 0.5 : 1.1,
                          filter: 'blur(5px)'
                        }}
                        transition={{ 
                          duration: phase === TimerPhase.PREPARE && timeLeft <= 5 ? 0.15 : 0.1, 
                          ease: "easeOut" 
                        }}
                        className="relative z-10 flex items-center justify-center"
                      >
                        <span className={`text-[clamp(6rem,35vw,18rem)] leading-none font-display text-white select-none tabular-nums tracking-tighter block ${phase === TimerPhase.PREPARE && timeLeft <= 5 ? 'text-blue-400' : ''}`}>
                          {phase === TimerPhase.DONE ? 'FIN' : timeLeft}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-8 items-center h-16">
                    {Array.from({length: config.reps}).map((_, i) => {
                      const isWorkActive = phase === TimerPhase.WORK && currentRep === i + 1;
                      const isRestActive = phase === TimerPhase.REST && currentRep === i + 1;
                      const isWorkDone = currentRep > i + 1 || (currentRep === i + 1 && (phase === TimerPhase.REST || phase === TimerPhase.DONE));
                      const isRestDone = currentRep > i + 1 || (currentRep === i + 1 && phase === TimerPhase.DONE);
                      
                      return (
                        <React.Fragment key={i}>
                          <motion.div 
                            animate={isWorkActive ? { 
                              height: [40, 56, 40],
                              opacity: [0.8, 1, 0.8],
                              boxShadow: ['0 0 10px rgba(34,197,94,0.3)', '0 0 30px rgba(34,197,94,0.8)', '0 0 10px rgba(34,197,94,0.3)']
                            } : { 
                              height: isWorkActive ? 56 : 40 
                            }}
                            transition={isWorkActive ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }}
                            className={`w-2.5 sm:w-3.5 rounded-sm skew-x-[-15deg] transition-all duration-500 ${
                              isWorkDone ? 'bg-green-500' : isWorkActive ? 'bg-green-400 scale-y-110' : 'bg-zinc-900 border border-zinc-800'
                            }`}
                          />
                          
                          {i < config.reps - 1 && (
                            <motion.div 
                              animate={isRestActive ? { 
                                height: [24, 36, 24],
                                opacity: [0.8, 1, 0.8],
                                boxShadow: ['0 0 10px rgba(239,68,68,0.3)', '0 0 30px rgba(239,68,68,0.8)', '0 0 10px rgba(239,68,68,0.3)']
                              } : { 
                                height: isRestActive ? 36 : 24
                              }}
                              transition={isRestActive ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }}
                              className={`w-1.5 sm:w-2 rounded-sm skew-x-[-15deg] transition-all duration-500 ${
                                isRestDone ? 'bg-red-500' : isRestActive ? 'bg-red-400 scale-y-110' : 'bg-zinc-950/50 border border-zinc-900/50'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Technical Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-zinc-950/50 flex gap-1 p-1">
                  <motion.div 
                    key={phase}
                    className={`h-full rounded-full ${phase === TimerPhase.WORK ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : phase === TimerPhase.REST ? 'bg-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : phase === TimerPhase.DONE ? 'bg-red-500' : 'bg-blue-500'}`}
                    initial={{ width: '100%' }}
                    animate={{ 
                      width: `${Math.max(0, (timeLeft - (isPaused ? 0 : 1)) / (phase === TimerPhase.WORK ? config.work : phase === TimerPhase.REST ? config.rest : PREPARE_TIME)) * 100}%` 
                    }}
                    transition={{ ease: "linear", duration: isPaused ? 0 : 1 }}
                  />
                </div>
              </motion.div>

              {/* Actions Grid */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 px-4 w-full max-w-5xl mx-auto mt-12 sm:mt-8">
                <button 
                  onClick={() => startWorkout(config)}
                  onTouchStart={() => initAudio()}
                  className="flex-1 h-20 sm:h-32 bg-blue-600 border-2 border-blue-400/50 text-white rounded-xl font-display text-2xl sm:text-3xl lg:text-5xl uppercase italic hover:bg-blue-500 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-4 sm:gap-6 group"
                >
                  <RotateCcw size={32} className="group-hover:rotate-[-90deg] transition-transform" />
                  <span className="inline">RESTART</span>
                </button>
                <button 
                  onClick={exitWorkout}
                  className="flex-1 h-20 sm:h-32 bg-crimson-red text-white rounded-xl font-display text-2xl sm:text-3xl lg:text-5xl uppercase italic hover:opacity-90 transition-all flex items-center justify-center gap-4 sm:gap-6 group"
                >
                  <X size={32} className="group-hover:rotate-90 transition-transform" />
                  <span className="inline">ABORT</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-auto py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-zinc-600 font-mono border-t border-zinc-900 bg-black shrink-0">
        <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4">
          <span className="tracking-widest uppercase">© {new Date().getFullYear()} TABATAMODE</span>
          <a 
            href="https://redpointapps.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-red-500 hover:text-red-400 transition-colors tracking-widest uppercase font-bold"
          >
            REDPOINTAPPS.COM
          </a>
          <button 
            onClick={() => { setView(AppView.PRIVACY); setIsStarted(false); window.scrollTo(0, 0); }}
            className="hover:text-neon-lime transition-colors tracking-widest uppercase"
          >
            PRIVACY POLICY
          </button>
        </div>
        <div className="flex gap-8">
          <span className="hidden md:inline tracking-widest text-neon-lime/40">STATUS: OPTIMAL</span>
          <span className="tracking-[0.3em] font-bold text-zinc-500">AIS:GMAI-BUILD</span>
        </div>
      </footer>

      {/* App Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, x: -50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              className="fixed top-24 left-4 right-4 md:left-8 md:right-auto md:w-[400px] z-[70] bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl overflow-hidden p-6 sm:p-8"
            >
              <div className="flex flex-col gap-4">
                <header className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <p className="text-xs font-bold text-neon-lime uppercase tracking-[0.3em]">System Navigator</p>
                    <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mt-1">Select Interface</p>
                  </div>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-sm transition-colors text-white"
                  >
                    <X size={20} />
                  </button>
                </header>
                
                <nav className="space-y-3">
                  <button 
                    onClick={() => { setView(AppView.TRAINING); setIsStarted(false); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      view === AppView.TRAINING ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <Timer size={28} className={view === AppView.TRAINING ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic">Train</span>
                    </div>
                    {view === AppView.TRAINING && <Zap size={20} className="fill-current animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => { setView(AppView.HISTORY); setIsStarted(false); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      view === AppView.HISTORY ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <History size={28} className={view === AppView.HISTORY ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic">Journal</span>
                    </div>
                    {view === AppView.HISTORY && <Zap size={20} className="fill-current animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => { setView(AppView.ROUTINES); setIsStarted(false); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      view === AppView.ROUTINES ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <ClipboardList size={28} className={view === AppView.ROUTINES ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic">Presets</span>
                    </div>
                    {view === AppView.ROUTINES && <Zap size={20} className="fill-current animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      isHelpOpen ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <HelpCircle size={28} className={isHelpOpen ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic">Help</span>
                    </div>
                    <ChevronRight size={24} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </nav>

                <div className="mt-8 pt-8 border-t border-zinc-900 flex flex-col gap-4">
                  <div className="flex items-center justify-between p-5 bg-zinc-900/50 border border-zinc-900 rounded-sm">
                    <div className="flex items-center gap-4">
                      {soundEnabled ? <Volume2 size={24} className="text-neon-lime" /> : <VolumeX size={24} className="text-zinc-500" />}
                      <span className="font-bold text-xs uppercase tracking-widest text-white">{soundEnabled ? 'Live Audio' : 'Muted'}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newState = !soundEnabled;
                        setSoundEnabled(newState);
                        if (newState) initAudio();
                      }}
                      onTouchStart={() => {
                        if (!soundEnabled) initAudio();
                      }}
                      className={`w-14 h-7 rounded-sm relative transition-colors ${soundEnabled ? 'bg-neon-lime' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-sm transition-all ${soundEnabled ? 'left-8 bg-black' : 'left-1 bg-white'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-center text-zinc-600 font-bold uppercase tracking-[0.3em]">
                    CORE_OS_2.0.0 // BUILD_822
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isHelpOpen && (
          <HelpModal 
            isOpen={isHelpOpen} 
            onClose={() => setIsHelpOpen(false)} 
            showDismissOption={localStorage.getItem('tabata_x_hide_help') !== 'true'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// End of App Component

