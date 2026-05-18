# D Co. 2/8 CAV Archive — Session 34 Handoff
May 18, 2026

---

## Development Environment

**Local on Windows.**

**Repo:** `https://github.com/authormsmiller/d281staircav`
**Working branch at session end:** `admin/2026-05-13` (merged to main; new branch to be created)

**To start a session:**
1. Open GitHub Desktop — confirm branch is current admin branch
2. Open repo in VS Code
3. Terminal 1: `cd admin && npm start` (admin tool at `localhost:3001`)
4. Terminal 2: `cd site && npx @11ty/eleventy --serve` (site preview at `localhost:8080`)

**Clean build (PowerShell from repo root):**
```powershell
cd site; Remove-Item -Recurse -Force _site -ErrorAction SilentlyContinue; npm run build
```

**Git warnings:**
- Terminal git pushes fail — `msm-illumia` account does not have access to `authormsmiller/d281staircav`. Always push via **GitHub Desktop**.
- Admin tool Commit button confirmed unreliable — always verify in GitHub Desktop History tab that a new commit appears after clicking Commit.

**Session handoffs:** stored in `_sessions/` at repo root. Claude can read these directly at session start — no upload needed.

---

## What Was Accomplished This Session

### Bugs 19–21 Closed in Tab 5

`ADMIN-BUG-20260518000019`, `000020`, `000021` marked complete in `todo.json`. Bug 18 was already closed from Session 33.

### Profile Subject Field UX — ADMIN-UX-20260518000023

`admin/index.html` Tab 4: replaced the optional "Subject Slug — override" input with a required **Subject** field that pre-populates with the staging folder's soldier slug. Every profile assignment now names its target explicitly. Value defaults to folder slug (simple case requires no editing); change it for cross-soldier assignments.

### YAML Quoting Fix — ADMIN-BUG-20260518000024

`admin/lib/photos.js`: added `yamlStr()` helper that wraps free-text values in double quotes and escapes embedded backslashes and double quotes. Applied to `caption_short`, `credit`, and `photographer` fields in the YAML block writer. Fixes YAMLException on any value containing a colon (e.g. "Left: Frank Guidara").

### Flush Soldier Header Bug — ADMIN-BUG-20260518000025

`admin/lib/photos.js`: `processEntries()` was writing `soldier: ${slug}` (staging folder slug) in new `index.md` headers even when a `targetSlug` override was in effect. Fixed to `soldier: ${targetSlug || slug}`. Cross-soldier profile flushes now write the correct `soldier:` value.

### Stub Validation + Create Stub Modal — ADMIN-FEAT-20260518000026

`admin/index.html` Tab 4:
- **On blur of Subject field** — calls `GET /api/soldiers/check`. If slug is missing, shows inline red warning + "Create Stub" button.
- **Create Stub mini-modal** — pre-fills slug (read-only), collects full name, rank, status. POSTs to `POST /api/soldiers/create` on submit. Clears warning on success with toast.
- **Flush pre-check** — before the confirm dialog, checks all profile-destination slugs in the buffer. Warns (non-blocking) if any are missing a stub.
- Backend endpoints (`/api/soldiers/check`, `/api/soldiers/create`) were already live in `soldiers.js` — this was UI wiring only.

### Harrington Intake Test — Manual Fixes Applied

Ran first Harrington photo intake through Tab 4. Three issues found and fixed manually; all are now prevented by the patches above:

1. `site/soldiers/harrington-william/photos/field/index.md` — `caption_short` had unquoted colon; fixed manually, now handled by `yamlStr()`.
2. `site/soldiers/guidara-frank/photos/profile/index.md` — `soldier:` was `harrington-william`; corrected to `guidara-frank`. Now handled by flush header fix.
3. `site/soldiers/guidara-frank/guidara-frank.md` — `profile_photo:` was empty; set to `guidara-frank.png`.
4. `site/soldiers/harrington-william/harrington-william.md` — stub was missing (directory existed, no `.md`); created manually. Now surfaced by stub validation in Tab 4.

### Guidara Headshot Enhancement

`guidara-frank.png` upscaled 4× (176×200 → 704×800) using Pillow: LANCZOS two-pass upscale, two unsharp mask passes, contrast ×1.25, sharpness ×1.4, color ×1.15, brightness ×1.05. Enhanced file replaced original in raw intake folder before processing.

---

## todo.json — Current State

Items added this session: `ADMIN-UX-20260518000023`, `ADMIN-BUG-20260518000024`, `ADMIN-BUG-20260518000025`, `ADMIN-FEAT-20260518000026` — all logged as complete.

`todo.json` at `admin/data/todo.json` remains the authoritative issues list.

---

## Next Session Priorities

