# PLCnext-file-swap
Loads the project from the SD Card onto the PLC and archives the project from the PLC on the SD Card.

<h2> Materials/Software Needed: </h2>

* PLCnext Control
    * AXC F X152
* Phoenix Contact SD Card
    * Ensure the SD Card has not been reformatted. The Overlay Filesystem is necessary for Swap to be able to find the files
* Computer w/ Windows OS
    * Can also be setup on Linux, but Windows is necessary for PLCnext Engineer projects
* WinSCP
* PuTTY
* PLCnext Engineer
* Ext4 File System Driver for Windows (with write capability)

<h2> Ensure SD Card Support is Deactivated </h2>

SD Card Support must be deactivated before swapping files. If it is left activated, and the SD card has a project on it when inserted, the project on the PLC will be lost. 

After connecting to PLC, open Web Based Management, either through PLCnext Engineer, or directly via web browser at `0.0.0.0/wbm` (replace with your PLC's IP address)

Login to WBM and navigate to the SD Card window under Security. Ensure that `Support for External SD Card` is deactivated. If support is currently activated, deactivate it by pressing the `Deactivate support` button and reboot your PLC.

![image](https://github.com/user-attachments/assets/21671b69-acf0-4a29-b263-6aa7769143c9)

<h2> Transfer files to PLC </h2>

After SD card support is deactivated, login to a new session in WinSCP. Use the IP address of your PLC as the Host name. If this is a fresh PLC, the user name will be `admin` and the password will be the one printed on the front of your PLCnext Control.

![image](https://github.com/user-attachments/assets/d2109d19-b523-492a-afb6-c2f1072121fc)

After connecting, navigate to /opt/plcnext and transfer install.sh, uninstall.sh, and SDCardSwap to this directory. All files needed can be found in this repo.

![image](https://github.com/user-attachments/assets/286c876f-643f-478e-b7d9-0d7ed2e03d84)

<h2> Installing Swap </h2>

Now, open a new session in PuTTY and log into the PLC. Use the same IP address, user, and password as used in the WinSCP session.

![image](https://github.com/user-attachments/assets/82967f32-0015-45bf-8253-ea8998067dca)

Next, enter the following command:
```
sudo passwd root
```
When asked for a password, use the password entered for WinSCP and PuTTY. Enter a new password for the root user. Then, enter `su` and login with the newly created password:
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

You will see an output asking you to wait, then all the necessary files should be installed.

<h2> Performing the Swap </h2>

You will need to upload your project manually to the SD card before performing the swap or else the PLC will just have an empty project assigned to it. This can also be a way to 'delete' the project from the PLC without losing it completely.

If you are using Windows, you will need to download an Ext4 File System Driver in order to read and write to the SD Card. A trial download for a driver can be found here: https://www.paragon-software.com/home/linuxfs-windows/ They have a 10 day free trial, but the software will continue to work after the software expires, just slower. There is also the option to upload the PCWE folder to a Linux computer, and then you should be able to read and write to the SD Card directly.

First, ensure the SD Card is properly formatted by checking that the following filepath exists: `/upperdir/opt/plcnext/projects` . The project will be uploaded to this folder.

Then, open your project in PLCnext Engineer and rebuild the project. Go to `Project` then hit `Rebuild`. You do not need to connect to your PLC to rebuild the project. This is to make sure all of the configs are correct and all the right files are generated. 

In order to upload the project to the SD Card, you will first need to find the project on your computer. Depending on where/how you installed PLCnext Engineer, this could vary slightly. If you are unable to find the PLCnext Engineer folder in Documents, check the Users\your_user\Documents and Users\Public\Documents folders as well. Navigate to:

`C:\Documents\PLCnext Engineer\Binaries\your_project@binary\RES_XXXXXX\Configuration\Projects` 

In this folder you will see a folder called PCWE. Copy this folder to `/upperdir/opt/plcnext/projects` on the SD Card. The project is now uploaded to the SD Card.

![image](https://github.com/user-attachments/assets/d548c1f9-95cf-40b2-9342-b21a42b22573)

After you have an SD card with the desired project uploaded to it, the swapping process is simple. With the PLC powered on and running, insert the SD Card into the SD Card slot. 

After approximately a minute, the PLC will reboot. After rebooting, the projects that was uploaded to the SD Card will be copied to the PLC, the project that was on the PLC will be archived in /opt/plcnext/project_archives on the SD Card, and the project now on the PLC will run. 

You can safely remove the SD Card once the new project is running. You can also leave the SD Card in the PLC if desired, the swap will not be performed again until the SD Card is removed and reinserted. If the PLC is powered on or rebooted while an SD Card is already inserted, you will need to remove and reinsert the SD Card to perform the swap.

Another way to upload the project to the SD Card is through the PLC using WinSCP. In this case, you will likely want to upload the project before performing the swap, so turn off the PLC, then insert the SD Card and turn it back on. This will ensure the swap does not occur before you upload the project.

Connect to the PLC as normal, then navigate to `/media/rfs/externalsd/upperdir/opt/plcnext/projects/`. You can upload the PCWE folder directly to here, but make sure that are in `externalsd`, not `internalsd`, or you risk overwriting the project on the PLC. 

Now, to perform the swap, remove and reinsert the SD Card while the PLC is still running.

<h2> Uninstalling Swap </h2>

In order to remove the Swap program from the PLC so that you may use the SD Card support normally, you will perform a similar process to installation. 

Using the same WinSCP procedure as before, check to make sure uninstall.sh is present in /opt/plcnext on the PLC. 

Open a session in PuTTY, logging into your user, and then root following the same procedure as installation.

You should be in the /opt/plcnext/ directory. If you are not, navigate there by using `cd /opt/plcnext`. Enter the following command, which will give the script the necessary read/write permissions:
```
chmod 777 uninstall.sh
```

Finally, run the script using:
```
./uninstall.sh
```

You can now safely reactivate SD Card support. The same data concerns still apply, so be aware of what projects are present on the PLC and SD Card before using this functionality.
