#!/bin/bash
{
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

exec > >(tee -i -a /opt/plcnext/logs/Swap.log)
exec 2>&1

FLAG_FILE="/opt/plcnext/just_rebooted"
current_time=$(date "+%m-%d-%Y_%T")
plc_dir="/media/rfs/internalsd/upperdir/opt/plcnext"
sd_dir="/media/rfs/externalsd/upperdir/opt/plcnext"
archive_dir="/media/rfs/externalsd/upperdir/opt/plcnext/project_archive"

function get_project_name() {
  local json_file=$1
  python3 -c "import sys, json; print(json.load(open('${json_file}'))['identification']['name'])"
}

if test -f $plc_dir/projects/PCWE/PCWE.software-package-manifest.json; then
  PLC_project_name=$(get_project_name "$plc_dir/projects/PCWE/PCWE.software-package-manifest.json")
else
  echo "$(date "+%d.%m.%y %T") No project on PLC, uploading project from SD without archiving"
  PLC_project_name=empty
fi

SD_project_name=$(get_project_name "$sd_dir/projects/PCWE/PCWE.software-package-manifest.json")
archive_filename=$PLC_project_name'_'$current_time

function fileTransfer() {
  sudo /usr/sbin/sdcard_state.sh request_deactivation
  echo "$(date "+%d.%m.%y %T") SD card deactivated"

  echo "$(date "+%d.%m.%y %T") Project on PLC: $PLC_project_name"
  echo "$(date "+%d.%m.%y %T") Project on SD card: $SD_project_name"

  if [ "$PLC_project_name" != "empty" ]; then
    # archive PLC project on SD
    echo "$(date "+%d.%m.%y %T") Archiving $PLC_project_name as $archive_filename"
    mkdir -p $archive_dir
    cp -a $plc_dir/projects $archive_dir/$archive_filename
    if [ -d $archive_dir/$archive_filename ]; then
      echo "$(date "+%d.%m.%y %T") Archive successful, continuing..."
    else
      echo "$(date "+%d.%m.%y %T") ERROR: Archive failed, exiting..."
      exit 1
    fi
  fi

  # rename projects and remove old instance on SD card
  cp -a $sd_dir/projects $sd_dir/projects1
  rm -r $sd_dir/projects

  # copy project from PLC to SD and remove old instance from PLC
  echo "$(date "+%d.%m.%y %T") Moving $PLC_project_name from PLC to SD"
  cp -a $plc_dir/projects $sd_dir/
  rm -r $plc_dir/projects

  # copy project from SD to PLC and remove old instance from SD
  echo "$(date "+%d.%m.%y %T") Moving $SD_project_name from SD to PLC"
  cp -a $sd_dir/projects1 $plc_dir/
  rm -r $sd_dir/projects1

  # rename projects1 on PLC back to projects and remove projects1
  cp -a $plc_dir/projects1 $plc_dir/projects
  rm -r $plc_dir/projects1

  new_PLC_project_name=$(get_project_name "$plc_dir/projects/PCWE/PCWE.software-package-manifest.json")
  echo "$(date "+%d.%m.%y %T") Project on PLC: $new_PLC_project_name"

  if [ "$PLC_project_name" != "empty" ]; then
    new_SD_project_name=$(get_project_name "$sd_dir/projects/PCWE/PCWE.software-package-manifest.json")
    echo "$(date "+%d.%m.%y %T") Project on SD card: $new_SD_project_name"
  else
    echo "$(date "+%d.%m.%y %T") Project on SD card now empty"
  fi

  echo "$(date "+%d.%m.%y %T") Rebooting..."
  sudo reboot
}

echo "$(date "+%d.%m.%y %T")"
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
  echo "$(date "+%d.%m.%y %T") SD Card not properly mounted"
  echo "$(date "+%d.%m.%y %T") Insert SD card to swap projects"
  exit 0
fi
} & disown


