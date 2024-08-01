SubPageActive = true;
doRefresh = true;

PLCNEXT_STORE_DP_SCRIPT_NAME = "module/PLCnextStore/PLCnextStoreDp/";

refreshTimer = null;
refreshSemaphore = 0;

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    if(typeof refreshTimer === "undefined")
    {
        return;
    }
    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }
    doRefresh = false;

    delete refreshTimer;
    delete SubPageActive;
    delete PLCNEXT_STORE_DP_SCRIPT_NAME;
}

$(document).ready(function () {
    // create button click events
    $("#id_apply_service_enable_btn").click(function (event) {
        event.preventDefault();

        let enabled = $("#id_plcnextstore_service_enabled_cb").prop("checked");
        StoreEnable(enabled);
    });
   
    $("#id_reconnect_btn").click(function (event) {
        event.preventDefault();

        Reconnect();
    });

    StoreRefreshUuid();
    StoreRefreshEnabled();

    // cyclic refresh status information
    doRefresh = true;
    StoreRefresh();

    // Show page content after page elements are loaded
    $("#id_plcnextstore_page_global_div").show();
});

document.addEventListener('keyup', CloseModalWithEsc);



/**
 * Refreshs the UI
 */
function StoreRefresh() {
    StoreRefreshSystemTime();
    StoreRefreshM2MStatus();
    StoreRefreshConnectionStatus();
    StoreRefreshRegistrationStatus();

    TriggerRefreshScheduler();
}

function TriggerRefreshScheduler() {
    // Execute next refresh cycle
    if (refreshSemaphore == 0) {
        refreshTimer = setTimeout(StoreRefresh, 3000);
    } else {
        refreshTimer = setTimeout(TriggerRefreshScheduler, 500);
    }
}

/**
 * Retrieves the PLCnext Store UUID
 */
function StoreRefreshUuid() {
    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;

    // Prepare ajax request to retrieve UUID
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "GetCloudUuid", // url
        AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
        AjaxInterface.AjaxRequestDataType.HTML, // dataType: The type of data that you're expecting back
        null, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        $("#id_plcnextstore_clouduuid_value").html(ProfiCloudV3EscapeHtml(data));
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
    });
}

/**
 * Retrieves whether the PLCnext Store is enabled or disabled
 */
function StoreRefreshEnabled() {
    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;

    // Prepare ajax request to retrieve registration status
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "IsPLCnextStoreEnabled", // url
        AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
        AjaxInterface.AjaxRequestDataType.HTML, // dataType: The type of data that you're expecting back
        null, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        $("#id_plcnextstore_service_enabled_cb").prop('checked', ProfiCloudV3EscapeHtml(data));
        if (data !== "checked") {
            $("#id_plcnextstore_disabled_hint").attr("class", "c_plcnextstore_disabled_hint");
        }
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
    });
}

/**
 * Retrives the current system time
 */
function StoreRefreshSystemTime() {
    refreshSemaphore++;

    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;

    // Prepare ajax request to retrieve time
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "GetSystemTime", // url
        AjaxInterface.AjaxRequestType.GET,
        AjaxInterface.AjaxRequestDataType.HTML,
        null, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        $("#id_plcnextstore_systemtime_value").html(ProfiCloudV3EscapeHtml(data));
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
    }).finally(function () {
        refreshSemaphore--;
    });
}

/**
 * Retrieves the PLCnext Store registration status
 */
function StoreRefreshRegistrationStatus() {
    refreshSemaphore++;

    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;

    // Prepare ajax request to retrieve registration status
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "GetRegistrationStatus", // url
        AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
        AjaxInterface.AjaxRequestDataType.HTML, // dataType: The type of data that you're expecting back
        null, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        $("#id_plcnextstore_registrationstate_value").html(ProfiCloudV3EscapeHtml(data));
        var className = "c_plcnextstore_registration_state_" + data;
        $("#id_plcnextstore_registrationstate_value").attr('class', ProfiCloudV3EscapeHtml(className));
        Language.UpdateActivePageMessages();
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
    }).finally(function () {
        refreshSemaphore--;
    });
}

/**
 * Retrieves the PLCnext Store M2M status
 */
