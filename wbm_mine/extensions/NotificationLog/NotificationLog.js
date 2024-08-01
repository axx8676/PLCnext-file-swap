SubPageActive = true;

NFLOG_UPDATE_TIMEOUT = 500;
NFLOG_FILTER_TEXT_COLOR_OK    = '#666a6e';
NFLOG_FILTER_TEXT_COLOR_ERROR = 'red';

Nflog_NotificationsUpdateTimer = null;

NFLOG_DEFAULT_NOTIFICATIONS_REQ_LIMIT = 512;
NFLOG_DEFAULT_MAX_NOTIFICATIONS_COUNT = 1024;

Nflog_MaxNotificationsCount = 4000;

Nflog_UserMaxNotificationCount = NFLOG_DEFAULT_MAX_NOTIFICATIONS_COUNT;

Nflog_ListedNotificationsIds = [];

Nflog_SenderInputInvalidCharsString = ' & / \\ \' " ,';
Nflog_SenderInputInvalidCharacters = '&/\\\'",';

Nflog_AsyncNotificationsDataReqT0 = 0;
Nflog_AsyncNotificationsDataReqT1 = 0;

Nflog_prevRxNotificationsCount = 0;

Nflog_NotificationsArchives = [];

Nflog_initialModeActive = true;

Nflog_showRplcData = false;

var DateRegex = new RegExp('^(?:(?:31(\\.)(?:0?[13578]|1[02]))\\1|(?:(?:29|30)(\\.)(?:0?[1,3-9]|1[0-2])\\2))(?:(?:1[6-9]|[2-9]\\d)?\\d{2})$|^(?:29(\\.)0?2\\3(?:(?:(?:1[6-9]|[2-9]\\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\\d|2[0-8])(\\.)(?:(?:0?[1-9])|(?:1[0-2]))\\4(?:(?:1[6-9]|[2-9]\\d)\\d{2})$');
var TimeRegex = new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9])$');

ConnectionStatusOk = true;

Nflog_FilterOptions = {
    Archives: [],
    Limit: NFLOG_DEFAULT_NOTIFICATIONS_REQ_LIMIT,
    SenderNameRegExp: "",
    TimestampBefore: "",
    TimestampAfter:  "",
    SeverityLowerLimit: "",
    StoredIdLowerLimit: 0,
    StoredIdUpperLimit: 0
}

Nflog_InitSetFilterOptions = Object.assign({},Nflog_FilterOptions);

Nflog_SeverityIcons = {
    Internal: "images/nflog_severity_internal.png",
    Info:     "images/nflog_severity_information.png",
    Warning:  "images/nflog_severity_warning.png",
    Error:    "images/nflog_severity_error.png",
    Critical: "images/nflog_severity_critical_error.png",
    Fatal:    "images/nflog_severity_fatal_error.png"
}

Nflog_SeverityOrder = {
    Internal: 0,
    Info:     1,
    Warning:  2,
    Error:    3,
    Critical: 4,
    Fatal:    5 
}


function CleanUpPageData()
{
    delete SubPageActive;
    
    delete NFLOG_UPDATE_TIMEOUT;
    
    if(typeof Nflog_NotificationsUpdateTimer !== "undefined")
    {
        window.clearTimeout(Nflog_NotificationsUpdateTimer);
        window.clearInterval(Nflog_NotificationsUpdateTimer);
        
        delete Nflog_NotificationsUpdateTimer;
    }

    delete NFLOG_FILTER_TEXT_COLOR_OK;
    delete NFLOG_FILTER_TEXT_COLOR_ERROR;
    
    delete Nflog_AsyncNotificationsDataReqT0;
    delete Nflog_AsyncNotificationsDataReqT1;
    
    delete Nflog_prevRxNotificationsCount;
    delete Nflog_initialModeActive;

    delete DateRegex;
    delete TimeRegex;
    
    delete Nflog_ListedNotificationsIds;
    
    delete Nflog_SenderInputInvalidCharsString;
    delete Nflog_SenderInputInvalidCharacters;
    
    
    delete Nflog_FilterOptions;
    delete Nflog_SeverityIcons;
    delete Nflog_SeverityOrder;
    
    delete ConnectionStatusOk;
    
    delete Nflog_NotificationsArchives;
    
	delete Nflog_showRplcData;
	
    // Reset Validator
    $("#id_nflog_filter_table_form").removeData('validator');
    
    $(document).off("LanguageChanged");
}

