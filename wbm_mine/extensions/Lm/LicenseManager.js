"use strict";

var SubPageActive = true;

var LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME = "module/Lm/LmProvider/";

//Offline activation steps definition
var lmGlobVarOfflineActivationStep =    [  

    {   id              :   0,
        activeElement   :   "licensemanager_offl_act_step_info",
        previousStep    :   null,
        nextStep        :   1,
        execute         :   null,
        completion      :   null
    },
    
    {   id              :   1,
        activeElement   :   "licensemanager_offl_act_step_requestfile", 
        previousStep    :   0,
        nextStep        :   2,
        execute         :   function() {lmDisplaySelectLicenserMenu();},
        completion      :   lmCompletionCheckContextFile,
    },
    
    {   id              :   2,
        activeElement   :   "licensemanager_offl_act_step_updatefile", 
        previousStep    :   1,
        nextStep        :   3, 
        execute         :   function () {lmOfflineActivationStepUpdateFileReset();},
        completion      :   lmCompletionCheckUpdateFile
    },
    
    {   id              :   3,
        activeElement   :   "licensemanager_offl_act_step_createreceiptfile", 
        previousStep    :   2,
        nextStep        :   null,
        execute         :   function() {lmSendQueryGetContainerTypeStatus(fillContainerReceiptSelectionList);},
        completion      :   lmCompletionCheckReceiptFile
    }

];

//Active Task
var lmGlobVarOfflineActivationActiveStepId = null;
var lmContextFileDownload = 0;
var lmUpdateFileUpload = 0;
var lmReceiptFileDownload = 0;
var lmAccessType = "Local";

function CleanUpPageData()
{    
    document.removeEventListener('keyup', CloseModalWithEsc);
    SubPageActive = null;
    lmGlobVarOfflineActivationStep = null;
    lmGlobVarOfflineActivationActiveStepId = null;
    lmContextFileDownload = 0;
    lmUpdateFileUpload = 0;
    lmReceiptFileDownload = 0;
    lmAccessType = "Local";
    $("#id_licensemanager_client_configuration_form").removeData('validator');
    $(document).off("LanguageChanged");
}

function lmSanitizeInput(data)
{
    let textArea = document.createElement("textarea");
    textArea.innerText = data;
    return textArea.innerHTML;
}

function lmUpdateViewByAccessType()
{
    if (lmAccessType === "Network")
    {
        $("div.c_licensemanager_access_type_local").hide();
        $("div.c_licensemanager_access_type_network").show();
    }
    else
    {
        $("div.c_licensemanager_access_type_local").show();
        $("div.c_licensemanager_access_type_network").hide();
    }

}

function lmSetAccessType(payload)
{
    lmAccessType = payload.data["accessType"];
    setTimeout(function(){}, 1000);
    lmUpdateViewByAccessType();
}

$(document).ready(function() 
{
    //Initial call
    lmSendQueryGetContainers(lmDisplayContainerTableOverview);
    lmResetOfflineActivation();
    
    lmSendQueryGetConfiguration(lmSetAccessType);
    
    $(".c_licensemanager_tab_content").hide();
    $("#id_licensemanager_tab_content_overview").show();

    $("#btn_licensemanager_overview_refresh").click(function(event)
    {
        event.preventDefault();
        lmSendQueryForceCacheUpdate(lmUpdateContainerTable);
    });
    
    $("#id_licensemanager_modal_productitem_details_close").click(function(event)
    {
        $("#id_div_licensemanager_modal_productitem_details").hide();
    });
    
    $("#id_licensemanager_modal_update_results_close").click(function(event)
    {
        $("#id_div_licensemanager_modal_update_results").hide();
    });
    
    $("#id_licensemanager_modal_btn_storage_reset_abort").click(function(event)
    {
        $("#id_div_licensemanager_modal_storage_reset").hide();
    });
    
    $("#id_licensemanager_modal_btn_storage_reset_apply").click(function(event)
    {
        lmResetStorageStart();
        event.preventDefault();
    });
    
    
    //Select offline activation action
    $("#btn_licensemanager_offl_act_select_task").click(function(event)
    {   
        event.preventDefault();
    });
    

    //Next step of offline activation
    $("#btn_licensemanager_offl_act_step_control_next").click(function(event)
    {  
        event.preventDefault();
        lmNextStepOfflineActivation();    
    });
    
    //Previous step of offline activation
    $("#btn_licensemanager_offl_act_step_control_back").click(function(event)
    {
        event.preventDefault();
        lmResetMessages();
        lmPreviousStepOfflineActivation();
    });
    
    //Cancel offline activation
    $("#btn_licensemanager_offl_act_step_control_cancel").click(function(event)
    {
        event.preventDefault();
        lmResetMessages();
        lmResetOfflineActivation();
    });
    
    //finish offline activation
    $("#btn_licensemanager_offl_act_step_control_finish").click(function(event)
    {
        event.preventDefault();
        lmResetMessages();
        lmResetOfflineActivation();
    });
    
    //Event listener "Container overview"
    $("#id_licensemanager_overview_tab").click(function(event)
    {   
        event.preventDefault();
        lmSendQueryGetContainers(lmDisplayContainerTableOverview);
    });
    
    //Event listener "Set configuration"
    $("#id_lmconfig_save_config_restart_button").click(function(event)
    {   
        event.preventDefault();

        if($("#id_licensemanager_client_configuration_form").valid() == true)
        {
            $("#id_lanconfig_save_restart_modal").show();
            $("#id_licensemanager_modal_activate_restart").show();
        }        
    });
    
        //Event listener "Discard"
    $("#id_lmconfig_discard_config_button").click(function(event)
    {   
        event.preventDefault();
        lmSendQueryGetConfiguration(lmFillConfiguration);
        ReloadValidation("#id_licensemanager_client_configuration_form");
    });
    
    $("#id_licensemanager_restart_config_cancel_btn").click(function(event)
    {  
        event.preventDefault();
        $("#id_licensemanager_modal_activate_restart").hide();
    });
    
    $("#id_licensemanager_restart_config_ok_btn").click(function(event)
    {  
        event.preventDefault();
        var configuration = lmGetConfigurationFromHtml();
        lmSendQuerySetConfiguration(configuration, null);
        $("#id_licensemanager_modal_activate_restart").hide();
    });
    
    //Tab control event listener
    $(".pxc-pd-tabs h2 a").click(function(event)
    {   
        event.preventDefault();
        var currentObjectId = $(this).attr('id');
        var match = currentObjectId.match(/(?:id_licensemanager_)(.+)(?:_tab)/);   
               
        if ((match !== null) && (match.length >= 1)) 
        {
                         
            $(".c_licensemanager_tab_content").hide();
            $("#id_licensemanager_tab_content_"+match[1]).show();


            $(".c_licensemanager_link_tab").removeClass("pxc-tab-on");
            $(".c_licensemanager_tab_content").removeClass("pxc-active-tab");
            $("#"+currentObjectId).addClass("pxc-tab-on");
            $("#id_licensemanager_tab_content_"+match[1]).addClass("pxc-active-tab");
            
        }
        else
        {
            console.error("Failed to load '" + match[1] + "'.");        
        }
              
    });
    
     //Create device-bound container
    $("#id_licensemanager_offl_act_btn_create_device_container").click(function(event)
    {  
        event.preventDefault();
        var containerType = $("#id_licensemanager_select_container_type_offline_step").val();
        lmSendQueryCreateContainer(containerType, lmHandleExecuteLicenseUpdateLifDone);
    });       
    
     //Open file selector for lif file selection
    $("#id_licensemanager_offl_act_btn_lif_browse").click(function(event)
    {  
        event.preventDefault();
        $("#id_licensemanager_offl_act_lif_file_select").trigger("click");   
    });   
    
    $("#id_licensemanager_cmb_offl_act_select_licenser").change(function(event)
    {
        lmDisplaySelectLicenserMenu();
    });

    $("#id_licensemanager_btn_context_man_download").click(function(event)
    {         
        event.preventDefault();
    });   
    
    $("#id_licensemanager_offl_act_lif_file_select").change(function(event)
    {
        var file = $("#id_licensemanager_offl_act_lif_file_select").prop("files")[0]; 
        $("input#id_licensemanager_offl_act_input_lif_file").val(file.name);  
        
        
        if ( !lmValidateFileWibuCmLif(file.name))
        {
             $("#id_licensemanager_offl_act_btn_lif_import").hide();
             lmSetValidationError("id_licensemanager_offl_act_input_lif_file", "InvalidFileType", "Invalid file type.");
        }
        else
        {
            $("#id_licensemanager_offl_act_btn_lif_import").show();
            lmResetValidationError("id_licensemanager_offl_act_input_lif_file");
        }        
        
    });          
    
    $("#id_licensemanager_offl_act_btn_lif_import").click(function(event)
    {  
        event.preventDefault();
        var file = $("#id_licensemanager_offl_act_lif_file_select").prop("files")[0]; 

        lmTriggerFileUpload(file, lmHandleFileReaderLifDone);
    });
    
    //Open file selector for lif file selection
    $("#id_licensemanager_offl_act_btn_rauc_browse").click(function(event)
    {  
        event.preventDefault();
        $("#id_licensemanager_offl_act_rau_file_select").trigger("click");   
    });   
    

    $("#id_licensemanager_offl_act_rau_file_select").change(function(event)
    {
        var file = $("#id_licensemanager_offl_act_rau_file_select").prop("files")[0]; 
        $("input#id_licensemanager_offl_act_input_rauc_file").val(file.name);  
        
        
        var fileFormat = lmGetSelectedFileFormat();
        var result = false;
        
        if (fileFormat === "advanced")
        {
            result = lmValidateFileJson(file.name);            
        } 
        else 
        {
            result = lmValidateFileWibuCmRaU(file.name);
        }
        
        
        if (!result)
        {
             $("#id_licensemanager_offl_act_btn_rauc_file_upload").hide();
             lmSetValidationError("id_licensemanager_offl_act_input_rauc_file", "InvalidFileType", "Invalid file type.");
        }
        else
        {
            $("#id_licensemanager_offl_act_btn_rauc_file_upload").show();
            lmResetValidationError("id_licensemanager_offl_act_input_rauc_file");
        }        
        
    });          
    
    $("#id_licensemanager_offl_act_btn_rauc_file_upload").click(function(event)
    {  
        event.preventDefault();
        var file = $("#id_licensemanager_offl_act_rau_file_select").prop("files")[0]; 

        lmTriggerFileUpload(file, lmHandleFileReaderRauDone);
    });
    
    $("#id_licensemanager_btn_container_type_create").click(function(event)
    {  
        event.preventDefault();
        var setContainerType = $("#id_licensemanager_select_container_type").val();
        lmCreateContainerByContainerType(setContainerType);
    });
    
    // Init validators
    Validation("#id_licensemanager_client_configuration_form");
    lmUpdateViewByAccessType();

});

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) 
{
    
    ReloadValidation("#id_licensemanager_client_configuration_form");
}

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

