#!/bin/bash

# path to the file on the server
FILE_PATH="/plcnext_upload/PCWE.zip"

# PLC details
PLC_USER="admin"
PLC_IP="192.168.1.10"
PLC_DEST="/opt/plcnext/"

# use scp to transfer file
scp "$FILE_PATH" "$PLC_USER@$PLC_IP:$PLC_DEST"