#!/bin/bash

# archives PLC project on SD card
# then swaps the projects on SD card and PLC
{
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

# output to both terminal and log
exec > >(tee -i -a /opt/plcnext/logs/Swap.log)
exec 2>&1

# parse json to retrieve project name
function get_project_name() 
{
  local json_file=$1
  python3 -c "import sys, json; print(json.load(open('${json_file}'))['identification']['name'])"
}

# initialize variables
function init() 
{
  # time for archive name
  current_time=$(date "+%m-%d-%Y_%T")

  # filepaths
  plc_dir="/media/rfs/internalsd/upperdir/opt/plcnext"
  sd_dir="/media/rfs/externalsd/upperdir/opt/plcnext"
  archive_dir="/media/rfs/externalsd/upperdir/opt/plcnext/project_archive"

  # project names
  if test -f $plc_dir/projects/PCWE/PCWE.software-package-manifest.json; then
    PLC_project_name=$(get_project_name "$plc_dir/projects/PCWE/PCWE.software-package-manifest.json")
  else
    echo "$(date "+%d.%m.%y %T") No project on PLC, uploading project from SD without archiving"
    PLC_project_name=empty
  fi
  SD_project_name=$(get_project_name "$sd_dir/projects/PCWE/PCWE.software-package-manifest.json")
  archive_filename=$PLC_project_name'_'$current_time
}

# archive PLC project on SD, then swap projects on SD and PLC
function fileTransfer() 
{
  # ensure sd card deactivated 
  # (probably unnecessary, won't get this far if it isn't already deactivated)
  sudo /usr/sbin/sdcard_state.sh request_deactivation
  echo "$(date "+%d.%m.%y %T") SD card deactivated"

  echo "$(date "+%d.%m.%y %T") Project on PLC: $PLC_project_name"
  echo "$(date "+%d.%m.%y %T") Project on SD card: $SD_project_name"

  # archive PLC project on SD
  if [ "$PLC_project_name" != "empty" ]; then
    echo "$(date "+%d.%m.%y %T") Archiving $PLC_project_name as $archive_filename"
    mkdir -p $archive_dir
    cp -a $plc_dir/projects $archive_dir/$archive_filename

    # continue swap only if project was successfully archived
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

  # new project names
  new_PLC_project_name=$(get_project_name "$plc_dir/projects/PCWE/PCWE.software-package-manifest.json")
  echo "$(date "+%d.%m.%y %T") Project on PLC: $new_PLC_project_name"

  if [ "$PLC_project_name" != "empty" ]; then
    new_SD_project_name=$(get_project_name "$sd_dir/projects/PCWE/PCWE.software-package-manifest.json")
    echo "$(date "+%d.%m.%y %T") Project on SD card: $new_SD_project_name"
  else
    echo "$(date "+%d.%m.%y %T") Project on SD card now empty"
  fi

  # reboot necessary for new project to start correctly
  echo "$(date "+%d.%m.%y %T") Rebooting..."
  sudo reboot
}

# sleep to ensure PLC has finished startup
echo "$(date "+%d.%m.%y %T")"
sleep 45

# check if PLC has just rebooted, to prevent swap loop
if [ -f /opt/plcnext/just_rebooted ]; then
  echo "$(date "+%d.%m.%y %T") Reboot detected, not performing swap"
  exit 0
fi

# check if SD card is formatted and inserted
if [ -d /media/rfs/externalsd/upperdir/opt/plcnext/projects ]; then
  echo "$(date "+%d.%m.%y %T") SD card inserted, performing swap"
  sudo /etc/init.d/plcnext stop
  init
  fileTransfer
  exit 0
else
  if [ -d /media/rfs/externalsd/upperdir ]; then
  # SD card present, but not formatted
    echo "$(date "+%d.%m.%y %T") SD Card not properly formatted"
    echo "$(date "+%d.%m.%y %T") Ensure SD card contains /upperdir/opt/plcnext/projects"
    exit 0
  else
  # SD card not present or not mounted
    echo "$(date "+%d.%m.%y %T") SD Card not inserted"
    echo "$(date "+%d.%m.%y %T") Insert SD card to swap projects."
    exit 0
  fi
fi
} & disown
# disown so udev rule doesn't time out
