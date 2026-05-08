
D Co. 2/8 CAV Archive — Alumni Features Product Vision
Drafted Session 12 — May 8, 2026

The Core Idea
The archive is a living record, not a finished product. For the veterans and families it serves, that means two things must be true simultaneously: the material that exists today is meaningful and deliverable, and the material that surfaces tomorrow has a place to land.
Every feature in this section is designed with that tension in mind. Nothing should feel incomplete because the archive isn't finished. Everything should feel worth having today, with the understanding that it will only get richer.

Feature 1 — Build Your Album
Priority: First post-MVP upgrade
A veteran visits the archive and receives a pre-populated photo album of every image in which they appear — sourced automatically from contains: and tagged: matches on their soldier slug. They can then browse the full archive and add any additional photos that resonate: a friend's face, a firebase they recognize, a moment they were part of even if they aren't in the frame.
The result is a downloadable ZIP of full-resolution images, theirs to keep, print, or share.
Why this first:

Photo albums carry no completeness expectation. Nobody assumes an album is ever finished. A veteran receiving one understands implicitly that more photos may surface later — that's a feature, not a flaw.
The infrastructure is already being built. contains: and tagged: on every photo artifact, R2 storage, slug-keyed photo index — the album download is "connect the dots" work once those are in place.
It has immediate personal value for veterans whose own photos are gone. Larry Fishell lost nearly all of his photographs in a house fire. The archive may hold the only surviving images of his service. That album means something.

The engagement loop:
The album also brings veterans and families back to the site. Larry downloads his album today. A new photo is tagged next month. He comes back, downloads the updated version. That loop keeps the archive alive and growing in a way passive browsing does not.

Feature 2 — Your Full Archive Download
Priority: Post-album
An extension of the album concept — not just photos, but everything in the archive pertaining to a veteran: documents, letters, verbal accounts, event records they are tagged in. Packaged as a structured download, probably photos as a folder plus a PDF summary of their profile, timeline, and associated records.
Less urgent than the album because the content pipeline (letters, documents, event accounts) needs to be substantially built out first. The album works with what exists today; the full archive download needs the archive to be meaningfully populated.

Feature 3 — Print-Ready Book Export
Priority: Longer term — after content coverage is deep
The full vision: a veteran or family member downloads an epub of their service record — their timeline, their photos, their letters, their accounts, the unit events they were part of — composed into something that can be uploaded to Amazon KDP and printed as a physical book. A keepsake. A gift. A record that outlasts the website.
Scope tiers:

Personal book — one soldier's story, platoon context, key events from their service period
Platoon book — everyone who served in a platoon during a given window, one-page summary per soldier, shared events as narrative spine
Company book — full company across all platoons, requires substantially deeper archive coverage
Unit history — the entire company across the full war, 1965–72. A different kind of book — unit history with soldiers as characters. 5–10 year horizon depending on material.

Why not yet:
A book feels final in a way a photo album does not. Sending Larry a book, then receiving new material that belonged in it, creates a different kind of incompleteness than a photo album that keeps growing. The book should wait until coverage is deep enough that the gaps don't undermine the gift.
The exception:
Manual first editions — assembled by hand in InDesign or equivalent — remain an option for specific veterans where the human timeline is urgent. Larry Fishell's health is a known concern. A manually assembled book for Larry, and for Ken Weaver who has contributed significantly to the archive, does not require the automated pipeline and should not wait for it.

Infrastructure Dependencies
All three features are downstream of the same foundation being built now:

contains: and tagged: on every artifact type — photos, documents, anecdotes, event records
R2 storage for photos and documents
Slug-keyed dynamic data indexes (the crawler pattern established in Session 12)
Deep content coverage — profiles, letters, event accounts, verbal accounts

Nothing being built today forecloses any of these features. The foundation is right.

A Note on Larry
Larry Fishell has been identified as a priority recipient for both the album and the manual book. His health is a concern. His photos were lost in a house fire. The archive may hold the only surviving visual record of his service.
His profile should be treated as a content priority independent of the technical roadmap. Whatever can be built for Larry — album, manual book, a complete profile — should not wait for the automated pipeline if the window is narrowing.