$(document).ready(function(){
    
    $("#id_div_loader").show();
    
    // Init Validations
    Validation("#id_nflog_filter_table_form");
    
    if(DeviceWbmConfigsLoaded) Nflog_MaxNotificationsCount = DeviceWbmConfigs.NotificationLogConfigs.MaxNotificationsCount;
    console.log("Notification Log site started -  Max Notifications is " + Nflog_MaxNotificationsCount);
    // Init notification filter - Limit
    if(Nflog_UserMaxNotificationCount > Nflog_MaxNotificationsCount)
    {
        Nflog_UserMaxNotificationCount = Nflog_MaxNotificationsCount;
    }
    
    if(NFLOG_DEFAULT_NOTIFICATIONS_REQ_LIMIT > Nflog_UserMaxNotificationCount)
    {
        Nflog_FilterOptions.Limit = Nflog_UserMaxNotificationCount;
    }
    
    $("#id_nflog_max_notifications_count").val(Nflog_UserMaxNotificationCount);

    Nflog_showRplcData = ((typeof DeviceWbmConfigs.NotificationLogConfigs["ShowRplcData"] !== "undefined")
	                      && (DeviceWbmConfigs.NotificationLogConfigs["ShowRplcData"] == true));
	if(Nflog_showRplcData == true)
	{
		$("#id_nflog_redundancy_info_area").show();
	}		
    // Show on Updating Status
    OnStateUpdatingNotifications();
    
    // Initialize notifications table sorter
    InitNotificationsTableSorter();
    
    // Updates the options listed in "Archive name" select box
    InitFilterArchivesOptions();
    
    // Start updating notifications
    Nflog_NotificationsUpdateTimer = setTimeout(UpdateNotificationsData, 20);

    setTimeout(UpdatePlaceHolders, 20);
    
    $(document).on("click", "#id_nflog_notifications_table tr", function(event) {
        
        HandleTableTrSelected('id_nflog_notifications_table', this.rowIndex);
        var notificationId = $(this).attr("nfid")

		if(Nflog_showRplcData == true)
        {
			let redundancyType = $(this).attr("redundancyType");
		    let redundancyRole = $(this).attr("redundancyRole");
		    $("#id_nflog_notification_rtype_input").val(redundancyType);
		    $("#id_nflog_notification_rrole_input").val(redundancyRole);
		}
		
        if(this.rowIndex != 0)
        {
            var notificationPayloadId = "id_nflog_notification_" + notificationId + "_payload_span";
						
            $("#id_nflog_notification_textarea").val($("#" + notificationPayloadId).text());
        }
        else
        {
            $("#id_nflog_notification_textarea").val(""); 
        }
        
        event.preventDefault();
    });
    
    $(document).on("keydown", function(event) {
        switch(event.keyCode) {
            case 38: // up
                if ($("#id_nflog_notifications_table tbody tr.selected").prev().length) {
                    var tableRowHeight = 29;
                    var prevRowId = $("#id_nflog_notifications_table tbody tr.selected").prev().attr("id");
                    var currentRowId = $("#id_nflog_notifications_table tbody tr.selected").attr("id");
                    var currentRowCount = $("#id_nflog_notifications_table tr").index($("#id_nflog_notifications_table tbody tr.selected"));
                    var scrollOffset = ($("#" + currentRowId).offset().top - $("#id_nflog_notifications_table_div").offset().top + 2) * (tableRowHeight);
                    var offsetRowCount = ($("#" + currentRowId).offset().top - $("#id_nflog_notifications_table_div").offset().top + 2) / tableRowHeight;
                    var correctionOffset = scrollOffset - (tableRowHeight * (offsetRowCount + 1));
                    $('#id_nflog_notifications_table_div tbody').scrollTop(correctionOffset + (tableRowHeight * (currentRowCount -  scrollOffset/tableRowHeight)));
                    $("#" + prevRowId).trigger( "click" );
                    event.preventDefault();
                }
                break;
            case 40: // down
                if ($("#id_nflog_notifications_table tbody tr.selected").next().length) {
                    var tableRowHeight = 29;
                    var nextRowId = $("#id_nflog_notifications_table tbody tr.selected").next().attr("id");
                    var currentRowId = $("#id_nflog_notifications_table tbody tr.selected").attr("id");
                    var currentRowCount = $("#id_nflog_notifications_table tr").index($("#id_nflog_notifications_table tbody tr.selected"));
                    var scrollOffset = ($("#" + currentRowId).offset().top - $("#id_nflog_notifications_table_div").offset().top + 2) * ((tableRowHeight));
                    var offsetRowCount = ($("#" + currentRowId).offset().top - $("#id_nflog_notifications_table_div").offset().top + 2) / tableRowHeight;
                    var correctionOffset = scrollOffset - (tableRowHeight * (offsetRowCount - 1));
                    $('#id_nflog_notifications_table_div tbody').scrollTop(correctionOffset + (tableRowHeight * (currentRowCount -  scrollOffset/tableRowHeight)));
                    $("#" + nextRowId).trigger( "click" );
                    event.preventDefault();
                }
                break;
        }
        
    });
    
    $( "#id_nflog_notifications_table_div" ).scroll(function(event) {
        var scrollPosition = $("#id_nflog_notifications_table_div").scrollTop();
        if(scrollPosition > 10)
        {
            $("#id_nflog_notifications_table_div").css("border-top", "1px solid #CCD0D2");
        }
        else
        {
            $("#id_nflog_notifications_table_div").css("border-top", "0px");
        }
        event.preventDefault();
    });
    
    $('#id_nflog_apply_filter_button').click(function(event) {
        event.preventDefault();
        
        let result = true;
        // Get time from
        let filterDateFrom = $("#id_nflog_time_from_date_input"); 
        let filterTimeFrom = $("#id_nflog_time_from_time_input"); 
        let filterDateTo = $("#id_nflog_time_to_date_input"); 
        let filterTimeTo = $("#id_nflog_time_to_time_input"); 

        let timeStampBefore = "";
        let timeStampAfter = "";
        
        // Validate notification filter configuration
        result = $("#id_nflog_filter_table_form").valid();
        // Get Time Stamps
        if(result == true)
        {
            // Time from
            if(filterDateFrom.val())
            {
                timeStampAfter = ConvertDateTimeStringToIsoString(filterDateFrom.val(), filterTimeFrom.val());
            }
            
            // Time to
            if(filterDateTo.val())
            {
                let timeToString = (filterTimeTo.val().length == 0)?("23:59:59.999"):(filterTimeTo.val() + ".999");
                timeStampBefore = ConvertDateTimeStringToIsoString(filterDateTo.val(), timeToString);
            }
        }
        else
        {
            return false;
        }
        console.log("Applying notifications filter, Selected Filter Options", Nflog_FilterOptions);
        
        // Get archive selected
        if($("#id_nflog_archive_filter_select option:selected" ).val() != "<All archives>")
        {
            Nflog_FilterOptions.Archives = [ $("#id_nflog_archive_filter_select option:selected" ).val() ];
        }
        else
        {
            Nflog_FilterOptions.Archives = Nflog_NotificationsArchives;
        }
        
        // Set time stamp before
        Nflog_FilterOptions.TimestampBefore = timeStampBefore;
        
        // Set time stamp after
        Nflog_FilterOptions.TimestampAfter = timeStampAfter;
        
        // Get min Sevvrity
        Nflog_FilterOptions.SeverityLowerLimit = $("#id_nflog_severity_filter_select option:selected" ).val();
        // Get name
        Nflog_FilterOptions.SenderNameRegExp =  "^(.*)(" + $("#id_nflog_sender_filter_input").val() + ")(.*)$";
        
        // Copy intial Filter value
        Nflog_InitSetFilterOptions = Object.assign({},Nflog_FilterOptions);
        
        // Clear the NotificationsTable to reload its content
        ClearNotificationsTable();
        $("#id_div_loader").show();
        return false;
    });
    
    $('#id_nflog_notifications_export_button').click(function(event) {
        var notificationsTitles = [];
        var notificationsData = [];
        // Build Table Titles
        $('#id_nflog_notifications_table th').each(function() {
            notificationsTitles.push($(this).text());
        });
        // Add Archive Column to CSV
        notificationsTitles.push($("#id_nflog_filter_archivename_span").text());
        // Iterate over all table rows and add their data
        $('#id_nflog_notifications_table').find("tbody>tr").each(function(idx, row) {
            $(this).find('td').each (function() {
                if(typeof $(this).attr("Severity") !== typeof undefined)
                {
                    notificationsData.push($(this).attr("Severity"));
                }
                else
                {
                    notificationsData.push($(this).text());
                }
            }); 
            // Add archive information to exported CSV data
            if(typeof $(this).attr("archive") !== typeof undefined)
            {
                notificationsData.push($(this).attr("archive"));
            }
            else
            {
                notificationsData.push("");
            }
        });
        
        // convert to string
        var CsvString = PrepareCsvRow(notificationsTitles, notificationsTitles.length, '');
        CsvString = PrepareCsvRow(notificationsData, notificationsTitles.length, CsvString);

        var downloadLink = document.createElement("a");
        var blob = new Blob(["\ufeff", CsvString]);
        var url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = "NotificationsData.csv";
        
        // Download file
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        event.preventDefault();
        return false;
    });
    
});

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("Notification Log: Event subscriber on LanguageChanged - Selected language: "+ e.message);
    setTimeout(UpdatePlaceHolders, 200);
    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_nflog_filter_table_form");
    }catch(e){}
}

