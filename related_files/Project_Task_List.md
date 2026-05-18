# D/2-8 Cav Archive Project — Task List
## Organized by Phase · Daily-Sized Tasks

*Updated April 2026 · Each task should take 15–45 minutes*

---

## How to Use This List

Work through phases in order. Phase 0 is time-sensitive and should be done before anything else — it protects content that could disappear at any time. Phase 1 builds the foundation everything else depends on. Don't start Phase 3 until Phase 1 is substantially complete. Mark tasks done as you go — the act of checking something off matters.

**A "daily task" means:** one item, start to finish, in a single sitting. If a task feels too big, it's two tasks.

---

## Phase 0 — Rescue & Preserve
*These tasks protect content that is at risk of disappearing. Do them before anything else.*

**Why this comes first:** Jim's Weebly site could lapse if a payment fails. The Angry Skipper Association site is maintained by volunteers in their late 70s. Content on both sites is not backed up anywhere and would be permanently lost if either site went down. This phase takes a few hours total and protects decades of work.

### 0A · Archive Jim Garvin's Weebly Site (~1 hour)

- [ ] **Download all Then & Now photos from jimgarvin.org.** Go to the Then & Now page, right-click and save each image, OR use a free tool like HTTrack Website Copier (httrack.com) to mirror the entire site automatically. Save to `/archive/jimgarvin-site/`. These ~300 photos are the core of what becomes the site roster.

- [ ] **Save all other pages from jimgarvin.org** — the FSB pages (Powder Ridge, Guinn, Silver, Fontaine, Fanning, Mace), the Never Forgotten pages (Drinkard, Waterman, Makowski, Colburn), the Vietnam photos, the reunion pages. HTTrack will do all of this in one pass. Each page may contain photos and context not found anywhere else.

- [ ] **Note Jim's current Weebly login credentials** — ask Jim (or whoever manages the site) to write down the login email and password and keep it somewhere safe. If Jim is incapacitated, no one else can access or update the site.

---

### 0B · Archive the Angry Skipper Association Site (~2 hours)

- [ ] **Download all 40 newsletters** from angryskipperassociation.org/angry_skipper_association_newsletters.htm. Save the original PDFs to `/archive/asa-newsletters/pdfs/`. The text-extracted markdown stubs are already in `/newsletters/` — now you need the original PDFs as backup.

- [ ] **Save the Vietnam Photos pages** — the Association site has photo galleries from different eras (1966-67, 1969-70, Firebase Melanie 1971, etc.) that may overlap with or complement Jim's collection. Save to `/archive/asa-site/vietnam-photos/`.

- [ ] **Save the Honor Roll pages** — the D 2/8 Honor Roll pages list KIA soldiers with Wall panel locations. Save to `/archive/asa-site/honor-roll/`.

- [ ] **Save the After Action Reports page** — the site lists links to related veteran resources. Save to `/archive/asa-site/`.

- [ ] **Save the Active Members page** — this may contain contact information or roster data not in Jim's version. Save to `/archive/asa-site/`.

---

### 0C · Contact Texas Tech Vietnam Center and Archive (~30 minutes)

- [ ] **Email the Vietnam Center and Archive at Texas Tech** — see the draft email below. Do this early because their response will shape decisions about how you build and what you contribute. Their URL is vietnam.ttu.edu and their reference email is vva@ttu.edu.

- [ ] **After receiving their response**, add a note to this task list summarizing what they said and any follow-up actions.

---

### 0D · Contact the National Archives (~20 minutes)

- [ ] **Submit a History Hub inquiry to NARA** at historyhub.history.gov — ask specifically: what boxes in Record Group 472 contain 2/8 Cav records for 1971, and are daily journals for April 1971 available? This is a free service and staff typically respond within a week.

- [ ] **After receiving their response**, add a note summarizing what records exist and how to request copies.

---

## Phase 1 — Foundation
*Get your materials organized before building anything*

### 1A · Personal Archive (Do These First)

