SubPageActive = true;

PLCNEXTAPPS_UPLOAD_TIMEOUT    = 3000;
AJAX_REQUEST_TIMEOUT = 3000;

// Upload via chunks

appContainerFileChunks   = [];

BytesPerChunk            = 1024 * 1024; //1 MB per chunk
appContainerFileSize     = 0;
appFileLoadedSize        = 0;
currChunkNumber          = 0;
currChunkBlobIdx         = 0;
prevChunkLoadedSize      = 0;
chunksCompletedTransfers = 0;

PLCNEXTAPPS_LastAppsList = undefined;

uploadRetryingCtr = 0;
UPLOAD_RETRY_MAX_CTR = 2;

checkAppsListChangesTimer = undefined;

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    window.clearTimeout(checkAppsListChangesTimer);
    window.clearInterval(checkAppsListChangesTimer);
    delete checkAppsListChangesTimer;
    
    delete SubPageActive;

    delete PLCNEXTAPPS_UPLOAD_TIMEOUT;
    delete AJAX_REQUEST_TIMEOUT;

    // Upload via chunks

    delete appContainerFileChunks;

    delete BytesPerChunk;
    delete appContainerFileSize;
    delete appFileLoadedSize;
    delete currChunkNumber;
    delete currChunkBlobIdx;
    delete prevChunkLoadedSize;
    delete chunksCompletedTransfers;

    delete PLCNEXTAPPS_LastAppsList;

    delete uploadRetryingCtr;
    delete UPLOAD_RETRY_MAX_CTR;

    delete AppManagerService;
}

$(document).ready(function(){

    SetInstallationModeStatus(AppManagerService.IsInstallationModeActive());
    
    $("#id_div_loader").hide();
    
    AppManagerService.TriggerCheckAppsListChanges();

    UpdateInstalledAppsTable();

    // Show page content after page elements are loaded
    $("#id_plcnextapps_page_global_div").show();
        
    $('#id_plcnextapps_install_mode_activate').click(function(event) {
        event.preventDefault();

        let response = AppManagerService.EnableInstallationMode();
        if(response.error == true)
        {
            console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
            OnStateAppManagerError(response.errorCode, response.errorText);
        }
        else
        {
            location.reload();
            //ReloadInstalledAppsTable();
        }
        return false;
    });
    
    $('#id_plcnextapps_install_mode_deactivate').click(function(event) {
        event.preventDefault();

        let response = AppManagerService.DisableInstallationMode();
        if(response.error == true)
        {
            console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
            OnStateAppManagerError(response.errorCode, response.errorText);
        }
        else
        {
            location.reload();
            //ReloadInstalledAppsTable();
        }
        return false;
    });
    
    $('#id_plcnextapps_activation_ok_btn').click(function(event) {
        event.preventDefault();
        let identifier = $("#id_plcnextapps_sm_act_reboot_req_id").text();
        let appname    = $("#id_plcnextapps_sm_restart_appname").text();
        $("#id_div_plcnextapp_restart_confirm").hide();
        $("#id_div_loader").show();
        setTimeout(function() { ActivatePlcnextApp(identifier, appname);}, 20);
    });
    
    $('#id_plcnextapps_deactivation_ok_btn').click(function(event) {
        event.preventDefault();
        let identifier = $("#id_plcnextapps_sm_deact_reboot_req_id").text();
        let appname    = $("#id_plcnextapps_sm_restart_appname").text();
        $("#id_div_plcnextapp_restart_confirm").hide();
        $("#id_div_loader").show();
        setTimeout(function() { DeactivatePlcnextApp(identifier, appname);}, 20);
    });
    
    $('#id_plcnextapps_restart_cancel_btn').click(function(event) {
        event.preventDefault();
        $("#id_div_plcnextapp_restart_confirm").hide();
        OnStateResetInfo();
    });

});

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

