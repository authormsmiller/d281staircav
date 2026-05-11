# D Co. 2/8 CAV Archive — Data Standards
*Canonical reference. Do not retrofit after this is committed.*
*Last updated: Session 16, May 11, 2026*

---

## The Three Cross-Reference Fields

These three fields appear on every content type and mean the same thing everywhere.
This consistency is what makes the crawler possible.

| Field | Meaning | Who populates it |
|---|---|---|
| `contains:` | Soldier is **confirmed present** — named in a source, visible in a photo, or positively identified | Archivist, from primary sources |
| `tagged:` | Soldier is **implied present** — their unit was there, or they may have information | Archivist, as a research/contribution prompt |
| `event:` | The **primary event** this content documents or references | Archivist, using event slug |

**`contains:` vs `tagged:` is a confidence distinction, not a role distinction.**
A soldier who was present but unhurt goes in `contains:`, not `casualties:`.
A soldier whose platoon was present but whose individual presence isn't confirmed goes in `tagged:`.

The "Build My Album" feature will use `contains:` as the default filter and offer
`tagged:` as a secondary opt-in. This distinction must be maintained precisely.

---

## Events

**Path:** `site/events/[slug]/index.md`
**Slug convention:** `type-location-YYYY-MM-DD`
**Examples:** `contact-fsb-fontaine-1971-04-20`, `crash-fsb-fontaine-1971-04-24`, `bee-incident-1971`

```yaml
---
slug: contact-fsb-fontaine-1971-04-20
title: Enemy Contact Near FSB Fontaine
status: draft                  # draft | published

date: 1971-04-20
date_end: 1971-04-23           # omit if single-day event
date_known: true               # false if date is approximate

location: Near FSB Fontaine, Long Khanh Province, RVN

units:
  primary:
    - slug: d-co-2-8-cav
      name: D Company, 2nd Battalion, 8th Cavalry (Airmobile)
      role: Conducting reconnaissance; engaged
  supporting:
    - name: Direct Support Artillery
      role: Fire support during engagement

platoons:
  - name: Range Platoon
    role: Lead element; ambushed on north bank
  - name: Cat Platoon
    role: South bank; fire support and medevac coordination

casualties:                    # ONLY soldiers who were hurt
  kia:
    - slug: cardwell-james
      name: CPL James Melvin Cardwell
      date: 1971-04-20
      note: Walking point; killed by Chicom mine blast
  dow:
    - slug: sargent-stan
      name: PFC Stanton Gerald Sargent
      date_wounded: 1971-04-20
      date_of_death: 1971-04-21
      note: Died of wounds April 21
  wia:
    - slug: dillon-stan
      name: SSG Stan Dillon
      note: Multiple wounds; carried across stream by Collins
  wia_count_note: >            # use when total WIA exceeds named individuals
    Approximately 15 WIA total; only named individuals confirmed from sources

contains:                      # confirmed present, NOT in casualties
  - slug: neal-bill
    note: Company commander; south bank throughout
  - slug: davis-kirk
    note: Range Platoon soldier; confirmed in his own account
  - slug: cate-larry
    note: Cat Platoon; confirmed present in Neal's account

tagged:                        # implied present; unconfirmed individually
  - slug: mcgrew-harold
    note: Range Platoon member; calendar corroborates unit presence

citations:
  - slug: hall-joseph
    award: unknown
    status: unconfirmed        # unconfirmed | confirmed | declined
    note: Actions consistent with valor citation; no documentation found

related_events:
  - slug: crash-fsb-fontaine-1971-04-24
    relationship: causal       # causal | operational | commemorative
    note: FSB renamed Fanning after pilot killed in crash four days later

open_questions:
  - id: oq-01
    publish: true              # true = public contribution prompt on event page
    question: >
      Hall, Collins, and Schneck performed actions that multiple accounts
      describe in terms consistent with valor citations. No award documentation
      has been found. If you know what awards were issued for April 20, 1971,
      please contact us.
  - id: oq-02
    publish: false             # false = private research todo for archivist
    question: >
      Can the ambush site be mapped? Check 1971 topographic maps at NARA.

archivist_notes:               # admin-only; never rendered publicly
  created: 2026-05-11
  session: 16
  sources:
    - 20Apr71_Cap_Neal_Deposition.docx
    - 20Apr71_Stan_Dillon_Deposition.docx
---

## Summary

Narrative prose — verifiable facts only. One to three paragraphs.

## Context and Contested Details

Prose — honest framing of what is disputed, uncertain, or requires
source criticism. Not rendered as a warning; rendered as an invitation
to engage with the primary sources.
```

---

## Documents

**Path:** `site/documents/[soldier-slug]/[doc-slug]/[doc-slug].md`
or `site/documents/unit/[doc-slug]/[doc-slug].md`

**Folder rule:**
- `documents/[soldier-slug]/` — authored by that soldier, in their own voice
  (depositions, essays, personal accounts). The soldier is the author.
