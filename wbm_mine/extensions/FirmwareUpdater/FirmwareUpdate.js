SubPageActive = true; // in cockpit

// common variables
resultFileSize = '';
updateFileBinaryString = "";
uploadIsSuccessfull = false;
abortUploading = false;
xhrGlobal = undefined;
procTimer = 0;
progressPercent = 0;

// Upload via chunks

updateFileChunks         = [];

BytesPerChunk            = 1024 * 1024; //1 MB per chunk
updateFileSize           = 0;
updateFileLoadedSize     = 0;
currChunkNumber          = 0;
currChunkBlobIdx         = 0;
prevChunkLoadedSize      = 0;
chunksCompletedTransfers = 0;

updateRetryingCtr = 0;
UPDATE_RETRY_MAX_CTR = 2;

function CleanUpPageData() //in cockpit
{
    CancelFirmwareUpdate();
    
    delete SubPageActive;

    // common variables
    delete resultFileSize;
    delete updateFileBinaryString;
    delete uploadIsSuccessfull;
    delete abortUploading;
    delete xhrGlobal;
    delete procTimer;
    delete progressPercent;

    // Upload via chunks

    delete updateFileChunks;

    delete BytesPerChunk;
    delete updateFileSize;
    delete updateFileLoadedSize;
    delete currChunkNumber;
    delete currChunkBlobIdx;
    delete prevChunkLoadedSize;
    delete chunksCompletedTransfers ;

    delete updateRetryingCtr;
    delete UPDATE_RETRY_MAX_CTR;

    delete FirmwareUpdaterService;
}

 $(document).ready(function(){
    $('#input-file').before('<input type="button" id="id_fw_update_rauc_file_input" value="File Upload" ></input>');
    $('#input-file').hide();
    $('body').on('click', '#pxc-btn-pa', function() { 
     $('#input-file').trigger('click');    
    });
 });
 

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB'];
    var size = '0 Bytes';
    if (bytes != 0)
    {
        var intval = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        size = (bytes / Math.pow(1024, intval)).toFixed(1) + ' ' + sizes[intval]
    }
    return size;
};

function fileSelected() {
    console.log('Update Container File selected');

    // hide different warnings
    
    showOnFileSelected();
    
    // get selected file element
    var updateFile = document.getElementById('id_fwupdate_raucb_file_input').files[0];
    
    $("#id_fwupdate_raucb_file_text").val(updateFile.name);
    
    // check file format
    var formatFilter = /(\.raucb)$/i;
    if (! formatFilter.test(updateFile.name)) {
        $('#id_fwupdate_invalid_file_format_error').show();
        $('#id_fwupdate_Status_ok').hide();
        $('#id_fwupdate_raucb_fileinfo').hide();
        $('#id_fwupdate_load_button').hide();
        return;
    }
    
    updateFileSize = updateFile.size;
    
    console.log('Update File Size = ' + updateFileSize);
    
    $("#id_div_loader").show();
    
    if(updateFile.type == '')
    {
        $('#id_fwupdate_raucb_filetype').html(' raucb');
    }
    else
    {
        $('#id_fwupdate_raucb_filetype').html(updateFile.type);
    }
    
    // Read update container file in slices
    readFileSlices(updateFile);
}

function readFileSlices(updateFile)
{
    var startUpload = 0;
    var endUpload   = BytesPerChunk;
    
    updateFileChunks = [];
    
    
    var slice = updateFile.slice(startUpload, endUpload);
    
    var upFileReader = new FileReader();
    upFileReader.onload = function(e){
        
        updateFileChunks.push(e.target.result);
        startUpload = endUpload;
        endUpload = startUpload + BytesPerChunk;
        
        if(startUpload < updateFileSize)
        {
            slice = updateFile.slice(startUpload, endUpload);
            upFileReader.readAsArrayBuffer(slice);
        } 
        else
        {
            resultFileSize = bytesToSize(updateFile.size);
            $('#id_fwupdate_raucb_fileinfo').show();
            $('#id_fwupdate_raucb_filename').html('Name: ' + updateFile.name);
            $('#id_fwupdate_raucb_filesize').html(resultFileSize);
            // show update starting button when no file format or size error
            $('#id_fwupdate_load_button').show();
            
            $("#id_div_loader").hide();
        }
    }
    if(startUpload < updateFileSize)
    {
        upFileReader.readAsArrayBuffer(slice);
    }
}