- [ ] **Create a folder structure on your computer** for the project — use the structure from the Git repo design: `/soldiers/miller-marvin/`, `/events/`, `/media/clippings/`, `/unit-history/`. This takes 10 minutes and makes everything else easier.

- [ ] **Move all photos you currently have digitally** into `/soldiers/miller-marvin/photos/`. Don't rename them yet — just get them in one place.

- [ ] **Locate the roster spreadsheet** Jim gave you (the source of the Cat Platoon data). Put a copy in `/roster/raw/` — untouched. The cleaned version we built goes in `/roster/`.

- [ ] **Scan or photograph the letters** — even with a phone camera app (Apple's built-in scanner, Adobe Scan, or Microsoft Lens all work). Aim for 5 letters per sitting. Don't transcribe yet — just get digital copies into `/soldiers/miller-marvin/letters/`.

- [ ] **Locate your father's DD-214** and scan it if not already done. Put the unredacted original in a secure location (not the project folder). Create a redacted version (black out SSN and service number) for the project folder.

- [ ] **Gather the documents already shared in this project** — the Neal deposition, Dillon deposition, Garvin account, the dud article, the Weaver email — and save them into `/events/19710420-contact-fsb-fanning/` and `/events/19710424-huey-crash/`. You already have digital versions from this conversation.

- [ ] **Write down the anecdotes you remember** about your father's service — even rough notes. Don't edit, just capture. These are irreplaceable and exist only in your memory right now. Put them in `/soldiers/miller-marvin/family-notes.md`.

---

### 1B · Git Repository Setup (One-Time, ~30 Minutes)

- [ ] **Create a free GitHub account** if you don't have one — github.com. Use a personal email you'll always have access to.

- [ ] **Create a new private repository** called `d28-cav-archive`. Private keeps contact information secure.

- [ ] **Set up the folder structure** in the repo — you can do this through GitHub's web interface without any command line. Create a README.md file explaining what the project is.

- [ ] **Invite 1–2 trusted people** as collaborators on the repository (future admins — whoever you decide should have backup access).

- [ ] **Upload your first batch of files** — start with the cleaned spreadsheet and the prototype HTML pages from this project.

---

### 1C · Proof-of-Concept Presentation Prep (~1 Hour Total)

- [ ] **Review the four prototype pages** we built (profile, roster, unit history, event page) and note any corrections or changes you want before showing Jim.

- [ ] **Write a one-page summary** of what the rebuilt site would be — in plain language Jim can read. Cover: what it is, why it matters, what you need from him (his blessing, access to his existing photos, contact for his admin login to Weebly).

- [ ] **Schedule a time to show Jim** the prototypes. In person is better than a phone call for this. The pages work in any browser — you can show them on a laptop or tablet.

---

## Phase 2 — Contact Research
*Work through the roster systematically — one or two people per day*

### 2A · High-Priority Living Contacts (Do These Soon)

- [ ] **Email Stan Dillon** at gaildillon@wowway.com — introduce yourself as Marvin Miller's son, reference the deposition he provided to Capt. Neal, ask if he'd be willing to talk. Short, respectful, no pressure.

- [ ] **Call or write Larry Fishell** — (989) 281-1122 — your father's RTO. You've spoken briefly. Schedule a proper conversation. Prepare 5–6 questions in advance.

- [ ] **Write to John Steelman** at 1824 County Road 362, Jones Creek TX 77437 — reference the email he sent Ken Weaver in October 2002. He was a witness to April 20.

- [ ] **Call Wayne Robinson** — find a current number via Washington County UT property records before attempting contact. He was your father's squad leader in April 1971.

- [ ] **Check in with Ken Weaver** — he's your most active source. Ask specifically: do you know if Wayne Robinson is still in Santa Clara? Do you have any contact for Stan Dillon?

---

### 2B · Obituary Search Continuation (2–3 names per sitting)

Remaining 26 names — work through in this order (small towns first, easiest to resolve):

**Batch 1 — Small towns, quick results:**
- [ ] Albert J. Snyder — Flinton, PA (tiny town, Armstrong County)
- [ ] Jim Bedsole — Barnesville, GA
- [ ] George Bassford — Buckhannon, WV
- [ ] William Schofield — Lockhart, AL

**Batch 2 — Medium cities:**
- [ ] Gus T. Angelos — Salt Lake City, UT
- [ ] Mark Bieberich — Odenton, MD
- [ ] Charles Stevens — Markham, IL
- [ ] Jerome Peszynski — Carpentersville, IL

**Batch 3 — Remaining:**
- [ ] Kenneth Hensley — Woodland, CA
- [ ] Kyle Lockhart — Santa Maria, CA
- [ ] Kirby Smith — Cameron Park, CA
- [ ] Bradford Smith — Sun Lake, AZ
- [ ] William Lyons — Somerset, NJ
- [ ] Theodre Hryniw — Linden, NJ
- [ ] James Green — Feasterville Trevose, PA
- [ ] Victor E. Dewey — Elyria, OH (revisit — search Lorain County specifically)
- [ ] Jimmy J. Johnson — South Thomaston, ME (search penbaypilot.com directly)
- [ ] Steven M. Dyer — Wentzville, MO
- [ ] Lynn Murray — Dandridge, TN
- [ ] Aaron Turnbull III — Oklahoma City, OK
- [ ] Eugene Jenkins LT — Gaithersburg, MD
- [ ] Wayne Robinson — Santa Clara, UT
- [ ] Joseph M. Kint — Davenport, IA
- [ ] John Fults "Peanut" — Rock Island, TN
- [ ] John S. Blair — Cape Coral, FL

---

### 2C · Outreach to Identified Contacts (After Obituary Search Complete)

For everyone confirmed living with an email or phone on file:

- [ ] Draft a standard outreach letter/email template — one version for veterans, one for family members of deceased veterans. Use Ken Weaver's response as the model for what a good connection looks like.

- [ ] Send outreach to Rick Aulenback (email on file)
- [ ] Send outreach to Mark Burchett (email on file)
- [ ] Send outreach to Carl Buttermore (email on file)
- [ ] Send outreach to Steven Dyer (email on file)
- [ ] Send outreach to Joseph Kint (email on file — prior no response, try again)
- [ ] Send outreach to Lynn Murray (email on file — prior no response, try again)
- [ ] Send outreach to John Blair (email on file)
- [ ] Send outreach to Bradford Smith (email on file)
- [ ] Send outreach to Kirby Smith (email on file)
- [ ] Send outreach to Richard David (email on file)
- [ ] Send outreach to Larry Randt (already confirmed — ask specifically about April 1971)

---

## Phase 3 — Historical Documentation
*Build out the unit history and your father's profile*

### 3A · Your Father's Profile (Your Personal Priority)

- [ ] **Transcribe one letter per sitting** — start with the earliest (December 1970) and work forward chronologically. Even rough transcriptions are valuable. Save as `/soldiers/miller-marvin/letters/letter-YYYYMMDD-transcription.md`.

- [ ] **Write the family narrative** — a 3–5 paragraph personal account of what you know about your father, how he came to serve, and what you've learned through this research. This is your voice on his profile page and belongs there.

- [ ] **Caption all photographs** — go through the photos one sitting at a time. For each: who is in it, who took it, approximate date, location if known, and source. The ones Ken Weaver and Larry Randt identified have notes you can draw from.

- [ ] **Request your father's full military records** from the National Personnel Records Center (nprc.archives.gov). As next of kin you're entitled to them. This may fill gaps the DD-214 leaves open and may confirm the Bronze Star citation.

- [ ] **Check the VVMF Wall of Faces** for Cardwell, Drinkard, and Hall — see if family members have left tributes that include contact information. These are the three KIA from April 20.

---

### 3B · Unit History Documents

- [ ] **Type up the April 20 event summary** — a clean 3–4 paragraph synthesis drawing from Neal, Dillon, and Garvin, with the source notice language we drafted. Save to `/events/19710420-contact-fsb-fanning/event-summary.md`.

- [ ] **Type up the April 24 crash event summary** — same format, incorporating the Wall of Faces findings on Fanning and Jeffries. Save to `/events/19710424-huey-crash/event-summary.md`.

- [ ] **Clean up the movement timeline document** you already compiled — it's mostly done, just needs a pass for formatting consistency. Save as `/unit-history/timeline-dec70-dec71.md`.

- [ ] **Email the Vietnam Center and Archive at Texas Tech** (vva@ttu.edu) — ask specifically whether they hold any 2/8 Cav records for 1971, and whether the movement timeline document you've compiled would be of interest to them as a donation.

- [ ] **Submit a History Hub inquiry to NARA** (historyhub.history.gov) — ask which boxes in RG 472 contain 2/8 Cav records for 1971 and whether daily journals for April 1971 are available.

---

### 3C · Photo Digitization

- [ ] **Scan the first 10 physical photographs** — prioritize the ones that are most fragile or have written notes on the back. Use 600 DPI minimum.

- [ ] **Organize the Google Drive archive** — the Vietnam-Share folder you shared with the unit. Create subfolders by subject: portraits, FSB/locations, operations, group shots, contributed-by-others.

- [ ] **Contact a local library or historical society** about professional scanning — many offer free or low-cost digitization services for veteran materials. Armstrong County, PA (your father's home county) likely has one.

---

## Phase 4 — Site Build
*Don't start until Phase 1 is complete and Phase 3 is well underway*

### 4A · Platform Decision (One Conversation)

- [ ] **Decide on the tech stack** — discuss with whoever will help build the site. The recommendation from this project: Airtable (database) + GitHub Pages (hosting) + Eleventy (site generator) + Cloudinary (media). All free to start.

- [ ] **Identify a developer or technical helper** — this doesn't need to be a professional. A technically inclined family member, a local college student, or a veteran's organization with web volunteers could work.

- [ ] **Transfer Jim's Weebly photos** — download all ~300 existing Then & Now photos from the Weebly site before doing anything else. These could disappear if Weebly is ever cancelled.

---

### 4B · Database Setup

- [ ] **Create an Airtable account** (free) and set up the base using the data model document from this project.

- [ ] **Import the Cat Platoon spreadsheet** as the first table — this seeds the Soldiers table with real data immediately.

- [ ] **Create the Events table** and enter the April 20 and April 24 events as the first records — these are the most documented events you have.

- [ ] **Link the first media records** — attach the Huey crash photos to the April 24 event record and to your father's soldier record.

---

### 4C · Public Site

- [ ] **Set up GitHub Pages** for the site — the four prototype HTML pages we built can go live immediately as a static preview site. No database connection needed at this stage.

- [ ] **Show the live preview to Jim** — a real URL is more convincing than a local file. Even a rough preview at a GitHub Pages URL demonstrates the vision concretely.

- [ ] **Register or transfer the domain** Jim owns to point at GitHub Pages.

- [ ] **Wire the site to Airtable** — this is the developer task, connecting the static pages to live data.

---

## Phase 5 — Ongoing (No End Date)
*These are recurring tasks, not one-time items*

- [ ] **One letter transcription per week** until all letters are done
- [ ] **One contact follow-up per week** working through the roster
- [ ] **One obituary search batch per month** to catch recent deaths
- [ ] **One unit history event entry per month** as new information comes in
- [ ] **Check in with Ken Weaver quarterly** — he's your most active living source
- [ ] **Annual review of admin access** — ensure at least 2 people have full access to everything

---

## The Three Things That Matter Most Right Now

If the list feels overwhelming, ignore everything except these three:

**1. Write down your memories and anecdotes about your father.** These exist only in your head. Everything else can be rebuilt; these cannot.

**2. Email Stan Dillon.** He's the highest-value uncontacted source. He was there on April 20, he nearly died, he wrote it all down, and no one has reached him yet.

**3. Download all the Weebly photos.** Before the site is changed or cancelled, preserve what already exists. This is a 20-minute task and protects years of Jim's work.

Everything else follows from these three.

---

*Document version 1.0 — April 2026*
*Maintained as part of D/2-8 Cav archive project*