function lmCompletionCheckContextFile()
{
    if (lmContextFileDownload >= 1)
    {
        //At least one context file has been downloaded ==> step completed
        lmContextFileDownload = 0;
        return true;
    }
    else 
    {
        return false;
    }
}

function lmCompletionCheckUpdateFile()
{
    if (lmUpdateFileUpload >= 1)
    {
        //At least one update file has been uploaded ==> step completed
        lmUpdateFileUpload = 0;
        return true;
    }
    else 
    {
        return false;
    }
}

function lmCompletionCheckReceiptFile()
{
    if (lmReceiptFileDownload >= 1)
    {
        //At least one receipt file has been downloaded ==> step completed
        lmContextReceiptDownload = 0;
        return true;
    }
    else 
    {
        return false;
    }
}


function lmHandleFileReaderLifDone(fileData)
{
    //Create container
    lmSendQueryExecuteLicenseUpdate(fileData, lmHandleExecuteLicenseUpdateLifDone);
}

function lmHandleFileReaderRauDone(fileData)
{
    //Execute license update
    lmSendQueryExecuteLicenseUpdate(fileData, lmHandleExecuteLicenseUpdateRauDone);
}

function lmCreateHtmlCodeUpdateStatus(key, className, successValue, value)
{
    var statusClass = "c_licensemanager_status_error";
    var messageClass = "c_licensemanager_status_message_" + value.toLowerCase();
            
    if (successValue === value)
    {
        statusClass = "c_licensemanager_status_success";
    }
    
    var htmlCode = "<tr><td class=\"" + className + "\" style=\"font-weight: bold;\">" + key + "</td><td class=\"" + statusClass + " " + messageClass + "\">" + value + "</td></tr>";
    return htmlCode;  
}

function lmCreateStorageIdentifierName(value)
{
    var storageIdentifierName = "c_licensemanager_storage_identifier_name_" + value.toLowerCase();
    return storageIdentifierName;
}

function lmCreateHtmlCodeUpdateValue(key, className, value)
{
    var htmlCode = "<tr><td class=\"" + className + "\" style=\"font-weight: bold;\">" + key + "</td><td>" + value + "</td></tr>";
    return htmlCode;  
}

function lmCreateHmtlCodeTableRowDownloadContextFile(containerId, containerType, storageIdentifierName, storageIdentifierValue, firmCode, fileType)
{
       var firmCodeAsString = "-";
           
       if (firmCode !== 0)
       {
           firmCodeAsString = firmCode;
       }       
       
       var containerTypeValue = lmContainerTypeToString(containerType);

       var htmlCode =  "<tr><td><span class=\"pxc-no-break\">" + containerId + "</span></td><td><span class=\"c_lm_container_type_" + containerType.toLowerCase() + "\">" +  containerTypeValue + "</span>";

       htmlCode += "<br>";

       if (storageIdentifierName !== null && storageIdentifierName !== '')
       {
            htmlCode += "<span class=\"" + lmCreateStorageIdentifierName(storageIdentifierName) + "\">" + storageIdentifierName + "</span>: ";
       }
        
       if (storageIdentifierValue !== null && storageIdentifierValue !== '')
       {
            htmlCode += "<span>" + storageIdentifierValue + "</span>";
       }
       
       var fileFormat = lmGetSelectedFileFormat();
       var fileName = "";
       
       if (fileFormat === "basic")
       {
            if (fileType === "Receipt")
            {
                fileName = containerId + ".WibuCmRaR";
            }
            else 
            {
                fileName = containerId + ".WibuCmRaC";
            }                
       }
       else
       {
            if (fileType === "Receipt")
            {
                fileName = containerId + ".PLCnextRaR";
            }
            else 
            {
                fileName = containerId + ".PLCnextRaC";
            }                
       }
       
       htmlCode += "<td>" + firmCodeAsString + "</td><td><div class=\"pxc-div-css-table-vm-align\"><div><span>" + fileName + "</span></div><div><button class=\"pxc-btn-download\" onclick=\"lmCreateAndDownloadContextFile('" + containerId + "'," + firmCode + ",'" + fileType + "','" + fileFormat + "')\"></button></div></div></td>";
       return htmlCode;
}

function lmHandleExecuteLicenseUpdateLifDone(data)
{
    if (data === null || data.dataType !== "executeLicenseUpdateResult")
    {
        //Nothing to do
        return;
    }

    if (data.data.status === "success" && data.data.updateResults.length >= 1)
    {
        lmResetMessages();
                
        //Hide all selections
        $("#id_licensemanager_offl_act_step_requestfile").find("div.c_licensemanager_cmb_offl_act_select_licenser_item").hide();
        $("div#id_licensemanager_offl_act_div_create_context_select_item").show();
        
        lmDisplaySelectLicenserMenu();
        $("#id_licensemanager_cmb_offl_act_select_licenser").val("0");
    }
    else 
    {
        lmSetMessage("error", "CreatingContainerFailed", "Creating container failed.");
        lmShowModalLicenseUpdateResults(data);
    }

}