function ConvertDateTimeStringToIsoString(dateString, timeString)
{
    let fromDate = moment(dateString + ' ' + timeString, "DD.MM.YYYY HH:mm:ss.SSS").toDate();
    let tzOffsetMs = (new Date()).getTimezoneOffset() * 60000;
	
	let janOffset = new Date(fromDate.getFullYear(), 0, 1).getTimezoneOffset();
    let julOffset = new Date(fromDate.getFullYear(), 6, 1).getTimezoneOffset();
    let dstMinutes = fromDate.getTimezoneOffset() - Math.max(janOffset, julOffset);
	fromDate.setMinutes(fromDate.getMinutes() - dstMinutes);
	
    let isoString = (new Date(fromDate - tzOffsetMs)).toISOString().slice(0, -1) + "000";
    // Delete 'Z' character at string end of Timestamp iso string
    if(isoString.length > 0 && isoString[isoString.length - 1] == 'Z')
    {
        isoString = isoString.slice(0, (isoString.length - 1)) + isoString.slice(isoString.length) + '000000';
    }
    return isoString;
}


function UpdateNotificationsData()
{
    Nflog_AsyncNotificationsDataReqT0 = performance.now();

    var filterJsonString = JSON.stringify(Nflog_FilterOptions, null, '\t');
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
    ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig("module/NotificationLog/NotificationLog/ListNotificationLog",
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.JSON,
                                                        filterJsonString, ajaxCallbackFunctions, null);
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
    .then(function(data) {
        ConnectionStatusOk = true;
        if(data.error)
        {
            alert("Error: " + data.errorText);
            result = false;
        }
        if(typeof data.result != undefined && data.result != false)
        {
            // Update Notifications Table
            UpdateNotificationsTable(data.result);

            var processDuration = performance.now() - Nflog_AsyncNotificationsDataReqT0;
        }
        Nflog_NotificationsUpdateTimer = setTimeout(UpdateNotificationsData, (NFLOG_UPDATE_TIMEOUT - Math.abs(processDuration)));
    })
    .catch(function(errorObj) {
        console.log(errorObj);
        var processDuration = performance.now() - Nflog_AsyncNotificationsDataReqT0;
        Nflog_NotificationsUpdateTimer = setTimeout(UpdateNotificationsData, (NFLOG_UPDATE_TIMEOUT - Math.abs(processDuration)));
    });

}

