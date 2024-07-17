#!/bin/bash
{
    current_time=$(date "+%m-%d-%Y_%T")
    new_file_name=test_$current_time
    echo "$new_file_name"
    mkdir -p /opt/plcnext/project_archive
    cp -a /opt/plcnext/projects /opt/plcnext/project_archive/$new_file_name
} & disown