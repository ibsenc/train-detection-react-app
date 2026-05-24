#!/usr/bin/env bash
set -euo pipefail

BUCKET="train-detection-ui-833495381683-us-west-2-an"
DEPLOY_DIR="deployments"

# Guard: abort if there are uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: uncommitted changes detected. Commit or stash them before deploying."
  exit 1
fi

# Guard: abort if not on main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "Error: you are on branch '$BRANCH', not 'main'. Switch to main before deploying."
  exit 1
fi

SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
ARCHIVE="$DEPLOY_DIR/$TIMESTAMP"

echo "Branch: $BRANCH | SHA: $SHA"
echo ""

echo "Building..."
npm run build

echo "Deploying to s3://$BUCKET..."
aws s3 sync dist/ "s3://$BUCKET" --delete --profile train-detection-deploy

echo "Archiving deployed build to $ARCHIVE/..."
mkdir -p "$ARCHIVE"
cp -r dist/. "$ARCHIVE/"

# TODO: Local-only archives — if this machine is lost, rollback history is gone.
# Consider syncing archives to a separate S3 bucket (e.g. s3://train-detection-ui-backups/)
# so rollbacks are available from any machine:
#   aws s3 sync "$ARCHIVE/" "s3://train-detection-ui-backups/$TIMESTAMP/" --delete

echo ""
echo "Done. Deployed $SHA, archived at $ARCHIVE/"
echo "To roll back to this build later: aws s3 sync $ARCHIVE/ s3://$BUCKET --delete"
