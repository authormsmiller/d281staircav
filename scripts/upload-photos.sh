#!/bin/bash
# Upload all soldier photos to R2
# Strips site/soldiers/[slug]/photos/ → soldiers/[slug]/
# Run from repo root: bash scripts/upload-photos.sh

BUCKET="angryskipperarchive-photos"
SOURCE="/workspaces/D28FirstAirCav/site/soldiers"

echo "Starting photo upload to $BUCKET..."
echo ""

SUCCESS=0
FAIL=0
SKIP=0

find "$SOURCE" -type f \( \
  -name "*.jpg" -o \
  -name "*.jpeg" -o \
  -name "*.png" -o \
  -name "*.gif" -o \
  -name "*.webp" \
\) | while read -r filepath; do

  # Strip source prefix to get relative path
  # e.g. /workspaces/.../site/soldiers/romani-val/photos/profile/val_romani2.jpg
  # → romani-val/photos/profile/val_romani2.jpg
  relative="${filepath#$SOURCE/}"

  # Strip the /photos/ segment
  # romani-val/photos/profile/val_romani2.jpg → romani-val/profile/val_romani2.jpg
  key="soldiers/${relative/\/photos\//\/}"

  echo "Uploading: $key"

  npx wrangler r2 object put "$BUCKET/$key" --file "$filepath" --remote 2>&1

  if [ $? -eq 0 ]; then
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✘ FAILED: $key"
    FAIL=$((FAIL + 1))
  fi

done

echo ""
echo "Done."