- `documents/unit/` — not authored by any individual soldier: press clippings,
  official records, newsletters, external database records, anything where
  the unit or event is the subject rather than a person's voice.

**Slug convention:** `authorslug-type-YYYYMMDD` (day `00` if unknown)

```yaml
---
layout: layouts/document.njk
slug: davis-kirk-essay-19710600
title: "30 Minutes Later"
type: verbal               # verbal | account | incident-record | artifact
author: davis-kirk
date: 1971-06-00           # YYYY-MM-DD; day 00 if unknown
date_known: false
source: "Walking Point, Issue 18, January 2013"
status: draft              # draft | published | redacted
event: contact-fsb-fontaine-1971-04-20
contains:                  # soldiers explicitly named in the document
  - guidara-frank
  - martin-mike
  - neal-bill
tagged: []                 # soldiers implied by context
files: []                  # binary files in the same folder (scans, PDFs)
permalink: /documents/davis-kirk/davis-kirk-essay-19710600/
---
Transcription or document body here.
```

---

## Anecdotes

**Path:** `site/anecdotes/[soldier-slug]/[anecdote-slug]/index.md`

**Note:** `soldiers:` is retired. Use `contains:` and `tagged:` instead.

```yaml
---
layout: layouts/anecdote.njk
archive_id: MDM-ANECDOTE-CLAYMORE
slug: claymore-incident
title: The Claymore Incident
type: anecdote             # anecdote | testimony | recollection
summary: "One-sentence teaser shown on the profile card."
date: 1971-00-00           # YYYY-MM-DD; month and day 00 if unknown
date_known: false
source_short: "Larry Cate · Capt. William Neal"
event: ""                  # event slug if applicable; empty string if none
contains:                  # soldiers explicitly present in the anecdote
  - miller-marvin-dale
  - cate-larry
tagged: []                 # soldiers implied by context
status: draft              # draft | published
permalink: /anecdotes/miller-marvin-dale/claymore-incident/
---
Narrative body here.
```

---

## Photos

**Path:** `site/soldiers/[soldier-slug]/photos/[subfolder]/index.md`

**Subfolders:** `profile/` | `field/` | `field/events/`

**Note:** Photo metadata migrates OUT of soldier profile front matter into
these index files. Do not add new photos to the soldier profile `photos:` array.
Upload scripts to be rewritten clean against this structure — do not patch
existing scripts.

```yaml
---
soldier: miller-marvin-dale
subfolder: field/events
photos:
  - filename: 042471-hueycrash3.jpg
    caption: >
      Wreckage of the Huey that crashed at FSB Fontaine, April 24, 1971.
      Veterans who reviewed this photograph believe Marvin was among the
      first people on scene.
    caption_short: Huey wreckage — FSB Fontaine, April 24, 1971
    credit: "Photographed by Marvin D. Miller · April 24, 1971"
    date: 1971-04-24
    date_known: true
    event: crash-fsb-fontaine-1971-04-24
    contains:              # soldiers visible in the frame
      - colburn-richard
    tagged:                # soldiers likely present but not visible
      - fanning-martin

  - filename: 042471-hueycrash4.jpg
    caption: Recovery of the downed Huey.
    caption_short: Huey recovery — FSB Fontaine, April 24, 1971
    credit: "Photographed by Marvin D. Miller · April 24, 1971"
    date: 1971-04-24
    date_known: true
    event: crash-fsb-fontaine-1971-04-24
    contains: []
    tagged:
      - fanning-martin
---
```

---

## Letters

**Path:** `site/letters/[soldier-slug]/[letter-slug]/index.md`

**Note:** Letters are one file per letter. `contains:` and `tagged:` go
directly in the front matter — no separate metadata file needed.
Letters currently contain no named soldiers; fields are present for
future-proofing and consistency.

```yaml
---
layout: layouts/letter.njk
archive_id: MDM-LETTER-19710522
slug: letter-19710522
title: "Letter Home — 22 May 1971"
date: 1971-05-22
date_known: true
recipient: "His mother"
event: ""                  # event slug if letter references a specific event
contains: []               # soldiers explicitly named in the letter
tagged: []                 # soldiers implied by context
status: draft              # draft | published
permalink: /letters/miller-marvin-dale/letter-19710522/
---
Transcription body here.
```

---

## Cross-Reference Field Summary

| Field | Events | Documents | Anecdotes | Photos | Letters |
|---|---|---|---|---|---|
| `casualties:` | ✓ KIA/DOW/WIA only | — | — | — | — |
| `contains:` | ✓ confirmed present, unhurt | ✓ named in text | ✓ named in story | ✓ visible in frame | ✓ named in letter |
| `tagged:` | ✓ implied present | ✓ implied connection | ✓ implied connection | ✓ likely in frame | ✓ implied connection |
| `event:` | — (IS the event) | ✓ | ✓ | ✓ | ✓ |
| `date` + `date_known` | ✓ | ✓ | ✓ | ✓ per photo | ✓ |
| `status:` | ✓ | ✓ | ✓ | — | ✓ |

