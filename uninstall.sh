#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

#Check for any files created by installation, and try to delete all of them
if [ -e /opt/plcnext/Swap.sh ] || [ -e /opt/plcnext/Upload.sh ] || [ -e /opt/plcnext/inotify.sh ] || [ -e /var/spool/cron/DetectReboot* ] || [ -e /etc/udev/rules.d/99-automount.rules ]; then
	echo "Running script to uninstall SDCardSwap. Please wait."
    rm /opt/plcnext/Swap.sh
	rm /opt/plcnext/Upload.sh
	rm /opt/plcnext/inotify.sh
	rm /var/spool/cron/DetectReboot_Upload
	rm /var/spool/cron/DetectReboot_Swap
	rm /etc/udev/rules.d/99-automount.rules
	rm /etc/udev/rules.d/99-swap.rules
    rm /opt/plcnext/just_rebooted
	sudo udevadm control --reload-rules
    echo "Uninstall complete"
else
	echo "No files found, already uninstalled."
fi
