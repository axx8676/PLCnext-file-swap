
SubPageActive = true;

SPLC_CONFIG_DATA_PROVIDER_SCRIPT_NAME="module/Splc/SplcConfigDp/"

///
/// Splc Notifications Configuration
///
Splc_FAddressRangesCount = 0;

Splc_NotificationsConfiguration = {
    NotificationActivationItems: [],
    FAddressRangeItems: []
}

var FAddressRangeRegex = new RegExp('^([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-4])$');

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete Splc_FAddressRangesCount;
    
    delete FAddressRangeRegex;

    delete SPLC_CONFIG_DATA_PROVIDER_SCRIPT_NAME;
    
    // Reset Validator
    $("#id_splc_notifications_f_addresses_table_form").removeData('validator');
    $(document).off("LanguageChanged");
}

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

$(document).ready(function(){
    
    // Init Validations
    Validation("#id_splc_notifications_f_addresses_table_form");
    
    // Init the Page
    InitSplcConfigurationPage();
    
    $("#id_div_loader").hide();
    
    $(document).on("click", "#id_splc_notifications_f_addresses_table button", function(event) {
        $("#id_splc_notifications_f_addresses_table tr:eq(" + ($(this).closest("tr").index() + 1) + ")").remove();
        
        UpdateZebraTableRowsColors('id_splc_notifications_f_addresses_table');
        
        event.preventDefault();
    });
    
    $("#id_splc_add_f_addrrange_button").click( function(event)
    {
        var fAddrRangeRowHtml = BuildFAddressRangeTableRow(++Splc_FAddressRangesCount, "", "", "");
        // check if last table row is vom type no entries row
        if($('#id_splc_notifications_f_addresses_table tr:last').length && $('#id_splc_notifications_f_addresses_table tr:last').hasClass("no-entries"))
        {
            // delete the row
            $('#id_splc_notifications_f_addresses_table tr:last').remove();
        }
        $('#id_splc_notifications_f_addresses_table > tbody:last-child').append(fAddrRangeRowHtml);
        UpdateZebraTableRowsColors('id_splc_notifications_f_addresses_table');
        Language.UpdateActivePageMessages();
    });
    
    $("#id_splc_apply_config_button").click( function(event)
    {
        $("#id_div_loader").show();
        console.log("Applying SPLC configuration...");
        setTimeout(ApplySplcConfiguration, 10);
        event.preventDefault();
    });
    $("#id_splc_discard_config_button").click( function(event)
    {
        $("#id_splc_discard_modal").show();
        event.preventDefault();
        return false;
    });
    $("#id_splc_discard_ok_btn").click(function(event)
    {
        $("#id_splc_discard_modal").hide();
        $("#id_div_loader").show();
        event.preventDefault();
        location.reload();
        window.location.href = "#extensions/Splc/SplcConfiguration.html";
        return false;
    });
    $("#id_splc_discard_cancle_btn").click(function(event)
    {
        $("#id_splc_discard_modal").hide();
        event.preventDefault();
        return false;
    });
});

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("Splc Configutation Log: Event subscriber on LanguageChanged - Selected language: "+ e.message);
    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_splc_notifications_f_addresses_table_form");
    }catch(e){}
}

function InitSplcConfigurationPage()
{
    // wait 20 ms until language objects are loaded
    MsDelay(20)
    .then(function()
    {
        // Request Splc notification config Data
        var notificationConfig = RequestJsonDataFromControl(
            SPLC_CONFIG_DATA_PROVIDER_SCRIPT_NAME + "GetNotificationConfiguration", "");

        if(notificationConfig != false && typeof notificationConfig != undefined)
        {
            // Splc Notifications Activation Table
            BuildSetSplcNotificationsActivationTable(notificationConfig.NotificationActivationItems);
            // Splc Notifications FAddressRanges Table
            BuildSetSplcNotificationsFAddressesTable(notificationConfig.FAddressRangeItems)
        }
        
        Language.UpdateActivePageMessages();
    });
    
}

function MsDelay(t, v)
{
    return new Promise(function(resolve) { 
       setTimeout(resolve.bind(null, v), t)
   });
}

