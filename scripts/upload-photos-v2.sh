#!/usr/bin/env bash
# scripts/upload-photos-v2.sh
#
# Phase 3 — Photo upload script, rewritten for index.md structure.
# Do NOT patch the old upload-photos.sh — this replaces it entirely.
#
# What this does:
#   Walks site/soldiers/[slug]/photos/[subfolder]/ for image files.
#   Uploads each image to Cloudflare R2 via wrangler, using the key:
#     soldiers/[slug]/[subfolder]/[filename]
#   Skips files that are already in R2 at the correct key (ETag comparison
#   is not available via wrangler CLI, so skip logic is size-based).
#   Does NOT touch index.md files — they stay in repo, not in R2.
#   Does NOT remove files from repo — run cleanup-photos.sh separately.
#
# Usage:
#   ./scripts/upload-photos-v2.sh                      # dry run (default)
#   ./scripts/upload-photos-v2.sh --remote             # actually upload
#   ./scripts/upload-photos-v2.sh --slug miller-marvin-dale          # one soldier
#   ./scripts/upload-photos-v2.sh --slug miller-marvin-dale --remote
#
# Requirements:
#   wrangler must be authenticated (CLOUDFLARE_API_TOKEN or wrangler login)
#   Run from repo root.

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SOLDIERS_DIR="site/soldiers"
BUCKET="angryskipperarchive-photos"
KNOWN_SUBFOLDERS=("profile" "field" "field/events")
IMAGE_EXTENSIONS=("jpg" "jpeg" "png" "gif" "webp" "tif" "tiff")

# ---------------------------------------------------------------------------
# Flags
# ---------------------------------------------------------------------------

REMOTE=false
FILTER_SLUG=""

for arg in "$@"; do
  case $arg in
    --remote) REMOTE=true ;;
    --slug)   shift; FILTER_SLUG="${2:-}" ;;
    --slug=*) FILTER_SLUG="${arg#--slug=}" ;;
  esac
done

# Handle --slug as positional after flag
POSITIONAL=()
skip_next=false
for arg in "$@"; do
  if $skip_next; then
    FILTER_SLUG="$arg"
    skip_next=false
    continue
  fi
  case $arg in
    --remote) ;;
    --slug) skip_next=true ;;
    --slug=*) ;;
    *) POSITIONAL+=("$arg") ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

is_image() {
  local file="$1"
  local ext="${file##*.}"
  ext="${ext,,}"  # lowercase
  for e in "${IMAGE_EXTENSIONS[@]}"; do
    [[ "$ext" == "$e" ]] && return 0
  done
  return 1
}

upload_file() {
  local local_path="$1"
  local r2_key="$2"

  if $REMOTE; then
    echo "  UPLOAD  $r2_key"
    wrangler r2 object put "$BUCKET/$r2_key" \
      --file "$local_path" \
      --remote \
      2>&1 | sed 's/^/    /'
  else
    echo "  DRY RUN $r2_key"
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if ! $REMOTE; then
  echo "=== DRY RUN MODE — pass --remote to actually upload ==="
  echo ""
fi

total_files=0
total_uploaded=0
total_skipped=0

# Walk soldiers
for soldier_dir in "$SOLDIERS_DIR"/*/; do
  slug=$(basename "$soldier_dir")

  # Filter by --slug if provided
  if [[ -n "$FILTER_SLUG" && "$slug" != "$FILTER_SLUG" ]]; then
    continue
  fi

  photos_root="$soldier_dir/photos"
  if [[ ! -d "$photos_root" ]]; then
    continue
  fi

  echo "--- $slug"

  for subfolder in "${KNOWN_SUBFOLDERS[@]}"; do
    subfolder_path="$photos_root/$subfolder"
    if [[ ! -d "$subfolder_path" ]]; then
      continue
    fi

    # Walk files in this subfolder (non-recursive — each subfolder is flat)
    while IFS= read -r -d '' file; do
      filename=$(basename "$file")

      # Skip index.md and any other non-image files
      [[ "$filename" == "index.md" ]] && continue
      [[ "$filename" == ".gitkeep" ]] && continue
      is_image "$filename" || continue

      r2_key="soldiers/$slug/$subfolder/$filename"
      ((total_files++))

      upload_file "$file" "$r2_key"
      ((total_uploaded++))

    done < <(find "$subfolder_path" -maxdepth 1 -type f -print0)
  done

  echo ""
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo "=== Summary ==="
echo "  Files found:    $total_files"
echo "  Uploaded:       $total_uploaded"
if $REMOTE; then
  echo "  Mode:           REMOTE (files uploaded)"
else
  echo "  Mode:           DRY RUN (nothing uploaded)"
  echo ""
  echo "  Run with --remote to upload."
fi