function UpdateNotificationsTable(result)
{
    //var t00 = performance.now();
    // Check if notifications are available and process those
    if(result.Notifications.length > 0)
    {
        var popNotificationsIds = [];
        OnStateUpdatingNotifications();
        var newRows = "";
        $.each( result.Notifications, function( i, notification) {
            if(Nflog_ListedNotificationsIds.indexOf(notification.Id) == -1)
            {
                // convert notification to Html row and add it to the new rows list
                var newRow = BuildHtmlNotificationTableRow(notification);
                newRows = newRows + newRow;
                // Update Sender filter options
                UpdateFilterSenderOptions(notification.SenderName);
                // When installation mode is activated, insert the notification id after the array end, otherwise at first position
                //(Nflog_initialModeActive == true)?(Nflog_ListedNotificationsIds.push(parseInt(notification.Id))):(Nflog_ListedNotificationsIds.unshift(parseInt(notification.Id)));
                if(Nflog_initialModeActive == true)
                {
                    Nflog_ListedNotificationsIds.push(parseInt(notification.Id));
                }
                else
                {
                    (Nflog_ListedNotificationsIds.unshift(parseInt(notification.Id)));
                }
                if(Nflog_ListedNotificationsIds.length > Nflog_UserMaxNotificationCount)
                {
                    popNotificationsIds.push(Nflog_ListedNotificationsIds.pop());
                }
                if((i % 50 == 0) || (i == (result.Notifications.length - 1)))
                {
                    $newRows = $(newRows),
                    // resort table using the current sort; set to false to prevent resort, otherwise
                    // any other value in resort will automatically trigger the table resort.
                    resort = false;
                    // Add new rows to table and trigger table update
                    $('#id_nflog_notifications_table').find('tbody').append($newRows);//.trigger('addRows', [$newRows, resort]);
                    newRows = "";
                }
            }
            else
            {
               // console.log("Notification with id " + notification.Id + " exists already and will be skipped");
            }
            
        });
        // Shift table content and eliminate all notifications >  MaxNotificationsCount  
        ProcessNotificationsCircularTable(popNotificationsIds);
        // Store last ID
        if(Nflog_initialModeActive == true)
        {
            //Nflog_FilterOptions.StoredIdUpperLimit = result.Notifications[(result.Notifications.length - 1)].Id - 1;

            if(    (result.Notifications.length == 1 && Nflog_ListedNotificationsIds.indexOf(result.Notifications[0].Id) != -1) 
                || (Nflog_ListedNotificationsIds.length >= Nflog_UserMaxNotificationCount)
                || (Nflog_FilterOptions.TimestampBefore == result.Notifications[(result.Notifications.length - 1)].TimeStamp))
            {   // Revert updating logic to LIFO
                ResetOnInitModeDisabling();
            }
            else
            {
                Nflog_FilterOptions.TimestampBefore  = result.Notifications[(result.Notifications.length - 1)].TimeStamp;
            }
        }
        else
        {   
            // Init finished, get the newest notifications when available
            Nflog_FilterOptions.StoredIdLowerLimit = result.Notifications[0].Id + 1;
        }
        
        UpdateZebraTableRowsColors('id_nflog_notifications_table');

        OnStateUpdatingNotifications();
    }
    else if(result.Notifications.length == 0 && ConnectionStatusOk == true)
    {
        if(Nflog_initialModeActive == true)
        {
            // Revert updating logic to LIFO
            ResetOnInitModeDisabling();
        }
        if(Nflog_prevRxNotificationsCount > 0)
        {
            // Update only when data loading is finished
            var resort = true;
            $('#id_nflog_notifications_table').find('tbody').trigger('update', [resort]);
        }
        OnStateOk();
        $("#id_div_loader").hide();
    }
    
    if(Nflog_ListedNotificationsIds.length == 0)
    {
        OnStateNoEntriesFound();
    }
    //var t01 = performance.now();
    //console.log("### Updating Data took " + (t01 - t00) + "ms");
    
    Nflog_prevRxNotificationsCount = result.Notifications.length;
}