function SetInstallationModeStatus(InstallationModeStatus)
{
    console.log("Installation Mode", InstallationModeStatus);
    $("#id_plcnextapps_activation_status_cb" ).prop( "checked", InstallationModeStatus.result);
    if(InstallationModeStatus.result == true)
    {
        $("#id_plcnextapps_install_mode_activate").hide();
        $("#id_plcnextapps_install_mode_deactivate").show();
    }
    else
    {
        $("#id_plcnextapps_install_mode_activate").show();
        $("#id_plcnextapps_install_mode_deactivate").hide();
    }
}

function CheckAppsListChanged(data, status, xhr)
{
    ConnectionStatusOk = true;

    //console.log("Apps List Data ", appsListData);
    if(typeof data.result !== "undefined")
    {
        // Check if names list contains changes
        if(typeof PLCNEXTAPPS_LastAppsList !== 'undefined')
        {
            if (JSON.stringify(data.result) !== JSON.stringify(PLCNEXTAPPS_LastAppsList))
            {
                console.log("Apps List changed!!! Site will be reloaded");
                location.reload();
                //ReloadInstalledAppsTable();           
            }
        }
        
        PLCNEXTAPPS_LastAppsList = data.result;
    }
    if(typeof data.error !== "undefined" && data.error == true)
    {
        OnStateDataErrorOccurred(data.errorText);
    }
    if(typeof PLCNEXTAPPS_UPLOAD_TIMEOUT !== "undefined")
    {
        checkAppsListChangesTimer = setTimeout(AppManagerService.TriggerCheckAppsListChanges, PLCNEXTAPPS_UPLOAD_TIMEOUT);
    }
}

function OnActivatePlcnextApp(identifier, appname, event)
{
    OnStateActivatingApp(appname);
    event.preventDefault();

    let response = AppManagerService.IsRebootRequiredForApp(identifier);
    if(response.error == true)
    {
        $("#id_plcnextapp_start_warning_warning_div").hide();
        console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
        OnStateAppManagerError(response.errorCode, response.errorText);
        $("#id_div_loader").hide();
    }
    else
    {
        $("#id_plcnextapp_start_warning_warning_div").show();
        if(response.rebootRequired == true)
        {
            $("#id_plcnextapps_activation_warning_div").show();
            $("#id_plcnextapps_deactivation_warning_div").hide();
            $("#id_plcnextapps_sm_act_reboot_req_id").text(identifier);
            $("#id_plcnextapps_sm_restart_appname").text(appname);
            $("#id_plcnextapps_deactivation_ok_btn").hide();
            $("#id_plcnextapps_activation_ok_btn").show();
            $("#id_div_plcnextapp_restart_confirm").show();
        }
        else
        {
            $("#id_div_loader").show();
            setTimeout(function() { ActivatePlcnextApp(identifier, appname);}, 20);
        }
    }
    return false;
}

function ActivatePlcnextApp(identifier, appname)
{
    console.log("Activating App " + identifier);

    let response = AppManagerService.ActivateApp(identifier);
    if(response.error == true)
    {
        $("#id_plcnextapp_start_warning_warning_div").hide();
        console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
        OnStateAppManagerError(response.errorCode, response.errorText);
        $("#id_div_loader").hide();
    }
    else
    {
        console.log('App "' + appname + '" activated');
        OnStateAppActivated(appname);
        setTimeout(window.location.reload.bind(window.location), 20);
    }
    return false;
}

function OnDeactivatePlcnextApp(identifier, appname, event)
{
    OnStateDeactivatingApp(appname);
    event.preventDefault();

    let response = AppManagerService.IsRebootRequiredForApp(identifier);
    console.log("Deactivation-Reboot", response);
    if(response.error == true)
    {
		$("#id_plcnextapp_stop_warning_warning_div").hide();
        console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
        OnStateAppManagerError(response.errorCode, response.errorText);
        $("#id_div_loader").hide();
    }
    else
    {
		$("#id_plcnextapp_stop_warning_warning_div").show();
        if(response.rebootRequired == true)
        {
            $("#id_plcnextapps_activation_warning_div").hide();
            $("#id_plcnextapps_deactivation_warning_div").show();
            $("#id_plcnextapps_sm_deact_reboot_req_id").text(identifier);
            $("#id_plcnextapps_sm_restart_appname").text(appname);
            $("#id_plcnextapps_deactivation_ok_btn").show();
            $("#id_plcnextapps_activation_ok_btn").hide();
            $("#id_div_plcnextapp_restart_confirm").show();
        }
        else
        {
            $("#id_div_loader").show();
            setTimeout(function() { DeactivatePlcnextApp(identifier, appname);}, 20);
        }
    }
    return false;
    
}

