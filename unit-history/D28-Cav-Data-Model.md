# D/2-8 Cav — Angry Skipper Archive
## Data Model & System Design Document
### Version 1.0 — April 2026

---

## Purpose of This Document

This document describes how information is organized, stored, and connected across the D/2-8 Cav archive website. It is written in plain language for non-technical readers (site administrators, Jim Garvin, contributing veterans and families) as well as for the developer who will build the system.

Think of this document as the blueprint for the filing cabinet before anything gets filed.

---

## The Core Idea: Three Kinds of Records

Everything in the archive falls into one of three categories:

**People** — the soldiers who served in D/2-8 Delta Company and attached units.

**Events** — things that happened: battles, FSB movements, casualties, R&R periods, USO shows, and any other moment worth recording.

**Media** — photographs, letters, documents, newspaper clippings, audio, and video.

These three types of records are connected to each other. A photograph is connected to the people in it and to the event it depicts. An event is connected to all the soldiers whose service dates overlap with it. A soldier's profile draws from all three types simultaneously.

---

## Record Type 1: Soldier Profile

Each soldier has one profile record. This is the master record for everything known about that person.

### Fields

| Field | Description | Example | Source |
|---|---|---|---|
| **soldier_id** | Unique identifier, auto-generated | MM-1970-001 | System |
| **last_name** | Last name | Miller | Roster / DD-214 |
| **first_name** | First name | Marvin | Roster / DD-214 |
| **middle_name** | Middle name | Dale | DD-214 |
| **nickname** | Known nickname or callsign | — | Submitted |
| **rank_at_discharge** | Final rank | SGT (E-5) | DD-214 |
| **mos** | Military Occupational Specialty code and title | 11F40 — Recon | DD-214 |
| **service_start** | Date entered active service | 23 Mar 1970 | DD-214 |
| **service_end** | Date of discharge | 2 Dec 1971 | DD-214 |
| **rvn_start** | Date arrived in Vietnam | 4 Dec 1970 | DD-214 / Letters |
| **rvn_end** | Date departed Vietnam | 2 Dec 1971 | DD-214 / Letters |
| **unit_primary** | Primary unit designation | D/2-8 Cav, 1st Cav Div | DD-214 |
| **platoon** | Platoon assignment | Cat (Wild Cat — 3rd Plt) | Roster |
| **designation** | Special role if applicable | — | Roster |
| **status** | Living / Deceased / Unknown | Deceased | Family / Obituary |
| **deceased_date** | Date of death (if known) | 2004 | Family |
| **kia** | Killed in action during service | No | DD-214 / Records |
| **kia_date** | Date KIA (if applicable) | — | — |
| **home_of_record** | City and state at time of service | Kittanning, PA | DD-214 |
| **decorations** | Awards and medals | Bronze Star, CIB, VSM w/2 Stars | DD-214 |
| **character_of_service** | Discharge characterization | Honorable | DD-214 |
| **bio_notes** | Free-text biographical notes | Drew scaled model of FSB Fontaine for the Colonel | Compiled |
| **profile_visibility** | Public / Family-only / Admin-only | Public | Admin setting |
| **contact_preference** | How contact requests are handled | Screen through admin | Veteran / Family choice |
| **contact_name** | Name of contact (veteran or family) | [Son's name] | Submitted |
| **contact_email** | Email — never displayed publicly | [private] | Submitted |
| **contact_phone** | Phone — never displayed publicly | [private] | Submitted |
| **submitted_by** | Who created or verified this record | Family / Jim Garvin | Admin |
| **last_updated** | Date record was last modified | 2026-04-01 | System |
| **version** | Version number for revert capability | 3 | System |

### Privacy Rules for Soldier Records

- `contact_email`, `contact_phone`, and the unredacted DD-214 are **never displayed publicly**.
- Contact requests from the public go to the admin, who forwards them to the contact person on file. The public never sees contact details directly.
- `profile_visibility` can be set to **Family-only** (requires a password or login to view) or **Admin-only** (not visible to public at all) at the request of the veteran or their family.
- Deceased veterans default to **Public** unless a family member requests otherwise.

---

## Record Type 2: Event

Each event on the unit history timeline is one record. Events range from major combat actions to FSB movements to R&R periods.

### Fields

| Field | Description | Example | Source |
|---|---|---|---|
| **event_id** | Unique identifier | EVT-19710420 | System |
| **date** | Date of event (or start date if a range) | 20 Apr 1971 | Records / Letters |
| **date_end** | End date (for multi-day events) | 23 Apr 1971 | Records |
| **date_confidence** | How certain is the date? | Confirmed / Approximate / Unknown | Admin judgment |
| **title** | Short descriptive title | Contact North of FSB Fanning — 3 KIA | Admin |
| **event_type** | Category | Combat Action | Controlled list (see below) |
| **location_name** | Named location | North of FSB Fanning, Long Khanh Province | Records |
| **location_coordinates** | GPS coordinates if known | 10.9234° N, 107.2341° E | Research |
| **fsb_reference** | FSB involved, if any | FSB Fanning | Records |
| **summary** | 1–3 sentence plain-language summary | Delta Company made contact with NVA base camp... | Admin / Compiled |
| **narrative** | Full account(s) — can contain multiple perspectives | See accounts below | Various sources |
| **source_notice** | Warning displayed when multiple accounts conflict | "Multiple accounts exist. No single version is definitive." | Admin |
| **casualties_kia** | Names of soldiers killed | Cardwell, Drinkard, Hall | Records |
| **casualties_wia** | Names of soldiers wounded | Dillon, Schneck, Bott | Records |
| **is_disputed** | Are details of this event contested? | Yes | Admin flag |
| **submitted_by** | Who contributed information about this event | Family / Capt. Neal / Jim Garvin | Admin |
| **last_updated** | Date record was last modified | 2026-04-01 | System |

### Event Types (Controlled List)

These are the categories an event can be assigned. Using a fixed list makes filtering possible.

- Combat Action
- FSB Established
- FSB Dismantled / Stood Down
- FSB Movement (unit relocated)
- Casualty (non-combat)
- R&R Period
- USO / Morale Event
- Personnel Change (new commander, new arrivals, departures)
- Incident (crash, accident, dud rounds, etc.)
- Administrative
- Other / Undetermined

---

## Record Type 3: Media

Each photograph, letter, document, clipping, or other item is one media record. A media item can be connected to multiple soldiers and multiple events simultaneously.

### Fields

| Field | Description | Example | Source |
|---|---|---|---|
| **media_id** | Unique identifier | MED-MM-001 | System |
| **media_type** | Category of media | Photograph | Controlled list (see below) |
| **title** | Descriptive title | Huey crash wreckage, FSB Fontaine | Admin / Submitted |
| **filename** | Storage filename | 042471-hueycrash3.jpg | System |
| **date_created** | Date media was created | 24 Apr 1971 | Metadata / Submitted |
| **date_confidence** | How certain is the date? | Confirmed / Approximate / Unknown | Admin judgment |
| **creator** | Who created the item | Marvin Dale Miller | Submitted / Known |
| **creator_role** | Creator's relationship to the unit | Cat Platoon, D/2-8 Cav | Submitted |
| **submitted_by** | Who submitted this item to the archive | Son of Marvin Miller | System |
| **submission_date** | When it was submitted | 2025-01-15 | System |
| **caption** | Full descriptive caption | Wreckage of the Huey that crashed... | Admin |
| **attestations** | Notes from veterans verifying content | "Marvin was among first on scene" — D/2-8 veterans, 2024 | Submitted |
| **source_type** | How this was obtained | Family archive / Unit veteran / Public record | Submitted |
| **content_sensitive** | Flag for wartime imagery requiring notice | Yes / No | Admin |
| **status** | Pending / Approved / Rejected / Archived | Approved | Admin |
| **visibility** | Public / Family-only / Admin-only | Public | Admin |
| **redacted_version** | ID of redacted version if one exists | MED-MM-001R | System |
| **original_preserved** | Is the unredacted original stored securely? | Yes | System |
| **version** | Version number for revert capability | 1 | System |

### Media Types (Controlled List)

- Photograph (in-country)
- Photograph (reunion / post-service)
- Photograph (portrait / then-now composite)
- Letter (personal correspondence)
- Official Record (DD-214, orders, citations)
- Press Clipping
- Deposition / Personal Account
- Compiled Document (family-assembled timeline, etc.)
- Map
- Audio Recording
- Video Recording
- Other

---

## How Records Connect to Each Other

This is the relational layer — the connections that make a single archive item appear in multiple places across the site.

### Soldier ↔ Event: Service Window Overlap (Automatic)

Every event whose date falls within a soldier's `rvn_start` to `rvn_end` range is automatically associated with that soldier's timeline. No manual work required. A soldier who arrived in July 1971 will not appear on the April 20 event. A soldier who arrived in December 1970 will.

This automatic relationship is labeled on the profile as: **"Present during this period"**

### Soldier ↔ Event: Named Connection (Explicit)

When a soldier is specifically named in a document, appears in a photograph of the event, or submits a personal account, a stronger connection is created manually by an admin.

This explicit relationship carries a source: *"Named in SSgt Dillon's deposition"* or *"Photographed at crash site."*

This is labeled on the profile as: **"Documented involvement"**

### Soldier ↔ Media: Appears In

A photograph of three soldiers connects to all three of their profiles. One photo, three profile pages. The photo is stored once; it appears everywhere it belongs.

| Connection | Description |
|---|---|
| **appears_in** | This soldier is depicted in this media item |
| **created_by** | This soldier created this media item |
| **submitted_by** | This person (veteran or family) submitted this item |

### Event ↔ Media: Documents

A deposition, photograph, or clipping is connected to the event it documents.

| Connection | Description |
|---|---|
| **primary_source** | This media item is a direct account of the event |
| **visual_record** | This photograph depicts the event or its aftermath |
| **press_coverage** | This clipping is contemporary press coverage of the event |
| **supporting** | This item provides context but does not directly document the event |

---

## The Submission & Approval Workflow

This describes how new information gets into the system — from submission by a veteran, family member, or researcher through to publication on the site.

### Step 1: Submission

Anyone can submit via the public submission form. The form collects:

- Submitter name and email (required, not displayed publicly)
- What they are submitting: new information, a correction, a media item, or a contact request
- The soldier(s) the submission relates to
- The event(s) the submission relates to (if applicable)
- The content itself: text, file upload, or both
- A source statement: where does this information come from? (e.g., "Personal recollection," "My father's papers," "Newspaper clipping saved by Ken Weaver")
- Consent: confirmation that the submitter has the right to share this material

### Step 2: Staging

The submission arrives in the admin panel as a **Pending** record. It does not appear on the public site. The admin can see:

- What was submitted
- Who submitted it
- What it would change or add
- A side-by-side comparison with the existing record (if it is a correction)

### Step 3: Review

The admin reviews the submission. They can:

- **Approve** — the submission goes live. The prior version of the record is saved automatically.
- **Reject** — the submission is declined. The submitter receives a notification.
- **Request more information** — the admin sends a message to the submitter asking for clarification or additional sourcing.
- **Approve with edits** — the admin modifies the submission before publishing (e.g., correcting spelling, adding a source label).

### Step 4: Publication

Approved content appears on the site immediately. The prior version of the record is preserved in version history. Any admin can revert to a prior version with one click.

### Step 5: Notification

The submitter receives an email notification when their submission is approved or rejected. If approved, they receive a link to the published content.

---

## Admin Roles

Three levels of admin access are recommended to address the succession concern:

| Role | Permissions | Who Holds It |
|---|---|---|
| **Owner** | Full access, can add/remove admins, can delete records permanently | Jim Garvin (and designated successor) |
| **Editor** | Can approve/reject submissions, edit any record, manage media | Trusted deputies (2–3 people) |
| **Contributor** | Can submit content; submissions go to pending queue like any public submitter, but are flagged as trusted | Verified veterans and family members |

The Owner role should be held by at least two people at all times for succession continuity.

---

## Data Sources and Trust Hierarchy

Not all information is equally reliable. The site should label every piece of information by its source type, so readers can judge for themselves.

| Source Type | Description | Trust Level | Display Label |
|---|---|---|---|
| Official Record | DD-214, Army orders, citations | Highest — but can contain errors | "Official Record" |
| Formal Deposition | Written account by a named veteran, signed or attributed | High | "Personal Account — [Name], [Role]" |
| Personal Correspondence | Letters, diaries written at the time | High for dates/locations; subjective for events | "Contemporary Letter — [Author]" |
| Veteran Attestation | Oral or written recollection by a named veteran | Medium — subject to memory | "Recollection — [Name], verified [year]" |
| Family Compilation | Timeline or notes assembled by family from multiple sources | Medium — clearly secondary | "Compiled by family from [sources]" |
| Press Coverage | Contemporary newspaper or military publication | Medium — journalists had limited access | "Press Coverage — [Publication, date if known]" |
| Unattributed / Unknown | Source cannot be identified | Low | "Source unknown" |

When accounts conflict, both are preserved with their source labels. The site never suppresses a minority account in favor of a majority one. A note is displayed: *"Accounts of this event vary. The following versions are preserved as submitted. No single version is presented as definitive."*

---

## The Unit History Timeline

The timeline is the chronological spine of the site. It is generated automatically from all approved Event records, displayed in date order.

### Filtering

The timeline can be filtered by:

- **Date range** — show only a specific period
- **Event type** — show only combat actions, or only FSB movements, etc.
- **Location / FSB** — show only events at a named firebase
- **Soldier** — show only events connected to a specific person (their individual timeline)

### Individual Soldier Timeline

A soldier's profile page shows a filtered version of the master timeline: all events whose dates fall within their service window (automatic), plus any events where they have a documented connection (explicit). This is generated dynamically — it does not need to be manually assembled for each soldier.

---

## Seeding the Database: Getting Started

The database does not start empty. It is seeded from existing sources in this order:

### Phase 1: Roster Import

The existing roster spreadsheet (currently in disarray) is cleaned and imported as the initial set of Soldier records. Fields available: name, service years, platoon, address, phone (where present), SOC data. Address and phone are imported as admin-only fields immediately.

Known data quality issues to resolve during import:
- Service date spans may be inaccurate — flag these for review against DD-214s where available
- Some soldiers may appear under slightly different name spellings
- Platoon assignments may be missing for attached personnel

### Phase 2: Photo Migration

The ~300 existing Then & Now composite photos from Jim's Weebly site are downloaded and imported as Media records. Each photo's filename encodes the soldier's name (and sometimes platoon and year) — these filenames are parsed to auto-link photos to Soldier records. Photos marked `-rip` in their filename are flagged as KIA/deceased.

### Phase 3: Event Seeding

The unit history timeline is seeded from:
- The D/2-8 movement timeline compiled from Marvin Miller's letters (Dec 1970 – Dec 1971)
- Capt. Neal's deposition (April 20, 1971 contact)
- SSgt Dillon's deposition (April 20, 1971 contact)
- Jim Garvin's account of the April 24, 1971 Huey crash
- FSB pages on Jim's existing Weebly site
- The "Duds Hit Firebase" press clipping (FSB Fontaine, 1971)

### Phase 4: Media Linking

After Soldier and Event records exist, Media records are linked:
- Marvin Miller's photographs are imported and linked to his Soldier record and to the relevant Event records
- Ken Weaver's contributed photographs are imported and credited to him
- The newspaper clipping is linked to FSB Fontaine and to Ken Weaver as submitter

### Phase 5: Open Submission

The public submission form goes live. Veterans, families, and researchers can begin contributing.

---

## What the Database Does NOT Store (Public-Facing)

These items are collected for administrative purposes only and are never displayed on the public site:

- Full Social Security Numbers
- Service Numbers (may be partially displayed, e.g., last 4 digits only)
- Current home addresses
- Phone numbers
- Email addresses
- Unredacted DD-214 images
- Any information a veteran or family member has specifically requested be kept private

---

## Open Questions for Discussion

The following decisions have not yet been made and should be resolved before development begins:

1. **Platform choice** — What technology stack will the site be built on? Options include a headless CMS (Airtable, Notion) with a custom front end, a purpose-built web application, or a managed platform. Each has different cost, maintenance, and longevity implications.

2. **Hosting and domain** — The site should eventually move to a domain Jim owns. What is that domain? Who manages DNS and hosting?

3. **DD-214 display policy** — Should redacted DD-214 images ever be displayed publicly, or only the extracted key fields (rank, MOS, dates, decorations)?

4. **Letter transcription** — Will letters be transcribed for searchability and accessibility, or displayed as scanned images only? Transcription is labor-intensive but makes content searchable and readable on mobile.

5. **Coordination with the Vietnam Center and Archive at Texas Tech** — The archive at Texas Tech actively collects primary sources from Vietnam veterans. Should digital copies of letters and photographs be deposited there as a preservation backup?

6. **KIA family outreach** — For soldiers marked KIA, is there a plan to proactively reach out to families? Richard Colburn's sister was found through Jim's 2021 memorial. Are there others?

7. **Succession plan for the Owner admin role** — Who are the 2–3 people who will hold Editor access alongside Jim? This should be decided and documented before the site launches.

---

*Document compiled April 2026. Prepared in support of the D/2-8 Cav Angry Skipper archive rebuild project.*
