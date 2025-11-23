# Task Management Chrome Extension

A Chrome extension for managing tasks with smart filtering and deadline management features. Built with React, TypeScript, and PGlite (local database).

## Features Overview

### Task Management
- Create tasks with deadlines
- Mark tasks as complete/incomplete
- Delete tasks
- Export all tasks as JSON

### Smart Deadline System
- **Default deadline**: 1 day (if not specified)
- **Quick add buttons**:
  - 1日: Set deadline to 1 day from now
  - 1週間: Set deadline to 7 days from now
  - 1年: Set deadline to 365 days from now
- **Keyboard shortcut**: `Ctrl+Enter` to add task with 7-day deadline

### Task Filtering
Three filter modes based on deadline proximity:
- **進行中 (In Progress)**: Shows tasks with deadline ≤ 1 day
  - Default filter on startup
  - Click to toggle filter on/off
- **1週間 (Week)**: Shows tasks with deadline between 2-7 days
  - Special feature: Checkbox replaced with left-arrow icon
  - Click arrow to move task to "In Progress" (sets deadline to 1 day)
- **1年 (Year)**: Shows tasks with deadline ≥ 8 days

### Task Actions
- **Complete/Incomplete toggle**: Click checkbox (except in Week filter)
- **Delete**: Click trash icon (appears on hover)
- **Postpone 7 days**: Click green right-arrow icon (appears on hover, in-progress tasks only)
- **Move to In Progress**: Click blue left-arrow icon (Week filter only)

## Technical Specifications

### Data Structure
```typescript
interface Task {
  id: string          // Format: "TASK:{number}"
  title: string       // Task description
  completed: boolean  // Completion status
  createdAt: string   // Creation date (YYYY-MM-DD)
  dueDate?: string    // Deadline date (YYYY-MM-DD)
}
```

### Storage
- **Database**: PGlite (IndexedDB-based local SQLite)
- **Table**: `tasks`
  - `id`: SERIAL PRIMARY KEY
  - `title`: TEXT NOT NULL
  - `completed`: BOOLEAN DEFAULT false
  - `created_at`: DATE NOT NULL
  - `due_date`: DATE
  - `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### UI Components
- **Header**: Contains task input form and settings menu
- **TaskInput**: Input field with quick add buttons
- **TaskList**: Displays filtered tasks
- **TaskItem**: Individual task card with actions

### Styling
- Built with Tailwind CSS
- Responsive design for 400x600px popup
- Hover effects for interactive elements
- Color coding:
  - Blue: Primary actions, active filters
  - Green: Postpone action
  - Red: Delete action
  - Gray: Inactive states

## Installation

### Development Mode

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Server

```bash
npm run dev
```
Opens at `http://localhost:5173/` (or next available port)

## Project Structure

```
task/
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Input form + settings menu
│   │   ├── TaskList.tsx      # Task list with filters
│   │   └── TaskItem.tsx      # Individual task card
│   ├── services/
│   │   ├── api-pglite.ts     # PGlite database operations
│   │   └── api-localstorage.ts # Alternative storage (not used)
│   ├── stores/
│   │   └── todoStore.ts      # Zustand state management
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── popup/
│   │   └── popup.tsx         # Main popup component
│   └── main.tsx              # Entry point
├── public/
│   └── icons/                # Extension icons
├── manifest.json             # Chrome extension manifest
└── vite.config.ts            # Build configuration
```

## User Workflows

### Adding a Task
1. Type task title in input field
2. Choose one of:
   - Press Enter → 1 day deadline
   - Press Ctrl+Enter → 7 day deadline
   - Click quick add button → Set specific deadline
   - Click "追加" button → 1 day deadline (default)

### Managing Deadlines
- **Postpone 7 days**: Hover over task → Click green arrow
- **Move to today**: In Week filter → Click blue left-arrow icon
- Result: Task moves to appropriate filter based on new deadline

### Filtering Tasks
- Click filter buttons to view tasks by deadline proximity
- Click same filter again to show all tasks
- Filters are mutually exclusive (only one active at a time)

### Exporting Data
1. Click gear icon (⚙️) in header
2. Click "JSONダンプ"
3. Downloads `tasks-YYYY-MM-DD.json` file

## Icons Used

All icons from Heroicons (https://heroicons.com/):
- Clock: Created date
- Calendar: Due date
- Trash: Delete task
- Arrow right: Postpone 7 days
- Arrow left (on rectangle): Move to In Progress
- Check: Complete task
- Gear: Settings menu
- Download: Export JSON

## Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Output in dist/ folder ready for Chrome extension loading
```

## Browser Compatibility

- Chrome/Chromium-based browsers
- Requires IndexedDB support for PGlite