function lmHandleExecuteLicenseUpdateRauDone(data)
{
    if (data === null || data.dataType !== "executeLicenseUpdateResult")
    {
        //Nothing to do
        return;
    }

    if (data.data.status === "success")
    {
        lmUpdateFileUpload++;
        lmResetMessages();
    }
    else 
    {
        lmSetMessage("error", "LicenseUpdateFailed", "License update failed.");
    }
    
    lmShowModalLicenseUpdateResults(data);

}


function lmShowModalLicenseUpdateResults(data)
{
    var htmlCode = "";
    var status = "Error";
    
    if ( data.data.status === "success")
    {
        status = "Success";
    }

    htmlCode += lmCreateHtmlCodeUpdateStatus("Status", "c_licensemanager_td_status", "Success", status);
    htmlCode += lmCreateHtmlCodeUpdateValue("Affected Items", "c_licensemanager_td_affected_items", data.data.updateResults.length);
    
    if ( data.data.status === "error")
    {
        htmlCode += lmCreateHtmlCodeUpdateValue("Error", "c_licensemanager_td_error", data.data.error);
        htmlCode += lmCreateHtmlCodeUpdateValue("Error Code", "c_licensemanager_td_errorcode", data.data.errorCode);
    }

    lmFillTableLicenseUpdateResults("id_licensemanager_table_update_results", htmlCode);
    
    $("#id_div_licensemanager_modal_update_results").show();
}

function lmShowModalCreateContextResults(data)
{
    var htmlCode = "";
    htmlCode += lmCreateHtmlCodeUpdateStatus("Status", "c_licensemanager_td_status", "Success", "Error");
    htmlCode += lmCreateHtmlCodeUpdateValue("Error", "c_licensemanager_td_error", data.data.details.data.error);
    htmlCode += lmCreateHtmlCodeUpdateValue("Error Code", "c_licensemanager_td_errorcode", data.data.details.data.errorCode);

    lmFillTableLicenseUpdateResults("id_licensemanager_table_update_results", htmlCode);
    
    $("#id_div_licensemanager_modal_update_results").show();
}

function lmDisplaySelectLicenserMenu()
{
    lmSendQueryGetContainerTypeStatus(lmDisplayContainerSelectionList);
}

function lmTransformContainerTypeStatusToContainerList(payload)
{
    var containerList = [];
                    
    //Container in container array
    for (var containerTypeIndex in payload.data) 
    {
        
        if (payload.data[containerTypeIndex].status === "Active")
        {
            var containerType = payload.data[containerTypeIndex].name;
            var storageIdentifierValue = payload.data[containerTypeIndex].storageIdentifierValue;
            var storageIdentifierName = payload.data[containerTypeIndex].storageIdentifierName;
                    
            for (var containerIndex in payload.data[containerTypeIndex].containers)
            {
                var containerId = payload.data[containerTypeIndex].containers[containerIndex].containerId;
                
                for (var firmCodeIndex in payload.data[containerTypeIndex].containers[containerIndex].firmCodes)
                {
                    var containerObj = new Object();
                    containerObj.containerId = containerId;
                    containerObj.containerType = containerType;
                    containerObj.storageIdentifierName = storageIdentifierName;
                    containerObj.storageIdentifierValue = storageIdentifierValue;
                    containerObj.firmCode = payload.data[containerTypeIndex].containers[containerIndex].firmCodes[firmCodeIndex];
                    containerList.push(containerObj);
                }
            }       
        }
    }
    
    return containerList;
}

function lmDisplayContainerSelectionList(payload)
{
    //Hide all selections
    $("#id_licensemanager_offl_act_step_requestfile").find("div.c_licensemanager_cmb_offl_act_select_licenser_item").hide();
        
    if (payload === null || payload.dataType === undefined || payload.dataType !== "containerTypeStatus")
    {
        //Nothing to do
        lmSetMessage("error", "QueryFailed", "Query failed.");
        return;
    }
        
    var containerList = lmTransformContainerTypeStatusToContainerList(payload);
    
    if (containerList.length === 0)
    {
        lmResetMessages();
        //No container exists ==> show import lif life
        $("div#id_licensemanager_offl_act_div_import_lif_file").show();
        $("div#id_licensemanager_offl_act_div_import_lif_file").find("div.c_licensemanager_offl_act_div_no_container").show();
        return;
    }
    else
    {
        //At least one container exists
        lmResetMessages();
        $("div#id_licensemanager_offl_act_div_create_context_select_item").show();
        fillContainerContextSelectionList(containerList);
    }
}

function lmValidateAjaxResponse(payload, textStatus, jqXHR, callbackFunction)
{
        //Content type is json
        if (jqXHR.getResponseHeader("Content-Type").match(/json/i))
        {
            //Payload is message
            if (payload.dataType === "message")
            {
                //Status is "error"
                if (payload.data.messageId !== undefined)
                {
                    //Display error with message id to allow translation
                    lmSetMessage(payload.data.messageType, payload.data.messageId, payload.data.message);
                }
                else
                {
                    //Display error without message id 
                    lmSetMessage(payload.data.messageType, null, payload.data.message);
                }
                callbackFunction(null);

            }
            else 
            {               
               //Callback function will parse data
               if (callbackFunction !== null)
               {
                    callbackFunction(payload);
               }
            }
            
        }
        //Content type is text
        else if ( jqXHR.getResponseHeader("Content-Type").match(/text/i) ) 
        {
            if (payload === "no access")
            {
                lmSetMessage("error", "NoPermission", "No permission. Session may have expired.");
            }
            else
            {
                lmSetMessage("error", "QueryFailed", "Query failed.");
            }
            
            callbackFunction(null);
        }
        else 
        {
            //Unexpected content type
            lmSetMessage("error", "InvalidData", "Invalid data.");  
            callbackFunction(null);
        }
}


function lmSendQueryGetContainers(callbackFunction) 
{
    $("#id_licensemanager_div_loader").show();
    
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "GetContainers?",
        type: "GET",
        success: function(data, textStatus, jqXHR) 
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
            $("#id_licensemanager_div_loader").hide();
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {
            console.error("LicenseManager.GetContainers: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null);
            $("#id_licensemanager_div_loader").hide();
        }
    });
    
}

function lmSendQueryGetContainerTypeStatus(callbackFunction) 
{        
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "GetContainerTypeStatus?",
        type: "GET",
        success: function(data, textStatus, jqXHR) 
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {
            console.error("LicenseManager.GetContainerTypeStatus: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null); 
        }
    });
    
}

function lmSendQueryGetProductItemDetails(containerId, firmCode, productCode, productItemReference, callbackFunction)
{ 
    
    var queryParameters = "containerId=" + containerId + "&firmCode=" + firmCode + "&productCode=" + productCode + "&productItemReference=" + productItemReference;
    
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "GetProductItem?",
        data : queryParameters,
        type: "POST",
        success: function(data, textStatus, jqXHR)  
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {          
            console.error("LicenseManager.GetProductItem: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null); 
        }
    });
}

function lmSendQueryForceCacheUpdate(callbackFunction) 
{
    $("#id_licensemanager_div_loader").show();
    
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "ForceCacheUpdate?",
        type: "GET",
        success: function(data, textStatus, jqXHR) 
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
            $("#id_licensemanager_div_loader").hide();
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {
            console.error("LicenseManager.GetContainers: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null); 
            $("#id_licensemanager_div_loader").hide();
        }
    });
    
}

