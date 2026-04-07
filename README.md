# root@depauw

A gamified wellness and productivity mobile app for DePauw University students. Complete daily tasks, grow virtual trees, and stay accountable to your personal goals — all powered by AI-curated recommendations built around your schedule and campus life.

Built for **TigerHacks 2026**.

---

## What it does

Students set personal wellness goals (sleep better, ease stress, move more, etc.). Each morning the app generates a personalized task list that fits around their Google Calendar availability and real DePauw campus events. Completing tasks waters a virtual tree that grows through five phases. Miss too many days and the tree starts to wilt — unless you use a fertilizer boost to save it.

The app also surfaces campus mental health resources when it notices a student hasn't completed any tasks for several consecutive days.

---

## Features

- **AI-powered daily tasks** — OpenAI generates 3+ actionable tasks each day tailored to the user's goals, free time gaps in their calendar, and upcoming DePauw campus events
- **Campus event integration** — live event crawl from the DePauw Engage platform surfaces relevant activities as completable tasks
- **Tree growth system** — earn water by fully completing your daily tasks; water advances your tree through 5 phases (Seed → Seedling → Sapling → Young Tree → Full Grown)
- **Coin economy** — earn coins for task completion; milestone streaks award bonus coins and fertilizer
- **Degradation & fertilizer** — 7 consecutive zero-completion days triggers a tree degradation warning; use a fertilizer to block the regression or decline and lose one growth phase
- **Streak tracking** — separate counters for full, partial, and zero completion days
- **Wellness check** — a gentle in-app check-in with campus mental health contacts appears when zero-completion days accumulate (days 5–7)
- **Tree collection** — complete a full tree (35 waters) to unlock the next species; collect them all
- **Calendar heatmap** — a monthly view showing full / partial / no completion at a glance
- **Push notifications** — morning motivation and evening reminders via Expo Notifications

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native + Expo (Expo Router) |
| State & navigation | Expo Router file-based routing |
| Backend API | Node.js + Express + TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google OAuth) |
| AI recommendations | OpenAI API |
| Campus events | DePauw Engage API (live crawler) |
| Push notifications | Expo Push Notifications |
| Deployment (API) | Vercel |
| Scheduled jobs | GitHub Actions (cron) |

---

## Game mechanics

### Daily flow

1. App generates today's task list (AI picks tasks + campus events that fit your goals and free calendar slots)
2. You confirm the task list for the day
3. Complete tasks throughout the day — each completion adds **+5 coins** instantly
4. At midnight a GitHub Actions job **finalizes the day** for all users and applies all rewards

### Completion rewards (applied at finalize)

| Result | Coins | Water |
|---|---|---|
| Full completion (all tasks done) | +10 | +1 |
| Partial completion (at least one done) | +5 | 0 |
| No completion | 0 | 0 |
| Campus event task (per event completed) | +10 bonus | — |

### Tree growth

Each tree has **5 phases**, requiring **7 waters per phase** (35 waters total to fully grow). Fully growing a tree awards **+100 coins** and automatically starts the next tree species.

Available trees:

| Tree | Full-grown | ID |
|---|---|---|
| Oak Sapling | 🌲 | 1 |
| Cherry Blossom | 💐 | 2 |
| Cactus | 🌵 | 3 |

### Streak milestones

Every **7 consecutive full-completion days**: **+50 coins** + **1 fertilizer**. The counter keeps running — rewards fire again at 14, 21, 28, etc.

### Degradation system

- After **7 consecutive zero-completion days** the tree enters a `pendingDegradation` state
- On next app open the user is prompted:
  - **Use fertilizer** → degradation cancelled, streak reset (costs 1 fertilizer)
  - **Decline** → tree regresses one phase, water resets to 0

### Wellness check

When `zeroCompletionDays` reaches 5–7 the home screen shows a wellness check modal with:
- Campus 24/7 Mental Health support: (765) 658-4268
- DePauw Police: (765) 658-5555
- Medical Emergency: 911

### User goals catalog

Goals are grouped into four categories:

| Category | Goals |
|---|---|
| Body & rest | Move regularly, Sleep steadier, Eat nourishing |
| Mind & mood | Ease stress, Build calm and focus, Reflect / gratitude |
| Growth & direction | Learn something new, Progress on work/creative, Money clarity |
| Connection & space | Meaningful time with others, Care for space, Reduce draining habits |

---

## API reference

Base URL: `/api`

