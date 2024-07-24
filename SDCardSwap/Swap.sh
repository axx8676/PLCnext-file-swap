#!/bin/bash
{
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

exec > >(tee -i -a /opt/plcnext/logs/Swap.log)
exec 2>&1

FLAG_FILE="/opt/plcnext/just_rebooted"
current_time=$(date "+%m-%d-%Y_%T")

PLC_project_name=$(python3 -c "import sys, json; print(json.load(open('/media/rfs/internalsd/upperdir/opt/plcnext/projects/PCWE/PCWE.software-package-manifest.json',))['identification']['name'])")

SD_project_name=$(python3 -c "import sys, json; print(json.load(open('/media/rfs/externalsd/upperdir/opt/plcnext/projects/PCWE/PCWE.software-package-manifest.json',))['identification']['name'])")

archive_filename=$PLC_project_name'_'$current_time

function fileTransfer() {
  sudo /usr/sbin/sdcard_state.sh request_deactivation
  echo "$(date "+%d.%m.%y %T") SD card deactivated"

  echo "$(date "+%d.%m.%y %T") Project on PLC: $PLC_project_name"
  echo "$(date "+%d.%m.%y %T") Project on SD card: $SD_project_name"

  # rename projects and remove old instance on SD card
  echo "$(date "+%d.%m.%y %T") Renaming SD card projects folders"
  cp -a /media/rfs/externalsd/upperdir/opt/plcnext/projects /media/rfs/externalsd/upperdir/opt/plcnext/projects1
  rm -r /media/rfs/externalsd/upperdir/opt/plcnext/projects

  # copy project from PLC to SD and remove old instance from PLC
  echo "$(date "+%d.%m.%y %T") Moving $PLC_project_name from PLC to SD"
  echo "$(date "+%d.%m.%y %T") Archiving $PLC_project_name as $archive_filename"
  cp -a /media/rfs/internalsd/upperdir/opt/plcnext/projects /media/rfs/externalsd/upperdir/opt/plcnext/
  mkdir -p /media/rfs/externalsd/upperdir/opt/plcnext/project_archive
  cp -a /media/rfs/internalsd/upperdir/opt/plcnext/projects /media/rfs/externalsd/upperdir/opt/plcnext/project_archive/$archive_filename
  rm -r /media/rfs/internalsd/upperdir/opt/plcnext/projects

  # copy project from SD to PLC and remove old instance from SD
  echo "$(date "+%d.%m.%y %T") Moving $SD_project_name from SD to PLC"
  cp -a /media/rfs/externalsd/upperdir/opt/plcnext/projects1 /media/rfs/internalsd/upperdir/opt/plcnext/
  rm -r /media/rfs/externalsd/upperdir/opt/plcnext/projects1

  # rename projects1 on PLC back to projects and remove projects1
  echo "$(date "+%d.%m.%y %T") Renaming PLC projects folders"
  cp -a /media/rfs/internalsd/upperdir/opt/plcnext/projects1 /media/rfs/internalsd/upperdir/opt/plcnext/projects
  rm -r /media/rfs/internalsd/upperdir/opt/plcnext/projects1

  new_PLC_project_name=$(python3 -c "import sys, json; print(json.load(open('/media/rfs/internalsd/upperdir/opt/plcnext/projects/PCWE/PCWE.software-package-manifest.json',))['identification']['name'])")

  new_SD_project_name=$(python3 -c "import sys, json; print(json.load(open('/media/rfs/externalsd/upperdir/opt/plcnext/projects/PCWE/PCWE.software-package-manifest.json',))['identification']['name'])")

  echo "$(date "+%d.%m.%y %T") Project on PLC: $new_PLC_project_name"
  echo "$(date "+%d.%m.%y %T") Project on SD card: $new_SD_project_name"
  echo "$(date "+%d.%m.%y %T") Rebooting ..."
  sudo reboot
}
# use systemd systemctl or entr to create a rule to run a script to organize files correctly when a PCWE folder is uploaded
# and then runs swap

echo "$(date "+%d.%m.%y %T") "
sleep 45

if [ -f "$FLAG_FILE" ]; then
  echo "$(date "+%d.%m.%y %T") Reboot detected, not performing swap"
  exit 0
fi

if [ -d /media/rfs/externalsd/upperdir/opt/plcnext/projects ]; then
  echo "$(date "+%d.%m.%y %T") SD card inserted, performing swap"
  sudo /etc/init.d/plcnext stop
  fileTransfer
  exit 0
else
  echo "$(date "+%d.%m.%y %T") No SD card inserted"
  exit 0
fi
} & disown


