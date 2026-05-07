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

BUCKET="documents"
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
if len