function startUploading() {
    //event.preventDefault();
    console.log('Starting Firmware Update');
    $("#progress_info").show();
    
    // reset status/progress bar to 0%
    $('#id_fwupdate_upload_progressbar').val(0);
    console.log('slices size = ' + updateFileChunks.length);
    showOnStartUploading();
    
    // cleanup all temp states
    updateFileLoadedSize     = 0;
    chunksCompletedTransfers = 0;

    // reset variables
    uploadIsSuccessfull = false;
    currChunkBlobIdx    = 0;
    currChunkNumber     = 0;
    
    abortUploading      = false;
    
    // send Start Downloading (in view of Controller) command to the ler
    let response = FirmwareUpdaterService.StartContainerDownloading(updateFileSize);
    if(response.error == true)
    {
        alert(response.errorText);
        showOnError(true);
    }
    else
    {
        // start uploading file via sending first File Chunk
        uploadNextFileChunk();
    }
    
    $("#id_div_loader").hide();
}

function uploadNextFileChunk()
{
    if(typeof SubPageActive == 'undefined')
    {
        return;
    }
    // Check Range of Chunk Nummer and Chunk Blob Index 
    if((currChunkNumber >= updateFileChunks.length)  || (currChunkBlobIdx >= updateFileChunks.length))
    {
        return;
    }
    
    // increment current chunk number
    currChunkNumber = currChunkBlobIdx + 1;
    prevChunkLoadedSize = 0;
    updateRetryingCtr = 0;
    FirmwareUpdaterService.UploadUpdateFile(updateFileChunks[currChunkBlobIdx]);
}

function abortUpdating() {
    abortUploading = true;
}

function doContainerProcessing()
{
    if(progressPercent == 100)
    {
        clearInterval(procTimer);
    }
    else
    {
        progressPercent = progressPercent + 1;
    }
    
    $('#id_fwupdate_processing_progressbar').val(progressPercent);
}

function onUpdateComplete()
{
    progressPercent = 100;
    $('#id_fwupdate_raucb_file_input').prop('disabled', false);
    if(uploadIsSuccessfull == true && abortUploading == false)
    {
        
        console.log("Starting Firmware Update");

        
        $('#id_fwupdate_update_completed_text').show();
        $('#id_fwupdate_updating_start').show();
        $('#id_fwupdate_uploading_success').hide();
        
        $('#id_fwupdate_updating_fw_info').show();
        
        //Send Downloading is finished trigger to the controller
        let response = FirmwareUpdaterService.FinishContainerDownloading();
        if(response.error == true)
        {
            showOnError(false);
            console.log('function finishContainerDownloading failed');
            alert('Failed to finish container uploading');
        }
        
        $("#id_fwupdate_div_loader").show();
        response = FirmwareUpdaterService.RunFirmwareUpdate();
        // Send Run Update Trigger to the Controller
        if(response.error == true)
        {
            showOnError(false);
            console.log('function runFirmwareUpdate failed');
        }
        else
        {
            // delete all file chunks array elements
            updateFileChunks = [];
            setTimeout(NavigateToMain, 4000);
        }
        $("#id_fwupdate_div_loader").hide();
    }
    else
    {
        CancelFirmwareUpdate();
        showOnError(false);
    }
    
    resetValues();
}

function NavigateToMain()
{
    window.location.href = "Login.html";
}

function resetValues()
{
    currChunkNumber = 0;
    currChunkBlobIdx = 0;
    prevChunkLoadedSize = 0;
    chunksCompletedTransfers = 0;
}

function CancelFirmwareUpdate()
{
    let response = FirmwareUpdaterService.CancelFirmwareUpdate();
    if(response.error == true)
    {
        console.log('function CancelFirmwareUpdate failed');
    }
}

function showOnAbort()
{
    $('#id_fwupdate_uploading_abort').show();
    $('#id_fwupdate_Status_ok').hide();
    
    $('#id_fwupdate_load_button').show();
    $('#id_fwupdate_cancel_button').hide();
    $('#id_fwupdate_cancel_button_span').show();
    
    $("#progress_info").hide();
    
    $('#id_fwupdate_raucb_file_input').prop('disabled', false);
    
}

