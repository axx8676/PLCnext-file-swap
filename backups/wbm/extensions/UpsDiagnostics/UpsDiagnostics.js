SubPageActive = true;

UpsDiagnostics_UpdateTimer = undefined;

UPSDIAGNOSTICS_UPDATE_TIMEOUT = 5000;
UPSDIAGNOSTICS_COLOR_OK = '#92D050';
UPSDIAGNOSTICS_COLOR_ERROR = '#ED1C24';
UPSDIAGNOSTICS_COLOR_WARNING = '#FFC000';
UPSDIAGNOSTICS_COLOR_GREY = '#808080';

function CleanUpPageData() {
    delete SubPageActive;

    window.clearTimeout(UpsDiagnostics_UpdateTimer);
    window.clearInterval(UpsDiagnostics_UpdateTimer);
    delete UpsDiagnostics_UpdateTimer;

    delete UPSDIAGNOSTICS_UPDATE_TIMEOUT;
    delete UPSDIAGNOSTICS_COLOR_OK;
    delete UPSDIAGNOSTICS_COLOR_ERROR;
    delete UPSDIAGNOSTICS_COLOR_WARNING;
    delete UPSDIAGNOSTICS_COLOR_GREY;

    delete UpsDiagnosticService;
}

$(document).ready(function () {
    UpdateUpsDiagnosticData();
});

/// Diagnostics Data update function which is called permanent every 1 second. This function:
///     - updates the diagnostics data fields and progress bar
/// @returns {none}
function UpdateUpsDiagnosticData() {
    if (typeof SubPageActive == undefined) {
        return;
    }

    UpsDiagnosticService.GetDiagnosticData()
        .then(function (jsonResponse) {
            SetConnectionOnline();

            if (jsonResponse.error) {
                console.error(($("#id_upsdiagnostics_error_msg_placeholder").text() + jsonResponse.errorText));
                SetStatusDiagnosticDataError();
            }
            else {
                let data = jsonResponse.result;
                UpdateUpsChargeLevel(data);
                UpdateUpsHealthStatus(data);
                SetStatusOK();
            }
        })
        .catch(function (errorObj) {
            // check status && error
            console.warn("Communication Error while requesting Json data from URL = " + ajaxReqConfig.Url + " Error: " + errorObj.error);
        });

    // Set Updating Timer Time Out
    UpsDiagnostics_UpdateTimer = setTimeout(UpdateUpsDiagnosticData, UPSDIAGNOSTICS_UPDATE_TIMEOUT);
}

UpsDiagnosticService = (function () {

    let Public = {

        GetDiagnosticData: function () {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetDiagnosticData",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        }
    }

    let Private = {
        dpScriptName: "module/UpsDiagnostics/UpsDiagnosticsProvider/"
    }

    return Public;

})();

function UpdateUpsChargeLevel(data) {
    $("#id_upsdiagnostics_bar_div").hide();
    $("#id_upsdiagnostics_bar_span").show();
    $("#id_upsdiagnostics_bar_span").text("N/A");

    if ((data.chargeLevel !== undefined) && (data.chargeLevel !== null)) {
        if ((data.chargeLevel > 0) && (data.chargeLevel <= 100)) {
            $("#id_upsdiagnostics_bar_span").hide();
            $("#id_upsdiagnostics_bar_div").show();
            $("#id_upsdiagnostics_bar_div").width(data.chargeLevel + "%");
            $("#id_upsdiagnostics_bar_div").text(data.chargeLevel + "%");
        }
        else {
            if (data.chargeLevel === 0) {
                $("#id_upsdiagnostics_bar_span").text("0%");
            }
            else {
                $("#id_upsdiagnostics_bar_span").text("invalid value");
            }
        }
    }
}

function UpdateUpsHealthStatus(data) {
    $("#id_upsdiagnostics_health_ok_span").hide();
    $("#id_upsdiagnostics_health_warning_span").hide();
    $("#id_upsdiagnostics_health_failure_span").hide();
    $("#id_upsdiagnostics_health_na_span").hide();

    if ((data.healthStatus !== undefined) && (data.healthStatus !== null)) {
        if (data.healthStatus === 0) {
            $("#id_upsdiagnostics_health_ok_span").show();
            $("#id_upsdiagnostics_health_value_td").css("background-color", UPSDIAGNOSTICS_COLOR_OK);
            return;
        }
        else if (data.healthStatus === 1) {
            $("#id_upsdiagnostics_health_warning_span").show();
            $("#id_upsdiagnostics_health_value_td").css("background-color", UPSDIAGNOSTICS_COLOR_WARNING);

            return;
        }
        else if (data.healthStatus === 2) {
            $("#id_upsdiagnostics_health_failure_span").show();
            $("#id_upsdiagnostics_health_value_td").css("background-color", UPSDIAGNOSTICS_COLOR_ERROR);
            return;
        }
    }

    $("#id_upsdiagnostics_health_na_span").show();
    $("#id_upsdiagnostics_health_value_td").css("background-color", UPSDIAGNOSTICS_COLOR_GREY);
}

function SetConnectionOnline() {
    $("#id_upsdiagnostics_online_circle_span").show();
    $("#id_upsdiagnostics_online_status_span").show();

    $("#id_upsdiagnostics_offline_circle_span").hide();
    $("#id_upsdiagnostics_offline_status_span").hide();
}

function SetStatusOK() {
    $("#id_upsdiagnostics_status_ok_span").show();
    $("#id_upsdiagnostics_status_text_get_data_error_span").hide();
    $("#id_upsdiagnostics_status_disconnected_span").hide();
}

function SetStatusDiagnosticDataError() {
    $("#id_upsdiagnostics_status_ok_span").hide();
    $("#id_upsdiagnostics_status_text_get_data_error_span").show();
    $("#id_upsdiagnostics_status_disconnected_span").hide();
}

function OnConnectionError(xhr, status, error) {
    $("#id_upsdiagnostics_online_circle_span").hide();
    $("#id_upsdiagnostics_online_status_span").hide();
    $("#id_upsdiagnostics_status_ok_span").hide();

    $("#id_upsdiagnostics_offline_circle_span").show();
    $("#id_upsdiagnostics_offline_status_span").show();
    $("#id_upsdiagnostics_status_disconnected_span").show();

    console.warn("Connection error occurred", status, error);
}
