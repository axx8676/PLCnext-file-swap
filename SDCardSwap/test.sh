#!/bin/bash
{
    if [ -f /opt/plcnext/just_rebooted ]; then
        echo "Reboot detected, not performing swap"
        touch /opt/plcnext/reboot_detected
        exit 0
    fi

    if [ -d /media/rfs/externalsd/upperdir ]; then
        echo "SD card inserted, performing swap"
        touch /opt/plcnext/performing_swap
        exit 0
    else
        echo "No SD card inserted"
        touch /opt/plcnext/sd_not_mounted
        exit 0
    fi
} & disown