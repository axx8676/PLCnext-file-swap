# PLCnext-file-swap
Uploads the given project to the PLC and archives the old project in `/upperdir/opt/plcnext/project_archive/` on an SD card.

<h2> Materials/Software needed: </h2>

* PLCnext Control
    * AXC F X152
* SD card
    * Phoenix Contact SD card preferred, but a normal SD card can be configured to work
* Computer w/ Windows OS
    * Can also be set up on Linux, but Windows is necessary for PLCnext Engineer projects
* SFTP client (e.g. WinSCP)
* SSH client (e.g. PuTTY)
* PLCnext Engineer
* Ext4 File System Driver for Windows
  * Only needed if a non-Phoenix Contact SD card is used

<h3> Version Info </h3>

* PLCnext Control AXC F 2152
   * Hardware version: 06
   * Firmware version: 2024.0.5 LTS
   * Linux #1 SMP PREEMPT_RT Thu Nov 16 06:49:45 UTC 2023 armv71
* PLCnext Engineer version 2024.0.3
* WinSCP version 6.3.4
* PuTTY release 0.79
* Linux File Systems for Windows by Paragon Software version 6.1.5
* GNU bash version 5.1.16(1)
* udev version 243
* crontab version cronie 1.6.1
* Packages installed with Upload 
  * gcc-10-base 10.2.1-6 armel
  * inotify-tools 3.14-8.1 armel
  * libc6 2.31-13 armel
  * libcrypt1 4.4.18-4 armel
  * libgcc-s1 10.2.1-6 armel
  * libinotifytools0 3.14-8.1 armel

<h2> Ensure SD card support is deactivated </h2>

SD card Support must be deactivated to use the SD card as storage. If it is left activated, and the SD card has a project on it when inserted, the project on the PLC will be lost. 

