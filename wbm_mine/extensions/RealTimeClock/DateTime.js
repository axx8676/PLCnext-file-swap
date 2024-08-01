'use strict';

var SubPageActive = true;
var RTC_DATA_PROVIDER_SCRIPT_NAME = "module/RealTimeClock/RtcProvider/";
var currentTimestamp = 0;
var ntpConfig = null;

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    $("#id_form_ntpconfig_add_edit_entry").validate().resetForm();
    SubPageActive = null;
    RTC_DATA_PROVIDER_SCRIPT_NAME = null;
    currentTimestamp = null;
    ntpConfig = null;
}

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

function rtcSanitizeInput(data)
{
    let textArea = document.createElement("textarea");
    textArea.innerText = data;
    return textArea.innerHTML;
}

function rtcSetMessage(type, messageId, message)
{
    rtcResetMessages();
            
    var target = $("#id_realtimeclock_div_content").first();
    
    var messageClass = "";
    
    var typeSymbol = "<div class=\"pxc-exclamation\"><div>!</div>";
    
    if (type === "info")
    {
        typeSymbol = "<div class=\"pxc-information\"><div>i</div>";
    }

    if (messageId)
    {
        messageClass = "c_realtimeclock_" + type + "_message_" + messageId.toLowerCase();
    }

    var htmlCode = "<div class=\"c_realtimeclock_message c_realtimeclock_" + type + "_message cf\" style=\"margin-bottom:14px\"><div><div class=\"pxc-" + type + "-general-msg-wrp\"><div class=\"pxc-" + type + "-msg\">" + typeSymbol + "</div><span class=\"pxc-msg-txt " + messageClass + "\">" + message + "</span></div></div></div></div>";    
    
    //Check if node exists        
    if ( target.find("div.c_realtimeclock_" + type + "_message").length !== 0 )
    {
        //Replace
        target.find("div.c_realtimeclock_" + type + "_message").find("span.pxc-msg-txt").replaceWith("<span class=\"pxc-msg-txt " + messageClass + "\">" + message + "</span>");
    }
    else
    {
        var hiddenHtmlCode = $(htmlCode).hide();
        target.prepend(hiddenHtmlCode); 
    }
    
    target.find("div.c_realtimeclock_" + type + "_message").fadeIn("slow", function()
    {
        target.find("div.c_realtimeclock_" + type + "_message").show();
    });
    
    //Load messages
    Language.UpdateActivePageMessages();

}

function rtcResetMessages()
{
    var target = $("#id_realtimeclock_div_content");

    target.find("div.c_realtimeclock_message").fadeOut("slow", function()
    {
        target.find("div.c_realtimeclock_message").hide();
    });
}

function rtcGetCurrentTimestamp()
{
    
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(RTC_DATA_PROVIDER_SCRIPT_NAME + "GetCurrentTimestamp?",
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.JSON,
                                                        "", null);
    
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
    .then(function (data)
    {
         if ((data.currentTimestamp !== undefined ) && ( data.currentTimestamp !== null ))
         {
             currentTimestamp = data.currentTimestamp;
             $("#id_realtimeclock_span_current_timestamp_value").text(rtcConvertToLocalDateString(currentTimestamp));
             rtcResetMessages(); 
         }
         else
         {
             currentTimestamp = 0
             $("#id_realtimeclock_span_current_timestamp_value").text("n/a");
             rtcSetMessage("error","rtc_getting_current_timestamp_failed","Getting current timestamp failed.");
         }
    })
    .catch(function(errorObj)
    {
        currentTimestamp = 0
        $("#id_realtimeclock_span_current_timestamp_value").text("n/a");
        rtcSetMessage("error", "GettingCurrentTimestampFailed","Getting current timestamp failed.");
    });
}

function rtcRefreshCurrentTimestamp()
{
    rtcGetCurrentTimestamp();
}