function lmSendQueryGetConfiguration(callbackFunction) 
{        
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "GetConfiguration?",
        type: "GET",
        success: function(data, textStatus, jqXHR) 
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {
            console.error("LicenseManager.GetConfiguration: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null); 
        }
    });
    
}


function lmSetMessage(type, messageId, message)
{
    lmResetMessages();
        
    var target = $("div.c_licensemanager_tab_content.pxc-active-tab").first();
    
    if (target.find("div.pxc-f-gradbox:visible").first().length === 1)
    {
        target = target.find("div.pxc-f-gradbox:visible").first();
    }
    
    
    var messageClass = "";
    
    var typeSymbol = "<div class=\"pxc-exclamation\"><div>!</div>";
    
    if (type === "info")
    {
        typeSymbol = "<div class=\"pxc-information\"><div>i</div>";
    }

    if (messageId)
    {
        messageClass = "c_licensemanager_" + type + "_message_" + messageId.toLowerCase();
    }

    var htmlCode = "<div class=\"c_licensemanager_message c_licensemanager_" + type + "_message cf\" style=\"margin-bottom:14px\"><div><div class=\"pxc-" + type + "-general-msg-wrp\"><div class=\"pxc-" + type + "-msg\">" + typeSymbol + "</div><span class=\"pxc-msg-txt " + messageClass + "\">" + message + "</span></div></div></div></div>";    
    
    //Check if node exists        
    if ( target.find("div.c_licensemanager_" + type + "_message").length !== 0 )
    {
        //Replace
        target.find("div.c_licensemanager_" + type + "_message").find("span.pxc-msg-txt").replaceWith("<span class=\"pxc-msg-txt " + messageClass + "\">" + message + "</span>");
    }
    else
    {
        var hiddenHtmlCode = $(htmlCode).hide();
        target.prepend(hiddenHtmlCode); 
    }
    
    target.find("div.c_licensemanager_" + type + "_message").fadeIn("slow", function()
    {
        target.find("div.c_licensemanager_" + type + "_message").show();
    });
    
    //Load messages
    Language.UpdateActivePageMessages();

}

function lmResetMessages()
{
    var target = $("div.c_licensemanager_tab_content");

    target.find("div.c_licensemanager_message").fadeOut("slow", function()
    {
        target.find("div.c_licensemanager_message").hide();
    });
}

function lmSetValidationError(target, messageId, message)
{
    
    var messageClass = "";

    if (messageId)
    {
        messageClass = "c_licensemanager_error_message_" + messageId.toLowerCase();
    }

    var htmlCode = "<div class=\"c_licensemanager_validation_error\"><div class=\"pxc-error-msg-wrp\"><div class=\"pxc-error-msg\"><div class=\"pxc-exclamation\"><div>!</div></div><span class=\"pxc-msg-txt " + messageClass + "\">" + message + "</span></div></div></div>";    
    
    //Check if node exists
    if ( $("#" + target).next().is("div.c_licensemanager_validation_error"))
    {    
        $("#" + target).next().find("span.pxc-msg-txt").first().replaceWith("<span class=\"pxc-msg-txt " + messageClass + "\">" + message + "</span>");

    }
    else
    {
        $("#" + target).after(htmlCode); 
    }
    
    //Load messages
    Language.UpdateActivePageMessages()

}

function lmResetValidationError(target)
{
    if ($("#" + target).next().is("div.c_licensemanager_validation_error"))
    {
        $("#" + target).next().remove();
    }
}

function lmValidateContainerId(containerId)
{
    //Validate parameters
    var expression = /[0-9]+-[0-9]+/;
    return (expression.test(containerId) ? true : false);
}

function lmValidateFirmCode(firmCode)
{
    //Validate parameters
    var expression = /^[0-9]+$/;
    return (expression.test(firmCode) ? true : false);
}

function lmSendQueryCreateContextInfo(containerId, firmCode, fileType, fileFormat)
{

    if (!lmValidateContainerId(containerId))
    {
        lmSetMessage("error", "InvalidQueryParameter", "Invalid query parameter.");
        return;
    }
    
    if (!lmValidateFirmCode(firmCode))
    {
        lmSetMessage("error", "InvalidQueryParameter", "Invalid query parameter.");
        return;
    }
    
    var queryParameters = "containerId="+containerId+"&firmCode="+firmCode+"&fileType="+fileType+"&fileFormat="+fileFormat;
        
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "GetContextInfo?",
        data : queryParameters,
        type: "POST",
        success: function(data, textStatus, jqXHR)
        {
                        
            //Check content type
            if (jqXHR.getResponseHeader("Content-Type").match(/text\/plain/i))
            {
                var contentDispo = jqXHR.getResponseHeader("Content-Disposition");
                var filename = "";
                            
                if (fileFormat === "basic")
                {
                    var regularExpr = /(?:filename=")([0-9]+-[0-9]+)/;
                    var matchArray = regularExpr.exec(contentDispo);
                    var extension = "";
                    
                    if (fileType === "Context")
                    {
                        extension = "WibuCmRaC";
                    }
                    else if (fileType === "Receipt")
                    {
                        extension = "WibuCmRaR";
                    }
                    
                    filename = matchArray[1] + "." + extension;
                }
                else 
                {
                    var regularExpr = /(?:filename=")(.+[.].+)(?:")/;
                    var matchArray = regularExpr.exec(contentDispo);
                    filename = matchArray[1]
                } 
                lmResetMessages();
                lmDownloadFile(data, "plain/text; charset=ISO-8859-1", filename);
                
                if (fileType === "Context")
                {
                    lmContextFileDownload++;
                }
                else if (fileType === "Receipt")
                {
                    lmReceiptFileDownload++;
                }
                
            }
            //Content type is json
            else if  (jqXHR.getResponseHeader("Content-Type").match(/json/i))
            {
                //Payload is message
                if (data.dataType === "message")
                {
                    //Status is "error"
                    if (data.data.messageId !== undefined)
                    {
                        //Display error with message id to allow translation
                        lmSetMessage("error", data.data.messageId, data.data.message);
                        lmShowModalCreateContextResults(data);
                    }
                    else
                    {
                        //Display error without message id 
                        lmSetMessage("error", null, data.data.message);
                    }
                }
                else 
                {
                    //Unexpected content type
                    lmSetMessage("error", "InvalidData", "Invalid data received.");  
                }       
            
            }
            //Content type is text
            else if ( jqXHR.getResponseHeader("Content-Type").match(/text/i) ) 
            {
                if (data === "no access")
                {
                    lmSetMessage("error", "NoPermission", "No permission. Session may have expired.");
                }
                else
                {
                    lmSetMessage("error", "QueryFailed", "Query failed.");
                }
                
            }
            else 
            {
                //Unexpected content type
                lmSetMessage("error", "InvalidData", "Invalid data received.");  
            }            

        },
        error: function(jqXHR, textStatus, errorThrown) 
        {  
            console.error("LicenseManager.GetContextInfo: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
        }
    });
}

function lmDownloadFile(data, type, filename)
{
    //Internet Explorer    
    if (navigator.msSaveBlob)
    {      
        var blobObject = new Blob([data], {type: type});
        window.navigator.msSaveOrOpenBlob(blobObject, filename);
    }
    else 
    {                                   
        var file = new Blob([data], {type: type});
        var downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(file);
        downloadLink.text = filename,
        downloadLink.style.display = "none";
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
    }

}


function lmShowModalProductItemDetails(containerId, firmCode, productCode, productItemReference)
{
    lmSendQueryGetProductItemDetails(containerId, firmCode, productCode, productItemReference, lmFillModalProductItemDetails);
}

