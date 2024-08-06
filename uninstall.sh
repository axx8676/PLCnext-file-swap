#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

# check for any files created by Swap installation, and try to delete relevant files
if [ -e /opt/plcnext/Swap.sh ] || [ -e /var/spool/cron/DetectReboot_Swap ] || [ -e /etc/udev/rules.d/99-swap.rules ]; then
	echo "Running script to uninstall SDCardSwap. Please wait."
	
	# remove script
	echo "Removing Swap.sh"
	rm /opt/plcnext/Swap.sh

	# remove cronjob
	echo "Removing DetectReboot_Swap"
	rm /var/spool/cron/DetectReboot_Swap

	# remove udev rules and reload rules to apply changes
	echo "Removing udev automount and swap rules"
	rm /etc/udev/rules.d/99-automount.rules
	rm /etc/udev/rules.d/99-swap.rules
	sudo udevadm control --reload-rules

	# remove flag file (may fail if PLC not rebooted)
	echo "Removing flag file"
    rm /opt/plcnext/just_rebooted
	
    echo "Uninstall complete"
fi

# check for any files created by Upload installation, and try to delete relevant files
if [ -e /opt/plcnext/Upload.sh ] || [ -e /var/spool/cron/DetectReboot_Upload ] || [ -e /opt/plcnext/inotify.sh ]; then
	echo "Running script to uninstall Upload. Please wait."
	
	# stop inotify
	echo "Stopping inotify"
	killall inotifywait

	# remove scripts
	echo "Removing Upload.sh"
	rm /opt/plcnext/Upload.sh
	echo "Removing inotify.sh"
	rm /opt/plcnext/inotify.sh

	# remove cronjob
	echo "Removing DetectReboot_Upload"
	rm /var/spool/cron/DetectReboot_Upload

	# remove udev rule and reload rules to apply changes
	echo "Removing udev automount rule"
	rm /etc/udev/rules.d/99-automount.rules
	sudo udevadm control --reload-rules

	# remove flag file (may fail if PLC not rebooted since SD card inserted/removed)
	echo "Removing flag file"
	rm /opt/plcnext/just_rebooted

	# uninstall deb packages
	dpkg --purge --force-all gcc-10-base:armel
	dpkg --purge --force-all inotify-tools
	dpkg --purge --force-all libc6:armel
	dpkg --purge --force-all libcrypt1:armel
	dpkg --purge --force-all libgcc-s1:armel
	dpkg --purge --force-all libinotifytools0:armel
	
	echo "Uninstall complete"
fi
