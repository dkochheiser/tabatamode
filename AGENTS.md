# AI Agent Custom Instructions

## Overall Project Constraints & Goals
- **Project Structure**: This is a React single-page frontend application utilizing Vite.
- **Styling**: Uses Tailwind CSS. Do not configure other styling mechanisms (like separate `.css` files unless absolutely necessary). Tailwind configuration is standard Vite setup.
- **Animations**: Uses `framer-motion` for complex UI transitions and timer scaling animations.

## Audio Handling (Critical Information)
- **Do NOT attempt to look for or load audio `.mp3/.wav` files**. 
- Audio in this project is strictly **synthesized** via `window.AudioContext` within the `playSound` and `initAudio` functions in `App.tsx`.
- Because mobile browsers (Safari / Chrome on iOS) require explicit user interaction to unlock `AudioContext`, **all entry points** must trigger `initAudio()` from a user-initiated event (like `onClick`, `onTouchStart`, `onPointerDown`, or `onKeyDown`). 
- When working on buttons that trigger the timer, always ensure `initAudio()` is fired on pointer/touch actions.

## State Management and Persistence
- `localStorage` is used to persist timers/history/routines across sessions.
- Timer intervals are managed defensively due to the environment limitations (see `setInterval` implementations and time divergence logic in `App.tsx`).

## Adding new features
- To add a new timer feature or sound effect, locate the Web Audio API cases in the `playSound()` switch statement.
- Maintain a polished UI. The design leans toward a dark theme with high-contrast "neon" colored timers and typography.
- Standard libraries configured include `lucide-react` for icons and `motion/react` for animations. 
- Try to respect the mobile-first component structure.

## Deployment Environment
- Cloud Run environment natively executes `npm run dev` in an Express wrapped shell for this platform (during development). Port is strictly `3000`. 
- No custom custom APIs/Databases have been built yet for this project (No Firebase/Cloud SQL). Client-side only. 
