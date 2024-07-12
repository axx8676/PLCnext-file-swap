# PLCnext-file-swap
Swaps the project files on the PLCnext control with the project files on the inserted SD card

Work on getting the udev rule that calls the script to execute when SD card inserted (ACTION=="add", KERNEL=="mmcblk1p1") AND when the PLC has finished initializing (ENV{initialized}=="1")

The main problem is to initialize the kernel, we need to use a different device to track, one that changes after the sd card and after the "just_rebooted" flag is set. However, the ENV tags are specific to a single kernel I think, so we can't use them if we are specifying the kernel of the SD card.
