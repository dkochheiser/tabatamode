export enum TimerPhase {
  PREPARE = 'PREPARE',
  WORK = 'WORK',
  REST = 'REST',
  DONE = 'DONE',
}

export enum AppView {
  TRAINING = 'training',
  HISTORY = 'history',
  ROUTINES = 'routines',
  PRIVACY = 'privacy',
}

export type View = AppView;

export interface Config {
  id?: string;
  name?: string;
  reps: number;
  work: number; // stores total seconds
  rest: number; // stores total seconds
  isFavorite?: boolean;
}

export interface HistoryRecord {
  id: string;
  routineName: string;
  startTime: string;
  endTime?: string;
  repsCompleted: number;
  totalReps: number;
  workTime: number;
  restTime: number;
  totalElapsed: number;
  wasPaused: boolean;
  pausedCount: number;
  wasTerminated: boolean;
}
