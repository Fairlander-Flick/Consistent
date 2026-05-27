# Supabase Data Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every store's data sync to Supabase so users see the same data on any device or browser.

**Architecture:** New `sync.js` module handles all Supabase I/O. `saveData` gets one side-effect line. `useAuthStore` gains a `syncing` status. Zero changes to store files.

**Tech Stack:** Vite + React 19 + Zustand 5, `@supabase/supabase-js` already installed, Vitest for tests.

**Working directory:** `C:\Users\Ugurt\Desktop\Code\Consistent+Potent\consistent\`

**Spec:** `docs/superpowers/specs/2026-05-27-supabase-sync-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| Supabase dashboard | manual | Create `user_data` table + RLS |
| `src/lib/sync.js` | create | All Supabase I/O: `initSync`, `syncWrite`, `clearSync` |
| `src/lib/sync.test.js` | create | Unit tests for `syncWrite` and `clearSync` |
| `src/lib/storage.js` | modify | Add `syncWrite` side-effect to `saveData` |
| `src/store/useAuthStore.js` | modify | Add `syncing` status; call `initSync`/`clearSync` |
| `src/App.jsx` | modify | Treat `syncing` same as `loading` |

---

## Task 1: Create Supabase `user_data` table

**Files:**
- Manual: Supabase Dashboard → SQL Editor

- [ ] **Step 1: Open Supabase SQL Editor**

Go to your Supabase project dashboard → SQL Editor → New query.

- [ ] **Step 2: Run table creation SQL**

Paste and run:

```sql
create table user_data (
  user_id    uuid        references auth.users(id) on delete cascade,
  key        text        not null,
  data       jsonb       not null default '{}',
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

alter table user_data enable row level security;

create policy "users own data" on user_data
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 3: Verify**

In Supabase → Table Editor, `user_data` table appears with columns: `user_id`, `key`, `data`, `updated_at`.

---

## Task 2: Create `sync.js` with unit tests

**Files:**
- Create: `consistent/src/lib/sync.js`
- Create: `consistent/src/lib/sync.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/sync.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock supabase before importing sync
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockEq     = vi.fn().mockResolvedValue({ data: [], error: null })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom   = vi.fn().mockReturnValue({ select: mockSelect, upsert: mockUpsert })

vi.mock('./supabase', () => ({ supabase: { from: mockFrom } }))

// Mock all stores
vi.mock('../store/useWeightStore',       () => ({ useWeightStore:       { setState: vi.fn() } }))
vi.mock('../store/useJournalStore',      () => ({ useJournalStore:      { setState: vi.fn() } }))
vi.mock('../store/useScheduleStore',     () => ({ useScheduleStore:     { setState: vi.fn() } }))
vi.mock('../store/useScheduleDoneStore', () => ({ useScheduleDoneStore: { setState: vi.fn() } }))
vi.mock('../store/useGoalsStore',        () => ({ useGoalsStore:        { setState: vi.fn() } }))
vi.mock('../store/useFinanceStore',      () => ({ useFinanceStore:      { setState: vi.fn() } }))
vi.mock('../store/useTrainingStore',     () => ({ useTrainingStore:     { setState: vi.fn() } }))

import { syncWrite, clearSync, initSync } from './sync'

beforeEach(() => {
  vi.clearAllMocks()
  clearSync()
  localStorage.clear()
})

describe('syncWrite', () => {
  it('is a no-op when no userId is set', () => {
    syncWrite('consistent:weight', [])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('is a no-op for keys not in SYNC_KEYS', async () => {
    await initSync('user-1')
    vi.clearAllMocks()
    syncWrite('consistent:settings', { theme: 'dark' })
    // give fire-and-forget a tick
    await new Promise(r => setTimeout(r, 0))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase upsert for a valid sync key after initSync', async () => {
    await initSync('user-1')
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
    syncWrite('consistent:weight', [{ date: '2026-05-27', kg: 80 }])
    await new Promise(r => setTimeout(r, 0))
    expect(mockFrom).toHaveBeenCalledWith('user_data')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        key: 'consistent:weight',
        data: [{ date: '2026-05-27', kg: 80 }],
      })
    )
  })
})

