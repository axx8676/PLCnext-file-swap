#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

# check for swap folder
if [ -d /opt/plcnext/SDCardSwap ]; then
	while true; do
	# ask user if they want to install Swap
	read -p "SDCardSwap folder detected, would you like to install Swap? {y|n} " yn
	case $yn in
		# install swap
		y) echo "Running script to install SDCardSwap. Please wait."
			
			# copy Swap script to more accessible folder
			echo "Installing Swap and setting permissions"
			cp -a /opt/plcnext/SDCardSwap/Swap.sh /opt/plcnext/
			chmod 777 /opt/plcnext/Swap.sh

			# copy cron job to cron folder, and add it to crontab
			echo "Setting up DetectReboot cronjob"
			cp -a -n /opt/plcnext/SDCardSwap/DetectReboot_Swap /var/spool/cron/
			sudo crontab /var/spool/cron/DetectReboot_Swap

			# copy udev rules to rules folder, and reload rules to apply changes
			echo "Setting up udev rules"
			cp -a /opt/plcnext/SDCardSwap/99-automount.rules /etc/udev/rules.d/
			cp -a /opt/plcnext/SDCardSwap/99-swap.rules /etc/udev/rules.d/
			sudo udevadm control --reload-rules

			break
			;;
		# don't install swap
		n) echo "Not installing SDCardSwap."
			break
			;;
		# prompt user again
		*) echo "Invalid response, please enter y or n"
			;;
	esac
	done
fi

# check for upload folder
if [ -d /opt/plcnext/Upload ]; then
	while true; do
	# ask user if they want to install Upload
	read -p "Upload folder detected, would you like to install Upload? {y|n} " yn
	case $yn in
		# install upload
		y) echo "Running script to install Upload. Please wait."

			# copy Upload script to more accessible folder
			echo "Installing Upload and setting permissions"
			cp -a /opt/plcnext/Upload/Upload.sh /opt/plcnext/
			chmod 777 /opt/plcnext/Upload.sh

			# copy inotify to more accessible folder
			echo "Installing inotify and setting permissions"
			cp -a /opt/plcnext/Upload/inotify.sh /opt/plcnext
			chmod 777 /opt/plcnext/inotify.sh

			# copy cron job to cron folder, and add it to crontab
			echo "Setting up DetectReboot cronjob"
			cp -a /opt/plcnext/Upload/DetectReboot_Upload /var/spool/cron/
			sudo crontab /var/spool/cron/DetectReboot_Upload

			# copy udev rule to rules folder, and reload rules to apply changes
			echo "Setting up udev rules"
			cp -a /opt/plcnext/Upload/99-automount.rules /etc/udev/rules.d/
			sudo udevadm control --reload-rules

			# install inotify package, and depends packages
			echo "Installing necessary packages for inotify"
			cd /opt/plcnext/Upload/packages
			dpkg --install --force-all *.deb
			
			# start inotify script, so upload can be used immediately
			echo "Installation complete, starting inotify watch"
			/opt/plcnext/inotify.sh

			break
			;;
		# don't install upload
		n) echo "Not installing Upload"
			break
			;;
		# prompt user again
		*) echo "Invalid response, please enter y or n"
			;;
	esac
	done
fi