### Game

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/game/:userId/state` | Fetch current game state (coins, phase, water, fertilizer) |
| `GET` | `/game/:userId/streak` | Fetch streak counters |
| `GET` | `/game/:userId/warning-status` | Get active warning (degradation / wellness check / none) |
| `GET` | `/game/:userId/profile` | Fetch user profile |
| `GET` | `/game/trees` | List all trees |
| `GET` | `/game/trees/:treeId` | Get a specific tree |
| `PATCH` | `/game/:userId/tree` | Switch active tree |
| `GET` | `/game/:userId/completed-trees` | List completed trees |
| `POST` | `/game/:userId/fertilizer/use` | Use fertilizer to cancel degradation |
| `POST` | `/game/:userId/fertilizer/decline` | Decline fertilizer (tree regresses) |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks/:userId/:date` | Get daily tasks for a date (`YYYY-MM-DD`) |
| `POST` | `/tasks/:userId/:date/confirm-setup` | Confirm task list for the day |
| `PATCH` | `/tasks/:userId/:date/complete` | Mark a task as completed |
| `POST` | `/tasks/:userId/:date/finalize` | Finalize the day (apply all rewards) |
| `GET` | `/tasks/:userId/calendar?year=&month=` | Monthly completion heatmap |

### Recommendations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/recommendations/:userId/generate` | Crawl events + call AI + store recommendations |
| `GET` | `/recommendations/:userId?date=` | Fetch stored recommendations for a date |

### Notifications & Settings

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/notifications/register` | Register Expo push token |
| `GET/PATCH` | `/setting/:userId` | Get / update user settings |

---

## Project structure

```
root-depauw/
├── frontend/                   # Expo React Native app
│   ├── app/                    # File-based routes (Expo Router)
│   │   ├── index.tsx           # Sign-in / onboarding
│   │   ├── home.tsx            # Main game screen
│   │   ├── tasks.tsx           # Daily task list
│   │   ├── trees.tsx           # Tree collection shelf
│   │   ├── calendar-view.tsx   # Monthly heatmap
│   │   └── setting-view.tsx    # Settings
│   ├── lib/                    # API clients, Firebase helpers
│   ├── types/                  # Shared TypeScript types
│   ├── constants/              # Theme
│   └── hooks/                  # Custom hooks (notifications, etc.)
│
├── core-backend/               # Express + TypeScript API
│   └── src/
│       ├── app.ts              # Express app entry
│       ├── routes/             # Route definitions
│       ├── controllers/        # Request handlers
│       ├── services/           # Business logic
│       ├── utils/
│       │   ├── gameLogic.ts    # Pure game logic (rewards, streaks, phases)
│       │   └── mockData.ts     # Tree catalog
│       ├── types/              # Shared types
│       ├── crawler/            # DePauw Engage event crawler
│       ├── jobs/               # Scheduled job scripts
│       └── database/           # Firestore config
│
└── .github/workflows/          # GitHub Actions cron jobs
    ├── finalize-job.yml        # Midnight: finalize all users' days
    ├── notification-morning.yml # 8 AM ET: morning push notifications
    └── notification-reminder.yml # Evening: reminder push notifications
```

---

## Setup

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Firestore and Authentication enabled
- OpenAI API key
- Expo account (for push notifications)

### Backend

```bash
cd core-backend
npm install
```

Create `.env`:

```env
PORT=3000
OPENAI_API_KEY=your_openai_key
```

Add Firebase credentials:
1. In your Firebase project, go to **Project Settings → Service Accounts → Generate new private key**
2. Save the downloaded JSON as `core-backend/src/credentials/service-account-file.json`

```bash
npm run dev       # development (watch mode)
npm run build     # production build
npm start         # run production build
```

Seed test data:

```bash
npm run seed         # seed test user
npm run seed:game    # seed game state
npm run seed:trees   # seed tree catalog
```

### Frontend

```bash
cd frontend
npm install
```

Create `.env.local` with your Firebase config and backend URL:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
```

```bash
npx expo start          # local dev
npx expo start --tunnel # tunnel (needed for physical devices on different networks)
npx expo start --ios    # iOS simulator
npx expo start --android
```

### GitHub Actions (scheduled jobs)

Add the following repository secrets:

| Secret | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON contents of the Firebase service account file |
| `OPENAI_API_KEY` | OpenAI API key |

The three workflows run automatically:
- **Finalize job** — midnight UTC daily
- **Morning notifications** — 8:00 AM ET (12:00 UTC) daily
- **Reminder notifications** — configurable evening time

---

## Privacy

This app does not collect or share any data with third parties. User data (goals, tasks, game state) is stored in a private Firebase Firestore database and is used solely to power the app's features.

---

## Team

Built at TigerHacks 2026 by:                                                                                                                
      - Uyen (Ellie) Ngo                                                                                                   
      - Khue Doan                                                                                                          
      - Tra Nguyen  