---

## Status Vocabulary

| Value | Meaning | Used on |
|---|---|---|
| `draft` | Created, not yet published | Events, Documents, Anecdotes, Letters |
| `published` | Live on the public site | Events, Documents, Anecdotes, Letters |
| `redacted` | Exists in repo, never renders publicly | Documents |

---

## Soldier Status Vocabulary

| Value | Meaning |
|---|---|
| `veteran` | Living, confirmed served |
| `deceased` | Died post-service |
| `kia` | Killed in action |
| `researching` | Name on record, nothing more |

All values lowercase. Consistent across profile front matter and `roster.json`.

---

## Date Conventions

- Format: `YYYY-MM-DD` throughout
- Unknown month: `YYYY-00-DD` → use `1971-00-00` for year-only
- Unknown day: `YYYY-MM-00` → use `1971-04-00` for month-only
- Always pair with `date_known: true/false`
- YAML parses bare years as integers — always quote year-only values: `"1971"`

---

## Slug Conventions

| Content type | Pattern | Example |
|---|---|---|
| Event | `type-location-YYYY-MM-DD` | `contact-fsb-fontaine-1971-04-20` |
| Soldier | `lastname-firstname` | `miller-marvin-dale` |
| Document | `authorslug-type-YYYYMMDD` | `davis-kirk-essay-19710600` |
| Anecdote | descriptive kebab-case | `claymore-incident` |
| Letter | `letter-YYYYMMDD` | `letter-19710522` |

---

## Search Index

The site uses Lunr.js for client-side full-text search with wildcard and
fuzzy fallback (`query*` then `query~1`). This handles misspellings like
"Fontain" for "Fontaine" automatically.

**`contains:` and `tagged:` are the primary source fields for the search index.**
Every soldier slug that appears in either field across any content type must be
resolvable to a name the index can return. Populating these fields correctly is
what makes a soldier findable across the archive — not just on their own profile.

The search index (`search-index.json`) is built at crawl time by inverting
`contains:` and `tagged:` arrays across all content. Every content type
contributes records to the same flat index with these core fields:

| Index field | Source | Boost |
|---|---|---|
| `name` | Soldier name / event title / location name | 10 |
| `last_name` | Soldier last name | 8 |
| `nickname` | Soldier nickname | 8 |
| `platoon` | Platoon name (Range, Cat, Skull…) | 4 |
| `location` | `location:` field on events and photos | 4 |
| `rank` | Soldier rank | 2 |
| `mos` | Military occupational specialty | 2 |
| `hometown` | Soldier hometown | 2 |
| `excerpt` | Summary or timeline text | 1 |

Result sections on the search page correspond to content types. The "Verbal
Accounts" and "Locations & Firebases" sections are already stubbed in the
template as coming soon — they activate when those content types contribute
records to the index.

**Do not add location search as a separate mechanism.** Location search works
through the same Lunr index once events and photos have a `location:` field
with consistent values. "FSB Fontaine," "Fontain," and "Fontaine" all resolve
correctly through fuzzy matching.

---

## Implementation Sequence

Data standardization must be complete before anything is rebuilt or rewired.
This is the correct order:

**Phase 1 — Standardize existing data** *(before touching any code)*
1. Update 3 anecdotes: retire `soldiers:`, add `contains:` and `tagged:`
2. Create photo `index.md` files for all of Marvin's photo subfolders;
   migrate metadata out of soldier profile `photos:` array
3. Add `event:` to existing documents where currently empty
4. Verify `contains:` and `tagged:` on existing documents are accurate

**Phase 2 — Rebuild the index builder**
- Rewrite `search-index.json` generation to walk all content types
- Events, documents, anecdotes, photos, letters all contribute records
- Keyed consistently on slug; grouped by content type for result rendering

**Phase 3 — Rewrite upload scripts**
- Rewrite photo upload script clean against `index.md` structure
- Do not patch existing scripts — full rewrite only

**Phase 4 — Build the crawler**
- Walks all content types using standardized fields
- Resolves `contains:`, `tagged:`, and `event:` cross-references
- Produces data files Eleventy templates consume
- Builds `search-index.json` as a byproduct

**Phase 5 — Rebuild templates**
- Soldier profiles pull photo data from crawler output, not profile `photos:` array
- Event pages assemble linked document cards via `event:` field lookup
- Search results render all content types from unified index

---

## What This Document Supersedes

- `soldiers:` field on anecdotes → replaced by `contains:` + `tagged:`
- Photo metadata in soldier profile `photos:` array → replaced by per-subfolder `index.md`
- `primary_event:` on documents → standardized to `event:`
- `contributor_slug:` on early documents → folder structure now carries attribution