function ResetOnInitModeDisabling()
{
    if(Nflog_ListedNotificationsIds.length > 0)
    {
        Nflog_FilterOptions.StoredIdLowerLimit = Math.max.apply(null, Nflog_ListedNotificationsIds);
    }
    else
    {
        Nflog_FilterOptions.StoredIdLowerLimit = 0;
    }
    Nflog_initialModeActive = false;
    Nflog_FilterOptions.StoredIdUpperLimit = 0;
    Nflog_FilterOptions.TimestampBefore = Nflog_InitSetFilterOptions.TimestampBefore;
    Nflog_FilterOptions.TimestampAfter  = Nflog_InitSetFilterOptions.TimestampAfter;
}


function ProcessNotificationsCircularTable(popNotifications)
{
    $.each( popNotifications, function( i, id) {
        var notificationRowTrId = "id_nflog_notification_" + id + "_row_tr";
        $("#" + notificationRowTrId).remove();
    });
}


function InitFilterArchivesOptions()
{
    var result = null;
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
    ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("module/NotificationLog/NotificationLog/ListNotificationsArchives",
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.JSON,
                                                        "",
                                                        null);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    if(response != null && response.error == true)
    {
        OnStateDataErrorOccurred(response.errorText);
    }
    else
    {
        //OnStateOk();
        result = response.result;
        ConnectionStatusOk = true;
    }
            
    var archivesHtml = "";
    var selectedArchive = $("#id_nflog_archive_filter_select option:selected" ).val();
    $.each( result, function( i, archive) {
        Nflog_NotificationsArchives.push(archive);
        if(selectedArchive == archive)
        {
            archivesHtml = archivesHtml + '<option selected="selected" value="' + archive + '">' + archive + '</option>';
        }
        else
        {
            archivesHtml = archivesHtml + '<option value="' + archive + '">' + archive + '</option>';
        }
        
    });
    // Remove all options excepting the first "All" options
    $("#id_nflog_archive_filter_select").find('option:not(:first)').remove();
    $("#id_nflog_archive_filter_select").append(archivesHtml);
    
    Nflog_FilterOptions.Archives = Nflog_NotificationsArchives;
}

