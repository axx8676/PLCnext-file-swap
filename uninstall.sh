#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

# check for any files created by Swap installation, and try to delete relevant files
if [ -e /opt/plcnext/Swap.sh ] || [ -e /var/spool/cron/DetectReboot_Swap ] || [ -e /etc/udev/rules.d/99-swap.rules ]; then
	while true; do
	# ask user if they want to uninstall Swap
	read -p "SDCardSwap is currently installed, would you like to uninstall Swap? {y|n} " yn
	case $yn in
		# uninstall swap
		y)	echo "Running script to uninstall SDCardSwap. Please wait."
			
			# remove script
			echo "Removing Swap.sh"
			rm /opt/plcnext/Swap.sh

			# remove udev rules and reload rules to apply changes
			echo "Removing udev swap rule"
			rm /etc/udev/rules.d/99-swap.rules
			sudo udevadm control --reload-rules

			# remove flag file (may fail if PLC not rebooted)
			echo "Removing flag file"
			rm /opt/plcnext/just_rebooted
			
			echo "Uninstall complete"
			break
			;;
		# don't uninstall swap
		n) 	echo "Not uninstalling SDCardSwap"
			break
			;;
		# prompt user again
		*) 	echo "Invalid response, please enter y or n"
			;;
	esac
	done
fi

# check for any files created by Upload installation, and try to delete relevant files
if [ -e /opt/plcnext/Upload.sh ] || [ -e /var/spool/cron/DetectReboot_Upload ] || [ -e /opt/plcnext/inotify.sh ]; then
	while true; do
	# ask user if they want to uninstall Upload
	read -p "Upload is currently installed, would you like to uninstall Upload? {y|n} " yn
	case $yn in
		# uninstall upload
		y)	echo "Running script to uninstall Upload. Please wait."
	
			# stop inotify
			echo "Stopping inotify"
			killall inotifywait

			# remove scripts
			echo "Removing Upload.sh"
			rm /opt/plcnext/Upload.sh
			echo "Removing inotify.sh"
			rm /opt/plcnext/inotify.sh

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
			break
			;;
		# don't uninstall upload
		n)	echo "Not uninstalling Upload"
			break
			;;
		# prompt user again
		*)	echo "Invalid response, please enter y or n"
			;;
	esac
	done
fi

if [ -e /etc/udev/rules.d/99-automount.rules ] && [ ! -e /opt/plcnext/Swap.sh ] && [ ! -e /opt/plcnext/Upload.sh ]; then
	echo "Swap and Upload both uninstalled, removing automount rule"
	rm /etc/udev/rules.d/99-automount.rules
	sudo udevadm control --reload-rules
fi

if [ -e /var/spool/cron/DetectReboot ] && [ ! -e /opt/plcnext/Swap.sh ] && [ ! -e /opt/plcnext/Upload.sh ]; then
	echo "Swap and Upload both uninstalled, removing cronjobs"
	rm /var/spool/cron/DetectReboot
	rm /var/spool/cron/root
fi