function rtcConvertToLocalDateString(dateTime) 
{
    //Convert to local time string; format depends on language selected
    
    if (dateTime === null)
    {
        return "";    
    }
    
    var dateTimeObject = new Date(dateTime / 1000);
    
    var dateTimeString = dateTimeObject.toLocaleString("de-DE", { 
        timeZone: "UTC", 
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit", 
        second: "2-digit"
    });
    
    //remove, if exist
    return dateTimeString.replace(","," ");
}

function rtcValidateNtpConfigEntries(data, callbackFunction)
{

    if ((!data.hasOwnProperty("versionCount")) ||
        (!data.hasOwnProperty("entries")) ||
        (!Array.isArray(data.entries)))
    {
        rtcSetMessage("error", "InvalidNtpConfigurationDataReceived","Invalid NTP configuration data received.");
        return;
    }
    
    callbackFunction(data);
}

function rtcHtmlNtpConfigEntry(index, entry)
{
    let number = index + 1;
    let hostName = "";
    let comment = "";

    let result = $.grep(entry.parameters, function(item){ return item.hasOwnProperty("hostName")});
    
    if (result.length === 1)
    {
        hostName = rtcSanitizeInput(result[0].hostName);
    }
    
    result = $.grep(entry.parameters, function(item){ return item.hasOwnProperty("comment")});
    
    if (result.length === 1)
    {
        comment = rtcSanitizeInput(result[0].comment);
    }
    
    let trClass = "c_ntpconfig_status_active";
    
    if (entry.inactive)
    {
        trClass = "c_ntpconfig_status_inactive";
    }

    let htmlCode = "<tr class=\"" + trClass +"\"><td>" + number + "</td><td>" + hostName + "</td><td>" + comment + "</td>";
    htmlCode += "<td class=\"pxc-div-css-table-vm-align\"><div class=\"pxc-div-css-table-vm-align\" style=\"display: inline;\"><div><button id=\"id_button_ntpconfig_edit_entry\" class=\"pxc-btn-edit tooltip ntp-config-edit-server\" value=\"" + number + "\"><span class=\"tooltip-text-topleft c_ntpconfig_server_edit_entry\">Edit NTP server entry</span></button>";
    htmlCode += "<button id=\"id_button_ntpconfig_remove_entry\" class=\"pxc-btn-remove tooltip ntp-config-remove-server\" value=\"" + number + "\"><span class=\"tooltip-text-topleft c_ntpconfig_server_remove_entry\">Remove NTP server entry</span></button></div></div></td></tr>";
    
    return htmlCode;
}

function rtcFillNtpConfigEntries(data)
{
    
    //Get table body
    var tableBody = $("table#id_ntpconfig_table").children("tbody").first();
    
    //Remove every row which is not a header
    tableBody.find("tr").not(".c_ntpconfig_table_header").remove();

    let htmlCode = "";
    
    for (let i = 0; i < data.entries.length; i++) 
    {
        htmlCode += rtcHtmlNtpConfigEntry(i, data.entries[i]);
    }

    //Append new table content
    tableBody.append(htmlCode);
    
    //Apply zebra style
    tableBody.children("tr:odd").addClass("odd");    
    tableBody.children("tr:even").addClass("even");
    
    //Apply color
    tableBody.find("tr.c_ntpconfig_status_active").css("color", "black");
    tableBody.find("tr.c_ntpconfig_status_inactive").css("color", "grey");
    
    //Load messages
    Language.UpdateActivePageMessages();
    
    $(":button.ntp-config-edit-server").click(function(event)
    {
        $("#id_ntpconfig_form_add_server_title").hide();
        $("#id_ntpconfig_form_edit_server_title").show();
        let number = $(event.target).attr("value");
        rtcShowModalEditEntry(number);
        event.preventDefault();
    });
    
    $(":button.ntp-config-remove-server").click(function(event)
    {
        let number = $(event.target).attr("value");
        rtcRemoveNtpConfigEntry(number);
        event.preventDefault();
    });
}

function rtcRemoveNtpConfigEntry(number)
{
    let index = number - 1;
    if (index >= 0)
    {
        ntpConfig.entries.splice(index, 1);
    }
    rtcFillNtpConfigEntries(ntpConfig);
}

