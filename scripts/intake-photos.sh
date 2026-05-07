#!/usr/bin/env bash
# intake-photos.sh
# Uploads soldier photos from repo to R2, syncs changes, appends new entries to front matter.
#
# Usage: ./scripts/intake-photos.sh --slug <soldier-slug> [--remote] [--dry-run]
#
# Behavior per file:
#   - Not in R2 yet         → upload, append front matter entry (or set profile_photo)
#   - In R2, file unchanged → skip
#   - In R2, file changed   → overwrite in R2, front matter entry untouched
#   - profile/ subfolder    → sets profile_photo field (warns if multiple found)
#
# NOTE: If you rename a photo after it has been uploaded, remove the old entry
# from the photos: array in front matter manually. The script cannot detect renames.
#
# Requires: wrangler (authenticated), md5sum
# Run from repo root.

set -euo pipefail

# ── DEFAULTS ────────────────────────────────────────────────────────────────
DRY_RUN=false
REMOTE=false
SLUG=""
SOLDIERS_DIR="site/soldiers"
PHOTOS_BUCKET="angryskipperarchive-photos"

# ── COLORS ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

# ── HELPERS ─────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[intake-photos]${NC} $*"; }
success() { echo -e "${GREEN}[intake-photos]${NC} $*"; }
warn()    { echo -e "${YELLOW}[intake-photos]${NC} $*"; }
skip()    { echo -e "${GRAY}[intake-photos]${NC} $*"; }
error()   { echo -e "${RED}[intake-photos]${NC} $*" >&2; }

usage() {
  cat <<EOF
Usage: $(basename "$0") --slug <soldier-slug> [OPTIONS]

Upload soldier photos from repo to R2 and update front matter.

Options:
  --slug      Soldier slug, e.g. miller-marvin-dale (required)
  --remote    Actually upload to R2 (default: dry run simulation)
  --dry-run   Explicit dry run — print what would happen, write nothing
  --help      Show this help

Examples:
  ./scripts/intake-photos.sh --slug miller-marvin-dale --dry-run
  ./scripts/intake-photos.sh --slug miller-marvin-dale --remote
EOF
  exit 0
}

# ── ARG PARSING ─────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug)    SLUG="$2";    shift 2 ;;
    --remote)  REMOTE=true;  shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help)    usage ;;
    *) error "Unknown option: $1"; usage ;;
  esac
done

# Default to dry run unless --remote is passed
if [[ "$REMOTE" == false ]]; then
  DRY_RUN=true
fi

# ── VALIDATION ───────────────────────────────────────────────────────────────
if [[ -z "$SLUG" ]]; then
  error "--slug is required."
  exit 1
fi

SOLDIER_DIR="${SOLDIERS_DIR}/${SLUG}"
SOLDIER_FILE="${SOLDIER_DIR}/${SLUG}.md"
PHOTOS_DIR="${SOLDIER_DIR}/photos"

if [[ ! -d "$SOLDIER_DIR" ]]; then
  error "Soldier directory not found: ${SOLDIER_DIR}"
  exit 1
fi

if [[ ! -f "$SOLDIER_FILE" ]]; then
  error "Soldier file not found: ${SOLDIER_FILE}"
  exit 1
fi

if [[ ! -d "$PHOTOS_DIR" ]]; then
  error "Photos directory not found: ${PHOTOS_DIR}"
  exit 1
fi

