#!/bin/bash
# batch-scaffold-soldiers.sh
# Run from the repo root (same directory as site/)
# Calls scaffold-soldier.sh for each soldier stub needed.
#
# Excluded — already have full profiles:
#   miller-marvin-dale, cate-larry, davis-kirk, sells-leroy, romani-val, weaver-ken
# Excluded — pending source verification:
#   vollmar-tom (todo:true in event record)
#
# Usage:
#   bash scripts/batch-scaffold-soldiers.sh
#   bash scripts/batch-scaffold-soldiers.sh --dry-run

DRY_RUN=""
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN="true"
  echo "--- DRY RUN MODE — no files will be written ---"
  echo ""
fi

# run FIRST LAST MIDDLE RANK STATUS PLATOON
# Pass "" for any optional field you want to skip.
# Uses an array so quoted platoon strings ("Range Platoon") pass safely.
run() {
  local first="$1"
  local last="$2"
  local middle="$3"
  local rank="$4"
  local status="$5"
  local platoon="$6"

  local args=( --first "$first" --last "$last" )
  [[ -n "$middle" ]]  && args+=( --middle "$middle" )
  [[ -n "$rank" ]]    && args+=( --rank "$rank" )
  [[ -n "$status" ]]  && args+=( --status "$status" )
  [[ -n "$platoon" ]] && args+=( --platoon "$platoon" )
  [[ -n "$DRY_RUN" ]] && args+=( --dry-run )

  echo "-> ${last,,}-${first,,} ($status)"
  bash scripts/scaffold-soldier.sh "${args[@]}"
}

# ─────────────────────────────────────────────
# April 20, 1971 — Contact Near FSB Fontaine
# ─────────────────────────────────────────────
echo ""
echo "=== April 20, 1971 Contact ==="
echo ""

# KIA — walking point, killed by Chicom mine blast
run "James"   "Cardwell"  "Melvin"          "CPL"  "kia"         "Range Platoon"
# KIA — walking point, killed by Chicom mine blast
run "Danny"   "Drinkard"  "George"          "CPL"  "kia"         "Range Platoon"
# KIA — moved forward to assist Dillon; killed covering withdrawal
run "Joseph"  "Hall"      "Lindsey"         "CPL"  "kia"         "Range Platoon"
# DOW April 21 — stored as kia at soldier level; DOW distinction lives in event record
# First name "Stan" so slug = sargent-stan, matching event front matter
run "Stan"    "Sargent"   "Stanton Gerald"  "PFC"  "kia"         "Range Platoon"

# WIA — Range Platoon Sergeant; survived; gave formal deposition
run "Stan"    "Dillon"    ""                "SSG"  "veteran"     "Range Platoon"
# WIA — Range Six (platoon leader); last man to cross the stream
run "Bill"    "Bott"      ""                "LT"   "researching" "Range Platoon"
# WIA — M60 gunner; continued firing after being wounded
run "Steve"   "Schneck"   ""                ""     "researching" "Range Platoon"
# WIA — took over M60 from Schneck; carried Dillon across stream
run "Gary"    "Collins"   ""                "PFC"  "researching" "Range Platoon"
# Medic — treated Dillon at the stream crossing
run "Harvey"  "Brothers"  ""                ""     "researching" "Range Platoon"
# Squad leader — named in Davis account
run "Bill"    "Marr"      ""                ""     "researching" "Range Platoon"

# ─────────────────────────────────────────────
# April 24, 1971 — Huey Crash, FSB Fontaine
# ─────────────────────────────────────────────
echo ""
echo "=== April 24, 1971 Huey Crash ==="
echo ""

# KIA — Battalion Armor; bumped Garvin from the flight
run "Richard"  "Colburn"   ""  ""     "kia"         ""
# KIA — pilot, UH-1H 69-15692; FSB Fanning named after him
run "Martin"   "Fanning"   ""  "CPT"  "kia"         ""
# KIA — co-pilot
run "Gabriel"  "Jeffries"  ""  ""     "kia"         ""
# WIA — door gunner; survived; named in Garvin account
run "Nathan"   "Stanfield" ""  ""     "researching" ""

# ─────────────────────────────────────────────
# Chieu Hoi Event — approx. May 1971
# ─────────────────────────────────────────────
echo ""
echo "=== Chieu Hoi Event (approx. May 1971) ==="
echo ""

# Cat Platoon RTO; deceased; presence in photo confirms pre-Aug 1971 date
run "Denny"  "Alloway"  ""  ""  "deceased"    "Cat Platoon"
# Cat Platoon; identified in contemporary photo caption
run "Bill"   "Small"    ""  ""  "researching" "Cat Platoon"

# ─────────────────────────────────────────────
# October 21, 1971 — Contact, Nui Ba
# ─────────────────────────────────────────────
echo ""
echo "=== October 21, 1971 Contact ==="
echo ""

run "William"  "Makowski"  ""  ""  "kia"         "Range Platoon"
run "Doug"     "Hilts"     ""  ""  "researching" "Range Platoon"
# "Dizzy" is a nickname used as first name until given name is confirmed.
# Slug will be blais-dizzy — update when real name is found.
run "Dizzy"    "Blais"     ""  ""  "researching" "Range Platoon"

# ─────────────────────────────────────────────
# May 10, 1972 — Chinook Crash
# ─────────────────────────────────────────────
echo ""
echo "=== May 10, 1972 Chinook Crash ==="
echo ""

run "Ken"  "Rosenberg"  ""  ""  "kia"  ""

echo ""
echo "=== Done ==="
echo ""
echo "Soldiers excluded (already have full profiles):"
echo "  miller-marvin-dale, cate-larry, davis-kirk, sells-leroy, romani-val, weaver-ken"
echo ""
echo "Soldiers excluded (pending source verification):"
echo "  vollmar-tom — todo:true in event record, do not create until confirmed"
echo ""
echo "Note: blais-dizzy — 'Dizzy' used as first name; update slug when real name found."
echo "Note: sargent-stan — middle field holds full legal name 'Stanton Gerald'."