#!/bin/bash
(
NOW=$(date +"%Y-%m-%d-%H:%M")
OUT=/home/ubuntu/backup
mongodump --db tributary --out "$OUT/$NOW"
) 2>&1 | tee -a "$OUT/backup.log"
