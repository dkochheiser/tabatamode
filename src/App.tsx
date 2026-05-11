import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, X, RotateCcw, Zap, ChevronRight, ChevronDown, AlertTriangle,
  Volume2, VolumeX, Clock, ClipboardList, Settings2, Save, Plus, Trash2, History, Timer, Info, Star, Menu, HelpCircle
} from 'lucide-react';
import { TimerPhase, AppView, View, Config, HistoryRecord, SoundMode } from './types';
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
  const [view, setView] = useState<AppView>(AppView.ROUTINES);
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
  const [soundMode, setSoundMode] = useState<SoundMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND_MODE);
    return (saved as SoundMode) || SoundMode.OFFICE;
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Config | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAudioSettingsExpanded, setIsAudioSettingsExpanded] = useState(false);
  const [isAudioPopoverOpen, setIsAudioPopoverOpen] = useState(false);

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
    const savedRoutines: Config[] = saved ? JSON.parse(saved) : [];
    
    // Start with the defaults to ensure they are always present first (or just present)
    const initialRoutines = [...savedRoutines];
    
    DEFAULT_ROUTINES.forEach(def => {
      if (!initialRoutines.some(r => r.id === def.id || r.name === def.name)) {
        initialRoutines.unshift(def); // Add missing defaults to the top
      }
    });

    return initialRoutines;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND_MODE, soundMode);
  }, [soundMode]);

  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    let ctx = audioContext.current;
    if (!ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx();
          audioContext.current = ctx;
        }
      } catch (e) {
        console.error("AudioContext not supported", e);
        return;
      }
    }
    
    if (!ctx) return;
    
    const playSilentNote = () => {
      if (ctx) {
        try {
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          if (source.start) {
            source.start(0);
          } else {
            (source as any).noteOn(0);
          }
        } catch (e) {
          console.error("Failed to play silent note", e);
        }
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(playSilentNote).catch(console.error);
    } else {
      playSilentNote();
    }
  }, []);

  useEffect(() => {
    const unlock = () => {
      initAudio();
      // Remove event listeners once unlock has been called to prevent multiple silent notes
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('touchend', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
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
    
    const now = ctx.currentTime;
    const isGym = soundMode === SoundMode.GYM;

    const playTone = (freq: number, duration: number, volume: number = 0.3, toneType: OscillatorType = 'sine', startTime: number = now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = toneType;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    switch (type) {
      case 'tick':
        if (isGym) {
          playTone(660, 0.15, 0.4, 'square');
        } else {
          playTone(440, 0.1, 0.2, 'sine');
        }
        break;
      case 'work':
        if (isGym) {
          // Aggressive triple alert
          [880, 880, 1760].forEach((f, i) => {
             playTone(f, 0.3, 0.5, 'sawtooth', now + i * 0.1);
          });
        } else {
          playTone(880, 0.2, 0.4, 'sine');
          playTone(1100, 0.3, 0.4, 'sine', now + 0.2);
        }
        break;
      case 'rest':
        if (isGym) {
          playTone(220, 0.8, 0.4, 'triangle');
        } else {
          playTone(330, 0.6, 0.3, 'sine');
        }
        break;
      case 'done':
        if (isGym) {
          [440, 660, 880, 1320].forEach((freq, i) => {
            playTone(freq, 0.6, 0.4, 'sawtooth', now + i * 0.12);
          });
        } else {
          [440, 554, 659, 880, 1108].forEach((freq, i) => {
            playTone(freq, 0.4, 0.3, 'sine', now + i * 0.15);
          });
        }
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const startWorkout = (targetConfig?: Config) => {
    initAudio();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
      case TimerPhase.WORK: return '#22c55e';
      case TimerPhase.REST: return '#facc15';
      case TimerPhase.DONE: return 'rgba(220, 38, 38, 0.4)';
      default: return '#22c55e';
    }
  };

  const getPhaseColorClass = () => {
    switch (phase) {
      case TimerPhase.PREPARE: return 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]';
      case TimerPhase.WORK: return 'text-white font-black italic';
      case TimerPhase.REST: return 'text-white font-bold';
      case TimerPhase.DONE: return 'text-white drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]';
      default: return 'text-white';
    }
  };

  const getColorClass = () => {
    switch (phase) {
      case TimerPhase.PREPARE: return 'text-white';
      case TimerPhase.WORK:
      case TimerPhase.REST: return 'text-white';
      case TimerPhase.DONE: return 'text-white';
      default: return 'text-white';
    }
  };

  const getBorderColor = () => {
    switch (phase) {
      case TimerPhase.PREPARE: return 'border-blue-600 timer-glow-prepare shadow-[0_0_50px_rgba(30,64,175,0.5)]';
      case TimerPhase.WORK: return 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]';
      case TimerPhase.REST: return 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]';
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
      <nav className="h-14 md:h-20 landscape:h-12 border-b border-zinc-900 flex items-center justify-between px-4 md:px-8 bg-zinc-950/80 backdrop-blur-md shrink-0 sticky top-0 z-40 transition-all duration-300">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity outline-none group"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-neon-lime rounded-sm flex items-center justify-center group-active:scale-95 transition-transform">
            {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6 text-black" /> : <Zap className="w-5 h-5 md:w-6 md:h-6 text-black fill-current" />}
          </div>
          <div className="flex flex-col items-start leading-none">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-display uppercase italic tracking-tighter text-white">TABATA<span className="text-neon-lime">MODE</span></span>
              <ChevronDown size={16} className={`md:hidden text-zinc-500 group-hover:text-white transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>
        
        <div className="flex items-center gap-4 sm:gap-6 relative">
          <div className="relative">
            <button 
              onClick={() => setIsAudioPopoverOpen(!isAudioPopoverOpen)}
              onTouchStart={() => {
                initAudio();
              }}
              aria-label="Sound settings"
              className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 group ${
                soundEnabled 
                  ? 'bg-neon-lime/10 border-neon-lime/20 text-neon-lime' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              } ${isAudioPopoverOpen ? 'ring-2 ring-neon-lime' : ''}`}
            >
              {soundEnabled ? (
                <Volume2 size={18} className="group-hover:scale-110 transition-transform" />
              ) : (
                <VolumeX size={18} />
              )}
              <span className="text-xs font-mono font-bold uppercase tracking-widest hidden md:inline">
                {soundEnabled ? 'AUDIO' : 'MUTED'}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isAudioPopoverOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isAudioPopoverOpen && (
                <>
                  {/* Backdrop for closing popover */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsAudioPopoverOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="p-4 flex flex-col gap-5 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Volume2 size={18} className={soundEnabled ? 'text-neon-lime' : 'text-zinc-500'} />
                          <span className="text-[11px] font-black uppercase tracking-wider">Master Sound</span>
                        </div>
                        <button 
                          onClick={() => {
                            setSoundEnabled(!soundEnabled);
                            initAudio();
                          }}
                          className={`w-12 h-6 rounded-sm relative transition-colors ${soundEnabled ? 'bg-neon-lime' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-sm transition-all ${soundEnabled ? 'left-7 bg-black' : 'left-1 bg-white'}`} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 pt-2 border-t border-zinc-900">
                        <div className="flex items-center gap-3">
                          <Settings2 size={16} className="text-white/60" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-white">Output Profile</span>
                        </div>
                        <div className="flex p-1 bg-black rounded-sm border border-zinc-800 relative h-10">
                          <motion.div 
                            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-sm z-0"
                            initial={false}
                            animate={{ x: soundMode === SoundMode.OFFICE ? 0 : '100%', left: soundMode === SoundMode.OFFICE ? 4 : 4 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                          <button
                            onClick={() => { setSoundMode(SoundMode.OFFICE); initAudio(); }}
                            className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${
                              soundMode === SoundMode.OFFICE ? 'text-black' : 'text-white/60 font-bold'
                            }`}
                          >
                            Office
                          </button>
                          <button
                            onClick={() => { setSoundMode(SoundMode.GYM); initAudio(); }}
                            className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${
                              soundMode === SoundMode.GYM ? 'text-black' : 'text-white/60 font-bold'
                            }`}
                          >
                            Gym
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 p-3 border-t border-zinc-900">
                      <p className="text-[9px] font-mono text-white leading-tight uppercase tracking-wider text-center">
                        {soundMode === SoundMode.OFFICE 
                          ? "Smooth sine pulses" 
                          : "Aggressive alerts"}
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex gap-10 text-sm font-bold uppercase tracking-[0.2em] text-white">
            <button 
              onClick={() => { setView(AppView.ROUTINES); setIsStarted(false); setIsMenuOpen(false); }}
              className={`${view === AppView.ROUTINES ? 'text-neon-lime font-black' : 'hover:text-neon-lime transition-colors'} py-2 relative group`}
            >
              ROUTINES
              <motion.div 
                className={`absolute bottom-0 left-0 h-0.5 bg-neon-lime transition-all ${view === AppView.ROUTINES ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <button 
              onClick={() => { setView(AppView.HISTORY); setIsStarted(false); setIsMenuOpen(false); }}
              className={`${view === AppView.HISTORY ? 'text-neon-lime font-black' : 'hover:text-neon-lime transition-colors'} py-2 relative group`}
            >
              JOURNAL
              <motion.div 
                className={`absolute bottom-0 left-0 h-0.5 bg-neon-lime transition-all ${view === AppView.HISTORY ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <button 
              onClick={() => { setView(AppView.TRAINING); setIsStarted(false); setIsMenuOpen(false); }}
              className={`${view === AppView.TRAINING ? 'text-neon-lime font-black' : 'hover:text-neon-lime transition-colors'} py-2 relative group`}
            >
              CUSTOM
              <motion.div 
                className={`absolute bottom-0 left-0 h-0.5 bg-neon-lime transition-all ${view === AppView.TRAINING ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <button 
              onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }}
              className="p-2.5 rounded-lg border bg-zinc-900 border-zinc-800 text-white hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2 group"
            >
              <HelpCircle size={18} className="text-neon-lime group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest hidden md:inline text-white">
                HELP
              </span>
            </button>
          </div>

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
            onSave={(name, note) => {
              setRoutines(prev => [...prev, { ...config, id: crypto.randomUUID(), name, note }]);
              setIsSavingTemplate(false);
            }}
          />
        )}
        {editingRoutine && (
          <RoutineEditorModal
            routine={editingRoutine}
            onClose={() => setEditingRoutine(null)}
            onSave={(updated) => {
              setRoutines(prev => {
                const exists = prev.some(r => r.id === updated.id);
                if (exists) {
                  return prev.map(r => r.id === updated.id ? updated : r);
                }
                return [...prev, updated];
              });
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
                        // UPDATE THE ROUNDS, WORK, AND REST DURATIONS BELOW TO CUSTOMIZE YOUR SESSION. USE THE MENU ABOVE FOR ROUTINES.
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
                  <div className="flex items-center justify-center py-1 px-6 rounded-full bg-zinc-900/50 border border-zinc-800/50 w-fit mx-auto gap-4 group transition-all duration-300">
                    <span className="text-yellow-400 font-display italic text-3xl tracking-tight uppercase">// TOTAL_TIME:</span>
                    <span className="text-yellow-400 font-display italic text-3xl tracking-tight">
                      {(() => {
                        const total = (config.reps * config.work) + (Math.max(0, config.reps - 1) * config.rest);
                        return formatTime(total);
                      })()}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => startWorkout()}
                      onTouchStart={() => initAudio()}
                      className="flex-[2] relative overflow-hidden h-24 bg-neon-lime text-black rounded-lg font-display text-4xl uppercase italic hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-neon-lime/20 group"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
                      </div>
                      <div className="relative z-10 flex items-center justify-center w-full h-full gap-4">
                        LETS DO IT! <Play className="fill-current group-hover:translate-x-1 transition-transform" size={32} />
                      </div>
                    </button>
                    <button
                      onClick={() => setIsSavingTemplate(true)}
                      className="flex-1 h-24 bg-zinc-950 border border-zinc-800 text-white rounded-lg font-display text-2xl uppercase italic hover:bg-zinc-900 transition-all flex items-center justify-center gap-3"
                    >
                      Save Routine <Save size={24} />
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
                onAdd={() => {
                  setEditingRoutine({
                    id: crypto.randomUUID(),
                    name: '',
                    note: '',
                    reps: 8,
                    work: 20,
                    rest: 10,
                    isFavorite: false
                  });
                }}
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
              className="h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-5rem)] landscape:h-[calc(100dvh-3rem)] flex flex-col p-2 sm:p-4 gap-2 sm:gap-4 max-w-7xl mx-auto w-full overflow-hidden"
            >
              <div className="flex-1 flex flex-col landscape:flex-row-reverse gap-2 landscape:gap-4 min-h-0">
                {/* Stats Section (Right in landscape, Top in portrait) */}
                <div className="flex flex-col gap-2 sm:gap-4 landscape:w-[240px] md:landscape:w-[300px] landscape:justify-center shrink-0">
                  <div className="grid grid-cols-3 landscape:grid-cols-1 gap-2 sm:gap-4 px-2 sm:px-4 w-full">
                    <div className="flex justify-center border-r landscape:border-r-0 landscape:border-b border-zinc-800 last:border-0 pr-2 landscape:pr-0 landscape:pb-2 md:landscape:pb-4 last:pb-0">
                      <VitalItem 
                        icon={<Zap className="text-electric-cyan w-4 h-4" />} 
                        value={`${currentRep}`} 
                        label="ROUND" 
                        unit={`of ${config.reps}`} 
                        color="text-electric-cyan" 
                        centerAlignment={true}
                      />
                    </div>
                    <div className="flex justify-center border-r landscape:border-r-0 landscape:border-b border-zinc-800 last:border-0 px-2 landscape:px-0 landscape:py-2 md:landscape:py-4 last:pb-0">
                      <VitalItem 
                        icon={<Clock className="text-white w-4 h-4" />} 
                        value={formatTime(totalElapsed)} 
                        label="ELAPSED" 
                        unit="" 
                        color="text-white" 
                        centerAlignment={true}
                      />
                    </div>
                    <div className="flex justify-center landscape:pt-2 md:landscape:pt-4">
                      <VitalItem 
                        icon={<RotateCcw className="text-neon-lime w-4 h-4" />} 
                        value={formatTime(Math.max(0, totalSessionTime - totalElapsed))} 
                        label="REMAINING" 
                        unit="" 
                        color="text-neon-lime" 
                        centerAlignment={true}
                      />
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col items-end gap-1 px-4">
                    <span className="text-xs font-bold text-white uppercase tracking-[0.3em]">Next Phase</span>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-display uppercase italic ${phase === TimerPhase.WORK ? 'text-yellow-400' : 'text-green-400'}`}>
                        {phase === TimerPhase.WORK ? 'Rest' : 'GO!'}
                      </span>
                      <ChevronRight size={20} className="text-zinc-800" />
                    </div>
                  </div>
                </div>

                {/* Central Display (Left in landscape, Middle in portrait) */}
                <motion.div 
                  animate={isStarted && !isPaused ? { 
                    boxShadow: phase === TimerPhase.PREPARE 
                      ? '0 0 40px rgba(59, 130, 246, 0.3)' 
                      : phase === TimerPhase.WORK 
                      ? '0 0 50px rgba(34, 197, 94, 0.4)'
                      : phase === TimerPhase.REST
                      ? '0 0 40px rgba(250, 204, 21, 0.3)'
                      : '0 0 20px rgba(220, 38, 38, 0.2)'
                  } : {}}
                  transition={{ duration: 0.5 }}
                  onClick={togglePause}
                  onTouchStart={() => initAudio()}
                  role="button"
                  aria-label={isPaused ? "Resume workout" : "Pause workout"}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') togglePause(); }}
                  className={`flex-1 flex flex-col justify-center items-center rounded-xl border-4 transition-all duration-700 relative py-2 landscape:py-1 min-h-0 overflow-hidden cursor-pointer group/timer ${getBorderColor()}`} 
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
                        <div className="font-display text-2xl sm:text-3xl lg:text-5xl italic tracking-tighter uppercase text-white mb-0.5">
                          {config.name}
                        </div>
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
                  <div className="relative flex justify-center items-center h-[clamp(6rem,35vw,18rem)] landscape:h-[clamp(4rem,35vh,10rem)] w-full">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div 
                        key={phase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 flex items-center justify-center"
                      >
                        <span className={`text-[clamp(6rem,35vw,18rem)] landscape:text-[clamp(4rem,35vh,10rem)] leading-none font-display select-none tabular-nums tracking-tighter block ${getColorClass()} ${(phase === TimerPhase.PREPARE || phase === TimerPhase.WORK) && timeLeft <= 5 ? 'text-blue-400' : ''}`}>
                          {phase === TimerPhase.DONE ? 'FIN' : formatTime(timeLeft)}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className={`flex mt-2 landscape:mt-1 items-center h-12 landscape:h-8 w-full px-4 justify-center ${config.reps > 12 ? 'gap-0.5' : config.reps > 8 ? 'gap-1' : 'gap-2 sm:gap-3'}`}>
                    {Array.from({length: config.reps}).map((_, i) => {
                      const isWorkActive = phase === TimerPhase.WORK && currentRep === i + 1;
                      const isRestActive = phase === TimerPhase.REST && currentRep === i + 1;
                      const isWorkDone = currentRep > i + 1 || (currentRep === i + 1 && (phase === TimerPhase.REST || phase === TimerPhase.DONE));
                      const isRestDone = currentRep > i + 1 || (currentRep === i + 1 && phase === TimerPhase.DONE);
                      
                      return (
                        <React.Fragment key={i}>
                          <motion.div 
                            animate={isWorkActive ? { 
                              height: 56,
                              opacity: 1,
                              boxShadow: '0 0 60px rgba(59,130,246,0.9)'
                            } : { 
                              height: 40,
                              opacity: 0.8,
                              boxShadow: 'none'
                             }}
                            transition={{ duration: 0.3 }}
                            className={`flex-1 max-w-[12px] sm:max-w-[14px] h-10 rounded-sm skew-x-[-15deg] transition-all duration-500 ${
                              isWorkDone ? 'bg-blue-600 border border-black' : isWorkActive ? 'bg-blue-500 border border-black scale-y-110' : 'bg-zinc-900 border border-zinc-800'
                            }`}
                          />
                          
                          {i < config.reps - 1 && (
                            <motion.div 
                              animate={isRestActive ? { 
                                height: 36,
                                opacity: 1,
                                boxShadow: '0 0 50px rgba(234,179,8,0.8)'
                              } : { 
                                height: 24,
                                opacity: 0.8,
                                boxShadow: 'none'
                              }}
                              transition={{ duration: 0.3 }}
                              className={`flex-[0.6] max-w-[8px] sm:max-w-[10px] h-6 rounded-sm skew-x-[-15deg] transition-all duration-500 ${
                                isRestDone ? 'bg-yellow-700 border border-black' : isRestActive ? 'bg-yellow-500 border border-black scale-y-110' : 'bg-zinc-950/50 border border-zinc-900/50'
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
              </div>

              {/* Actions Grid */}
              <div className="flex flex-row justify-center gap-2 sm:gap-6 px-2 sm:px-4 w-full max-w-5xl mx-auto mb-2 landscape:mb-1 shrink-0">
                <button 
                  onClick={() => startWorkout(config)}
                  onTouchStart={() => initAudio()}
                  className="flex-1 relative overflow-hidden h-14 sm:h-24 landscape:h-12 bg-blue-600 border-2 border-blue-400/50 text-white rounded-xl font-display text-xl sm:text-3xl lg:text-5xl uppercase italic hover:bg-blue-500 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] group"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-full h-full gap-2 sm:gap-4">
                    <RotateCcw size={24} className="sm:w-8 sm:h-8 group-hover:rotate-[-90deg] transition-transform" />
                    <span className="landscape:text-lg sm:landscape:text-2xl">RESTART</span>
                  </div>
                </button>
                <button 
                  onClick={exitWorkout}
                  className="flex-1 relative overflow-hidden h-14 sm:h-24 landscape:h-12 bg-crimson-red text-white rounded-xl font-display text-xl sm:text-3xl lg:text-5xl uppercase italic hover:opacity-90 transition-all group"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-full h-full gap-2 sm:gap-4">
                    <X size={24} className="sm:w-8 sm:h-8 group-hover:rotate-90 transition-transform" />
                    <span className="landscape:text-lg sm:landscape:text-2xl">ABORT</span>
                  </div>
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
                    onClick={() => { setView(AppView.ROUTINES); setIsStarted(false); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      view === AppView.ROUTINES ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <ClipboardList size={28} className={view === AppView.ROUTINES ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic">ROUTINES</span>
                    </div>
                    {view === AppView.ROUTINES && <Zap size={20} className="fill-current animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => { setView(AppView.HISTORY); setIsStarted(false); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      view === AppView.HISTORY ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <History size={28} className={view === AppView.HISTORY ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic">JOURNAL</span>
                    </div>
                    {view === AppView.HISTORY && <Zap size={20} className="fill-current animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => { setView(AppView.TRAINING); setIsStarted(false); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      view === AppView.TRAINING ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <Timer size={28} className={view === AppView.TRAINING ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic">CUSTOM</span>
                    </div>
                    {view === AppView.TRAINING && <Zap size={20} className="fill-current animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }}
                    className={`w-full p-6 rounded-sm flex items-center justify-between transition-all group border-2 ${
                      isHelpOpen ? 'bg-neon-lime/10 border-neon-lime text-neon-lime font-black' : 'bg-transparent border-zinc-900 text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-6 text-white">
                      <HelpCircle size={28} className={isHelpOpen ? 'text-neon-lime' : 'text-zinc-500 group-hover:text-white'} />
                      <span className="text-4xl font-display uppercase italic text-white">HELP</span>
                    </div>
                    <ChevronRight size={24} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </nav>

                <div className="mt-8 pt-8 border-t border-zinc-900 flex flex-col gap-4">
                  <div className={`flex flex-col gap-2 transition-all duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Audio Header / Expandable Control */}
                    <button 
                      onClick={() => setIsAudioSettingsExpanded(!isAudioSettingsExpanded)}
                      className={`flex items-center justify-between p-5 bg-zinc-900/50 border rounded-sm transition-all ${
                        isAudioSettingsExpanded ? 'border-neon-lime ring-1 ring-neon-lime/20' : 'border-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {soundEnabled ? <Volume2 size={24} className="text-neon-lime" /> : <VolumeX size={24} className="text-zinc-500" />}
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-xs uppercase tracking-widest text-white">Audio Status</span>
                          <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest">{soundEnabled ? `Live (${soundMode})` : 'Muted'}</span>
                        </div>
                      </div>
                      <ChevronDown size={20} className={`text-zinc-500 transition-transform duration-300 ${isAudioSettingsExpanded ? 'rotate-180 text-neon-lime' : ''}`} />
                    </button>

                    {/* Expandable Settings Box */}
                    <AnimatePresence>
                      {isAudioSettingsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="bg-zinc-900/80 border border-zinc-800 rounded-sm p-4 flex flex-col gap-6 mt-1 backdrop-blur-sm">
                            {/* Master Toggle */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Volume2 size={18} className={soundEnabled ? 'text-neon-lime' : 'text-zinc-600'} />
                                <span className="text-[11px] font-black uppercase tracking-wider text-white">Master Sound</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newState = !soundEnabled;
                                  setSoundEnabled(newState);
                                  if (newState) initAudio();
                                }}
                                className={`w-12 h-6 rounded-sm relative transition-colors ${soundEnabled ? 'bg-neon-lime' : 'bg-zinc-800'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 rounded-sm transition-all ${soundEnabled ? 'left-7 bg-black' : 'left-1 bg-white'}`} />
                              </button>
                            </div>

                              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800/50 text-white">
                                <div className="flex items-center gap-3">
                                  <Settings2 size={18} className="text-white/40" />
                                  <span className="text-[11px] font-black uppercase tracking-wider">Output Profile</span>
                                </div>
                                <div className="flex p-1 bg-black rounded-sm border border-zinc-800 relative">
                                  <motion.div 
                                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-sm z-0"
                                    initial={false}
                                    animate={{ x: soundMode === SoundMode.OFFICE ? 0 : '100%', left: soundMode === SoundMode.OFFICE ? 4 : 4 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  />
                                  <button
                                    onClick={() => { setSoundMode(SoundMode.OFFICE); initAudio(); }}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${
                                      soundMode === SoundMode.OFFICE ? 'text-black' : 'text-white/40 font-bold'
                                    }`}
                                  >
                                    Office
                                  </button>
                                  <button
                                    onClick={() => { setSoundMode(SoundMode.GYM); initAudio(); }}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${
                                      soundMode === SoundMode.GYM ? 'text-black' : 'text-white/40 font-bold'
                                    }`}
                                  >
                                    Gym
                                  </button>
                                </div>
                                <p className="text-[9px] font-mono text-white/60 leading-tight">
                                  {soundMode === SoundMode.OFFICE 
                                    ? "Smooth sine-wave pulses optimized for shared spaces." 
                                    : "Aggressive square/sawtooth alerts for maximum focus."}
                                </p>
                              </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <p className="text-xs text-center text-zinc-600 font-bold uppercase tracking-[0.3em] mt-4">
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