function DeactivatePlcnextApp(identifier, appname)
{
    console.log("Deactivating App " + identifier);
    
    let response = AppManagerService.DeactivateApp(identifier);
    if(response.error == true)
    {
		$("#id_plcnextapp_stop_warning_warning_div").hide();
        console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
        OnStateAppManagerError(response.errorCode, response.errorText);
        $("#id_div_loader").hide();
    }
    else
    {
        console.log("App " + identifier + " deactivated");
        OnStateAppDeactivated(appname);
        setTimeout(window.location.reload.bind(window.location), 20);
    }
    return false;
}

function InstallPlcnextApp()
{
    $("#id_div_loader").show();

    let response = AppManagerService.InstallApp();
    if(response.error == true)
    {
        console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
        OnStateAppManagerError(response.errorCode, response.errorText);
        $("#id_div_loader").hide();
    }
    else
    {
        console.log("App installed");
        OnStateAppInstalled();
        // delete all file chunks array elements
        appContainerFileChunks = [];
        ResetValues();
        setTimeout(window.location.reload.bind(window.location), 20);
    }
}

function OnUninstallPlcnextApp(identifier, appname, event)
{
    event.preventDefault();
    console.log("Uninstalling App " + identifier);
    OnStateUninstallingApp(appname);
    $("#id_div_loader").show();
    setTimeout(function() {UninstallPlcnextApp(identifier, appname);}, 100);
}

function UninstallPlcnextApp(identifier, appname)
{
    let response = AppManagerService.UninstallApp(identifier);
    if(response.error == true)
    {
        console.log("Error! Code: " + response.errorCode + ", Message: " + response.errorText);
        OnStateAppManagerError(response.errorCode, response.errorText);
        $("#id_div_loader").hide();
    }
    else
    {
        console.log('App "' + appname + '" has been uninstalled');
        OnStateAppUninstalled(appname);
        setTimeout(window.location.reload.bind(window.location), 20);
    }
    return false;
}

function OnAppFileSelected() {
    console.log('PLCnext app container File selected');

    // hide different warnings
        
    // get selected file element
    var appContainerFile = document.getElementById('id_plcnextapps_container_file_input').files[0];
        
    // check file format
    var formatFilter = /(\.app)$/i;
    if (! formatFilter.test(appContainerFile.name)) {
        OnStateInvalidAppContainerFormat();
        console.log("Invalid format of PLCnext App container. Only .app file format is accepted")
        return;
    }
    
    appContainerFileSize = appContainerFile.size;
    
    console.log('PLCnext app container file size = ' + appContainerFileSize);
    
    $("#id_div_loader").show();
    
    if(appContainerFile.type == '')
    {
        $('#id_fwupdate_raucb_filetype').html(' raucb');
    }
    else
    {
        $('#id_fwupdate_raucb_filetype').html(appContainerFile.type);
    }
    
    // Read update container file in slices
    ReadFileSlices(appContainerFile);
    
}

function ReadFileSlices(appContainerFile)
{
    var startUpload = 0;
    var endUpload   = BytesPerChunk;
    
    appContainerFileChunks = [];
    
    var slice = appContainerFile.slice(startUpload, endUpload);
    
    var appFileReader = new FileReader();
    appFileReader.onload = function(e){
        
        appContainerFileChunks.push(e.target.result);
        startUpload = endUpload;
        endUpload = startUpload + BytesPerChunk;
        
        if(startUpload < appContainerFileSize)
        {
            slice = appContainerFile.slice(startUpload, endUpload);
            appFileReader.readAsArrayBuffer(slice);
        } 
        else
        {
            resultFileSize = WbmUtilities.BytesToSize(appContainerFile.size);
            
            StartUploading();
        }
    }
    if(startUpload < appContainerFileSize)
    {
        appFileReader.readAsArrayBuffer(slice);
    }
}