function lmConvertToLocalDateString(dateTime)
{
    //Convert to local time string; format depends on language selected
    
    if (dateTime === null)
    {
        return "";    
    }
    
    var dateTimeObject = new Date(dateTime / 1000);
    var currentLocale = "";
    
    switch (Language.GetSelectedLanguage())   
    {
        case "en":
            currentLocale = "en-US";
            break;
    
        case "de":
            currentLocale = "de-DE";
            break;
    
        default:
            currentLocale = "en-US";
            break;
    
    }
    
    var dateTimeString = dateTimeObject.toLocaleString(currentLocale);
    
    //remove , if exist
    return dateTimeString.replace(","," ");    
       
}

function lmConvertUsagePeriod(usagePeriod)
{
    if (usagePeriod === 0)
    {
        return "";    
    }
    
    return usagePeriod + "d";
}

function lmFillModalProductItemDetails(payload)
{
    var tableContent = "";
    
    if (payload === null || payload.dataType !== "productItem")
    {
        //Nothing to do
        return;
    }
    else 
    {
        tableContent =  lmCreateHtmlCodeProductItemDetailsRow("Container", "c_licensemanager_container", payload.data.containerId, "");
        tableContent += lmCreateHtmlCodeProductItemDetailsRow("Firm Code", "c_licensemanager_firmcode", payload.data.firmCode, payload.data.firmText);     
        tableContent += lmCreateHtmlCodeProductItemDetailsRow("Product Code", "c_licensemanager_productcode", payload.data.productCode, payload.data.productText); 
        tableContent += lmCreateHtmlCodeProductItemDetailsRow("Feature Map", "c_licensemanager_featuremap", lmConvertToHex(payload.data.featureMap,8), "");
        tableContent += lmCreateHtmlCodeProductItemDetailsRow("License Quantity", "c_licensemanager_licensequantity", payload.data.licenseQuantity, "");
        tableContent += lmCreateHtmlCodeProductItemDetailsRow("Activation Time", "c_licensemanager_activationtime", lmConvertToLocalDateString(payload.data.activationTime), "");    
        tableContent += lmCreateHtmlCodeProductItemDetailsRow("Expiration Time", "c_licensemanager_expirationtime", lmConvertToLocalDateString(payload.data.expirationTime), "");    
        tableContent += lmCreateHtmlCodeProductItemDetailsRow("Usage Period", "c_licensemanager_usageperiod", lmConvertUsagePeriod(payload.data.usagePeriod), "");  
        
        if (payload.data.status === true)
        {
             tableContent += lmCreateHtmlCodeProductItemDetailsStatusRow("c_licensemanager_valid", "License valid");        
        }
        else 
        {
             tableContent += lmCreateHtmlCodeProductItemDetailsStatusRow("c_licensemanager_invalid", "License invalid");       
        }   
        
        lmFillTableProductItemDetails(tableContent);
        $("#id_div_licensemanager_modal_productitem_details").show();
    }
       
}

function lmFillTableOverview(htmlCode)
{
    //Get table body
    var tableBody = $("#id_licensemanager_table_overview").children("tbody");
    
    //Remove every row which is not a header
    tableBody.find("tr").not(".c_licensemanager_table_overview_header").remove();

    //Append new table content
    tableBody.append(htmlCode);
    
    //Apply zebra style
    tableBody.children("tr:odd").addClass("odd");    
    tableBody.children("tr:even").addClass("even"); 
    
    //Load messages
    Language.UpdateActivePageMessages()
   
}

function lmFillTableProductItemDetails(htmlCode)
{
    //Get table body
    var tableBody = $("#id_licensemanager_table_productitem_details").children("tbody");
    
    //Remove every row 
    tableBody.find("tr").remove();

    //Append new table content
    tableBody.append(htmlCode);
    
    //Apply zebra style
    tableBody.children("tr:odd").addClass("odd");    
    tableBody.children("tr:even").addClass("even");
    
    //Apply color
    tableBody.find("td.c_licensemanager_valid").css("color", "green");
    tableBody.find("td.c_licensemanager_invalid").css("color", "red");
    
    //Load messages
    Language.UpdateActivePageMessages()
   
}

function lmUpdateContainerTable()
{
    lmSendQueryGetContainers(lmDisplayContainerTableOverview);
}

function lmDisplayContainerTableOverview(payload) 
{
    var tableContent = "";
    
    if (payload === null || payload.dataType === undefined || payload.dataType !== "containerList")
    {
        tableContent = "<tr class=\"odd\"><td colspan=\"8\">&nbsp</td></tr>";
    }
    else
    {   
        if (payload.data.length === 0)
        {
            tableContent = "<tr class=\"odd c_licensemanager_tr_status_message\"><td class=\"c_licensemanager_td_no_container_found\" colspan=\"7\">No container found.</td></tr>";
        }
        else
        {          
            //Container in container array
            for (var containerKey in payload.data) 
            {
                tableContent += lmCreateHtmlCodeContainerRow(payload.data[containerKey]);
            }   
        }
        
        lmResetMessages();
             
    }

    lmFillTableOverview(tableContent);
    
    lmUpdateViewByAccessType();

}

function lmCreateHtmlCodeContainerRow(containerObj)
{
    var htmlCode = ""
    var firmCode = "";
    var firmText = "";
    var productItemsTableContent = "";
    var firmItemObj = [];
    var rowSpan = 1;
    
    var containerId = containerObj.containerId;
    var containerType = containerObj.containerType;
    var containerTypeTag = containerType.toLowerCase();
    var containerTypeValue = lmContainerTypeToString(containerType);
    var entries = 0;
    
    if(containerObj.firmItems.length === 0) 
    {
        htmlCode += "<td></td><td></td><td></td><td></td><td></td><td></td></tr>";
        htmlCode = "<tr class=\"c_licensemanager_tr_container\"><td rowspan=\"1\"><div class=\"pxc-div-css-table-vm-align\"><div><span class=\"pxc-no-break\">" + containerId + "</span></div><div class=\"c_licensemanager_access_type_local\" style=\"display: none;\"><button class=\"pxc-btn-download\" onclick=\"lmCreateAndDownloadContextFile('" + containerId + "',0,'Receipt','basic')\"></button></div></td><td class=\"c_lm_container_type_" + containerTypeTag + "\" rowspan=\"1\">" +  containerTypeValue + "</td>" + htmlCode;
        return htmlCode;    
    }    
    
    //Firm item in firm item array
    for (var firmItemKey in containerObj.firmItems) 
    {  
        var firmItem = containerObj.firmItems[firmItemKey];
        firmCode = firmItem.firmCode;
        firmText = firmItem.firmText;
        
        if (firmItem !== undefined && firmItem.length !== 0)
        {
            rowSpan = Math.max(firmItem.productItems.length, 1);
        }
        
        
        var containerTypeTag = containerType.toLowerCase();
        var containerTypeValue = lmContainerTypeToString(containerType);
        htmlCode += "<td rowspan=\"" + rowSpan + "\">" + firmCode + "</td><td rowspan=\"" + rowSpan + "\">" + firmText + "</td>";
        
        if (firmItem.length === 0 || firmItem.productItems.length === 0)
        {
            //No product item
            htmlCode += "<td></td><td></td><td></td><td></td></tr>";
            entries += 1;
        }
        else 
        {
            entries += firmItem.productItems.length;
            
            //Product item in product item array
            for (var productItemKey in firmItem.productItems) 
            {        
                var productItem = firmItem.productItems[productItemKey];
                
                if (productItemKey == 0)
                {
                    htmlCode += "<td>" + productItem.productCode + "</td><td>" + lmConvertToHex(productItem.featureMap,8) + "</td><td>" + productItem.productText + "</td><td><button class=\"btn_licensemanager_productitem_details pxc-btn-pa c_licensemanager_td_button\" onclick=\"lmShowModalProductItemDetails('" + containerId + "'," + firmCode + "," + productItem.productCode + "," + productItem.productItemReference + ")\"><span class=\"c_glb_btn_details\">Details</span></button></td></tr>";
                }
                else 
                {
                    htmlCode += "<tr class=\"c_licensemanager_tr_productitem\"><td>" + productItem.productCode + "</td><td>" + lmConvertToHex(productItem.featureMap,8) + "</td><td>" + productItem.productText + "</td><td><button class=\"btn_licensemanager_productitem_details pxc-btn-pa c_licensemanager_td_button\" onclick=\"lmShowModalProductItemDetails('" + containerId + "'," + firmCode + "," + productItem.productCode + "," + productItem.productItemReference + ")\"><span class=\"c_glb_btn_details\">Details</span></button></td></tr>";
                }
            }
        }
    }
        
    htmlCode = "<tr class=\"c_licensemanager_tr_container\"><td rowspan=\"" + entries + "\"><div class=\"pxc-div-css-table-vm-align\"><div><span class=\"pxc-no-break\">" + containerId + "</span></div><div class=\"c_licensemanager_access_type_local\" style=\"display: none;\"><button class=\"pxc-btn-download\" onclick=\"lmCreateAndDownloadContextFile('" + containerId + "',0,'Receipt','basic')\"></button></div></td><td class=\"c_lm_container_type_" + containerTypeTag + "\" rowspan=\"" + entries + "\">" +  containerTypeValue + "</td>" + htmlCode;
    
    return htmlCode;  
}


