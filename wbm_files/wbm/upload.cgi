#!/bin/bash

# read the content length
CONTENT_LENGTH=$CONTENT_LENGTH

# read the data from stdin
DATA=$(dd bs=1 count=$CONTENT_LENGTH 2>/dev/null)

# extract the file data from the multipart/form-data
BOUNDARY=$(echo "$DATA" | sed -n 's/.*boundary=\([^;]*\).*/\1/p')
FILE_CONTENT=$(echo "$DATA" | sed -n "/--$BOUNDARY/,\$!d;//,//d;s/\r\n.*//p")

# save file to upload directory
UPLOAD_DIR="/opt/plcnext"
echo "$FILE_CONTENT" > "$UPLOAD_DIR/PCWE.zip"

# call script to transfer file to plcnext_upload
#/var/www/plcnext/wbm/file_transfer.sh

# send the response
echo "testing upload.cgi" >> /opt/plcnext/logs/UploadCGI.log
echo "Content=type: text/html"
echo ""
echo "<html><body>File uploaded successfully</body></html>"