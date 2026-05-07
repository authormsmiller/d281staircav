#!/bin/bash
# Upload all document assets (images, PDFs) to R2
# Keeps markdown in repo — only uploads binary files
# Run from repo root: bash scripts/upload-documents.sh

BUCKET="angryskipperarchive-documents"
SOURCE="/workspaces/D28FirstAirCav/site/documents"

echo "Starting document upload to $BUCKET..."
echo ""

find "$SOURCE" -type f \( \
  -name "*.jpg" -o \
  -name "*.jpeg" -o \
  -name "*.png" -o \
  -name "*.gif" -o \
  -name "*.webp" -o \
  -name "*.pdf" \
\) | while read -r filepath; do

  relative="${filepath#$SOURCE/}"
  key="documents/$relative"

  echo "Uploading: $key"

  npx wrangler r2 object put "$BUCKET/$key" --file "$filepath" --remote 2>&1

  if [ $? -ne 0 ]; then
    echo "  ✘ FAILED: $key"
  fi

done

echo ""
echo "Done."
