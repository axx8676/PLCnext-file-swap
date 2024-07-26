#!/bin/bash
{
    while inotifywait -e create /opt/plcnext/ ;
        do /opt/plcnext/Upload.sh;
    done
} & disown