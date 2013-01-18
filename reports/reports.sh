#!/bin/bash
#pass in $DIR when you call this so you can be sure its executed from the root trbiutary directory
#i.e. DIR=~/code/tributary reports.sh
cd $DIR
node reports/aggregators/visitsByGist.js
node reports/aggregators/inletsByUser.js