function StartUploading() {
    //event.preventDefault();
    console.log('Starting App installation');
    $("#id_div_loader").show();
    // Reset status/progress bar to 0%
    OnStateUploadProgress(0);
    console.log('slices size = ' + appContainerFileChunks.length);
    
    // Cleanup all temp states
    appFileLoadedSize        = 0;
    chunksCompletedTransfers = 0;

    // Reset variables
    uploadIsSuccessfull = false;
    currChunkBlobIdx    = 0;
    currChunkNumber     = 0;
    
    abortUploading      = false;
    
    // Send Start Downloading (in view of Controller) command to the Controller
    let response = AppManagerService.StartDownloadingApp(appContainerFileSize);
    if(response.error == true)
    {
        OnStateContainerUploadError(response.errorText);
        $("#id_div_loader").hide();
    }
    else
    {
        OnStateUploadingAppContainer();
        // start uploading file via sending first File Chunk
        UploadNextFileChunk();
    }
}

function UploadNextFileChunk()
{
    // Check Range of Chunk Nummer and Chunk Blob Index 
    if((currChunkNumber >= appContainerFileChunks.length)  || (currChunkBlobIdx >= appContainerFileChunks.length))
    {
        return;
    }
    
    // increment current chunk number
    currChunkNumber = currChunkBlobIdx + 1;
    prevChunkLoadedSize = 0;

    AppManagerService.UploadAppContainer(appContainerFileChunks[currChunkBlobIdx]);
}

function AbortUploading() {
    abortUploading = true;
}

function DoContainerProcessing()
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

function OnUploadProgress(evt)
{
    if(evt.lengthComputable == true)
    {
        appFileLoadedSize += (evt.loaded - prevChunkLoadedSize);
        prevChunkLoadedSize   = evt.loaded;

        var uploadPercentCompleted = Math.round(appFileLoadedSize / appContainerFileSize * 100);
        var updateFileBytesLoaded  = WbmUtilities.BytesToSize(appFileLoadedSize)
        var dataBytesRemaining     = WbmUtilities.BytesToSize((appContainerFileSize - appFileLoadedSize));
        
        OnStateUploadProgress(uploadPercentCompleted);
        
        if (uploadPercentCompleted == 100) {
            
            progressPercent = 0;

            procTimer = setInterval(DoContainerProcessing, 450);
        }
    }
}

function OnUploadComplete()
{
    progressPercent = 100;
    
    if(uploadIsSuccessfull == true && abortUploading == false)
    {
        
        console.log("Starting App Installation");
        
        // Send Downloading is finished trigger to the controller
        let response = AppManagerService.FinishDownloadingApp();
        if(response.error == true)
        {
            OnStateContainerUploadError(response.errorText);
            console.log('function finishContainerDownloading failed');
        }
        
        // Install Plcnext App
        console.log("Installing App");
        OnStateInstallingApp();
        setTimeout(function() { InstallPlcnextApp();}, 20);
    }
    else
    {
        OnStateContainerUploadError("Unknown error!");
        $("#id_div_loader").hide();
    }   
}

function ResetValues()
{
    currChunkNumber = 0;
    currChunkBlobIdx = 0;
    prevChunkLoadedSize = 0;
    chunksCompletedTransfers = 0;
}


function HandleFileInputClick(destInputId, event)
{
    document.getElementById(destInputId).click();
    event.preventDefault();
}

function OnStateResetInfo()
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
}

function OnStateInstallingApp()
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_installing_info").show();
}

function OnStateAppInstalled()
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });

    $("#id_plcnextapps_sm_status_installed_info").show();
}

function OnStateInvalidAppContainerFormat()
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });

    $("#id_plcnextapps_sm_invalid_container_format_info").show();
}