function StoreRefreshM2MStatus() {
    refreshSemaphore++;

    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;

    // Prepare ajax request to retrieve registration status
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "GetM2MStatus", // url
        AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
        AjaxInterface.AjaxRequestDataType.HTML, // dataType: The type of data that you're expecting back
        null, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        $("#id_plcnextstore_internetstate_value").html(ProfiCloudV3EscapeHtml(data));
        var classNameInternet = "c_plcnextstore_internetstate_" + data;
        $("#id_plcnextstore_internetstate_value").attr('class', ProfiCloudV3EscapeHtml(classNameInternet));

        $("#id_plcnextstore_m2mstate_value").html(ProfiCloudV3EscapeHtml(data));
        var classNameM2M = "c_plcnextstore_m2mstate_" + data;
        $("#id_plcnextstore_m2mstate_value").attr('class', ProfiCloudV3EscapeHtml(classNameM2M));
        Language.UpdateActivePageMessages();

        
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
    }).finally(function () {
        refreshSemaphore--;
    });
}

/**
 * Retrieves the device connection status
 */
function StoreRefreshConnectionStatus() {
    refreshSemaphore++;

    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;

    // Prepare ajax request to retrieve registration status
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "GetConnectionStatus", // url
        AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
        AjaxInterface.AjaxRequestDataType.HTML, // dataType: The type of data that you're expecting back
        null, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        $("#id_plcnextstore_connectionstate_value").html(ProfiCloudV3EscapeHtml(data));
        var classNameConnectionState = "c_plcnextstore_connectionstate_" + data;
        $("#id_plcnextstore_connectionstate_value").attr('class', ProfiCloudV3EscapeHtml(classNameConnectionState));
        Language.UpdateActivePageMessages();

        if (data === "Online") {
            $("#id_reconnect_btn").show();
        } else {
            $("#id_reconnect_btn").hide();
        }
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
        $("#id_reconnect_btn").hide();
    }).finally(function () {
        refreshSemaphore--;
    });
}

/**
 * Reconnect the connection to the M2M if online
 */
function Reconnect() {
    $("#id_reconnect_btn").hide();

    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
    ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
        $("#id_reconnect_btn").show();
    };

    // Prepare ajax request to retrieve registration status
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "Reconnect", // url
        AjaxInterface.AjaxRequestType.POST, // requestType: HTTP Request type
        AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
        null, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        // Nothing to do
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
    }).finally(function () {
        $("#id_reconnect_btn").show();
    });;
}

/**
 * Enables/Disables the PLCnext Store
 */
function StoreEnable(enabled) {
    $('#id_apply_service_enable_btn').hide();

    var enable_service_msg = {
        "plcnextstore": enabled
    };

    // Prepare ajax callback container object
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
    ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
        $('#id_apply_service_enable_btn').show();
    };

    // Prepare ajax request to retrieve registration status
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
        PLCNEXT_STORE_DP_SCRIPT_NAME + "EnablePLCnextStore", // url
        AjaxInterface.AjaxRequestType.POST, // requestType: HTTP Request type
        AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
        enable_service_msg, // data: The data to send
        ajaxCallbackFunctions, // callbacks
        60000 // timeout
    );

    // Execute ajax request
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
        // Nothing to do
    }).catch(function (errorObj) {
        // Unknown execption
        console.log(errorObj);
    }).finally(function () {
        $('#id_apply_service_enable_btn').show();
        if (enabled) {
            $("#id_plcnextstore_disabled_hint").removeAttr("class");
            $("#id_plcnextstore_disabled_hint").text("");
        } else {
            $("#id_plcnextstore_disabled_hint").attr("class", "c_plcnextstore_disabled_hint");
        }
        Language.UpdateActivePageMessages();
    });
}

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

/**
 * Escapes the special html characters: & < > " ' `
 * 
 * Unfortunately there's no native javascript function to do that.
 * There is a jquery function escapeHTML() but it doesn't escape characters which is required for inserting text as quoted attribute values.
 * 
 * This method is not safe to use for inserting text in <script> tags.
 * This method is not safe to use for inserting text as unquoted attribute values.
 * 
 * Content-Type HTTP response header and <meta> tag with charset must be specified, otherwise XSS might still be possible.
 * 
 * See also https://wonko.com/post/html-escaping
 * 
 * @param text The text to escape.
 * @returns The escaped text or an empty string if the given parameter is null.
 */
function ProfiCloudV3EscapeHtml(text) {
    if (text == null) {
        return "";
    }
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}