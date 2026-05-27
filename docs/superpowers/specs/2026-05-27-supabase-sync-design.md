# Supabase Data Sync Design

**Goal:** Every store's data lives in Supabase as the single source of truth. localStorage is a read cache only. Switching devices or browsers gives you the same data.

**Approach:** Sync Layer (Approach 1) — stores are unchanged. A new `sync.js` module handles all Supabase I/O. `saveData` gets a single side-effect line. `useAuthStore` gains a `syncing` status.

---

## 1. Supabase Table

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

One row per user per store key. Cascade delete on user removal. RLS enforced.

---

## 2. Sync Keys (9 total)

Settings (`consistent:settings`) is excluded — stays device-local.

| Key | Store | State field(s) |
|-----|-------|----------------|
| `consistent:weight` | useWeightStore | `entries` |
| `consistent:journal` | useJournalStore | `entries` |
| `consistent:schedule` | useScheduleStore | `recurring`, `oneoffs` |
| `consistent:schedule-done` | useScheduleDoneStore | `done` |
| `consistent:goals` | useGoalsStore | `goals` |
| `consistent:goals-log` | useGoalsStore | `goalsLog` |
| `consistent:finance` | useFinanceStore | `categories`, `transactions`, `recurring`, `budgets` |
| `consistent:training-program` | useTrainingStore | `program` |
| `consistent:training-log` | useTrainingStore | `log` |

---

## 3. `src/lib/sync.js` (new file)

Three exports:

### `initSync(userId)`
Called once after Supabase auth confirms a session.

1. Fetch all rows for `user_id` from `user_data`.
2. For each sync key:
   - If Supabase row exists → write to localStorage + call hydrator (see table above).
   - If no Supabase row but localStorage has data → upload to Supabase (first-login migration).
3. Sets module-level `currentUserId`.

Hydrators call `Store.setState()` directly — no store files touched.

### `syncWrite(key, value)`
Fire-and-forget. Called from `saveData`.

- No-op if `currentUserId` is null or key is not in SYNC_KEYS.
- Upserts `{ user_id, key, data: value, updated_at: now }` to Supabase.
- Logs errors to console; never throws.

### `clearSync()`
Called on `signOut`. Sets `currentUserId = null`.

---

## 4. `src/lib/storage.js` — 2 line change

```diff
+ import { syncWrite } from './sync'

  export function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
+   syncWrite(key, value)
  }
```

---

## 5. `src/store/useAuthStore.js` — ~10 lines

New status: `'syncing'` (between session confirmed and data loaded).

```
loading → syncing → authed
loading →          guest
```

`init()` change:
```js
if (session) {
  set({ status: 'syncing' })
  await initSync(session.user.id)
  set({ user: ..., status: 'authed' })
}
```

`signOut()` change: call `clearSync()` before `supabase.auth.signOut()`.

---

## 6. `src/App.jsx` — 1 line

```diff
- if (status === 'loading') {
+ if (status === 'loading' || status === 'syncing') {
```

---

## 7. Offline behavior

No offline support. If Supabase is unreachable during `initSync`, the error propagates and the app shows a loading state indefinitely (or an error boundary catches it). No retry logic in v1.

---

## 8. Edge cases

- **Goals date-reset logic** runs at module init (before sync). After `initSync` hydrates `goals` from Supabase, stale-date goals won't auto-reset until next app load. Acceptable for v1.
- **Training seed**: new users with no Supabase data get the localStorage seed uploaded on first login.
- **Concurrent writes** (two tabs): last write wins via `updated_at`. No conflict resolution in v1.

---

## Files changed

| File | Change |
|------|--------|
| `src/lib/sync.js` | **NEW** — all Supabase I/O |
| `src/lib/storage.js` | +2 lines |
| `src/store/useAuthStore.js` | ~10 lines (syncing status + initSync/clearSync) |
| `src/App.jsx` | 1 line |
| Supabase dashboard | 1 table + RLS SQL |

**Zero changes to any of the 7+ store files.**
