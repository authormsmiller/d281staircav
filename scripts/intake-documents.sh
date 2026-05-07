#!/usr/bin/env bash
# intake-documents.sh
# Upload soldier documents from repo to R2, update/create document front matter stubs.
#
# Usage:
#   ./intake-documents.sh [--remote] [--soldier <slug>]
#
# Default is dry run. Pass --remote to actually upload.
# Pass --soldier <slug> to process one soldier only.

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

BUCKET="documents"
SOLDIERS_DIR="site/soldiers"
DOCUMENTS_DIR="site/documents"
R2_PUBLIC_BASE="https://documents.your-r2-public-url.com"  # TODO: set real URL
DRY_RUN=true
FILTER_SLUG=""

# ── Args ──────────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)   DRY_RUN=false; shift ;;
    --soldier)  FILTER_SLUG="$2"; shift 2 ;;
    *)          echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if $DRY_RUN; then
  echo "── DRY RUN (pass --remote to upload) ──────────────────────────────────"
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

# Extract a scalar front matter value: get_fm_value "title" file.md
get_fm_value() {
  local key="$1" file="$2"
  grep "^${key}:" "$file" | head -1 | sed "s/^${key}:[[:space:]]*//"
}

# Check if a filename already exists in the files: array
fm_has_filename() {
  local filename="$1" file="$2"
  grep -A9999 "^files:" "$file" | grep "filename:" | sed 's/.*filename:[[:space:]]*//' | grep -qF "$filename"
}

# Append a file entry to the files: array in front matter
append_file_entry() {
  local filename="$1" file="$2"
  # Insert before the closing --- of front matter
  sed -i "/^---$/{ N; /---\n---/!{ P; d; }; }" "$file"  # no-op guard
  # Find last line of front matter and append before closing ---
  python3 - "$file" "$filename" <<'PYEOF'
import sys, re

path = sys.argv[1]
filename = sys.argv[2]

with open(path) as f:
    content = f.read()

# Split on front matter fences
parts = content.split('---')
if len(parts) < 3:
    print(f"ERROR: can't parse front matter in {path}", file=sys.stderr)
    sys.exit(1)

fm = parts[1]
body = '---'.join(parts[2:])

entry = f"\n  - filename: {filename}\n    caption: \"\"\n    credit: \"\""

if 'files:' in fm:
    # Append after the last existing file entry
    fm = fm.rstrip() + entry + '\n'
else:
    # Add the files: key
    fm = fm.rstrip() + f'\nfiles:{entry}\n'

with open(path, 'w') as f:
    f.write('---' + fm + '---' + body)

print(f"  → appended {filename} to files:")
PYEOF
}

# Build a stub document .md if one doesn't exist yet
create_stub() {
  local soldier_slug="$1" doc_slug="$2" filename="$3"
  local doc_dir="${DOCUMENTS_DIR}/${soldier_slug}/${doc_slug}"
  local doc_file="${doc_dir}/${doc_slug}.md"

  mkdir -p "$doc_dir"

  cat > "$doc_file" <<STUB
---
title: ""
author: ${soldier_slug}
type: ""
status: draft
files:
  - filename: ${filename}
    caption: ""
    credit: ""
transcript: ""
---
STUB

  echo "  → created stub: ${doc_file}"
}

# ── Main loop ─────────────────────────────────────────────────────────────────

shopt -s nullglob

for soldier_dir in "$SOLDIERS_DIR"/*/; do
  soldier_slug=$(basename "$soldier_dir")

  [[ -n "$FILTER_SLUG" && "$soldier_slug" != "$FILTER_SLUG" ]] && continue

  doc_repo_root="${soldier_dir}documents"
  [[ -d "$doc_repo_root" ]] || continue

  echo ""
  echo "── $soldier_slug ───────────────────────────────────────────────────────"

  for doc_slug_dir in "$doc_repo_root"/*/; do
    doc_slug=$(basename "$doc_slug_dir")
    doc_md="${DOCUMENTS_DIR}/${soldier_slug}/${doc_slug}/${doc_slug}.md"

    echo "  doc: $doc_slug"

    for filepath in "$doc_slug_dir"*; do
      [[ -f "$filepath" ]] || continue
      filename=$(basename "$filepath")

      r2_key="${soldier_slug}/${doc_slug}/${filename}"
      r2_full_key="documents/${r2_key}"

      echo "    file: $filename"

      # ── Upload ──────────────────────────────────────────────────────────────

      if $DRY_RUN; then
        echo "    [dry] would upload → $r2_full_key"
      else
        echo "    uploading → $r2_full_key"
        wrangler r2 object put "$BUCKET/$r2_key" \
          --file "$filepath" \
          --remote 2>&1 | tail -1
      fi

      # ── Stub / front matter ─────────────────────────────────────────────────

      if [[ ! -f "$doc_md" ]]; then
        if $DRY_RUN; then
          echo "    [dry] would create stub: $doc_md"
        else
          create_stub "$soldier_slug" "$doc_slug" "$filename"
        fi
      else
        if fm_has_filename "$filename" "$doc_md"; then
          echo "    → $filename already in front matter, skipping"
        else
          if $DRY_RUN; then
            echo "    [dry] would append $filename to files: in $doc_md"
          else
            append_file_entry "$filename" "$doc_md"
          fi
        fi
      fi
    done
  done
done

echo ""
if $DRY_RUN; then
  echo "── Dry run complete. Pass --remote to upload. ──────────────────────────"
else
  echo "── Intake complete. ────────────────────────────────────────────────────"
fi
