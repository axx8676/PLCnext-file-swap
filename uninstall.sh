#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

#Check for new update
if [ -e /opt/plcnext/Swap.sh ] || [ -e /var/spool/cron/DetectReboot ] || [ -e /etc/udev/rules.d/99-automount.rules ] || [ -e /etc/udev/rules.d/99-swap.rules ]; then
	echo "Running script to uninstall SDCardSwap. Please wait."
    rm /opt/plcnext/Swap.sh
	rm /var/spool/cron/DetectReboot
	rm /etc/udev/rules.d/99-automount.rules
	rm /etc/udev/rules.d/99-swap.rules
    rm /opt/plcnext/just_rebooted
	sudo udevadm control --reload-rules
	cd /opt/plcnext
	fwVersion="$(head -n 1 /etc/plcnext/arpversion)"
	echo "$fwVersion" > /opt/plcnext/.fwVersion.txt
    echo "Uninstall complete"
else
	echo "No files found, Swap.sh and udev rules do not exist."
fi
