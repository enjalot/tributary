#!/bin/bash
NOW=$(date +"%Y-%m-%d-%H:%M")
mongobackup --db tributary --out NOW
