#!/bin/bash
OUT=/home/ubuntu/backup
(
NOW=$(date +"%Y-%m-%d-%H:%M")
mongodump --db tributary --out "$OUT/$NOW"
) 2>&1 | tee -a "$OUT/backup.log"
