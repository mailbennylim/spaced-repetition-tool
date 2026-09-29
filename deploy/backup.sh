#!/bin/bash
# Nightly SQLite backup (docs/build-plan.md Phase 7). Keeps 30 days.
# Install: crontab -e  →  15 3 * * * /Users/benny/Documents/Work__no-gdrive/spaced-repetition-tool/deploy/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
sqlite3 prisma/dev.db ".backup 'backups/reader-$STAMP.db'"
tar -czf "backups/uploads-$STAMP.tgz" -C public uploads 2>/dev/null || true
find backups -name 'reader-*.db' -mtime +30 -delete
find backups -name 'uploads-*.tgz' -mtime +30 -delete
echo "backup ok $STAMP"
