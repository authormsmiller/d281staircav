#!/usr/bin/env bash
# cleanup-photos.sh
# Removes photos from repo after they have been uploaded to R2.
# Destroys the photos/ directory tree and recreates empty structure with .gitkeep files.
#
# Usage: ./scripts/cleanup-photos.sh --slug <soldier-slug> [--confirm]
#
# Run from repo root.
# Only run after verifying photos are live in R2.

set -euo pipefail

# ── DEFAULTS ────────────────────────────────────────────────────────────────
SLUG=""
CONFIRMED=false
SOLDIERS_DIR="site/soldiers"

# ── COLORS ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── HELPERS ─────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[cleanup-photos]${NC} $*"; }
success() { echo -e "${GREEN}[cleanup-photos]${NC} $*"; }
warn()    { echo -e "${YELLOW}[cleanup-photos]${NC} $*"; }
error()   { echo -e "${RED}[cleanup-photos]${NC} $*" >&2; }

usage() {
  cat <<EOF
Usage: $(basename "$0") --slug <soldier-slug> [--confirm]

Remove photos from repo after R2 upload. Destroys photos/ tree and
recreates empty profile/ and field/ folders with .gitkeep files.

Only run after verifying photos are live and correct in R2.

Options:
  --slug      Soldier slug, e.g. weaver-ken (required)
  --confirm   Actually delete (default: dry run)
  --help      Show this help

Examples:
  ./scripts/cleanup-photos.sh --slug weaver-ken
  ./scripts/cleanup-photos.sh --slug weaver-ken --confirm
EOF
  exit 0
}

# ── ARG PARSING ─────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug)    SLUG="$2";      shift 2 ;;
    --confirm) CONFIRMED=true; shift ;;
    --help)    usage ;;
    *) error "Unknown option: $1"; usage ;;
  esac
done

# ── VALIDATION ───────────────────────────────────────────────────────────────
if [[ -z "$SLUG" ]]; then
  error "--slug is required."
  exit 1
fi

SOLDIER_DIR="${SOLDIERS_DIR}/${SLUG}"
PHOTOS_DIR="${SOLDIER_DIR}/photos"

if [[ ! -d "$SOLDIER_DIR" ]]; then
  error "Soldier directory not found: ${SOLDIER_DIR}"
  exit 1
fi

if [[ ! -d "$PHOTOS_DIR" ]]; then
  error "Photos directory not found: ${PHOTOS_DIR}"
  exit 1
fi

# ── COUNT PHOTOS ─────────────────────────────────────────────────────────────
mapfile -t PHOTO_FILES < <(find "$PHOTOS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | sort)
PHOTO_COUNT=${#PHOTO_FILES[@]}

# ── DRY RUN ──────────────────────────────────────────────────────────────────
if [[ "$CONFIRMED" == false ]]; then
  warn "DRY RUN — nothing will be deleted. Pass --confirm to execute."
  echo ""
  info "Soldier: ${SLUG}"
  info "Photos directory: ${PHOTOS_DIR}"
  echo ""

  if [[ $PHOTO_COUNT -eq 0 ]]; then
    info "No photo files found — directory may already be clean."
  else
    info "Would delete ${PHOTO_COUNT} photo file(s):"
    for f in "${PHOTO_FILES[@]}"; do
      echo "  ${f}"
    done
  fi

  echo ""
  info "Would then recreate:"
  echo "  ${PHOTOS_DIR}/profile/.gitkeep"
  echo "  ${PHOTOS_DIR}/field/.gitkeep"
  echo ""
  warn "Verify photos are live in R2 before running with --confirm."
  exit 0
fi

# ── LIVE RUN ─────────────────────────────────────────────────────────────────
info "Cleaning photos for: ${SLUG}"
echo ""

if [[ $PHOTO_COUNT -eq 0 ]]; then
  info "No photo files found — directory may already be clean."
else
  info "Removing ${PHOTO_COUNT} photo file(s)..."
  for f in "${PHOTO_FILES[@]}"; do
    rm "$f"
    echo "  deleted: ${f}"
  done
fi

# Remove any empty subdirectories left behind
find "$PHOTOS_DIR" -type d -empty -not -path "$PHOTOS_DIR" -delete 2>/dev/null || true

# Destroy and recreate clean structure
rm -rf "$PHOTOS_DIR"
mkdir -p "${PHOTOS_DIR}/profile"
mkdir -p "${PHOTOS_DIR}/field"
touch "${PHOTOS_DIR}/profile/.gitkeep"
touch "${PHOTOS_DIR}/field/.gitkeep"

echo ""
success "Done."
success "  Removed: ${PHOTO_COUNT} photo(s)"
success "  Recreated: ${PHOTOS_DIR}/profile/.gitkeep"
success "  Recreated: ${PHOTOS_DIR}/field/.gitkeep"
echo ""
info "Next steps:"
echo "  1. git add ${SOLDIER_DIR}/photos && git commit -m \"chore: remove photos from repo after R2 intake (${SLUG})\""
