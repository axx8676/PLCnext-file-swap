#!/bin/bash

# This script starts the inotify watch to run Upload when a project is uploaded
{
    # output to log instead of terminal
    exec 1>>/opt/plcnext/logs/inotify.log

    while inotifywait -q -o /opt/plcnext/logs/inotify.log -e create /opt/plcnext/ ;
        do /opt/plcnext/Upload.sh;
    done
} & disown
