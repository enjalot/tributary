# Reporting

## Aggregation

Aggregation scripts are found in the aggregators directory.
These use mongo mapreduce and update records in the database using mongoskin.   

You can run all aggregators with this bash script: (be sure to provide a DIR
unless you run it from the root tributary directory
```DIR=/path/to/tributary /path/to/tributary/reports/reports.sh```

## Cron

reports.cron can be used to setup a cronjob for running aggregates and backups regularly  
set it up like:  
```crontab reports/reports.cron```

## Migrations

When we want to record data in mongo that we weren't recording before, or change the data structure
you can write a script to update the existing data in a migration  

You probably want to backup the database before doing any migration  
```./backup.sh```