function ClearNotificationsTable()
{
    // Reset ID Limitation
    Nflog_FilterOptions.StoredIdLowerLimit = 0;
    Nflog_FilterOptions.StoredIdUpperLimit = 0;
    
    // Clear Table
    $.tablesorter.clearTableBody($("#id_nflog_notifications_table"));
    $($("#id_nflog_notifications_table")).trigger('update');
    
    // Clear notification box content
    $("#id_nflog_notification_textarea").val("");
    
    // Clear sender list
    $("#id_nflog_sender_list").html("");

    Nflog_ListedNotificationsIds = [];
    
    Nflog_UserMaxNotificationCount = parseInt($("#id_nflog_max_notifications_count").val());
    
    Nflog_initialModeActive = true;
}


function BuildHtmlNotificationTableRow(notification)
{
    var timeStampStr =  IsoToDinTimeStampStr(notification.TimeStamp);
    var notificationPayload = "";
    $.each( notification.Payload, function( i, payload) {
        notificationPayload = notificationPayload + WbmUtilities.EncodeHtmlEntities(payload);
    });

    // Sanitize Notification fields
    // Will generate comma separated string from the Archives elements
    notification.Archive          = WbmUtilities.EncodeHtmlEntities(notification.Archives);
    notification.TimeStamp        = WbmUtilities.EncodeHtmlEntities(notification.TimeStamp);
    notification.SenderName       = WbmUtilities.EncodeHtmlEntities(notification.SenderName);
    notification.NotificationName = WbmUtilities.EncodeHtmlEntities(notification.NotificationName);
	
	let redundancyIdsHtml = "";
	if(Nflog_showRplcData == true)
	{
		notification.RedundancyType   = WbmUtilities.EncodeHtmlEntities(notification.RedundancyType);
        notification.RedundancyRole   = WbmUtilities.EncodeHtmlEntities(notification.RedundancyRole);
		redundancyIdsHtml = ' redundancyType="' + notification.RedundancyType + '" redundancyRole="' + notification.RedundancyRole + '"';
	}

    var tableHtmlRow =   '<tr nfid="' + notification.Id + '" id="id_nflog_notification_' + notification.Id + '_row_tr" archive="' + notification.Archive + '" class="highlighted" ' + redundancyIdsHtml +'>'
                       +    '<td style="text-align: center;" Severity="' + notification.Severity + '">'
                       +        '<img src="' + Nflog_SeverityIcons[notification.Severity] + '" style="max-height:100%; width: auto;"></img>'
                       +    '</td>'
                       +    '<td id="id_nflog_notification_' + notification.Id + '_time_td" Timestamp="' + notification.TimeStamp + '">' + timeStampStr + '</td>'
                       +    '<td id="id_nflog_notification_' + notification.Id + '_sender_td">' + notification.SenderName + '</td>'
                       +    '<td id="id_nflog_notification_' + notification.Id + '_name">' + notification.NotificationName + '</td>'
                       +    '<td id="id_nflog_notification_' + notification.Id + '_payload_td" class="NotificationPaylod" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">'
                       +        '<span id="id_nflog_notification_' + notification.Id + '_payload_span">' + notificationPayload + '</span></td>'
                       + '</tr>';
    return tableHtmlRow;
}

