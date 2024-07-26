#!/bin/bash
{
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

exec > >(tee -i -a /opt/plcnext/logs/Swap.log)
exec 2>&1

FLAG_FILE="/opt/plcnext/just_rebooted"
current_time=$(date "+%m-%d-%Y_%T")
active_dir="/media/rfs/internalsd/upperdir/opt/plcnext"
archive_dir="/media/rfs/externalsd/upperdir/opt/plcnext/project_archive"

function get_project_name() {
  local json_file=$1
  python3 -c "import sys, json; print(json.load(open('${json_file}'))['identification']['name'])"
}

if [ -f $active_dir/projects/PCWE/PCWE.software-package-manifest.json ]; then
  old_project_name=$(get_project_name "$active_dir/projects/PCWE/PCWE.software-package-manifest.json")
else
  echo "$(date "+%d.%m.%y %T") No project on PLC, uploading new project without archiving"
  old_project_name="empty"
fi

new_project_name=$(get_project_name "$active_dir/PCWE/PCWE.software-package-manifest.json")
archive_filename=$old_project_name'_'$current_time



function fileTransfer() {
  sudo /usr/sbin/sdcard_state.sh request_deactivation
  echo "$(date "+%d.%m.%y %T") SD card deactivated"

  echo "$(date "+%d.%m.%y %T") Project on PLC: $old_project_name"
  echo "$(date "+%d.%m.%y %T") Project to upload: $new_project_name"

  # copy project from PLC to SD archive
  if [ "$old_project_name" != "empty"]; then
    echo "$(date "+%d.%m.%y %T") Archiving $old_project_name as $archive_filename"
    mkdir -p $archive_dir
    cp -a $active_dir/projects $archive_dir/$archive_filename
  
    # remove project from PLC if it was successfully archived, exit if not
    if [ -f $archive_dir/$archive_filename ]; then
      echo "$(date "+%d.%m.%y %T") Successfully archived, removing $old_project_name from PLC"
      rm -r $active_dir/projects/PCWE
    else
      echo "$(date "+%d.%m.%y %T") ERROR: Archive failed, not deleting $old_project_name or uploading $new_project_name"
      exit 1
    fi
  else
    echo "$(date "+%d.%m.%y %T") Project on PLC empty, deleting..."
    rm -r $active_dir/projects/PCWE
  fi

  # upload project to PLC
  echo "$(date "+%d.%m.%y %T") Uploading $new_project_name to PLC"
  cp -a $active_dir/PCWE $active_dir/projects
  rm -r $active_dir/PCWE

  new_uploaded_project=$(get_project_name "$active_dir/projects/PCWE/PCWE.software-package-manifest.json")

  old_archived_project=$(get_project_name "$archive_dir/$archive_filename/PCWE/PCWE.software-package-manifest.json")

  echo "$(date "+%d.%m.%y %T") Project on PLC: $new_uploaded_project"
  echo "$(date "+%d.%m.%y %T") Archived project: $old_archived_project"

  #echo "$(date "+%d.%m.%y %T") Rebooting ..."
  #sudo reboot
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
  echo "$(date "+%d.%m.%y %T") Insert SD card to archive projects"
  exit 0
fi
} & disown


