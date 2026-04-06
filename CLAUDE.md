# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**root@depauw** is a gamified wellness mobile app for DePauw University students. Users complete daily wellness tasks (physical, mental, social) to grow a virtual tree. The repo contains two packages: a React Native/Expo frontend and a Node.js/Express backend.

## Repository Structure

```
root-depauw/
├── frontend/          # React Native/Expo mobile app (TypeScript)
└── core-backend/      # Express.js API server (TypeScript + Firebase)
```

## Commands

### Frontend (`cd frontend`)

```bash
npm install
npm start                    # Start Expo dev server
npx expo start --tunnel      # Start with tunnel (for physical devices)
npm run android              # Android emulator
npm run ios                  # iOS simulator
npm run lint                 # ESLint
```

### Backend (`cd core-backend`)

```bash
npm install
npm run dev      # TypeScript watch + nodemon (recommended for development)
npm run build    # Compile TypeScript → build/
npm start        # Run compiled app (requires build first)
```

### Backend Environment Setup

Requires a `credentials/service-account-file.json` (Firebase Admin SDK credentials — not in repo) and a `.env` file with:
- `PORT`
- `OPENAI_API_KEY`
- Firebase credentials path

## Architecture

### Frontend

Uses **Expo Router** (file-based routing, like Next.js) under `frontend/app/`:
- `(onboarding)/` — Auth flow: login, signup, set-goals
- `home.tsx`, `tasks.tsx`, `trees.tsx`, `calendar-view.tsx`, `setting-view.tsx` — Main tabs

Supporting directories:
- `components/` — Reusable UI (e.g., `TaskItem.tsx`)
- `hooks/` — Custom hooks (e.g., `usePushNotifications.ts`)
- `lib/` — Helper utilities for calendar, task completion, goals, notifications, user preferences
- `types/` — Shared TypeScript types
- `constants/theme.ts` — Design tokens
- `data/` — Mock data (used for local dev/testing)

Path alias `@/*` maps to the project root (configured in `tsconfig.json`).

### Backend

Layered architecture: **Routes → Controllers → Services → Database**

```
core-backend/src/
├── app.ts                     # Express app setup + route mounting
├── routes/                    # Route definitions (game, tasks, notifications, recommendations, setting)
├── controllers/               # HTTP handlers (thin layer, delegates to services)
├── services/                  # Business logic
│   ├── game.service.ts        # Tree state management
│   ├── tasks.service.ts       # Daily task logic + finalization
│   ├── recommendations.service.ts  # OpenAI-powered event recommendations
│   └── notification.service.ts
├── jobs/                      # Background jobs (triggered by GitHub Actions)
│   ├── finalizeJob.ts         # Midnight: finalize tasks, update streaks, calc rewards
│   └── notificationJob.ts     # Send push notifications
├── crawler/eventCrawler.js    # Scrapes DePauw campus events
├── utils/
│   ├── gameLogic.ts           # Tree growth phases, coin/water rewards, streak logic
│   └── errors.ts              # Custom error classes
├── types/                     # TypeScript interfaces (gameState, user, dailyTasks, event, etc.)
└── database/configFirestore.ts  # Firebase Admin initialization
```

**API prefix:** all routes under `/api/` — e.g., `/api/game/*`, `/api/tasks/*`, `/api/notifications/*`, `/api/recommendations/*`, `/api/setting/*`.

### Game Logic

Tree has 5 growth phases: Seed → Seedling → Sapling → Young Tree → Full Grown. Users earn coins and water by completing tasks. Streaks trigger milestone bonuses. Logic lives in `utils/gameLogic.ts`.

### Background Jobs (GitHub Actions)

Three workflows in `.github/workflows/`:
- `finalize-job.yml` — Runs daily at midnight: crawl events, generate AI recommendations, finalize user task completion
- `notification-morning.yml` — Morning reminders
- `notification-reminder.yml` — Task reminder notifications

Workflows build the backend, inject Firebase credentials from GitHub secrets, and call backend job endpoints directly.

## TypeScript Notes

- **Backend:** `"module": "NodeNext"` with ES module imports — use `.js` extensions on relative imports in source files (e.g., `import { foo } from './bar.js'`)
- **Frontend:** Strict mode, extends Expo base config
- Backend compiles to `build/` directory; nodemon watches `build/` (not `src/`)
