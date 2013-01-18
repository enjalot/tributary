#!/bin/bash
NOW=$(date +"%Y-%m-%d-%H:%M")
mongodump --db tributary --out NOW
