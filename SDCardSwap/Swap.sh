#!/bin/bash
{
  export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

  sdState="$(/usr/sbin/sdcard_state.sh getStatus)"
  FLAG_FILE="/opt/plcnext/just_rebooted"

  function fileTransfer() {
    sudo /usr/sbin/sdcard_state.sh request_deactivation
    echo "SD card deactivated"

    # rename upperdir and remove old instance on SD card
    echo "Renaming SD card upperdir"
    cp -a /media/rfs/externalsd/upperdir/opt/plcnext/projects /media/rfs/externalsd/upperdir/opt/plcnext/projects1
    rm -r /media/rfs/externalsd/upperdir/opt/plcnext/projects

    # copy project from PLC to SD and remove old instance from PLC
    echo "Moving from PLC to SD"
    cp -a /media/rfs/internalsd/upperdir/opt/plcnext/projects /media/rfs/externalsd/upperdir/opt/plcnext/
    rm -r /media/rfs/internalsd/upperdir/opt/plcnext/projects

    # copy project from SD to PLC and remove old instance from SD
    echo "Moving from SD to PLC"
    cp -a /media/rfs/externalsd/upperdir/opt/plcnext/projects1 /media/rfs/internalsd/upperdir/opt/plcnext/
    rm -r /media/rfs/externalsd/upperdir/opt/plcnext/projects1

    # rename upperdir1 on PLC back to upperdir and remove upperdir1
    echo "Renaming PLC upperdir"
    cp -a /media/rfs/internalsd/upperdir/opt/plcnext/projects1 /media/rfs/internalsd/upperdir/opt/plcnext/projects
    rm -r /media/rfs/internalsd/upperdir/opt/plcnext/projects1

    echo "PLC and SD swapped"
    sudo reboot
  }

  sleep 45

  if [ -f "$FLAG_FILE" ]; then
    echo "Reboot detected, not performing swap"
    exit 0
  fi

  if [ -d /media/rfs/externalsd/upperdir/opt/plcnext/projects ]; then
    echo "SD card inserted, performing swap"
    fileTransfer
    exit 0
  else
    echo "No SD card inserted"
    exit 0
  fi
} & disown


