#!/bin/bash
# Deploy ParQlet static landing page to GCP Cloud Storage
# Usage: ./scripts/deploy-static.sh [bucket-name]
# Example: ./scripts/deploy-static.sh gs://parqlet-landing
set -e

BUCKET="${1:-}"
DIST_DIR="./dist"

if [ -z "$BUCKET" ]; then
    echo "Usage: $0 <bucket-name>"
    echo "Example: $0 gs://parqlet-landing"
    exit 1
fi

if [ ! -d "$DIST_DIR" ]; then
    echo "Error: dist/ directory not found. Run your build first."
    exit 1
fi

echo "=== Deploying to $BUCKET ==="

# Create bucket if it doesn't exist
if ! gsutil ls "$BUCKET" &>/dev/null; then
    echo "Creating bucket..."
    gsutil mb "$BUCKET"
fi

# Sync dist/ to bucket (delete files no longer present locally)
echo "Uploading files..."
gsutil -m rsync -r -d "$DIST_DIR" "$BUCKET"

# Make bucket publicly readable
echo "Setting public access..."
gsutil iam ch allUsers:objectViewer "$BUCKET"

# Set cache headers
echo "Setting cache headers..."
# HTML files: no-cache
find "$DIST_DIR" -name "*.html" | while read -r f; do
    gsutil -h "Cache-Control:no-cache" cp "$f" "$BUCKET/"
done

# Images & CSS: 1 year cache (immutable via content-addressed filenames)
find "$DIST_DIR/images" "$DIST_DIR/styles.css" "$DIST_DIR/main.js" 2>/dev/null | while read -r f; do
    gsutil -h "Cache-Control:public,max-age=31536000,immutable" cp "$f" "$BUCKET/"
done

echo ""
echo "=== Deploy complete ==="
echo "Public URL: https://storage.googleapis.com/${BUCKET#gs://}/index.html"
