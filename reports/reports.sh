#!/bin/bash
#TODO: make it so you can pass in $DIR when you call this so you can be sure its executed from the root trbiutary directory
#i.e. DIR=~/code/tributary reports.sh
DIR=/home/ubuntu/tributary
(
cd $DIR
/usr/local/bin/node reports/aggregators/visitsByGist.js
/usr/local/bin/node reports/aggregators/inletsByUser.js
) 2>&1 | tee -a "$DIR/reports.log"
