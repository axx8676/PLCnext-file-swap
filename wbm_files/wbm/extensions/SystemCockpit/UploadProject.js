fileChunks = [];
BytesPerChunk = 1024 * 1024;
fileSize = 0;
fileLoadedSize = 0;
currChunkNumber = 0;
currChunkBlobIdx = 0;
prevChunkLoadedSize = 0;
chunksCompletedTransfers = 0;

function CleanUpPageData()
{
    delete BytesPerChunk;
    delete fileSize;
    delete fileLoadedSize;
    delete currChunkNumber;
    delete currChunkBlobIdx;
    delete prevChunkLoadedSize;
    delete chunksCompletedTransfers;
}

function handleFileInputClick(inputId) 
{
    document.getElementById(inputId).click();
}

// prompts the user for a file
function fileSelected() 
{
    var input = document.getElementById('id_project_file_input');
    var file = input.files[0];

    var formatFilter = /(\.zip)$/i;
    if (! formatFilter.test(file.name)) {
        console.log("Invalid format of PLCnext Project. Only .zip file format is accepted")
        return;
    }
    console.log(`File selected: ${file.name}`);

    fileSize = file.size;

    console.log('PLCnext app container file size = ' + fileSize);

    ReadFileSlices(file);
}

function ReadFileSlices(file)
{
    var startUpload = 0;
    var endUpload = BytesPerChunk;

    fileChunks = [];

    var slice = file.slice(startUpload, endUpload);

    var fileReader = new FileReader();
    fileReader.onload = function(e){
        fileChunks.push(e.target.result);
        startUpload = endUpload;
        endUpload = startUpload + BytesPerChunk;

        if (startUpload < fileSize)
        {
            slice = file.slice(startUpload, endUpload);
            fileReader.readAsArrayBuffer(slice);
        }
        else
        {
            resultFileSize = WbmUtilities.BytesToSize(file.size);
            StartUploading();
        }
    }
    if(startUpload < fileSize)
    {
        fileReader.readAsArrayBuffer(slice);
    }
}

function StartUploading() 
{
    console.log('Starting project installation');
    console.log('slices size = ' + fileChunks.length);
    
    fileLoadedSize = 0;
    chunksCompletedTransfers = 0;
    uploadIsSuccessful = false;
    currChunkBlobIdx = 0;
    currChunkNumber = 0;

    abortUploading = false;

    let response = ProjectService.StartDownloading(fileSize);
    if (response.error != true)
    {
        UploadNextFileChunk();
    }
}

function UploadNextFileChunk()
{
    if ((currChunkNumber >= fileChunks.length) || (currChunkBlobIdx >= fileChunks.length))
    {
        return;
    }

    currChunkNumber = currChunkBlobIdx + 1;
    prevChunkLoadedSize = 0;
    ProjectService.UploadProject(fileChunks[currChunkBlobIdx]);
}

//TODO: OnUploadProgress
function OnUploadProgress(evt)
{
    if(evt.lengthComputable == true)
    {
        fileLoadedSize += (evt.loaded - prevChunkLoadedSize);
        prevChunkLoadedSize = evt.loaded;

        var uploadPercentCompleted = Math.round(fileLoadedSize/fileSize * 100);
        var dataBytesRemaining = WbmUtilities.BytesToSize((fileSize - fileLoadedSize));

        if (uploadPercentCompleted == 100) {
            progressPercent = 0;
        }
    }
}

function OnUploadComplete()
{
    progressPercent = 100;

    if(uploadIsSuccessful == true && abortUploading == false)
    {
        console.log("Upload complete");
        let response = ProjectService.FinishDownloading();
        if(response.error == true)
        {
            console.log('function finishDownloading failed');
        }
    }
}

function AbortUploading() {
    abortUploading = true;
}

ProjectService = (function () {
    let Public = {
        StartDownloading: function (fileSize)
        {
            let data = "fileSize=" + encodeURIComponent(fileSize);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                "upload/Project/StartDownloading?" + data,                  // url
                AjaxInterface.AjaxRequestType.GET,                          // requestType
                AjaxInterface.AjaxRequestDataType.JSON,                     // dataType
                "",                                                       // data
                null,                                                       // callbacks
                AjaxInterface.AjaxRequestContentType.APPLICATION_FORM_URL); // contentType    
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        UploadProject: function (uploadData) 
        {
            var xhrGlobal = $.ajasx({
                url: "upload/Project/UploadProject",
                type: "POST",
                data: uploadData,
                contentType: "application",
                dataType: "zip",
                async: true,
                timeout: 3000,
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function (evt) {
                        if (abortUploading == true) {
                            xhrGlobal.abort();
                        }
                        OnUploadProgress(evt);
                    };
                    xhr.upload.onload = function () {

                    };
                    return xhr;
                },
                success: function (response) {
                    if (response.error) {
                        uploadIsSuccessful = false;
                        AbortUploading();
                        OnUploadComplete();
                        console.log(response.errorText);
                    }
                    else {
                        if (currChunkNumber >= fileChunks.length) {
                            console.log("Upload of update container was successful");
                            uploadIsSuccessful = true;
                        }
                        else {
                            console.log('Upload of update container chunk ' + currChunkNumber + ' successful');
                            currChunkBlobIdx++;
                            if (abortUploading == false) {
                                UploadNextFileChunk();
                            }
                        }
                    }
                },
                error: function (req, status, err) {
                    console.log('General error occurred: ', status, err);
                    uploadIsSuccessful = false;
                    if(abortUploading == false) {
                        console.log('Aborting');
                        xhrGlobal.abort();
                    }
                },
                complete: function () {
                    chunksCompletedTransfers++;
                    if (currChunkNumber == fileChunks.length && chunksCompletedTransfers == fileChunks.length) {
                        uploadIsSuccessful = true;
                        console.log('Upload Completed');
                        OnUploadComplete();
                    }
                },
            });
        },

        FinishDownloading: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                "upload/Project/FinishDownloading",                             // url
                AjaxInterface.AjaxRequestType.POST,                             // requestType
                AjaxInterface.AjaxRequestDataType.JSON,                         // dataType
                "",                                                             // data
                null,                                                           // callbacks
                AjaxInterface.AjaxRequestContentType.APPLICATION_FORM_URL);     // contentType
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }
    }

    return Public;
})();