1. **Crawler fix (SITE-BUG-20260518140001001)** — Dynamic scan of `field/events/*/index.md` in `photosBySlug.js`. Replaces static `"field/events"` entry. Required before any event-destination photo appears on a soldier profile. Moderate effort, self-contained.

2. **byEvent pipeline (SITE-BUG-20260518140001002)** — Add `byEvent` map to `photosBySlug`, wire to event template. Makes Makowski clipping visible on Nui Ba event page. Depends on #1.

3. **Create stub — `bacon-wg`** — W.G. Bacon, LTC, status: deceased. Small, unblocked. Check `roster.json` and remove entry after creation.

4. **Event slug `[]` literal in promote form (ADMIN-BUG-20260518000022)** — Quick fix in `populatePromoteForm`.

5. **Re-test Harrington intake flow** — Now that all three bugs are patched (YAML quoting, flush header, stub validation), run a second photo through the full raw → staging → Tab 4 → flush pipeline to confirm clean end-to-end behavior.

---

## Carry-Forward

**Soldier stubs needed:**
- `bacon-wg` — W.G. Bacon, LTC, status: deceased. Not yet created.
- `caruthers-tom`, `kinsey-charles`, `ryneska-john` — referenced in Bacon document `contains`, no stubs
- `rosenberg-kenneth` — KIA May 14, 1972 (Chinook crash); update `status: kia`, add `date_of_death` once format confirmed
- `blais-dizzy` — real name confirmed Jean Blais; update slug to `blais-jean` across all records
- `neal-bill` — confirm correct slug for Capt. William D. Neal before wiring
- `martin-michael` vs `martin-mike` — slug conflict; reconcile before scaffolding profile
- `makowski-william` — stub exists; check `roster.json` and remove entry
- `woo-robin` — stub exists; check `roster.json` and remove entry
- Dillon document `contains` — named soldiers not yet cross-referenced with stubs

**Documents ready to process:**
- Makowski commemoration — staged at `_intake/staging/docs/kutter-wolf/kutter-wolf-commemoration-makowski-20211021.md`; promote once `makowski-william` stub is confirmed stable

**Data decisions pending:**
- McGrew calendar document type — `log` or `journal`
- `miller-marvin-dale-OLD.md` — remove once new profile confirmed stable
- Bee incident slug — update `bee-incident-1971` to `bee-incident-1971-03-22` in testing brief

**Research / physical assets:**
- Higher-resolution Cardwell clippings — LaCunha deceased; Peggy may have originals
- Linda Martin shadow box photograph — offered to Angelo State; unclear if in collection
- Grenada MS war memorial — carries Sargent's name; note on Sargent's profile
- Unnamed boot camp soldier in Linda Martin transcript — potentially identifiable
- Cate shadow box — Michael Miller has photograph; needs adding to project

**Deferred features:**
- Honor Wall — tabled until Unit History page built
- Phase 5 template work — profile photo path to R2; remove `photos:` array fallback
- ASA newsletter migration — skip until ready as clean batch
- R2 pull endpoint — `/api/add-record/pull` shell-out to wrangler not yet implemented
- Served Alongside — Add to Edit Record under Soldier; wire to `relationships.json`
- Profile photo picker in Edit Record — pairs with photo metadata editing
- `kia` collection filter — `.eleventy.js` uses uppercase `"KIA"`; data standard is lowercase `"kia"`; fix when KIA collection is actually used

---

## Profile Structure Reference (unchanged)

- Soldier files: `site/soldiers/[slug]/[slug].md`
- Photos: `site/soldiers/[slug]/photos/[subfolder]/[filename]`
- Event photos: `site/soldiers/[slug]/photos/field/events/[event-slug]/index.md`
- Profile photo: must be in `photos/profile/` — template uses `profile_photo:` field in soldier front matter
- Documents: `site/documents/[soldier-slug]/[doc-slug]/[doc-slug].md` or `site/documents/unit/[doc-slug]/[doc-slug].md`
- Document slug convention: `authorslug-type-YYYYMM`
- Relationships: `site/_data/relationships.json`
- Anecdotes: `site/anecdotes/[soldier-slug]/[anecdote-slug]/index.md`
- Photographer values: `unknown` = subject took it, `unknown-of` = someone else took it of them

## Status Vocabulary Reference

| Value | Meaning |
|---|---|
| `veteran` | Living, confirmed served |
| `deceased` | Died post-service |
| `kia` | Killed in action |
| `researching` | Name on record, nothing more |

All values lowercase.

## Roster.json Deduplication Rule

Every soldier with a profile file must be removed from `roster.json`. After creating any new stub, check `roster.json` and remove the matching entry.

**Confirmed to check next session:** `makowski-william`, `woo-robin`, `bacon-wg` (after creation)
