# Project Architecture

## Overview

A mobile-friendly, highly animated interval and Tabata timer built with React, Vite, Tailwind CSS, and Framer Motion. The application allows users to create custom routines, track their workout history, and manage multiple timers with a polished, neon-styled dark mode interface.

## Tech Stack
- Frontend Framework: React 18
- Build Tool: Vite
- Styling: Tailwind CSS
- Animation: `framer-motion` (via `motion/react`)
- Icons: `lucide-react`
- Audio: **Web Audio API** (Procedural synthesis, NO static files)
- Persistence: `localStorage`

## Core Components
- **`App.tsx`**: Main entrypoint holding layout logic, timer loops, Web Audio context, and state handling.
- **Timer Loop**: Based on JavaScript `setInterval` combined with `Date.now()` delta math to ensure accurate timekeeping across mobile browser suspensions and sleeping tabs.
- **Web Audio Context** (`playSound`, `initAudio`): A robust state wrapper over `window.AudioContext`.
  - Used to play oscillator beeps for "Work", "Rest", and "Tick" cues.
  - Initialized with strict `onClick` and `onTouchStart` un-blocking logic for iOS/Safari rules preventing automated background audio.

## File Structure / Subviews
- **ConfigView**: UI for modifying timer configuration (Reps, Sets, Work/Rest intervals).
- **HistoryView**: Persistent log of completed sessions.
- **RoutinesView**: A CRUD repository for pre-saved/favorite timer configurations.

## Handling Mobile Browsers & Audio
Mobile browsers are notoriously aggressive at suspending web audio and timeout intervals.
1. The app handles time-drift by keeping track of the target finish time and reducing `timeLeft`.
2. Audio state is initialized explicitly via touch interactions on UI buttons in order to grant audio capabilities to the running web application instance.
