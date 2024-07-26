#!/bin/bash
{
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

exec > >(tee -i -a /opt/plcnext/logs/Swap.log)
exec 2>&1

FLAG_FILE="/opt/plcnext/just_rebooted"
current_time=$(date "+%m-%d-%Y_%T")
active_dir="/media/rfs/internalsd/upperdir/opt/plcnext"
sd_dir="/media/rfs/externalsd/upperdir/opt/plcnext"
archive_dir="/media/rfs/externalsd/upperdir/opt/plcnext/project_archive"

function get_project_name() {
  local json_file=$1
  python3 -c "import sys, json; print(json.load(open('${json_file}'))['identification']['name'])"
}

PLC_project_name=$(get_project_name "$active_dir/projects/PCWE/PCWE.software-package-manifest.json")

SD_project_name=$(get_project_name "$sd_dir/projects/PCWE/PCWE.software-package-manifest.json")

archive_filename=$PLC_project_name'_'$current_time

function fileTransfer() {
  sudo /usr/sbin/sdcard_state.sh request_deactivation
  echo "$(date "+%d.%m.%y %T") SD card deactivated"

  echo "$(date "+%d.%m.%y %T") Project on PLC: $PLC_project_name"
  echo "$(date "+%d.%m.%y %T") Project on SD card: $SD_project_name"

  # rename projects and remove old instance on SD card
  echo "$(date "+%d.%m.%y %T") Renaming SD card projects folders"
  cp -a $sd_dir/projects $sd_dir/projects1
  rm -r $sd_dir/projects

  # copy project from PLC to SD and remove old instance from PLC
  echo "$(date "+%d.%m.%y %T") Moving $PLC_project_name from PLC to SD"
  echo "$(date "+%d.%m.%y %T") Archiving $PLC_project_name as $archive_filename"
  cp -a $active_dir/projects $sd_dir/
  mkdir -p $sd_dir
  cp -a $active_dir/projects $sd_dir/$archive_filename
  rm -r $active_dir/projects

  # copy project from SD to PLC and remove old instance from SD
  echo "$(date "+%d.%m.%y %T") Moving $SD_project_name from SD to PLC"
  cp -a $sd_dir/projects1 $active_dir/
  rm -r $sd_dir/projects1

  # rename projects1 on PLC back to projects and remove projects1
  echo "$(date "+%d.%m.%y %T") Renaming PLC projects folders"
  cp -a $active_dir/projects1 $active_dir/projects
  rm -r $active_dir/projects1

  new_PLC_project_name=$(get_project_name "$active_dir/projects/PCWE/PCWE.software-package-manifest.json")

  new_SD_project_name=$(get_project_name "$sd_dir/projects/PCWE/PCWE.software-package-manifest.json")

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
  echo "$(date "+%d.%m.%y %T") SD Card not properly mounted"
  exit 0
fi
} & disown


