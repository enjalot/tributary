#!/bin/bash
BACKUP=/home/ubuntu/backup
OUT=/tmp
NOW=$(date +"%Y-%m-%d-%H_%M")
(
mongodump --db tributary --out "$OUT/$NOW"
) 2>&1 | tee -a "$OUT/backup.log"

TAR="$OUT/$NOW.tar.gz"
tar czvf "$TAR" "$OUT/$NOW"

coffee $BACKUP/s3.coffee --method upload -f $TAR -p "$NOW.tar.gz"

rm -rf "$OUT/$NOW"
rm -rf "$TAR"
