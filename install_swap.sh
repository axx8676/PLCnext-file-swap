#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

#Check for new update
if [ -d /opt/plcnext/SDCardSwap ]; then
	echo "Running script to install SDCardSwap. Please wait."
	cp -a /opt/plcnext/SDCardSwap/Swap.sh /opt/plcnext/
	chmod 777 /opt/plcnext/Swap.sh
	cp -a -n /opt/plcnext/SDCardSwap/DetectReboot_Swap /var/spool/cron/
	sudo crontab /var/spool/cron/DetectReboot_Swap
	cp -a /opt/plcnext/SDCardSwap/99-automount.rules /etc/udev/rules.d/
	cp -a /opt/plcnext/SDCardSwap/99-swap.rules /etc/udev/rules.d/
	sudo udevadm control --reload-rules
	
	echo "Installation complete"
else
	echo "No files found, please upload SDCardSwap directory."
fi
