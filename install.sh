#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

#Check for new update
if [ -d /opt/plcnext/SDCardSwap ]; then
	cp -a /opt/plcnext/SDCardSwap/Swap.sh /opt/plcnext/
	chmod 777 /opt/plcnext/Swap.sh
	cp -a /opt/plcnext/SDCardSwap/PLCmove /var/spool/cron/
	sudo crontab /var/spool/cron/PLCmove
	cp -a /opt/plcnext/SDCardSwap/10-swap.rules /etc/udev/rules.d/
	cd /opt/plcnext
	fwVersion="$(head -n 1 /etc/plcnext/arpversion)"
	echo "$fwVersion" > /opt/plcnext/.fwVersion.txt
	echo "Running script to move files. Please wait."
	#./Swap.sh
else
	echo "No files found."
fi