After connecting to PLC, open Web Based Management, either through PLCnext Engineer, or directly via web browser at `0.0.0.0/wbm` (replace with your PLC's IP address)

Login to WBM and navigate to the SD card window under Security. Ensure that `Support for External SD card` is deactivated. If support is activated, deactivate it by pressing the `Deactivate support` button and reboot your PLC.

![image](https://github.com/user-attachments/assets/21671b69-acf0-4a29-b263-6aa7769143c9)

<h2> Transfer files to PLC </h2>

After SD card support is deactivated, login to a new session in your SFTP client. Use the IP address of your PLC as the Host name. If this is a fresh PLC, the user name will be `admin` and the password will be printed on the front of your PLCnext Control.

![image](https://github.com/user-attachments/assets/d2109d19-b523-492a-afb6-c2f1072121fc)

![image](https://github.com/user-attachments/assets/25aa88f3-8b14-4333-8c3a-f1f08025e2d7)

After connecting, navigate to /opt/plcnext and transfer install.sh, uninstall.sh, and Upload to this directory. All files needed can be found in this repo.

![image](https://github.com/user-attachments/assets/0c862abe-34c4-4d1e-bf9d-a08a38ad0cd4)

<h2> Installing Upload </h2>

Now, open a new session in your SSH client and log into the PLC. Use the same IP address, user, and password as used in the SFTP session.

![image](https://github.com/user-attachments/assets/82967f32-0015-45bf-8253-ea8998067dca)

Next, enter the following command:
```
sudo passwd root
```
When asked for a password, use the password entered previously. Enter a new password for the root user. Then, enter `su` and login with the newly created password:
```
login as: admin
admin@192.168.1.10's password: password
Last login: Mon Jul 15 15:35:00 2024 from 192.168.1.1
admin@axcf2152:~$ sudo passwd root
Password: password
New password: rootPassword
Retype new password: rootPassword
passwd: password updated successfully
admin@axcf2152:~$ su
Password: rootPassword
root@axcf2152:/opt/plcnext/#
```

You should be in the /opt/plcnext/ directory. If you are not, navigate there by using `cd /opt/plcnext`. Enter the following command, which will give the installation file the necessary read/write permissions:
```
chmod 777 install.sh
```

Finally, run the installation file using:
```
./install.sh
```

You will see an output asking if you would like to install Upload. Enter `y` and press enter, then the files will be installed.

<h2> Performing the Upload </h2>

You will need to manually transfer your project to the PLC before the upload occurs. 

There are multiple ways to do this, including using SCP to transfer the files and using the SFTP client. The SD card must be in the PLC for both of these to work. If it is not present, the script will be unable to archive the project and thus will not proceed with the upload.

If you are using a normal SD card, you will need to create some of the file structure that exists on the Phoenix Contact SD cards in order to archive the projects from the PLC. First, you will need to format the SD card as Ext4. I used a trial for this driver: https://www.paragon-software.com/home/linuxfs-windows/. In Linux File Systems for Windows, click the three dots icon, then click `Format new volume`. Select your SD card, the Ext4 format, and then click Format. 

After you have formatted the SD card, create the folders upperdir and work. Then, create the folders in this filepath: `upperdir/opt/plcnext`. After uploading the PCWE folder, you will need to create a symlink called current that links to the PCWE folder. Please note that while this SD card can be used for storage and uploading projects to the PLC, it cannot be mounted as the primary filesystem to run the PLC.

Ensure the SD card is properly formatted by checking that the following filepath exists: `/upperdir/opt/plcnext`.

To upload the project to the PLC, you will first need to find the project on your computer. Depending on where you installed PLCnext Engineer, this could vary slightly. To find where the project is stored, in PLCnext Engineer go to Extras, then open the Options. Open the `Directories` tab under `Tools`.

![image](https://github.com/user-attachments/assets/ebe768cd-325e-459f-b820-05362b65a704)

While you have your project open in PLCnext Engineer, rebuild the project. Go to `Project` then hit `Rebuild`. You do not need to connect to your PLC to rebuild the project. This is to make sure all of the configs are correct and all the right files are generated. 

Navigate to the folder labeled `Binaries` in your file explorer. Then, navigate to:

`\Binaries\your_project@binary\RES_XXXXXX\Configuration\Projects` 

In this file, there will be a folder labeled `PCWE`. This will be the folder and filepath this document refers to when it says `PCWE`.

<h3> Uploading via SCP </h3>

Ensure your computer is connected to the PLC and the SD card is in the PLC. Open a command prompt terminal. Enter this command:

```
pscp -scp -r "C:\Users\your_user\OneDrive\Documents\PLCnext Engineer\Binaries\project_name@binary\RES_XXXXXX\Configuration\Projects\PCWE" admin@0.0.0.0:/opt/plcnext/
```
You will need to fill in the your_user, project_name@binary, and RES_XXXXXX fields with the ones found in your filepath. The easiest way to do this is to navigate to the `PCWE` folder and then copy the filepath from your file explorer. You will also need to replace 0.0.0.0 with the IP address of your PLC. 

After you enter this command, a password will be requested. Enter the password for admin, found on the front of the PLC. The progress of the transfer will be shown. Once it is complete, after about a minute, the PLC will reboot and the new project will be running. The old project will be archived on the SD card.

<h3> Uploading manually via SFTP </h3>

Open your SFTP client and connect to the PLC. Navigate to the `PCWE` folder on your local machine. Then, open `/opt/plcnext/` on the PLC. Copy the `PCWE` folder on your local machine to the PLC.

![image](https://github.com/user-attachments/assets/49110c24-1bd6-4a7a-b765-447ddec830ba)

Once it is complete, after about a minute, the PLC will reboot and the new project will be running. The old project will be archived on the SD card, and the temporary `PCWE` folder in /opt/plcnext/ will be deleted.

<h2> Uninstalling Upload </h2>

To remove the Upload program from the PLC, you will perform a similar process to installation. 

Using the same SFTP client procedure as before, check to make sure uninstall.sh is present in /opt/plcnext on the PLC. 

Open a session in your SSH client, login to your user, and then root following the same procedure as installation.

You should be in the /opt/plcnext/ directory. If you are not, navigate there by using `cd /opt/plcnext`. Enter the following command, which will give the script the necessary read/write permissions:
```
chmod 777 uninstall.sh
```

Finally, run the script using:
```
./uninstall.sh
```

Similar to installation, you will see an output asking if you would like to uninstall Upload. Enter `y` to uninstall. 

You can now safely reactivate SD card support. The same data concerns still apply, so be aware of what projects are present on the PLC and SD card before using this functionality.