function UpdateFilterSenderOptions(senderName)
{
    //var senderOptionFound = $('#id_nflog_sender_list option').find('[text="' + senderName + '"]');
    var senderOptionFound = ($("#id_nflog_sender_list option:contains('" + senderName + "')").text() == senderName);
    if(senderOptionFound == false)
    {
        $("#id_nflog_sender_list").append("<option>" + senderName + "</option>");
    }
}

function IsoToDinTimeStampStr(timeStamp)
{
    var timeStamp = new Date(timeStamp); 
    var timeStampStr =    ("0" + timeStamp.getDate()).slice(-2) + '.' 
                        + ("0" + (timeStamp.getMonth() +　1)).slice(-2) + '.'
                        + ("00" + timeStamp.getFullYear()).slice(-4) + ' '
                        + ("0" + timeStamp.getHours()).slice(-2) + ':'
                        + ("0" + timeStamp.getMinutes()).slice(-2) + ':' 
                        + ("0" + timeStamp.getSeconds()).slice(-2) + '.' 
                        + ("00" + timeStamp.getMilliseconds()).slice(-3);
    return timeStampStr;
}


function InitNotificationsTableSorter()
{
    // Add severity parser
    $.tablesorter.addParser({
        // set a unique id
        id: 'severity',
        is: function(s, table, cell, $cell) {
            // return false so this parser is not auto detected
            return false;
        },
        format: function(s, table, cell, cellIndex) {
            // format your data for normalization
            var nummericalVal = Nflog_SeverityOrder[$(cell).attr("Severity")];
            if(typeof nummericalVal != undefined)
            {
                return nummericalVal;
            }
            else
            {
                return 0;
            }
        },
        // Set numeric type
        type: 'numeric'
    });
    
    // Add time stamp parser
    $.tablesorter.addParser({
        // set a unique id
        id: 'timestamp',
        is: function(s, table, cell, $cell) {
            // return false so this parser is not auto detected
            return false;
        },
        format: function(s, table, cell, cellIndex) {
            // format your data for normalization
            var splitedStamp = $(cell).attr("Timestamp").split(".");
            if(splitedStamp.length == 2)
            {
                var date = new Date($(cell).attr("Timestamp"));
                return date.getTime();
            }
            else
            {
                return 0;
            }
        },
        // Set numeric type
        type: 'numeric'
    });
    
    // Bind sort end event
    $("#id_nflog_notifications_table")
    .bind("sortEnd",function(e, table) {
        UpdateZebraTableRowsColors('id_nflog_notifications_table');
    });
    $("#id_nflog_notifications_table")
    .bind("sortStart",function(e, table) {
        $("#id_div_loader").show();
        OnStateSortingNotifications();
    });
    
    // Initialize table
    $("#id_nflog_notifications_table").tablesorter({
                                                      sortList: [[1,1]], // Default descending sort by timestamp column  
                                                      debug: false
                                                   }); 
}


