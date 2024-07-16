# PLCnext-file-swap
Swaps the project files on the PLCnext Control with the project files on the inserted SD card

<h2> Materials/Software Needed: </h2>

* PLCnext Control
    * AXC F X152
* SD Card
    * Phoenix Contact SD card preferred, but not required. If using normal SD Card, follow additional SD Card setup instructions
* Computer w/ Windows OS
    * Can also be done on Linux, but instructions will be using Windows
* WinSCP
* PuTTY
* PLCnext Engineer

<h2> Ensure SD Card Support is Deactivated </h2>

SD Card Support must be deactivated before swapping files. If it is left activated, and the SD card has a project on it when inserted, the project on the PLC will be lost. 

After connecting to PLC, open Web Based Management, either through PLCnext Engineer, or directly via web browser at `0.0.0.0/wbm` (replace with your PLC's IP address)

![image](https://github.com/user-attachments/assets/bea298c2-8b29-42d8-8612-8c14b7140654)

Login to WBM and navigate to the SD Card window under Security. Ensure that `Support for External SD Card` is deactivated. If support is currently activated, deactivate it by pressing the `Deactivate support` button and reboot your PLC.

![image](https://github.com/user-attachments/assets/21671b69-acf0-4a29-b263-6aa7769143c9)

<h2> Transfer files to PLC </h2>

After SD card support is deactivated, login to a new session in WinSCP. Use the IP address of your PLC as the Host name. If this is a fresh PLC, the user name will be `admin` and the password will be the one printed on the front of your PLCnext Control.

![image](https://github.com/user-attachments/assets/d2109d19-b523-492a-afb6-c2f1072121fc)

After connecting, navigate to /opt/plcnext and transfer install.sh and SDCardSwap to this directory. All files needed can be found in this repo.

![image](https://github.com/user-attachments/assets/286c876f-643f-478e-b7d9-0d7ed2e03d84)

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

After installing the necessary files, we need to upload an initial project to the PLC. Open your desired project in PLCnext Engineer and connect to the PLC. Upload your project as normal.

In order to upload a project to the SD card, you will either need to upload a project manually or by swapping the PLC project with the (currently empty) SD Card project, then uploading to the PLC normally and swapping back.

You will first need to ensure the SD Card is properly formatted. If you are using a Phoenix Contact SD card, the formatting should already be done, so you can skip this next step. 

If you are using a regular SD Card, you will need to ensure that the SD Card has enough space to hold a PLCnext project. You will also need to create multiple folders to mimic enough of the Overlay Filesystem that the Swap program can correctly navigate to the project files. 

Open the SD card on your computer, and create the folder 'upperdir'. Within 'upperdir', create the folder 'opt'. Within 'opt', create the folder 'plcnext'. Finally, within 'plcnext', create the folder 'projects'. 

In order to create the correct layout for a project and manually upload to the SD card, ...WIP

-NEED TO FIGURE OUT HOW TO UPLOAD PROJECT DIRECTLY TO SD CARD W/O UPLOADING TO PLC-

After you have an SD card with the desired project uploaded to it, the swapping process is simple. With the PLC powered on and running, insert the SD Card into the SD Card slot. After approximately a minute, the PLC will reboot. After rebooting, the projects that were on the PLC and the SD card will be swapped, and the project that was previously on the SD Card will run. You can safely remove the SD Card once the new project is running. You can also leave the SD Card in the PLC if desired. If the PLC is powered on while an SD Card is already inserted, you will need to remove and reinsert the SD Card to perform the swap.

<h2> Removing Swap from PLC </h2>

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