function ApplySplcConfiguration()
{
    // Apply Notifications configurations
    var result = $("#id_splc_notifications_f_addresses_table_form").valid();
    
    if(result == true)
    {
        result = ApplySplcNotificationsConfiguration();
    }

    if(result == true)
    {
        location.reload();
    }
    else
    {
        $("#id_div_loader").hide();
    }
    
    return false;
}

function ApplySplcNotificationsConfiguration()
{
    var result = true;
    
    Splc_NotificationsConfiguration.NotificationActivationItems = [];
    Splc_NotificationsConfiguration.FAddressRangeItems = [];
    
    // Get SPLC notifications configuration
    var notificationsActivationsRows = $('#id_splc_notifications_activation_table > tbody tr:not(".no-entries")');
    $.each(notificationsActivationsRows, function(index, activationRow)
    {   
        var activationItemNumber = $(activationRow).attr("ActivationItemNumber");
        var activationItem = {};
        activationItem.Identifier = $("#id_splc_notification_activation_" + activationItemNumber + "_tr").text();
        activationItem.Activation = $("#id_splc_notification_activation_" + activationItemNumber + "_checkbox").is(':checked');

        Splc_NotificationsConfiguration.NotificationActivationItems.push(activationItem);
        
    });
    // Get SPLC FAddressRanges configuration
    var FAddressRangesRows = $('#id_splc_notifications_f_addresses_table > tbody tr:not(".no-entries")');
    $.each(FAddressRangesRows, function(index, fAddressRangeRow)
    {   
        var fAddressRangeNumber = $(fAddressRangeRow).attr("fAddressRangeNumber");
        var fAddressRangeItem = {};
        fAddressRangeItem.StartAddress = $("#id_splc_notification_addrrange_" + fAddressRangeNumber + "_startaddr_input").val();
        fAddressRangeItem.EndAddress = $("#id_splc_notification_addrrange_" + fAddressRangeNumber + "_endaddr_input").val();
        
        Splc_NotificationsConfiguration.FAddressRangeItems.push(fAddressRangeItem);
    });


    var configJsonString = JSON.stringify(Splc_NotificationsConfiguration, null, '\t');
    result = RequestJsonDataFromControl(
        SPLC_CONFIG_DATA_PROVIDER_SCRIPT_NAME + "SetNotificationConfiguration", configJsonString);

    return result;
}

function BuildSetSplcNotificationsActivationTable(notificationActivationItems)
{
    var tableHtml = "";
    
    if(notificationActivationItems.length != 0)
    {
        $.each(notificationActivationItems, function(index, activationItem)
        {   
            var oddEven = "even";
            var notificationChecked = (activationItem.Activation == true)?("checked"):("");
            if((index % 2) == 0)
            {
                oddEven = "odd";
            }
            tableHtml += '<tr class="' + oddEven + '" id="id_splc_notification_activation_' + (index + 1) + '_tr" ActivationItemNumber="' + (index + 1 ) + '">';
            tableHtml +=    '<td id="id_splc_notification_activation_' + (index + 1) + '_span">' + activationItem.Identifier + '</span></td>';
            tableHtml +=    '<td id="id_splc_notification_activation_' + (index + 1) + '_checkbox_td" style="text-align: left !important;"><input type="checkbox" id="id_splc_notification_activation_' + (index + 1) + '_checkbox" ' + notificationChecked + '></input></td>';
            tableHtml += '</tr>';
        });
    }
    else
    {
        tableHtml += '<tr class="odd no-entries"><td colspan="2"><span class="c_splc_no_entries_available exclude" style="color:red;"/></td></tr>';
    }
    $("#id_splc_notifications_activation_table > tbody").html(tableHtml);
}
function BuildSetSplcNotificationsFAddressesTable(fAddressRangeItems)
{
    var tableHtml = "";
    
    if(fAddressRangeItems.length != 0)
    {
        $.each(fAddressRangeItems, function(index, fAddressRangeItem)
        {   
            var oddEven = "even";
            if((index % 2) == 0)
            {
                oddEven = "odd";
            }
            tableHtml += BuildFAddressRangeTableRow(++Splc_FAddressRangesCount, fAddressRangeItem.StartAddress, fAddressRangeItem.EndAddress , oddEven);
        });
    }
    else
    {
        tableHtml += '<tr class="odd no-entries"><td colspan="5"><span class="c_splc_no_entries_available exclude" style="color:red;"></span></td></tr>';
    }
    $("#id_splc_notifications_f_addresses_table > tbody").html(tableHtml);
    Language.UpdateActivePageMessages();
}