function lmCreateHtmlCodeProductItemDetailsRow(tagName, className, key, value)
{
    var htmlCode = "<tr><td class=\"" + className + "\" style=\"font-weight: bold;\">" + tagName + "<td>" + key + "</td><td>" + value + "</td></tr>";
    return htmlCode;  
}


function lmCreateHtmlCodeProductItemDetailsStatusRow(className, status)
{
    var htmlCode = "<tr><td class=\"c_licensemanager_status\" style=\"font-weight: bold;\">Status<td class=\"" + className + "\">" + status + "</td><td></td></tr>";
    return htmlCode;  
}

function lmResetOfflineActivation()
{
    //Init current step and value
    lmGlobVarOfflineActivationActiveStepId = 0;
    lmShowOfflineActivationStep();
    lmContextFileDownload = 0;
    lmUpdateFileUpload = 0;
    lmReceiptFileDownload = 0;
}

function lmExecuteStepOfflineActivation()
{
    //Get current step
    var activeStep = lmGetActiveStepOfflineActivation();
    
    //Execute step
    if ( ( activeStep.execute !== undefined ) && ( activeStep.execute !== null ) )
    {
        var result = activeStep.execute();
        
        if (result === false)
        {
            return;
        }    
        
    }        
}

function lmNextStepOfflineActivation()
{
    //Get active step
    var activeStep = lmGetActiveStepOfflineActivation();
    
    //Proceed only after validation
    if (activeStep !== null)
    {   
        //Is a completion check required?
        if ( activeStep.nextStep !== null )
        {
            if (activeStep.completion !== null)
            {   
                var result = activeStep.completion();
                if (result !== true)
                {
                    lmSetMessage("warning", "CompleteStep", "Please complete this step before continuing.");
                    return;
                }    
            }  
        }
        
        if ( activeStep.nextStep !== null ) 
        {
            lmResetMessages();
            lmGlobVarOfflineActivationActiveStepId = activeStep.nextStep;     
            lmExecuteStepOfflineActivation();  
            lmShowOfflineActivationStep();
        }  
    }
    else
    {
        console.error("No step active.");
    } 
}

function lmPreviousStepOfflineActivation()
{
    //Get active step
    var activeStep = lmGetActiveStepOfflineActivation();
    
    //Proceed only after validation
    if (activeStep !== null )
    {
        if (activeStep.previousStep !== null) 
        {
            //No decision required
            lmGlobVarOfflineActivationActiveStepId = activeStep.previousStep;   
            lmExecuteStepOfflineActivation();      
            lmShowOfflineActivationStep();
        }  
    }
    else 
    {
        console.error("No step active.");    
    } 
} 

function lmFinishOfflineActivation()
{
    lmGlobVarOfflineActivationActiveStepId  = 0;   
    lmShowOfflineActivationStep();
} 


function lmGetActiveStepOfflineActivation()
{   
    //Find is not supported in IE, hence filter and use first element  
    var activeStep = lmGlobVarOfflineActivationStep.filter(function(item)
    {
        return item.id === lmGlobVarOfflineActivationActiveStepId;
        
    })[0]; 
    
    return activeStep;
}

function lmShowOfflineActivationStep()
{
    
    //Hide all div elements
    $("div.c_licensemanager_offl_act_step").hide();
    
    //Reset progress bar
    $("div#id_licensemanager_tab_content_offline_act").find("ul.pxc-sc-progbar > li").removeClass("pxc-on");
        
    //Get active step
    var activeStep = lmGetActiveStepOfflineActivation();    
    
    //Proceed only after validation
    if (activeStep !== null)
    {
        var stepDivIdToShow = activeStep.activeElement;
        
        //Show step as div
        $("div#id_" + stepDivIdToShow).show();
        $("div#id_licensemanager_tab_content_offline_act").find("ul.pxc-sc-progbar > li.c_" + stepDivIdToShow).addClass("pxc-on");
    
        //Show control but hide all buttons 
        $("#id_licensemanager_offl_act_step_control").show();           
        $("button.c_licensemanager_offl_act_step_control").css("display", "none")

        //At least one step follows             
        if (activeStep.nextStep !== null)
        {
            $("#btn_licensemanager_offl_act_step_control_next").css("display", "inline");
        }
        
        //At least one previous step exist
        if (activeStep.previousStep !== null)
        {
            $("#btn_licensemanager_offl_act_step_control_back").css("display", "inline");
        }
        
        //Active step is last step
        if (activeStep.nextStep === null)
        {
            $("#btn_licensemanager_offl_act_step_control_finish").css("display", "inline");
        }        
                        
        //Active step is not first step            
        if (activeStep.id !== 0)
        {
            $("#btn_licensemanager_offl_act_step_control_cancel").css("display", "inline");
        }  
        
    }
    else 
    {
        console.error("No step active.");    
        $("#id_licensemanager_offl_act_step_info").show(); 
    }
    
}

function lmFillTableSelectItems(elementId, htmlCode) 
{
    //Get table body
    var tableBody = $("table.c_licensemanager_table_select_container#" + elementId).children("tbody");
    
    //Remove every row which is not a header
    tableBody.find("tr").not(".c_licensemanager_table_select_container_firmcode_header").remove();
    
    //Append new table content
    tableBody.append(htmlCode);
    
    //Apply zebra style
    tableBody.children("tr:odd").addClass("odd");    
    tableBody.children("tr:even").addClass("even"); 
    
    //Load messages
    Language.UpdateActivePageMessages()
}

function fillContainerContextSelectionList(payload)
{
    fillContainerSelectionList(payload, "Context");
}

function fillContainerReceiptSelectionList(payload)
{
    if (payload === null || payload.dataType === undefined || payload.dataType !== "containerTypeStatus")
    {
        //Nothing to do
        lmSetMessage("error", "QueryFailed", "Query failed.");
        return;
    }
    
    var containerList = lmTransformContainerTypeStatusToContainerList(payload);
    
    lmResetMessages();
    fillContainerSelectionList(containerList, "Receipt");
    
}