function OnStateUninstallingApp(appname)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    
    $("#id_plcnextapps_sm_app_info").show();
    $("#id_plcnextapps_sm_appname_info").text('"' + appname + '"');
    $("#id_plcnextapps_sm_appname_info").show();
    $("#id_plcnextapps_sm_uninstalling_info").show();
}

function OnStateAppUninstalled(appname)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    
    $("#id_plcnextapps_sm_appid_info").text("App " + '"' + appname + '"');
    $("#id_plcnextapps_sm_appid_info").show();
    $("#id_plcnextapps_sm_status_uninstalled_info").show();
}

function OnStateActivatingApp(appname)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_app_info").show();
    $("#id_plcnextapps_sm_appname_info").text('"' + appname + '"');
    $("#id_plcnextapps_sm_appname_info").show();
    $("#id_plcnextapps_sm_activating_info").show();
}

function OnStateAppActivated(appname)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_appid_info").text("App " + '"' + appname + '"');
    $("#id_plcnextapps_sm_appid_info").show();
    $("#id_plcnextapps_sm_status_activated_info").show();
}

function OnStateDeactivatingApp(appname)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_app_info").show();
    $("#id_plcnextapps_sm_appname_info").text('"' + appname + '"');
    $("#id_plcnextapps_sm_appname_info").show();
    $("#id_plcnextapps_sm_deactivating_info").show();
}

function OnStateAppDeactivated(appname)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_appid_info").text("App " + '"' + appname + '"');
    $("#id_plcnextapps_sm_appid_info").show();
    $("#id_plcnextapps_sm_status_deactivated_info").show();
}

function OnStateAppManagerError(errorCode, errorMessage)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    if(errorCode == "RestartScheduled")
    {
        $("#id_main_connection_error_div").show();
        OnStateControllerRebooting();
        window.location.href = "Login.html";
        
    }
    else
    {
        $("#id_plcnextapps_sm_error_occured_appinfo").show();
        $("#id_plcnextapps_sm_opt_msg_error_code_info").show();
        $("#id_plcnextapps_sm_opt_msg_error_code_val").text(errorCode);
        $("#id_plcnextapps_sm_opt_msg_error_code_val").show();
        
        $("#id_plcnextapps_sm_opt_msg_error_msg_info").show();
        $("#id_plcnextapps_sm_opt_msg_error_msg_val").text("\"" + errorMessage + "\"");
        $("#id_plcnextapps_sm_opt_msg_error_msg_val").show();
        
        alert(  $("#id_plcnextapps_sm_opt_msg_error_code_info").text() + " " + $("#id_plcnextapps_sm_opt_msg_error_code_val").text() + "\n"
              + $("#id_plcnextapps_sm_opt_msg_error_msg_info").text() + " " + $("#id_plcnextapps_sm_opt_msg_error_msg_val").text());
    }
}



function OnStateContainerUploadError(errorDescription)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_uploading_error_info").show();
    $("#id_plcnextapps_sm_opt_msg_error_msg_info").show();
    $("#id_plcnextapps_sm_opt_msg_error_msg_val").text("\"" + errorDescription + "\"");
    $("#id_plcnextapps_sm_opt_msg_error_msg_val").show();
}

function OnStateUploadingAppContainer()
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_uploading_info").show();
    $("#id_plcnextapps_sm_opt_msg_text_extension").show();
}

function OnStateUploadProgress(percent)
{
    $("#id_plcnextapps_sm_opt_msg_text_extension").text(" " + percent + "%");
}

function OnStateControllerRebooting()
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_status_reboot_info").show();
}

function OnStateConnectionError(xhr, status, error)
{
    $("#id_plcnextapps_sm_status_box_td span").each(function(){
        $(this).hide();
    });
    $("#id_plcnextapps_sm_status_disconnected_info").show();
}

function UpdateInstalledAppsTable()
{
    let response = AppManagerService.ListInstalledAppsTable();
    $("#id_plcnextapps_installed_apps_table > tbody > tr:last").after(response);
    Language.UpdateActivePageMessages();
}

