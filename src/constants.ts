import { Config } from './types';

export const STORAGE_KEYS = {
  HISTORY: 'tabatamode_history',
  ROUTINES: 'tabatamode_routines',
  HIDE_HELP: 'tabatamode_hide_help',
};

export const INITIAL_CONFIG: Config = {
  name: 'Standard Tabata',
  reps: 8,
  work: 20,
  rest: 10,
  isFavorite: true,
};

export const PREPARE_TIME = 10;

export const DEFAULT_ROUTINES: Config[] = [
  { id: '1', name: 'Standard Tabata', reps: 8, work: 20, rest: 10, isFavorite: true },
  { id: '2', name: 'High Intensity', reps: 10, work: 45, rest: 15 },
  { id: '3', name: 'Kegels', reps: 20, work: 5, rest: 5 },
  { id: '4', name: '1 Minute Stretch', reps: 1, work: 60, rest: 10 },
  { id: '5', name: 'HIIT', reps: 8, work: 20, rest: 10 },
  { id: '6', name: 'Pomodoro', reps: 4, work: 1500, rest: 300 },
];

export const QUOTES = [
  "Unleash the Beast.",
  "No Shortcuts. No Excuses.",
  "Pain is temporary. Glory is forever.",
  "The only bad workout is the one that didn't happen.",
  "Hustle for that muscle.",
  "Sweat is just fat crying.",
  "Don't stop when you're tired. Stop when you're done.",
  "Strive for progress, not perfection.",
  "Your body can stand almost anything. It’s your mind that you have to convince.",
  "Success starts with self-discipline.",
  "Train like a pro.",
  "What hurts today makes you stronger tomorrow.",
  "Discipline is what you need.",
  "Champions are made in the dark.",
  "Dedication has no off-season.",
  "Be stronger than your excuses.",
  "Decide. Commit. Succeed.",
  "Motivation gets you started. Habit keeps you going.",
  "Hard work beats talent.",
  "Limitless potential."
];

export const MAX_HISTORY_RECORDS = 50;