function PrepareCsvRow(array, columnCount, initial) {
  var row = '';
  var delimeter = ';';
  var newLine = '\r\n';
  var plainArray = splitArray(array, columnCount);
  // converting `['a', 'b', 'c']` to `a,b,c` string
  plainArray.forEach(function(arrayItem, rowIdx) {
    arrayItem.forEach(function(item, idx) {
      var itemval = item.replace(/(\r\n|\n|\r)/gm, "");
      // Prevent CSV Injection
      itemval = '"\'' + itemval.replace(/["]+/g, '""') + '"';
      row += itemval + ((idx + 1) === arrayItem.length ? '' : delimeter);
    });
    row += newLine;
  });
  return initial + row;
}

function splitArray(array, count) {
    var splitted = [];
    var result = [];
    array.forEach(function(item, index) {
      if ((index + 1) % count === 0) {
        splitted.push(item);
        result.push(splitted);
        splitted = [];
      } else {
        splitted.push(item);
      }
    });
    return result;
  }
  
function HandleTableTrSelected(tableId, rowIndex)
{
   var table = document.getElementById(tableId);
   for(var i = 1; i < table.rows.length ; i++)
   {
       if(i == rowIndex)
       {
           if(table.rows[i].classList.contains("even") == true)
           {
              table.rows[i].classList.remove("even");
           }
           table.rows[i].classList.toggle("selected", "true");
       }
       else
       {
           table.rows[i].classList.remove("selected");
           if((i % 2) == 0)
           {
               if(table.rows[i].classList.contains("even") == false)
               {
                   if(table.rows[i].classList.contains("odd") == true)
                   {
                       table.rows[i].classList.remove("odd");
                   }
                   table.rows[i].classList.add("even");
               }
           }
       }
       
   }
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

function UpdatePlaceHolders()
{
    $("#id_nflog_time_from_date_input").attr("placeholder", $("#id_nflog_date_placeholder_span").text());
    $("#id_nflog_time_from_time_input").attr("placeholder", $("#id_nflog_time_placeholder_span").text());
    
    $("#id_nflog_time_to_date_input").attr("placeholder", $("#id_nflog_date_placeholder_span").text());
    $("#id_nflog_time_to_time_input").attr("placeholder", $("#id_nflog_time_placeholder_span").text());
    
    $("#id_nflog_max_notifications_count").attr("placeholder", "Max: " + Nflog_MaxNotificationsCount);
}

function OnConnectionError(xhr, status, error)
{
    $("#id_nflog_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_nflog_offline_circle_span").css("display", "inline-block");
    $("#id_nflog_offline_status_span").show();
    $("#id_nflog_status_disconnected_span").show();
    
    if(ConnectionStatusOk == true)
    {
        ConnectionStatusOk = false;
    }
    $("#id_div_loader").hide();
    
    $("#id_main_connection_error_div").show();
}

function OnStateOk()
{
    $("#id_nflog_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_nflog_online_circle_span").css("display", "inline-block");
    $("#id_nflog_online_status_span").show();
    $("#id_nflog_status_ok_span").show();
    
    $("#id_main_connection_error_div").hide();
}

function OnStateUpdatingNotifications()
{
    $("#id_nflog_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_nflog_online_circle_span").css("display", "inline-block");
    $("#id_nflog_online_status_span").show();
    $("#id_nflog_status_updating_notifications_span").show();
    
}

function OnStateNoEntriesFound()
{
    $("#id_nflog_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_nflog_online_circle_span").css("display", "inline-block");
    $("#id_nflog_online_status_span").show();
    $("#id_nflog_no_entries_available_span").show();
}

function OnStateSortingNotifications()
{
    $("#id_nflog_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_nflog_online_circle_span").css("display", "inline-block");
    $("#id_nflog_online_status_span").show();
    $("#id_nflog_status_text_sorting_notifications_span").show();
}

function OnStateDataErrorOccurred()
{
    $("#id_nflog_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_nflog_online_circle_span").css("display", "inline-block");
    $("#id_nflog_online_status_span").show();
    $("#id_nflog_nlogger_error_occurred_span").show();
}