AppManagerService = (function () {

    let Public = {

        IsInstallationModeActive: function ()
        {
            // Request and set installation mode activation status
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "IsInstallationModeActive",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        EnableInstallationMode: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "EnableInstallationMode",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        DisableInstallationMode: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "DisableInstallationMode",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        IsRebootRequiredForApp: function (identifier)
        {
            let data = "identifier=" + encodeURIComponent(identifier);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "IsRebootRequiredForApp?" + data,
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ActivateApp: function (identifier)
        {
            let data = "identifier=" + encodeURIComponent(identifier);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "ActivateApp?" + data,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        DeactivateApp: function (identifier)
        {
            let data = "identifier=" + encodeURIComponent(identifier);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "DeactivateApp?" + data,
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        InstallApp: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "InstallApp",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        UninstallApp: function (identifier)
        {
            let data = "identifier=" + encodeURIComponent(identifier);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "UninstallApp?" + data,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        StartDownloadingApp: function (appContainerFileSize)
        {
            let data = "fileSize=" + encodeURIComponent(appContainerFileSize);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "StartDownloadingApp?" + data,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        FinishDownloadingApp: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "FinishDownloadingApp",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        TriggerCheckAppsListChanges: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnStateConnectionError = OnStateConnectionError;
            ajaxCallbackFunctions.OnSuccessCallBack = CheckAppsListChanged;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.appManagerDpScriptName + "ListInstalledAppsIds",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            AjaxInterface.PerformAsyncRequest(ajaxReqConfig);
        },

        UploadAppContainer: function (uploadData) {

            var xhrGlobal = $.ajax({
                url: Private.appManagerDpScriptName + "UploadAppContainer",
                type: "POST",
                data: uploadData,
                processData: false,
                contentType: "application",
                dataType: "json",
                async: true,
                cache: false,
                timeout: AJAX_REQUEST_TIMEOUT,
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function (evt) {
                        if (typeof SubPageActive == 'undefined') {
                            return;
                        }
                        if (abortUploading == true) {
                            xhrGlobal.abort();
                            ShowOnAbort();
                        }
                        OnUploadProgress(evt);
                    };
                    xhr.upload.onload = function () {

                    };
                    return xhr;
                },
                success: function (response) {
                    if (typeof SubPageActive == 'undefined') {
                        return;
                    }
                    if (response.error) {
                        alert(response.errorText);
                        uploadIsSuccessfull = false;
                        AbortUploading();
                        OnUploadComplete();
                        console.log(response.errorText);
                    }
                    else {
                        if (currChunkNumber >= appContainerFileChunks.length) {

                            console.log("Upload of update container was successfull");
                            uploadIsSuccessfull = true;
                        }
                        else {
                            //console.log('Upload of update container chunk ' + currChunkNumber + ' successfull');
                            currChunkBlobIdx++;
                            if (abortUploading == false) {
                                UploadNextFileChunk();
                            }
                            else {
                                ShowOnAbort();
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
                    if (uploadRetryingCtr > UPLOAD_RETRY_MAX_CTR) {
                        uploadRetryingCtr = 0;
                        AbortUploading();
                        OnStateContainerUploadError(err);
                        console.log('appFileLoadedSize error = ' + appFileLoadedSize);
                    }
                    else if (abortUploading == false) {
                        uploadRetryingCtr++;
                        console.log('Retrying to Upload Update Container');
                        xhrGlobal.abort();
                        setTimeout(StartUploading, 50);
                    }

                },
                complete: function () {
                    uploadRetryingCtr = 0;
                    chunksCompletedTransfers++;
                    if (currChunkNumber == appContainerFileChunks.length && chunksCompletedTransfers == appContainerFileChunks.length) {
                        uploadIsSuccessfull = true;
                        console.log('Update Completed');
                        OnUploadComplete();
                    }
                },
            });

        },

        ListInstalledAppsTable: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.appManagerDpScriptName + "ListInstalledAppsTable",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }

    }

    let Private = {
        appManagerDpScriptName: "module/AppManager/AppManagerDp/"
    }

    return Public;
})();