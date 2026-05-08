#!/usr/bin/env bash
# intake-documents.sh
# Upload documents from repo to R2, update/create document front matter stubs.
#
# Usage:
#   ./intake-documents.sh [--remote] [--slug <slug>]
#
# Default is dry run. Pass --remote to actually upload.
# Pass --slug <slug> to process one top-level slug only (soldier slug or "unit").

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

BUCKET="angryskipperarchive-documents"
DOCUMENTS_DIR="site/documents"
DRY_RUN=true
FILTER_SLUG=""

# ── Args ──────────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote) DRY_RUN=false; shift ;;
    --slug)   FILTER_SLUG="$2"; shift 2 ;;
    *)        echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if $DRY_RUN; then
  echo "── DRY RUN (pass --remote to upload) ──────────────────────────────────"
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

fm_has_filename() {
  local filename="$1" file="$2"
  grep -A9999 "^files:" "$file" | grep "filename:" | sed 's/.*filename:[[:space:]]*//' | grep -qF "$filename"
}

append_file_entry() {
  local filename="$1" file="$2"
  python3 - "$file" "$filename" <<'PYEOF'
import sys

path = sys.argv[1]
filename = sys.argv[2]

with open(path) as f:
    content = f.read()

parts = content.split('---')
if len(parts) < 3:
    print(f"ERROR: can't parse front matter in {path}", file=sys.stderr)
    sys.exit(1)

fm = parts[1]
body = '---'.join(parts[2:])

entry = f"\n  - filename: {filename}\n    caption: \"\"\n    credit: \"\""

if 'files:' in fm:
    fm = fm.rstrip() + entry + '\n'
else:
    fm = fm.rstrip() + f'\nfiles:{entry}\n'

with open(path, 'w') as f:
    f.write('---' + fm + '---' + body)

print(f"  → appended {filename} to files:")
PYEOF
}

create_stub() {
  local top_slug="$1" doc_slug="$2" filename="$3"
  local doc_dir="${DOCUMENTS_DIR}/${top_slug}/${doc_slug}"
  local doc_file="${doc_dir}/${doc_slug}.md"

  mkdir -p "$doc_dir"

  # author: soldier slug when under a soldier folder; empty when under unit/
  local author=""
  if [[ "$top_slug" != "unit" ]]; then
    author="$top_slug"
  fi

  cat > "$doc_file" <<STUB
---
title: ""
type: ""
author: "${author}"
recipient: ""
event: ""
date: ""
date_known: true
source: ""
status: draft
contains: []
tagged: []
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

for top_slug_dir in "$DOCUMENTS_DIR"/*/; do
  top_slug=$(basename "$top_slug_dir")

  [[ -n "$FILTER_SLUG" && "$top_slug" != "$FILTER_SLUG" ]] && continue

  echo ""
  echo "── $top_slug ────────────────────────────────────────────────────────────"

  for doc_slug_dir in "$top_slug_dir"*/; do
    [[ -d "$doc_slug_dir" ]] || continue
    doc_slug=$(basename "$doc_slug_dir")
    doc_md="${top_slug_dir}${doc_slug}/${doc_slug}.md"

    echo "  doc: $doc_slug"

    for filepath in "$doc_slug_dir"*; do
      [[ -f "$filepath" ]] || continue
      filename=$(basename "$filepath")

      # Skip the .md stub itself if it's already in the doc folder
      [[ "$filename" == *.md ]] && continue

      r2_key="${top_slug}/${doc_slug}/${filename}"

      echo "    file: $filename"

      # ── Upload ──────────────────────────────────────────────────────────────

      if $DRY_RUN; then
        echo "    [dry] would upload → ${BUCKET}/${r2_key}"
      else
        echo "    uploading → ${BUCKET}/${r2_key}"
          npx wrangler r2 object put "${BUCKET}/${r2_key}" \
          --file "$filepath" \
          --remote 2>&1 | tail -1
      fi

      # ── Stub / front matter ─────────────────────────────────────────────────

      if [[ ! -f "$doc_md" ]]; then
        if $DRY_RUN; then
          echo "    [dry] would create stub: $doc_md"
        else
          create_stub "$top_slug" "$doc_slug" "$filename"
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