function rtcUpdateNtpConfigEntries(restore)
{
        
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(RTC_DATA_PROVIDER_SCRIPT_NAME + "GetNtpConfigEntries?",
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.JSON,
                                                        "", null);
    
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
    .then(function(data) 
    {
        ntpConfig = data;
        rtcValidateNtpConfigEntries(data, rtcFillNtpConfigEntries);
        
        if (restore === true)
        {
            rtcSetMessage("info","DiscardingNtpConfigChangesSucceeded","Discarding changes in NTP configuration succeeded.");
        }
    })
    .catch(function(errorObj) 
    {
        if (restore === true)
        {
            rtcSetMessage("error","DiscardingNtpConfigChangesFailed","Discarding changes in NTP configuration failed.");
        }
        else
        {
            rtcSetMessage("error","GettingNtpConfigEntriesFailed","Getting NTP configuration entries failed.");
        }
    });
}

function rtcShowModalAddEntry()
{
    rtcConvertToJsonObject(null);
    $("#id_ntpconfig_div_modal_addedit_server").show();
    $("#id_form_ntpconfig_add_edit_entry").validate().resetForm();
}

function rtcShowModalEditEntry(number)
{
    let index = number - 1;
    if (index <  0)
    {
        return;
    }
    
    let entry = ntpConfig.entries[index];
    entry["number"] = number;
    rtcConvertToJsonObject(entry);
    
    $("#id_ntpconfig_div_modal_addedit_server").show();
    $("table#id_table_ntpconfig_server_add_entry tbody tr.c_ntpconfig_server_number").show();
    $("#id_form_ntpconfig_add_edit_entry").validate().resetForm();
}

function rtcConvertToQueryObject(data)
{
    let result = {};
    result["number"] = 0;
    result["id"] = 0;
    result["type"] = "Server";
    result["inactive"] = false;
    result["parameters"] = [];
 
    for(let index in data)
    {
        
        if(data[index].hasOwnProperty("name") && data[index].hasOwnProperty("value"))
        {
            let name = data[index].name;
            let value = data[index].value;
            
            if (name === "number")
            {
                 result["number"] = parseInt(value, 10);
            }
            else if (name === "id")
            {
                 result["id"] = parseInt(value, 10);
            }
            else if (name === "status")
            {
                if (value === "inactive")
                {
                    result["inactive"] = true;
                }
            }
            else
            {
                if (value != "") 
                {
                    let object = {};
                    object[name] = value;
                    result["parameters"].push(object); 
                }    
                
            }
        }
    } 
    
    return result;
}

function rtcConvertToJsonObject(data)
{
        
    let result = [];
    result["number"] = 0;
    result["id"] = 0;
    result["type"] = "Server";
    result["status"] = "active";
    result["hostName"] = null;
    result["minPoll"] = "6";
    result["maxPoll"] = "10";
    result["comment"] = null;
    
    if (data !== null)
    {
        result["number"] = data.number;
        result["id"] = data.id;
        result["minPoll"] = "";
        result["maxPoll"] = "";
        
        if (data["inactive"] === true)
        {
           result["status"] = "inactive";
        }

        for(let index in data.parameters)
        {
            let key = Object.keys(data.parameters[index])[0];
            result[key] = data.parameters[index][key];
        } 
    }
    
    let keys = Object.keys(result);
    
    for(let index in keys)
    {
        let key = keys[index];

        let value = "";
        
        if (result[key] !== null)
        {
            value = result[key];
            
        }
        
        $("input[name=\""+key+"\"], select[name=\""+key+"\"]").val(value);
        
    }
        
    return result;
}

