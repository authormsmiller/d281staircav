#!/usr/bin/env bash
# scaffold-soldier.sh
# Generates directory structure and front matter stub for a new soldier.
# Usage: ./scripts/scaffold-soldier.sh [OPTIONS]
# Run from repo root.

set -euo pipefail

# ── DEFAULTS ────────────────────────────────────────────────────────────────
DRY_RUN=false
SOLDIERS_DIR="site/soldiers"

# ── COLORS ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── HELPERS ─────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[scaffold]${NC} $*"; }
success() { echo -e "${GREEN}[scaffold]${NC} $*"; }
warn()    { echo -e "${YELLOW}[scaffold]${NC} $*"; }
error()   { echo -e "${RED}[scaffold]${NC} $*" >&2; }

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Scaffold a new soldier profile — directory structure and front matter stub.

Options:
  --first       First name (required)
  --last        Last name (required)
  --rank        Rank abbreviation, e.g. SGT, SP4, PFC (optional)
  --nick        Nickname (optional)
  --middle      Middle name (optional)
  --mos         MOS code, e.g. 11B (optional)
  --platoon     Platoon string, e.g. "Cat (Wild Cat) Platoon · 3rd" (optional)
  --status      veteran | deceased | kia | researching (default: researching)
  --dry-run     Print what would be created without writing anything
  --help        Show this help

Examples:
  ./scripts/scaffold-soldier.sh --first Ken --last Weaver --rank SGT --platoon "Cat Platoon · 3rd"
  ./scripts/scaffold-soldier.sh --first Jim --last Cardwell --rank PFC --status kia --dry-run
EOF
  exit 0
}

# ── ARG PARSING ─────────────────────────────────────────────────────────────
FIRST=""
LAST=""
RANK=""
NICK=""
MIDDLE=""
MOS=""
PLATOON=""
STATUS="researching"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --first)   FIRST="$2";   shift 2 ;;
    --last)    LAST="$2";    shift 2 ;;
    --rank)    RANK="$2";    shift 2 ;;
    --nick)    NICK="$2";    shift 2 ;;
    --middle)  MIDDLE="$2";  shift 2 ;;
    --mos)     MOS="$2";     shift 2 ;;
    --platoon) PLATOON="$2"; shift 2 ;;
    --status)  STATUS="$2";  shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help)    usage ;;
    *) error "Unknown option: $1"; usage ;;
  esac
done

# ── VALIDATION ───────────────────────────────────────────────────────────────
if [[ -z "$FIRST" || -z "$LAST" ]]; then
  error "--first and --last are required."
  exit 1
fi

case "$STATUS" in
  veteran|deceased|kia|researching) ;;
  *) error "Invalid --status '$STATUS'. Must be: veteran, deceased, kia, or researching."; exit 1 ;;
esac

# ── SLUG + TITLE ─────────────────────────────────────────────────────────────
# Slug: last-first, lowercase, spaces→hyphens
SLUG="$(echo "${LAST}-${FIRST}" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')"

# Title: RANK FIRST LAST (rank optional)
if [[ -n "$RANK" ]]; then
  TITLE="${RANK} ${FIRST} ${LAST}"
else
  TITLE="${FIRST} ${LAST}"
fi

BREADCRUMB="${FIRST} ${LAST}"

# ── PATHS ────────────────────────────────────────────────────────────────────
SOLDIER_DIR="${SOLDIERS_DIR}/${SLUG}"
SOLDIER_FILE="${SOLDIER_DIR}/${SLUG}.md"
PHOTOS_PROFILE_DIR="${SOLDIER_DIR}/photos/profile"
PHOTOS_FIELD_DIR="${SOLDIER_DIR}/photos/field"

# ── COLLISION CHECK ───────────────────────────────────────────────────────────
if [[ -d "$SOLDIER_DIR" ]]; then
  error "Directory already exists: ${SOLDIER_DIR}"
  error "If this is intentional, remove it first or edit the file manually."
  exit 1
fi

# ── FRONT MATTER BUILDER ──────────────────────────────────────────────────────
build_front_matter() {
  # Inline fields — emit value if set, empty if not
  local rank_val="${RANK:-}"
  local nick_val="${NICK:-}"
  local middle_val="${MIDDLE:-}"
  local mos_val="${MOS:-}"
  local platoon_val="${PLATOON:-}"

  # timeline_source default text
  local timeline_text="Service timeline not yet compiled. If you served with or knew ${FIRST} ${LAST}, please use the contribute form to share what you remember."

  # photo_intro default text
  local photo_intro_text="Photographs pending."

  cat <<YAML
---
layout: layouts/soldier.njk
title: ${TITLE}
slug: ${SLUG}
breadcrumb: ${BREADCRUMB}

# ── IDENTITY ──────────────────────────────────────
first_name: ${FIRST}
last_name: ${LAST}
nickname: ${nick_val}
middle_name: ${middle_val}
rank: ${rank_val}
mos: ${mos_val}
platoon: "${platoon_val}"

# ── SERVICE ───────────────────────────────────────
arrived:
departed:
hometown:
character_of_service: Honorable
status: ${STATUS}

# ── PROFILE PHOTO ─────────────────────────────────
profile_photo:

# ── DECORATIONS ───────────────────────────────────
decorations:

distinguished_decorations:

# ── FAMILY CONTACT ────────────────────────────────
family_contact: false

# ── TIMELINE SOURCE NOTE ──────────────────────────
timeline_source: >
  ${timeline_text}

# ── SERVICE TIMELINE ──────────────────────────────
timeline:

# ── PHOTOS ────────────────────────────────────────
photo_intro: >
  ${photo_intro_text}

wartime_content_notice: false

photos:

# ── DOCUMENTS ─────────────────────────────────────
documents:

# ── BROTHERS IN ARMS ──────────────────────────────
brothers:

---
YAML
}

# ── DRY RUN OUTPUT ───────────────────────────────────────────────────────────
if [[ "$DRY_RUN" == true ]]; then
  warn "DRY RUN — nothing will be written."
  echo ""
  info "Slug:        ${SLUG}"
  info "Title:       ${TITLE}"
  info "Status:      ${STATUS}"
  echo ""
  info "Would create:"
  echo "  ${SOLDIER_FILE}"
  echo "  ${PHOTOS_PROFILE_DIR}/.gitkeep"
  echo "  ${PHOTOS_FIELD_DIR}/.gitkeep"
  echo ""
  info "Front matter preview:"
  echo "──────────────────────────────────────────────"
  build_front_matter
  echo "──────────────────────────────────────────────"
  exit 0
fi

# ── WRITE FILES ───────────────────────────────────────────────────────────────
info "Scaffolding soldier: ${TITLE} (${SLUG})"

mkdir -p "$PHOTOS_PROFILE_DIR"
mkdir -p "$PHOTOS_FIELD_DIR"
touch "${PHOTOS_PROFILE_DIR}/.gitkeep"
touch "${PHOTOS_FIELD_DIR}/.gitkeep"

build_front_matter > "$SOLDIER_FILE"

echo ""
success "Created:"
echo "  ${SOLDIER_FILE}"
echo "  ${PHOTOS_PROFILE_DIR}/.gitkeep"
echo "  ${PHOTOS_FIELD_DIR}/.gitkeep"
echo ""
info "Next steps:"
echo "  1. Fill in front matter fields in ${SOLDIER_FILE}"
echo "  2. Add to site/_data/roster.json"
echo "  3. Run intake-photos.sh to upload photos to R2"
echo "  4. git add ${SOLDIER_DIR} && git commit"