function showOnError(hideProgressBar)
{
    $('#id_fwupdate_updating_start').hide();
    $('#id_fwupdate_uploading_success').hide();
    $('#id_fwupdate_updating_error').show();
    $('#id_fwupdate_Status_ok').hide();
    $('#id_fwupdate_updating_fw_info').hide();
    
    $('#id_fwupdate_load_button').show();
    $('#id_fwupdate_cancel_button').hide();
    $('#id_fwupdate_cancel_button_span').show();
    
    if(hideProgressBar == true)
    {
        $("#id_fwupdate_upload_progressbar").hide();
    }
}

function showOnStartUploading()
{
    $('#id_fwupdate_Status_ok').show();
    $('#id_fwupdate_upload_response').hide();
    $('#id_fwupdate_invalid_file_format_error').hide();
    $('#id_fwupdate_file_upload_error').hide();
    $('#id_fwupdate_invalid_file_abort').hide();
    $('#id_fwupdate_invalid_file_size_warn').hide();
    $('#id_fwupdate_uploading_abort').hide();
    $('#id_fwupdate_progress_percent').html('');
    $('#id_fwupdate_uploading_success').hide();
    $('#id_fwupdate_processing_file_info').hide();
    $('#id_fwupdate_updating_fw_info').hide();
    $('#id_fwupdate_updating_start').hide();
    $('#id_fwupdate_update_completed_text').hide();
    $('#id_fwupdate_updating_error').hide();
    $('#id_fwupdate_raucb_file_input').prop('disabled', true);

    $('#id_fwupdate_upload_progressbar').show();
    $('#id_fwupdate_processing_progressbar').hide();
    
    
    // hide start updating button
    $('#id_fwupdate_load_button').hide();
    $('#id_fwupdate_cancel_button').show();
    
}

function showOnFileSelected()
{
    $('#id_fwupdate_Status_ok').show();
    $('#id_fwupdate_upload_response').hide();
    $('#id_fwupdate_invalid_file_format_error').hide();
    $('#id_fwupdate_file_upload_error').hide();
    $('#id_fwupdate_invalid_file_abort').hide();
    $('#id_fwupdate_invalid_file_size_warn').hide();
    $('#id_fwupdate_uploading_abort').hide();
    $('#id_fwupdate_uploading_success').hide();
    $('#id_fwupdate_updating_start').hide();
    $('#id_fwupdate_updating_error').hide();

    $('#id_fwupdate_processing_file_info').hide();
    $('#id_fwupdate_uploading_file_info').hide();
    $('#id_fwupdate_updating_fw_info').hide();
    $('#id_fwupdate_upload_progressbar').hide();
    $('#id_fwupdate_upload_transfered_text').hide();
    $('#id_fwupdate_upload_transfered').hide();
    $('#id_fwupdate_upload_remaining_text').hide();
    $('#id_fwupdate_upload_remaining').hide();
    $('#id_fwupdate_progress_percent').hide();
    $('#id_fwupdate_update_completed_text').hide();
    
    $('#id_fwupdate_processing_progressbar').hide();
}

function onUploadProgress(evt)
{
    if(evt.lengthComputable == true)
    {
        updateFileLoadedSize += (evt.loaded - prevChunkLoadedSize);
        prevChunkLoadedSize   = evt.loaded;

        var uploadPercentCompleted = Math.round(updateFileLoadedSize/updateFileSize*100);
        var updateFileBytesLoaded  = bytesToSize(updateFileLoadedSize)
        var dataBytesRemaining     = bytesToSize((updateFileSize - updateFileLoadedSize));
        
        $('#id_fwupdate_uploading_file_info').show();
        $('#id_fwupdate_upload_transfered_text').show();
        $('#id_fwupdate_upload_transfered').show();
        $('#id_fwupdate_upload_remaining_text').show();
        $('#id_fwupdate_upload_remaining').show();
        $('#id_fwupdate_progress_percent').show();
        $('#id_fwupdate_progress_percent').html(uploadPercentCompleted.toString() + '%');
        $('#id_fwupdate_upload_progressbar').val(uploadPercentCompleted);
        $('#id_fwupdate_upload_transfered').html(updateFileBytesLoaded);
        $('#id_fwupdate_upload_remaining').html(dataBytesRemaining);
        $('#id_fwupdate_upload_transfered_name').text($('#id_fwupdate_upload_transfered_name').text());
        $('#id_fwupdate_upload_remaining_name').text($('#id_fwupdate_upload_remaining_name').text());
        
        if (uploadPercentCompleted == 100) 
        {
            progressPercent = 0;
            
            $('#id_fwupdate_uploading_success').show();
            
            $('#id_fwupdate_Status_ok').hide();
            
            $('#id_fwupdate_processing_file_info').show();
            
            $('#id_fwupdate_processing_progressbar').show();
            
            procTimer = setInterval(doContainerProcessing, 450);
            
            $('#id_fwupdate_cancel_button').hide();
            $('#id_fwupdate_cancel_button_span').show();
            
        }
    }
}