# ── COLLECT PHOTO FILES ──────────────────────────────────────────────────────
# Find all image files, excluding .gitkeep
mapfile -t PHOTO_FILES < <(find "$PHOTOS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | sort)

if [[ ${#PHOTO_FILES[@]} -eq 0 ]]; then
  warn "No photo files found in ${PHOTOS_DIR}"
  exit 0
fi

info "Found ${#PHOTO_FILES[@]} photo file(s) for ${SLUG}"
[[ "$DRY_RUN" == true ]] && warn "DRY RUN — nothing will be uploaded or written."
echo ""

# ── COUNTERS ─────────────────────────────────────────────────────────────────
UPLOADED=0
OVERWRITTEN=0
SKIPPED=0
APPENDED=0
PROFILE_SET=""
PROFILE_EXTRAS=()

# ── READ EXISTING FRONT MATTER ───────────────────────────────────────────────
# Extract filenames already in the photos: array
existing_photo_filenames() {
  grep -E '^\s+filename:' "$SOLDIER_FILE" | sed 's/.*filename:\s*//' | tr -d '"' | tr -d "'" || true
}

# Get current profile_photo value
current_profile_photo() {
  grep -E '^profile_photo:' "$SOLDIER_FILE" | sed 's/profile_photo:\s*//' | tr -d '"' | tr -d "'" | xargs || true
}

# ── R2 KEY BUILDER ───────────────────────────────────────────────────────────
# photos bucket key: soldiers/[slug]/[subfolder]/[filename]
# subfolder is derived from the path relative to photos/
r2_key_for_file() {
  local filepath="$1"
  local rel="${filepath#${PHOTOS_DIR}/}"   # strip photos/ prefix → e.g. field/events/foo.jpg
  echo "soldiers/${SLUG}/${rel}"
}

subfolder_for_file() {
  local filepath="$1"
  local rel="${filepath#${PHOTOS_DIR}/}"   # e.g. field/events/foo.jpg or profile/foo.jpg
  local dir
  dir="$(dirname "$rel")"                  # e.g. field/events or profile
  echo "$dir"
}

filename_for_file() {
  basename "$1"
}

# ── MD5 HELPER ───────────────────────────────────────────────────────────────
local_md5() {
  md5sum "$1" | cut -d' ' -f1
}

# ── R2 ETAG CHECK ────────────────────────────────────────────────────────────
# Returns the etag (md5) of an existing R2 object, or empty string if not found
r2_etag() {
  local key="$1"
  if [[ "$REMOTE" == true ]]; then
    wrangler r2 object get "$PHOTOS_BUCKET/$key" --remote 2>/dev/null | \
      grep -i 'etag' | sed 's/.*etag[: ]*//' | tr -d '"' | xargs || echo ""
  else
    echo ""
  fi
}

# ── PROFILE PHOTO DETECTION ───────────────────────────────────────────────────
# Collect all profile/ photos first so we can warn on multiples
mapfile -t PROFILE_FILES < <(find "${PHOTOS_DIR}/profile" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | sort)

if [[ ${#PROFILE_FILES[@]} -gt 1 ]]; then
  warn "Multiple files found in photos/profile/ — will use first, extras listed below:"
  for f in "${PROFILE_FILES[@]:1}"; do
    warn "  Extra: $(basename "$f")"
    PROFILE_EXTRAS+=("$(basename "$f")")
  done
fi

# ── FRONT MATTER APPEND HELPER ───────────────────────────────────────────────
# Appends a new photo entry to the photos: block in the soldier .md file
append_photo_entry() {
  local filename="$1"
  local subfolder="$2"

  # Build the YAML entry
  local entry
  entry="  - filename: ${filename}
    subfolder: ${subfolder}
    caption: >
      Caption pending.
    caption_short: Caption pending
    credit: \"Contributor unknown\""

  # Insert before the closing --- of the front matter
  # Find the photos: key and append after the last entry, before documents:
  python3 - "$SOLDIER_FILE" "$entry" <<'PYEOF'
import sys, re

filepath = sys.argv[1]
new_entry = sys.argv[2]

with open(filepath, 'r') as f:
    content = f.read()

# Find the photos: block and append before the documents: section
# We look for the line starting with "# ── DOCUMENTS" and insert before it
marker = "# ── DOCUMENTS"
if marker in content:
    content = content.replace(marker, new_entry + "\n\n" + marker, 1)
else:
    # Fallback: append before closing ---
    content = content.rstrip()
    if content.endswith("---"):
        content = content[:-3] + new_entry + "\n---\n"
    else:
        content += "\n" + new_entry + "\n"

with open(filepath, 'w') as f:
    f.write(content)

print("appended")
PYEOF
}

# ── SET PROFILE PHOTO HELPER ─────────────────────────────────────────────────
set_profile_photo() {
  local filename="$1"
  python3 - "$SOLDIER_FILE" "$filename" <<'PYEOF'
import sys, re

filepath = sys.argv[1]
filename = sys.argv[2]

with open(filepath, 'r') as f:
    content = f.read()

# Replace profile_photo: (empty or existing value)
content = re.sub(r'^profile_photo:.*$', f'profile_photo: {filename}', content, flags=re.MULTILINE)

with open(filepath, 'w') as f:
    f.write(content)

print("set")
PYEOF
}

# ── MAIN LOOP ────────────────────────────────────────────────────────────────
EXISTING_FILENAMES="$(existing_photo_filenames)"
CURRENT_PROFILE="$(current_profile_photo)"

for FILEPATH in "${PHOTO_FILES[@]}"; do
  FILENAME="$(filename_for_file "$FILEPATH")"
  SUBFOLDER="$(subfolder_for_file "$FILEPATH")"
  R2_KEY="$(r2_key_for_file "$FILEPATH")"
  IS_PROFILE=false

  [[ "$SUBFOLDER" == "profile" ]] && IS_PROFILE=true

  # ── CHANGE DETECTION ──────────────────────────────────────────────────────
  ACTION="upload"  # default

  if [[ "$REMOTE" == true ]]; then
    REMOTE_ETAG="$(r2_etag "$R2_KEY")"
    if [[ -n "$REMOTE_ETAG" ]]; then
      LOCAL_MD5="$(local_md5 "$FILEPATH")"
      if [[ "$LOCAL_MD5" == "$REMOTE_ETAG" ]]; then
        ACTION="skip"
      else
        ACTION="overwrite"
      fi
    fi
  fi

  # ── DRY RUN OUTPUT ────────────────────────────────────────────────────────
  if [[ "$DRY_RUN" == true ]]; then
    if [[ "$IS_PROFILE" == true ]]; then
      info "  [profile]   ${FILENAME} → R2: ${R2_KEY}"
      [[ "$CURRENT_PROFILE" == "$FILENAME" ]] && \
        skip "              profile_photo already set to ${FILENAME} — no change" || \
        info "              Would set profile_photo: ${FILENAME}"
    else
      ALREADY_IN_FM=false
      echo "$EXISTING_FILENAMES" | grep -qx "$FILENAME" && ALREADY_IN_FM=true
      if [[ "$ALREADY_IN_FM" == true ]]; then
        skip "  [skip fm]   ${FILENAME} already in photos: array"
      else
        info "  [append]    ${FILENAME} → would append to photos: array (subfolder: ${SUBFOLDER})"
      fi
      info "              R2: ${R2_KEY}"
    fi
    continue
  fi

  # ── LIVE RUN ──────────────────────────────────────────────────────────────
  case "$ACTION" in
    skip)
      skip "  [skip]      ${FILENAME} — unchanged in R2"
      ((SKIPPED++)) || true
      ;;

    upload|overwrite)
      if [[ "$ACTION" == "overwrite" ]]; then
        warn "  [overwrite] ${FILENAME} — changed, re-uploading"
      else
        info "  [upload]    ${FILENAME} → ${R2_KEY}"
      fi

      wrangler r2 object put "${PHOTOS_BUCKET}/${R2_KEY}" \
        --file "$FILEPATH" \
        --remote 2>/dev/null

      if [[ "$ACTION" == "upload" ]]; then
        ((UPLOADED++)) || true
      else
        ((OVERWRITTEN++)) || true
      fi

      # ── FRONT MATTER UPDATE ─────────────────────────────────────────────
      if [[ "$IS_PROFILE" == true ]]; then
        if [[ "$CURRENT_PROFILE" != "$FILENAME" ]]; then
          set_profile_photo "$FILENAME"
          PROFILE_SET="$FILENAME"
          success "              profile_photo set to ${FILENAME}"
        else
          skip "              profile_photo already set — no change"
        fi
      else
        # Only append if not already in front matter
        if echo "$EXISTING_FILENAMES" | grep -qx "$FILENAME"; then
          skip "              Already in photos: array — front matter untouched"
        else
          append_photo_entry "$FILENAME" "$SUBFOLDER"
          ((APPENDED++)) || true
          success "              Appended to photos: array"
        fi
      fi
      ;;
  esac

done

# ── SUMMARY ──────────────────────────────────────────────────────────────────
echo ""
if [[ "$DRY_RUN" == true ]]; then
  warn "Dry run complete — run with --remote to execute."
else
  info "Done."
  [[ $UPLOADED -gt 0 ]]    && success "  Uploaded:    ${UPLOADED}"
  [[ $OVERWRITTEN -gt 0 ]] && success "  Overwritten: ${OVERWRITTEN}"
  [[ $SKIPPED -gt 0 ]]     && skip    "  Skipped:     ${SKIPPED}"
  [[ $APPENDED -gt 0 ]]    && success "  FM appended: ${APPENDED}"
  [[ -n "$PROFILE_SET" ]]  && success "  Profile set: ${PROFILE_SET}"

  if [[ ${#PROFILE_EXTRAS[@]} -gt 0 ]]; then
    echo ""
    warn "Action needed — extra files in photos/profile/ (only first was used):"
    for f in "${PROFILE_EXTRAS[@]}"; do
      warn "  ${f}"
    done
  fi

  echo ""
  info "Next steps:"
  echo "  1. Verify photos in R2 Cloudflare dashboard"
  echo "  2. Fill in captions, credits in ${SOLDIER_FILE}"
  echo "  3. git add ${SOLDIER_FILE} && git commit"
  echo "  4. Run cleanup-photos.sh when ready to remove from repo"
fi
