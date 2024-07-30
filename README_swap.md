# PLCnext-file-swap
Loads the project from the SD card onto the PLC and archives the project from the PLC on the SD card.

<h2> Materials/Software needed: </h2>

* PLCnext Control
    * AXC F X152
* SD card
    * Phoenix Contact SD Card preferred, but a normal SD Card can be configured to work
* Computer w/ Windows OS
    * Can also be set up on Linux, but Windows is necessary for PLCnext Engineer projects
* SFTP client (e.g. WinSCP)
* SSH client (e.g. PuTTY)
* PLCnext Engineer
* Ext4 File System Driver for Windows (with write capability)

<h2> Ensure SD card support is deactivated </h2>

SD card Support must be deactivated before swapping files. If it is left activated, and the SD card has a project on it when inserted, the project on the PLC will be lost. 

After connecting to PLC, open Web Based Management, either through PLCnext Engineer, or directly via web browser at `0.0.0.0/wbm` (replace with your PLC's IP address)

Login to WBM and navigate to the SD card window under Security. Ensure that `Support for External SD card` is deactivated. If support is activated, deactivate it by pressing the `Deactivate support` button and reboot your PLC.

![image](https://github.com/user-attachments/assets/21671b69-acf0-4a29-b263-6aa7769143c9)

<h2> Transfer files to PLC </h2>

After SD card support is deactivated, login to a new session in your SFTP client. Use the IP address of your PLC as the Host name. If this is a fresh PLC, the user name will be `admin` and the password will be printed on the front of your PLCnext Control.

![image](https://github.com/user-attachments/assets/d2109d19-b523-492a-afb6-c2f1072121fc)

After connecting, navigate to /opt/plcnext and transfer install_swap.sh, uninstall.sh, and SDcardSwap to this directory. All files needed can be found in this repo.

![image](https://github.com/user-attachments/assets/286c876f-643f-478e-b7d9-0d7ed2e03d84)

<h2> Installing Swap </h2>

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
chmod 777 install_swap.sh
```

Finally, run the installation file using:
```
./install_swap.sh
```

You will see an output asking you to wait, then all the necessary files should be installed.

<h2> Uploading the project </h2>

You will need to upload your project manually to the SD card before performing the swap, or the PLC will just have an empty project assigned to it. This can also be a way to clear the PLC without losing the project.

There are multiple ways to do this, including using SCP to transfer the files, uploading through the PLC, and manually uploading to the SD card directly. If you do not have a Phoenix Contact SD card, you will need to upload manually at 

To upload the project to the SD card, you will first need to find the project on your computer. Depending on where/how you installed PLCnext Engineer, this could vary slightly. To find where the project is stored, in PLCnext Engineer go to Extras, then open the Options. Open the `Directories` tab under `Tools`.

![image](https://github.com/user-attachments/assets/ebe768cd-325e-459f-b820-05362b65a704)

While you have your project open in PLCnext Engineer, rebuild the project. Go to `Project` then hit `Rebuild`. You do not need to connect to your PLC to rebuild the project. This is to make sure all of the configs are correct and all the right files are generated. 

Navigate to the folder labeled `Binaries` in your file explorer. Then, navigate to:

`\Binaries\your_project@binary\RES_XXXXXX\Configuration\Projects` 

In this file, there will be a folder labelled `PCWE`. This will be the folder adn filepath this document refers to when it says `PCWE`.

<h3> Uploading via SCP </h3>

Ensure your computer is connected to the PLC and the SD card is in the PLC. Open a command prompt terminal. Enter this command:

```
pscp -scp -r "C:\Users\your_user\OneDrive\Documents\PLCnext Engineer\Binaries\project_name@binary\RES_XXXXXX\Configuration\Projects\PCWE" admin@0.0.0.0:/media/rfs/externalsd/upperdir/opt/plcnext/projects/
```
You will need to fill in the your_user, project_name@binary, and RES_XXXXXX fields with the ones found in your filepath. The easiest way to do this is to navigate to the `PCWE` folder and then copy the filepath from your file explorer. You will also need to replace 0.0.0.0 with the IP address of your PLC. 

After you enter this command, a password will be requested. Enter the password for admin, found on the front of the PLC. The progress of the transfer will be shown. Once it is complete, you can move on to the `Performing the Swap` step.

<h3> Uploading manually via SFTP </h3>

Open your SFTP client and connect to the PLC. Ensure the SD card is in the PLC. navigate to the `PCWE` folder on your local machine. Then, open `/media/rfs/externalsd/upperdir/opt/plcnext/projects` on the PLC. Copy the `PCWE` folder on your local machine to the PLC.

![image](https://github.com/user-attachments/assets/2160f333-6976-415b-9ce3-d31bd278ab79)

Make sure you are in the correct folder on the PLC. If you navigate to the wrong /opt/plcnext/ you could overwrite the project on the PLC. You can now move to the `Performing the Swap` step.

<h3> Uploading manually to the SD card</h3>

This method is required for the first upload if you are using a normal SD card.

If you are using Windows, you will need to download an Ext4 File System Driver to read and write to the SD card. A trial download for a driver can be found here: https://www.paragon-software.com/home/linuxfs-windows/ They offer a 10-day free trial, but the software will continue to work after the software expires, albeit slower. There is also the option to upload the PCWE folder to a Linux computer, and then you should be able to read and write to the SD card directly with no driver necessary.

If you are using a normal SD card, you will need to create some of the file structure that exists on the Phoenix Contact SD cards. First, you will need to format the SD card as Ext4. You can do this in the same driver that was suggested for reading and writing to Ext4 file systems. To do this in Linux File Systems for Windows, click the three dots icon, then click `Format new volume`. Select your SD card, the Ext4 format, and then click Format. 

After you have formatted the SD card, create the folders upperdir and work. Then, create the folders in this filepath: `upperdir/opt/plcnext/projects`. After uploading the PCWE folder, you will need to create a symlink called current that links to the PCWE folder. Please note that while this SD card can be used for storage and uploading projects to the PLC, it cannot be used to run the PLC itself like a Phoenix Contact SD card.

Ensure the SD card is properly formatted by checking that the following filepath exists: `/upperdir/opt/plcnext/projects` . The project will be uploaded to this folder.

Upload the `PCWE` folder on your local machine to `/upperdir/opt/plcnext/projects`. 

![image](https://github.com/user-attachments/assets/d548c1f9-95cf-40b2-9342-b21a42b22573)

<h2> Performing the Swap </h2>

After you have an SD card with the desired project uploaded to it, the swapping process is simple. With the PLC powered on and running, insert the SD card into the SD card slot. If you used one of the steps where the SD card is already inserted in the PLC, you can either SSH into the PLC and manually run Swap.sh, or just remove and reinsert the SD card.

After approximately a minute, the PLC will reboot. After rebooting, the project that was uploaded to the SD card will be copied to the PLC, the project that was on the PLC will be archived in /opt/plcnext/project_archives on the SD card, and the project now on the PLC will run. 

You can safely remove the SD card once the new project is running. You can also leave the SD card in the PLC if desired, the swap will not be performed again until the SD card is removed and reinserted. If the PLC is powered on or rebooted while an SD card is already inserted, you will need to remove and reinsert the SD card to perform the swap.

<h2> Uninstalling Swap </h2>

To remove the Swap program from the PLC so that you may use the SD card support normally, you will perform a similar process to installation. 

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

You can now safely reactivate SD card support. The same data concerns still apply, so be aware of what projects are present on the PLC and SD card before using this functionality.