function BuildFAddressRangeTableRow(fAddressRangeCount, startAddress, endAddress, oddEven)
{
    var fAddrRangeRowHtml = "";
    // Start F-Address Range table line
    fAddrRangeRowHtml += '<tr class="' + oddEven + '" id="id_splc_notification_addrrange_' + fAddressRangeCount + '_tr" fAddressRangeNumber="' + fAddressRangeCount + '">';
    // F-Address Range (Start Address)
    fAddrRangeRowHtml +=    '<td id="id_splc_notification_addrrange_' + fAddressRangeCount + '_startaddr_text_td">';
    fAddrRangeRowHtml +=        '<span class="c_splc_notifications_f_start_address" style="font-weight: bold;">Start Address</span></td>';
    fAddrRangeRowHtml +=    '<td id="id_splc_notification_addrrange_' + fAddressRangeCount + '_startaddr_input_td">'; 
    fAddrRangeRowHtml +=        '<input type="text" class="faddress-range" id="id_splc_notification_addrrange_' + fAddressRangeCount + '_startaddr_input" style="width: 70%; display: inline-block;" value="' + startAddress +'" placeholder="1 - 65534" name="splc_notification_addrrange_' + fAddressRangeCount + '_start"></input></td>';
    // F-Address Range (Start Address)
    fAddrRangeRowHtml +=    '<td id="id_splc_notification_addrrange_' + fAddressRangeCount + '_endaddr_text_td">';
    fAddrRangeRowHtml +=        '<span class="c_splc_notifications_f_end_address" style="font-weight: bold;">End Address</span></td>';
    fAddrRangeRowHtml +=    '<td id="id_splc_notification_addrrange_' + fAddressRangeCount + '_endaddr_input_td">'; 
    fAddrRangeRowHtml +=        '<input type="text" class="faddress-range" id="id_splc_notification_addrrange_' + fAddressRangeCount + '_endaddr_input" style="width: 70%; display: inline-block;" value="' + endAddress +'" placeholder="1 - 65534" name="splc_notification_addrrange_' + fAddressRangeCount + '_end"></input></td>';
    // F-Address Rabge remove button
    fAddrRangeRowHtml +=    '<td><div class="pxc-btm-btn-align centered">';
    fAddrRangeRowHtml +=        '<button class="pxc-btn-pa" id="id_splc_notification_remove_addrrange_' + fAddressRangeCount + '_button" style="float: center;"><span class="c_splc_delete_f_addrrange_button_text">Remove F-Address Range</span></button></div></td>';
    // End F-Address Range table line
    fAddrRangeRowHtml += '</tr>';
    
    return fAddrRangeRowHtml;
}

function UpdateZebraTableRowsColors(tableId)
{
    var table = $('#' + tableId);
    $('#' + tableId + ' > tbody  > tr').each(function(index, tr) { 
        if($(tr).hasClass("selected") == false)
        {
            if((index % 2) == 1 )
            {
               if($(tr).hasClass("odd") == true)
               {
                   $(tr).removeClass("odd");
               }
               if($(tr).hasClass("even") == false)
               {
                   $(tr).addClass("even");
               }
            }
            else
            {
               if($(tr).hasClass("even") == true)
               {
                   $(tr).removeClass("even");
               }
               if($(tr).hasClass == false)
               {
                   $(tr).addClass("odd");
               }
            }
        }
    });
}

function RequestJsonDataFromControl(Url, RequestData)
{
    var result = false;
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
    ajaxCallbackFunctions.OnErrorCallback = OnStateConnectionError;
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Url,
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.JSON,
                                                        RequestData,
                                                        ajaxCallbackFunctions);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    if(response.error)
    {
        OnStateDataErrorOccurred(response.errorText);
        result = false;
    }
    else
    {
        OnStateStatusOk();
        result = response.result;
    }
    return result;
}

function OnStateStatusOk()
{
    
}

function OnStateDataErrorOccurred(errorText)
{
    alert($("#id_splc_status_text_internal_error_span").text() + errorText);
    console.log($("#id_splc_status_text_internal_error_span").text() + errorText);
}

function OnStateConnectionError(xhr, status, error)
{
    alert(error);
}