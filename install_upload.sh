#!/bin/bash

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/opt/plcnext/appshome/bin

#Check for new update
if [ -d /opt/plcnext/Upload ]; then
	echo "Running script to install Upload. Please wait."
	cp -a /opt/plcnext/Upload/Upload.sh /opt/plcnext/
	chmod 777 /opt/plcnext/Upload.sh
	cp -a /opt/plcnext/Upload/inotify.sh /opt/plcnext
	chmod 777 /opt/plcnext/inotify.sh
	cp -a /opt/plcnext/Upload/DetectReboot_Upload /var/spool/cron/
	sudo crontab /var/spool/cron/DetectReboot_Upload
	cp -a /opt/plcnext/Upload/99-automount.rules /etc/udev/rules.d/
	sudo udevadm control --reload-rules

	cd /opt/plcnext/Upload/packages
	dpkg -i --force-all *.deb
	
	echo "Installation complete, rebooting to apply changes"
	sudo reboot
else
	echo "No files found, please upload Upload directory."
fi
