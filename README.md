# root@depauw


## Frontend

```
cd frontend
```

```
npm run start
```

### Folder Structure

```text
frontend/
  app/                      # Routes & navigation (Expo Router)
    (tabs)/                 # Route group for tab-based navigation
    _layout.tsx            # Root layout for the app (navigation container)
    index.tsx              # Default route (/)
    explore.tsx            # Tab screen route
    modal.tsx              # Modal route
  components/               # Reusable UI components
    ui/                     # Smaller UI building blocks (internal)
  constants/                # Shared constants (ex: theme)
  hooks/                    # Reusable hooks (ex: color scheme / theme helpers)
  assets/                   # Static images used by the app
  scripts/                  # Project scripts (ex: reset helper)
```

What each directory is for:

- `app/`: your screens and navigation. Expo Router uses the file tree to create routes automatically.
- `(tabs)/`: grouped tab screens so their layout stays separate from the root layout.
- `components/`: shared React components used by the routes.
- `constants/`: app-wide values like colors and typography (`theme.ts`).
- `hooks/`: custom hooks for theme/color-scheme selection.
- `assets/`: images referenced by the UI (icons, splash, logos, etc.).
- `scripts/`: development/maintenance helpers (like `reset-project.js`).


## Core Backend

```
cd core-backend
```

```
npm run dev
```

### Folder Structure
```
core-game-backend/
├── index.js
├── package.json
├── README.md
├── controllers/
│   └── (controller files)
├── db/
│   └── (database-related files)
├── middleware/
│   └── (express middleware)
├── model/
│   └── (data models)
├── routes/
│   └── (route definitions)
└── utils/
    └── (helpers / utilities)
```