describe('clearSync', () => {
  it('prevents syncWrite from calling supabase after clearSync', async () => {
    await initSync('user-1')
    clearSync()
    vi.clearAllMocks()
    syncWrite('consistent:weight', [])
    await new Promise(r => setTimeout(r, 0))
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('initSync', () => {
  it('writes Supabase data to localStorage when row exists', async () => {
    const entries = [{ date: '2026-05-27', kg: 80 }]
    mockEq.mockResolvedValueOnce({
      data: [{ key: 'consistent:weight', data: entries }],
      error: null,
    })
    await initSync('user-1')
    expect(localStorage.getItem('consistent:weight')).toBe(JSON.stringify(entries))
  })

  it('uploads localStorage data to Supabase when no remote row exists', async () => {
    mockEq.mockResolvedValueOnce({ data: [], error: null })
    localStorage.setItem('consistent:journal', JSON.stringify([{ date: '2026-05-27' }]))
    mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
    await initSync('user-1')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ key: 'consistent:journal', user_id: 'user-1' }),
      ])
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd consistent
npx vitest run src/lib/sync.test.js
```

Expected: FAIL — `Cannot find module './sync'`.

- [ ] **Step 3: Create `sync.js`**

Create `src/lib/sync.js`:

```js
import { supabase } from './supabase'
import { loadData } from './storage'
import { useWeightStore }       from '../store/useWeightStore'
import { useJournalStore }      from '../store/useJournalStore'
import { useScheduleStore }     from '../store/useScheduleStore'
import { useScheduleDoneStore } from '../store/useScheduleDoneStore'
import { useGoalsStore }        from '../store/useGoalsStore'
import { useFinanceStore }      from '../store/useFinanceStore'
import { useTrainingStore }     from '../store/useTrainingStore'

const HYDRATORS = {
  'consistent:weight':           (d) => useWeightStore.setState({ entries: d }),
  'consistent:journal':          (d) => useJournalStore.setState({ entries: d }),
  'consistent:schedule':         (d) => useScheduleStore.setState({ recurring: d.recurring, oneoffs: d.oneoffs }),
  'consistent:schedule-done':    (d) => useScheduleDoneStore.setState({ done: d }),
  'consistent:goals':            (d) => useGoalsStore.setState({ goals: d }),
  'consistent:goals-log':        (d) => useGoalsStore.setState({ goalsLog: d }),
  'consistent:finance':          (d) => useFinanceStore.setState(d),
  'consistent:training-program': (d) => useTrainingStore.setState({ program: d }),
  'consistent:training-log':     (d) => useTrainingStore.setState({ log: d }),
}

const SYNC_KEYS = Object.keys(HYDRATORS)

let currentUserId = null

export async function initSync(userId) {
  currentUserId = userId

  const { data, error } = await supabase
    .from('user_data')
    .select('key, data')
    .eq('user_id', userId)

  if (error) throw error

  const remote = Object.fromEntries(data.map(r => [r.key, r.data]))
  const uploads = []

  for (const key of SYNC_KEYS) {
    if (remote[key] !== undefined) {
      localStorage.setItem(key, JSON.stringify(remote[key]))
      HYDRATORS[key]?.(remote[key])
    } else {
      const local = loadData(key, null)
      if (local !== null) {
        uploads.push({
          user_id: userId,
          key,
          data: local,
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  if (uploads.length > 0) {
    await supabase.from('user_data').upsert(uploads)
  }
}

export function syncWrite(key, value) {
  if (!currentUserId || !SYNC_KEYS.includes(key)) return

  supabase
    .from('user_data')
    .upsert({ user_id: currentUserId, key, data: value, updated_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.error('[sync] write failed:', key, error)
    })
}

export function clearSync() {
  currentUserId = null
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd consistent
npx vitest run src/lib/sync.test.js
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
cd consistent
git add src/lib/sync.js src/lib/sync.test.js
git commit -m "feat(sync): add sync.js — Supabase I/O layer with initSync, syncWrite, clearSync"
```

---

## Task 3: Wire `syncWrite` into `storage.js`

**Files:**
- Modify: `consistent/src/lib/storage.js`

- [ ] **Step 1: Add the import and side-effect call**

Open `src/lib/storage.js`. Replace the entire file with:

```js
import { syncWrite } from './sync'

export function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    syncWrite(key, value)
  } catch (e) {
    console.error('[storage] saveData failed:', e)
  }
}
```

- [ ] **Step 2: Run full test suite to catch regressions**

```bash
cd consistent
npx vitest run
```

Expected: same pass/fail as before this task (2 pre-existing currency locale failures, everything else green).

- [ ] **Step 3: Commit**

```bash
cd consistent
git add src/lib/storage.js
git commit -m "feat(sync): wire syncWrite into saveData"
```

---

## Task 4: Update `useAuthStore.js` — `syncing` status + init/clear

**Files:**
- Modify: `consistent/src/store/useAuthStore.js`

- [ ] **Step 1: Add imports and `syncInitialized` flag**

At the top of `src/store/useAuthStore.js`, after the existing imports, add:

```js
import { initSync, clearSync } from '../lib/sync'
```

Directly below the imports (before `const USERNAME_DOMAIN`), add:

```js
let syncInitialized = false
```

- [ ] **Step 2: Update `init` to set `syncing` status and call `initSync`**

Replace the entire `init` action:

```js
  init: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      set({ status: 'syncing' })
      await initSync(data.session.user.id)
      syncInitialized = true
      set({
        user: { id: data.session.user.id, username: fromEmail(data.session.user.email) },
        status: 'authed',
      })
    } else {
      set({ status: 'guest' })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        if (!syncInitialized) {
          set({ status: 'syncing' })
          await initSync(session.user.id)
          syncInitialized = true
        }
        set({
          user: { id: session.user.id, username: fromEmail(session.user.email) },
          status: 'authed',
          error: null,
        })
      } else if (get().status !== 'loading') {
        set({ user: null, status: 'guest' })
      }
    })
  },
```

- [ ] **Step 3: Update `signOut` to call `clearSync` and reset flag**

Replace the `signOut` action:

```js
  signOut: async () => {
    syncInitialized = false
    clearSync()
    await supabase.auth.signOut()
    // Hard reload so the previous user's local Zustand state cannot leak
    // into the next session.
    window.location.reload()
  },
```

- [ ] **Step 4: Verify build**

```bash
cd consistent
npm run build
```

Expected: build succeeds, no new errors.

- [ ] **Step 5: Commit**

```bash
cd consistent
git add src/store/useAuthStore.js
git commit -m "feat(sync): add syncing status to useAuthStore; call initSync on login"
```

---

## Task 5: Update `App.jsx` loading gate

**Files:**
- Modify: `consistent/src/App.jsx`

- [ ] **Step 1: Treat `syncing` same as `loading`**

In `src/App.jsx`, find:

```js
  if (status === 'loading') {
```

Replace with:

```js
  if (status === 'loading' || status === 'syncing') {
```

- [ ] **Step 2: Verify build + tests**

```bash
cd consistent
npx vitest run && npm run build
```

Expected: tests unchanged, build succeeds.

- [ ] **Step 3: Commit**

```bash
cd consistent
git add src/App.jsx
git commit -m "feat(sync): show loading screen while syncing Supabase data"
```

---

## Task 6: Smoke test + push

**Files:** none (verification only)

- [ ] **Step 1: Start dev server**

```bash
cd consistent
npm run dev
```

- [ ] **Step 2: Test new user flow**

1. Open `http://localhost:5173` in Chrome.
2. Sign up with a fresh username (e.g. `synctest1` / `password123`).
3. Wait for dashboard to load — the app should show Loading... briefly while `initSync` runs, then show the dashboard.
4. Add a weight entry (e.g. 80 kg).
5. Check Supabase Table Editor → `user_data` — a row with `key = 'consistent:weight'` should appear for that user.

- [ ] **Step 3: Test cross-browser sync**

1. In a different browser (or incognito), open `http://localhost:5173`.
2. Sign in with the same credentials (`synctest1` / `password123`).
3. Navigate to the weight page.
4. Expected: the 80 kg entry from Step 4 is visible.

- [ ] **Step 4: Test sign out clears state**

1. Sign out.
2. Sign in again as a different user (or same user in a new session).
3. Expected: no data leaks between sessions.

- [ ] **Step 5: Verify no Turkish remains in src/**

```bash
cd consistent
grep -rnP "[şğıİüöçŞĞÇÖÜ]" src/ || echo "CLEAN"
```

Expected: `CLEAN`.

- [ ] **Step 6: Final build + full test run**

```bash
cd consistent
npx vitest run && npm run build
```

Expected: same pass/fail as baseline (2 pre-existing currency locale failures, all others green). Build succeeds.

- [ ] **Step 7: Push**

```bash
cd consistent
git push origin main
```

---

## Acceptance Criteria

- [ ] Writing a weight entry in Chrome → visible immediately in Firefox after sign-in.
- [ ] `user_data` table in Supabase shows one row per store key per user.
- [ ] Fresh user: localStorage seed data is uploaded on first login.
- [ ] Returning user: Supabase data overwrites any stale localStorage.
- [ ] `syncWrite` no-op for `consistent:settings` (theme stays device-local).
- [ ] Sign out → sign in as different user → zero data leakage.
- [ ] `npm run build` passes. `npx vitest run` passes (minus 2 pre-existing locale failures).