function handleFileInputClick(destInputId)
{
    document.getElementById(destInputId).click();
    event.preventDefault();
}

FirmwareUpdaterService = (function () {

    let Public = {

        StartContainerDownloading: function (updateFileSize)
        {
            let requestData = "fileSize=" + encodeURIComponent(updateFileSize);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "StartContainerDownloading?" + requestData,
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        UploadUpdateFile: function (fileChunk) {

            var xhrGlobal = $.ajax({
                url: Private.dpScriptName + "UploadUpdateFile",
                type: "POST",
                data: fileChunk,
                processData: false,
                contentType: "application",
                dataType: "json",
                async: true,
                cache: false,
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function (evt) {
                        if (typeof SubPageActive == 'undefined') {
                            return;
                        }
                        else if (abortUploading == true) {
                            CancelFirmwareUpdate();
                            xhrGlobal.abort();
                            showOnAbort();
                        }
                        onUploadProgress(evt);
                    };
                    xhr.upload.onload = function () {

                    };
                    return xhr;
                },
                success: function (response) {
                    updateRetryingCtr = 0;
                    if (typeof SubPageActive == 'undefined') {
                        return;
                    }
                    if (response.error == true) {
                        alert(response.errorText);
                        uploadIsSuccessfull = false;
                        abortUpdating();
                        onUpdateComplete();
                        console.log(response.errorText);
                    }
                    else {
                        if (currChunkNumber >= updateFileChunks.length) {

                            console.log("Upload of update container was successfull");
                            uploadIsSuccessfull = true;
                        }
                        else {
                            //console.log('Upload of update container chunk ' + currChunkNumber + ' successfull');
                            currChunkBlobIdx++;
                            if (typeof SubPageActive == 'undefined') {
                                return;
                            }
                            else if (abortUploading == false) {
                                uploadNextFileChunk();
                            }
                            else {
                                showOnAbort();
                            }
                        }
                    }
                },
                error: function (req, status, err) {
                    if (typeof SubPageActive == 'undefined') {
                        return;
                    }
                    console.log('General error occured: ', status, err);
                    uploadIsSuccessfull = false;
                    if (updateRetryingCtr > UPDATE_RETRY_MAX_CTR) {
                        updateRetryingCtr = 0;
                        abortUpdating();
                        showOnError(false);
                        console.log('updateFileLoadedSize error = ' + updateFileLoadedSize);
                        CancelFirmwareUpdate();
                    }
                    else if (abortUploading == false) {
                        console.log('Retrying to Upload Update Container');
                        xhrGlobal.abort();
                        setTimeout(startUploading, 50);
                    }
                    updateRetryingCtr++;
                },
                complete: function () {
                    if (typeof SubPageActive == 'undefined') {
                        return;
                    }
                    chunksCompletedTransfers++;
                    if (currChunkNumber == updateFileChunks.length && chunksCompletedTransfers == updateFileChunks.length) {
                        uploadIsSuccessfull = true;
                        console.log('Update Completed');
                        onUpdateComplete();
                    }
                },
            });
        },

        FinishContainerDownloading: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "FinishContainerDownloading",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        RunFirmwareUpdate: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "RunFirmwareUpdate",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        CancelFirmwareUpdate: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "CancelFirmwareUpdate",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }

    }

    let Private = {
        dpScriptName: "module/FirmwareUpdater/FirmwareUpdaterDp/"
    }

    return Public;

})();