function fillContainerSelectionList(containerList, fileType)
{
        var htmlCode = "";
        
        if (containerList === null || containerList.length === 0)
        {

        }
        else
        {   
                    
            //Container in container array
            for (var containerIndex in containerList) 
            {
                htmlCode +=  lmCreateHmtlCodeTableRowDownloadContextFile(containerList[containerIndex].containerId, containerList[containerIndex].containerType, containerList[containerIndex].storageIdentifierName, containerList[containerIndex].storageIdentifierValue, containerList[containerIndex].firmCode, fileType);
            }
        }
        
        if (htmlCode === "")
        {
            htmlCode = "<tr><td class=\"c_licensemanager_td_no_container_found\" colspan=\"4\">No container found.</td></tr>";
        }
        
        //Find first visibile element id
        var result = $("table.c_licensemanager_table_select_container:visible").first();
        
        if (result.lentgh === 0)
        {
            return;
        }
 
        var elementId = result.attr("id");
                     
        //Fill table   
        lmFillTableSelectItems(elementId, htmlCode);

}

function lmCreateAndDownloadContextFile(containerId, firmCode, fileType, fileFormat)
{
    lmSendQueryCreateContextInfo(containerId, firmCode, fileType, fileFormat);
}

function lmValidateFileWibuCmLif(filename) 
{
    //Validate license information file 
    var regularExpr = /.+\.wibucmlif$/i;
    return regularExpr.test(filename);     
}

function lmValidateFileWibuCmRaC(filename) 
{
    //Validate license information file 
    var regularExpr = /.+\.wibucmrac$/i;
    return regularExpr.test(filename);     
}

function lmValidateFileWibuCmRaU(filename) 
{
    //Validate license information file 
    var regularExpr = /.+\.wibucmrau$/i;
    return regularExpr.test(filename);     
}

function lmValidateFileJson(filename) 
{
    //Validate license information file 
    var regularExpr = /.+\.plcnextrau$/i;
    return regularExpr.test(filename);     
}

function lmTriggerFileUpload(file, callbackFunction)
{
    var fileReader = new FileReader();
    
    fileReader.onerror = function (event)
    {
        //$("#id_progress_file_upload").hide(); 
        lmSetMessage("error", "ReadingFileFailed", "Reading file failed.")
    };
    
    fileReader.onprogress = function (event)
    {
        if (event.lengthComputable)
        {
            var percentage = Math.round((event.loaded / event.total) * 100.0);
            
            if (percentage > 100)
            {
                percentage = 100;        
            }
            
            //$("#id_progress_file_upload").attr("value", percentage);
            //console.log("onProgressChange: " + percentage);
        }    
    };
       
    fileReader.onloadstart = function (event)
    { 
        //$("#id_progress_file_upload").attr("value", 0);
        //$("#id_progress_file_upload").show();
    };
           
    fileReader.onload = function (event) 
    {
        //$("#id_span_file_reader_result").html(fileReader.result.length);     
        //$("#id_progress_file_upload").attr("value", 100);  
        //$("#id_progress_file_upload").hide();  
        callbackFunction(fileReader.result);
    };   
    
    fileReader.readAsText(file, "UTF-8");  
}

function lmSendQueryCreateContainer(containerType, callbackFunction) 
{
    var queryParameters = "containerType=" + containerType;
    
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "CreateContainer?",
        data : queryParameters,
        type: "POST",
        success: function(data, textStatus, jqXHR) 
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {
            console.error("LicenseManager.CreateContainer: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null);
        }
    });
}

function lmSendQueryExecuteLicenseUpdate(updateData, callbackFunction) 
{
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "ExecuteLicenseUpdate?",
        type: "POST",
        data: updateData,
        contentType: "text/plain;charset=utf-8",
        success: function(data, textStatus, jqXHR) 
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {
            console.error("LicenseManager.ExecuteLicenseUpdate: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null);
        }
    });
    
}

function lmSendQuerySetConfiguration(configuration, callbackFunction)
{ 

    var jsonConfiguration = JSON.stringify(configuration);

    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "SetConfiguration",
        data : jsonConfiguration,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data, textStatus, jqXHR)  
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {          
            console.error("LicenseManager.SetConfiguration: " + textStatus + ": " + errorThrown);
            lmSetErrorMessage("QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null); 
        }
    });
}

function lmFillTableLicenseUpdateResults(elementId, htmlCode)
{
    //Get table body
    var tableBody = $("table#"+elementId).children("tbody");
    
    //Remove every row which is not a header
    tableBody.find("tr").not(".c_licensemanager_table_overview_header").remove();

    //Append new table content
    tableBody.append(htmlCode);
    
    //Apply zebra style
    tableBody.children("tr:odd").addClass("odd");    
    tableBody.children("tr:even").addClass("even");
    
    //Apply color
    tableBody.find("td.c_licensemanager_status_success").css("color", "green");
    tableBody.find("td.c_licensemanager_status_error").css("color", "red");
    
    //Load messages
    Language.UpdateActivePageMessages()
}

function lmConvertToHex(number, padding) 
{
    var result = Number(number).toString(16);
    
    while (result.length < padding) 
    {
        result = "0" + result;
    }
    
    result = "0x" + result;

    return result;
}

function lmFillContainerTypeSelector(payload)
{

    if (payload === null || payload.dataType === undefined || payload.dataType !== "containerTypeStatus")
    {
        lmSetMessage("error", "RetrievingContainerTypesFailed", "Retrieving container types failed.");
    }
    else
    {  
        lmFillContainerTypeStatusTable(payload.data);
    }
    
}

function lmCreateContainerByContainerType(containerType) 
{
    lmSendQueryCreateContainer(containerType, lmHandleExecuteLicenseUpdateLifDone);
}

function lmCreateContainerByContainerTypeAdvanced(containerType) 
{
    lmSendQueryCreateContainer(containerType, lmHandleExecuteLicenseUpdateLifDone);
    lmSendQueryGetContainers(lmDisplayContainerTableOverview);
    lmSendQueryGetContainerTypeStatus(lmFillContainerTypeSelector);
}

function lmContainerTypeStatusToString(containerTypeStatus)
{
    var result = null;
    switch (containerTypeStatus) 
    {
        case "Active":
            result = "Active";
            break;
        case "Inactive":
            result = "Inactive";
            break;
        case "StorageNotAvailable":
            result = "Not available";
            break;            
        default:
            result = null;
    }
    
    return result;
}

function lmContainerTypeToString(containerType)
{
    var result = null;
    switch (containerType) 
    {
        case "Device":
            result = "Device";
            break;
        case "SdCard":
            result = "SD Card";
            break;
        case "Network":
            result = "Network";
            break;            
        default:
            result = "n/a";
    }
    
    return result;
}