function rtcApplyNtpConfigEntries()
{
    
    let objectData = {};
    objectData["data"] = ntpConfig;
    objectData["restartDaemon"] = true;
    
    let jsonData = JSON.stringify(objectData);

    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(RTC_DATA_PROVIDER_SCRIPT_NAME + "SetNtpConfigEntries?",
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.JSON,
                                                        jsonData, null);
    
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
    .then(function(data) 
    {
        if ((data["dataType"] !== "settingNtpConfigEntriesResult") || (data["data"]["status"] !== "success"))
        {
            rtcSetMessage("error","SettingNtpConfigEntriesFailed","Setting NTP configuration entries failed.");
        }
        else
        {
            rtcSetMessage("info","SettingNtpConfigEntriesSucceeded","Setting NTP configuration entries succeeded. NTP daemon has been restarted.");
        }
            
    })
    .catch(function(errorObj) 
    {
         rtcSetMessage("error","SettingNtpConfigEntriesFailed","Setting NTP configuration entries failed.");
    });
}

$(document).ready(function(){
    //Event handler registration
    $("#id_button_realtimeclock_timestamp_refresh").click(function(event)
    {
        rtcRefreshCurrentTimestamp();
        event.preventDefault();
    });
    
    $("#id_button_ntpconfig_add_entry").click(function(event)
    {
        $("#id_ntpconfig_form_edit_server_title").hide();
        $("#id_ntpconfig_form_add_server_title").show();
        $("table#id_table_ntpconfig_server_add_entry tbody tr.c_ntpconfig_server_number").hide();
        rtcShowModalAddEntry();
        event.preventDefault();
    });
    
    $("#id_button_ntpconfig_cancel").click(function(event)
    {
        $("#id_ntpconfig_div_modal_addedit_server").hide();
        event.preventDefault();
    });
    
    $("#id_button_ntpconfig_add_edit_ok").click(function(event)
    {
        let result = $("#id_form_ntpconfig_add_edit_entry").valid();
        
        if(result == false)
        {
            return;
        }

        $("#id_ntpconfig_div_modal_addedit_server").hide();
        event.preventDefault();
                
        let object = rtcConvertToQueryObject($("#id_form_ntpconfig_add_edit_entry").serializeArray());
        let number = object["number"];
        if (number <= 0)
        {
            //Add new entry
            delete object["number"];
            ntpConfig.entries.push(object);
        }
        else
        {
            let index = number - 1;
            //Edit entry
            delete object["number"];
            ntpConfig.entries[index] = object;
        }            
        rtcFillNtpConfigEntries(ntpConfig);
        
    });
    
    $("#id_button_ntpconfig_discard_changes").click(function(event)
    {
        $("#id_rtc_discard_modal").show();
        event.preventDefault();
    });
    
    $("#id_rtc_discard_ok_btn").click(function (event) {
        $("#id_rtc_discard_modal").hide();
        event.preventDefault();
        location.reload();
        return false;
    });

    // discard cancel button
    $("#id_rtc_discard_cancle_btn").click(function (event) {
        $("#id_rtc_discard_modal").hide();
        event.preventDefault();
        return false;
    });
    
    $("#id_button_ntpconfig_apply_changes").click(function(event)
    {
        rtcResetMessages();
        $("#id_div_ntpconfig_modal_set_entries").show();
        event.preventDefault();
    });
    
    $("#id_rtc_ntpconfig_button_set_ok").click(function(event)
    {
        rtcApplyNtpConfigEntries();
        $("#id_div_ntpconfig_modal_set_entries").hide();
        event.preventDefault();
    });
    
    $("#id_rtc_ntpconfig_button_set_cancel").click(function(event)
    {
        $("#id_div_ntpconfig_modal_set_entries").hide();
        event.preventDefault();
    });
    
    rtcRefreshCurrentTimestamp();
    rtcUpdateNtpConfigEntries(false);
    
        
    MsDelay(100).then(function()
    {
        Validation("#id_form_ntpconfig_add_edit_entry");
        $("#id_form_ntpconfig_add_edit_entry").validate().settings.ignore = [];
    })

});


$(document).on("LanguageChanged", rtcLanguageChangedHandler);

// LanguageChanged event handler
function rtcLanguageChangedHandler(e) {
    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_form_ntpconfig_add_edit_entry");
        $("#id_form_ntpconfig_add_edit_entry").validate().settings.ignore = [];
    }
    catch(e)
    {
    }
}