function lmFillContainerTypeStatusTable(containerTypes)
{
            
    var htmlCode = "";
    var htmlCode = "";
    
    for (var containerTypeIndex in containerTypes) 
    {
        var containerType = containerTypes[containerTypeIndex].name;
        var containerTypeValue = lmContainerTypeToString(containerTypes[containerTypeIndex].name);
        var storageIdentifierName = containerTypes[containerTypeIndex].storageIdentifierName;
        var storageIdentifierValue = containerTypes[containerTypeIndex].storageIdentifierValue;
        htmlCode += "<tr><td><span class=\"c_lm_container_type_" + containerType.toLowerCase() + "\">" +  containerTypeValue + "</span>";
        
        htmlCode += "<br>";

        if (storageIdentifierName !== null && storageIdentifierName !== '')
        {
             htmlCode += "<span class=\"" + lmCreateStorageIdentifierName(storageIdentifierName) + "\">" + storageIdentifierName + "</span>: ";
        }
        
        if (storageIdentifierValue !== null && storageIdentifierValue !== '')
        {
             htmlCode += "<span>" + storageIdentifierValue + "</span>";
        }
        
        htmlCode += "</td>";
        
        var containerTypeStatus = containerTypes[containerTypeIndex].status.toLowerCase();
        var containerTypeStatusValue = lmContainerTypeStatusToString(containerTypes[containerTypeIndex].status);
        htmlCode += "</td><td class=\"c_lm_container_type_status_" + containerTypeStatus + "\">" + containerTypeStatusValue + "</td>";
        
        if (containerTypes[containerTypeIndex].status == "Active")
        {
            htmlCode += "<td style=\"text-align:center;\"><button class=\"btn_licensemanager_storage_reset_start pxc-btn-pa c_licensemanager_td_button\" style=\"float:center; min-width: 80%;\" onclick=\"lmResetStorageShowModal('" + containerTypes[containerTypeIndex].name + "')\"><span class=\"c_glb_btn_delete_all_license_data\">Delete</span></button></td>";
        }
        else 
        {
            htmlCode += "<td></td>";
        }
        
        if (containerTypes[containerTypeIndex].containers.length === 0)
        {
            if (containerTypes[containerTypeIndex].status === "StorageNotAvailable")
            {
                htmlCode += "<td>-</td><td></td>";
            }
            else 
            {
                htmlCode += "<td class=\"c_licensemanager_td_no_container_found\">No container found.</td>";
                htmlCode += "<td style=\"text-align:center;\"><button class=\"btn_licensemanager_configuration_create_container pxc-btn-pa c_licensemanager_td_button\" style=\"float:center; min-width: 80%;\" onclick=\"lmCreateContainerByContainerTypeAdvanced('" + containerTypes[containerTypeIndex].name + "')\"><span class=\"c_licensemanager_btn_label_create_container\">Create Container</span></button></td>";

            }
        }
        else 
        {
            htmlCode += "<td>";
            for (var containerIdIndex in containerTypes[containerTypeIndex].containers) 
            {
                if (containerIdIndex > 0)
                {
                    htmlCode += "<br>";
                }
                htmlCode += "<span class=\"pxc-no-break\">" + containerTypes[containerTypeIndex].containers[containerIdIndex].containerId + "</span>";
            }
            htmlCode += "<td></td>";
        }
        htmlCode += "</tr>";

    }
    
    var optionString = "";
    $("#id_licensemanager_select_container_type").empty();
    containerTypes.forEach(function(containerType, index)
    {
        if (containerType.status !== "StorageNotAvailable")
        {
            var containerTypeKey = containerType.name.toLowerCase();
            var containerTypeValue = lmContainerTypeToString(containerType.name);
            optionString += "<option value='" + containerType.name + "'><span class=\"c_lm_container_type_" + containerTypeKey + "\">" + containerTypeValue + "</span></option>";
        }
    });
    $("#id_licensemanager_select_container_type").append(optionString);
    
    //Get table body
    var tableBody = $("table#id_licensemanager_table_container_type_overview").children("tbody");
    
    //Remove every row which is not a header
    tableBody.find("tr").not(".c_licensemanager_table_container_type_header").remove();
    
    //Append new table content
    tableBody.append(htmlCode);
    
    //Apply zebra style
    tableBody.children("tr:odd").addClass("odd");    
    tableBody.children("tr:even").addClass("even");
    tableBody.find("td.c_lm_container_type_status_inactive").css("color", "red");
    tableBody.find("td.c_lm_container_type_status_active").css("color", "green");
    tableBody.find("td.c_lm_container_type_status_preselectedforactivation").css("color", "orange");
    tableBody.find("td.c_lm_container_type_status_storagenotavailable").css("color", "red");
    
    //Load messages
    Language.UpdateActivePageMessages()

}

function lmFillContainerTypeSelectOfflineStep(payload)
{
    var containerTypes = null;
    
    if (payload === null || payload.dataType === undefined || payload.dataType !== "containerTypeStatus")
    {
        lmSetMessage("error", "RetrievingContainerTypesFailed", "Retrieving container types failed.");
        return;
    }
    else
    {  
        containerTypes = payload.data;
    }    
    
    var optionString = "";
    $("#id_licensemanager_select_container_type_offline_step").empty();
    containerTypes.forEach(function(containerType, index)
    {
        if (containerType.status !== "StorageNotAvailable")
        {
            var containerTypeKey = containerType.name.toLowerCase();
            var containerTypeValue = lmContainerTypeToString(containerType.name);
            optionString += "<option value='" + containerType.name + "'><span class=\"c_lm_container_type_" + containerTypeKey + "\">" + containerTypeValue + "</span></option>";
        }
    });
    $("#id_licensemanager_select_container_type_offline_step").append(optionString);
    
    //Load messages
    Language.UpdateActivePageMessages()

}

function lmResetStorageShowModal(containerType)
{
    $("#id_licensemanager_input_storage_reset_confirmation").val("");
    var containerTypeKey = containerType.toLowerCase();
    var containerTypeValue = lmContainerTypeToString(containerType);
    $("#id_licensemanager_storage_reset_select").attr({
        "name" : containerType,
        "class" : "c_lm_container_type_" + containerTypeKey});
    $("#id_licensemanager_storage_reset_select").html(containerTypeValue);
    //Load messages
    Language.UpdateActivePageMessages()
    $("#id_div_licensemanager_modal_storage_reset").show();
}

function lmResetStorageStart()
{
    var confirmation = $("#id_licensemanager_input_storage_reset_confirmation").val();
    if (confirmation !== "")
    {
        var containerType = $("#id_licensemanager_storage_reset_select").attr("name");
        $("#id_div_licensemanager_modal_storage_reset").hide();
        lmSendQueryResetStorage(containerType, confirmation, lmResetStorageResultHandle);
    }
}

function lmSendQueryResetStorage(containerType, confirmation, callbackFunction)
{ 
    var queryParameters = "containerType=" + containerType + "&confirmation=" + confirmation;
    
    $.ajax({
        url: LICENSE_MANAGER_DATA_PROVIDER_SCRIPT_NAME + "ResetStorage?",
        data : queryParameters,
        type: "POST",
        success: function(data, textStatus, jqXHR)  
        {
            lmValidateAjaxResponse(data, textStatus, jqXHR, callbackFunction);
        },
        error: function(jqXHR, textStatus, errorThrown) 
        {          
            console.error("LicenseManager.ResetStorage: " + textStatus + ": " + errorThrown);
            lmSetMessage("error", "QueryFailedConnection", "Query failed. Connection may have been lost.");
            callbackFunction(null); 
        }
    });
}

function lmResetStorageResultHandle(payload)
{
    lmSendQueryGetContainers(lmDisplayContainerTableOverview);
    lmResetOfflineActivation();
    lmSendQueryGetContainerTypeStatus(lmFillContainerTypeSelector);
        
    if (payload === null || payload.dataType === undefined || payload.dataType !== "resetStorageResult")
    {

    }
    else 
    {

        if (payload.data.status === "success")
        {
            lmResetMessages();
        }
        else 
        {
            lmSetMessage("error", "FailedToResetStorage", "Failed to reset storage.");
        }
    }
    
}

function lmGetSelectedFileFormat() 
{
    return $("#id_licensemanager_cmb_offl_act_select_file_format option").filter(":selected").val();
}

function lmFillConfiguration(payload) 
{   
    //Iterate over received parameters
    $.each( payload.data, function(name, value)
    {
        //Find element by name
        var result = $("#id_table_license_client_configuration").find("select[name='"+ name + "'], input[name='"+ name + "']");
        
        //Has element been found? ==> if found, set element by id
        if (result !== undefined && result.length === 1)
        {
            $("#" +result.attr("id")).val(lmSanitizeInput(value));
        }
    });
}

function lmGetConfigurationFromHtml()
{
    //Find element by name
    var inputs = $("#id_table_license_client_configuration").find("select, input");
    var result = {};
    var name = "";
    var value = "";

    //Has element been found? ==> if found, set element by id
    if (inputs !== undefined && inputs.length !== 0)
    {
        $.each( inputs, function(index)
        {
            name = inputs[index].name;
            value = inputs[index].value;
            result[name] = value;
        });
    }
    
    return result;
}

function lmOfflineActivationStepUpdateFileReset()
{
    //Reset input value
    $("input#id_licensemanager_offl_act_input_rauc_file").val(""); 
}
