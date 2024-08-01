SubPageActive = true;

ConnectionStatusOk = true;

ConnectionStatusNa = false;

FANCONTROL_TEXT_COLOR_OK    = '#92D050';
FANCONTROL_TEXT_COLOR_ERROR = '#ED1C24';
FANCONTROL_STATUS_WARNING_COLOR  = '#FFC000';
FANCONTROL_STATUS_COLOR_GREY = "#808080"

FanControlUpdateTimer = undefined;

FANCONTROL_STATUS_UPDATE_TIMEOUT = 1000;

AJAX_REQUEST_TIMEOUT = 3000;

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    window.clearTimeout(FanControlUpdateTimer);
    window.clearInterval(FanControlUpdateTimer);
    delete FanControlUpdateTimer;
    
    delete SubPageActive;
    delete SystemMessagesIds;
    delete ConnectionStatusOk;
    delete ConnectionStatusNa;
    delete NETWORK_PORT_INFOS_UPDATE_TIMEOUT;
    delete AJAX_REQUEST_TIMEOUT;
    delete FanControlService;
}

$(document).ready(function()
{
    UpdateFanControlData();
    UpdateFanCalibrationTimestamp();
    
    $('#id_fancontrol_calibration_button').click(function(event) {
        // should ask permission before calling calibration function
        $("#id_div_fancalibration_start_confirm").show();
        event.preventDefault();
        return false;
    });
    
    $('#id_fancalibration_start_ok_btn').click(function(event) {
        // should ask permission before calling calibration function
        let response = FanControlService.StartFanControlCalibration();
        
        if(response.error)
        {
            OnStateDataErrorOccurred(response.errorText);
        }
        else
        {
            OnStateStatusOk();
        }
        if(response != false && typeof response.error == false)
        {
            location.reload();
        }
        $("#id_div_fancalibration_start_confirm").hide();
        event.preventDefault();
        return false;
    });
    
    $('#id_fancalibration_start_cancel_btn').click(function(event) {
        // should ask permission before calling calibration function
        $("#id_div_fancalibration_start_confirm").hide();
    
        event.preventDefault();
        return false;
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

function UpdateFanControlData()
{
    // Check Session is Valid
    FanControlService.GetFanControlSysVariables()
    .then(function(data) {
        ConnectionStatusOk = true;
        if(data.error)
        {
            console.log("Error: " + data.errorText);
            result = false;
        }
        if(ConnectionStatusOk == true)
        {
            OnStateStatusOk();
        }
        var result = data.result;
        
        if(typeof result !== "undefined" && result == "Fan module not plugged")
        {
            ConnectionStatusNa = true;
            $('#id_fancontrol_calibration_button').show();
            $("#id_fancontrol_fan_defect_value_td").css("background-color", FANCONTROL_STATUS_COLOR_GREY);
            $("#id_fancontrol_fan_defect_na_span").show();
            $("#id_fancontrol_fan_lastcalibration_value_td").text("--");
            $("#id_fancontrol_fan_defect_yes_span").hide();
            $("#id_fancontrol_fan_defect_no_span").hide();
            $("#id_fancontrol_status_ok_span").hide();
            $("#id_fancontrol_status_na_span").show();
                
            $("#id_fancontrol_fan_maintenance_value_td").css("background-color", FANCONTROL_STATUS_COLOR_GREY);
            $("#id_fancontrol_fan_maintenance_na_span").show();
            $("#id_fancontrol_fan_lastcalibration_value_td").text("--");
            $("#id_fancontrol_fan_maintenance_yes_span").hide();
            $("#id_fancontrol_fan_maintenance_no_span").hide();
                        
        }
        else if(typeof result !== "undefined" && result != false)
        {
            // Start Network Port Infos Update Timer
            //console.log("Sys variable fanfail", result.FanFail);
            ConnectionStatusNa = false;
            if(result.FanFail == true)
            {
                $("#id_fancontrol_fan_defect_value_td").css("background-color", FANCONTROL_TEXT_COLOR_ERROR);
                $("#id_fancontrol_fan_defect_yes_span").show();
                $("#id_fancontrol_fan_defect_no_span").hide();
                $("#id_fancontrol_fan_defect_na_span").hide();
                $("#id_fancontrol_status_na_span").hide();
            }
            else
            {
                $("#id_fancontrol_fan_defect_value_td").css("background-color", FANCONTROL_TEXT_COLOR_OK);
                $("#id_fancontrol_fan_defect_yes_span").hide();
                $("#id_fancontrol_fan_defect_no_span").show();
                $("#id_fancontrol_fan_defect_na_span").hide();
                $("#id_fancontrol_status_na_span").hide();
            }
            //console.log("Sys variable fanMaintenance", result.FanMaintenance);
            if(result.FanMaintenance == true)
            {
                $("#id_fancontrol_fan_maintenance_value_td").css("background-color", FANCONTROL_STATUS_WARNING_COLOR);
                $("#id_fancontrol_fan_maintenance_yes_span").show();
                $("#id_fancontrol_fan_maintenance_no_span").hide();
                $("#id_fancontrol_fan_maintenance_na_span").hide();
                $("#id_fancontrol_status_na_span").hide();
            }
            else
            {
                $("#id_fancontrol_fan_maintenance_value_td").css("background-color", FANCONTROL_TEXT_COLOR_OK);
                $("#id_fancontrol_fan_maintenance_yes_span").hide();
                $("#id_fancontrol_fan_maintenance_no_span").show();
                $("#id_fancontrol_fan_maintenance_na_span").hide();
                $("#id_fancontrol_status_na_span").hide();
            }       
        
        }
        
    })
    .catch(function(errorObj) {
        console.log(errorObj)
    })

    NetworkPortInfosUpdateTimer = setTimeout(UpdateFanControlData, FANCONTROL_STATUS_UPDATE_TIMEOUT);
}

function UpdateFanCalibrationTimestamp()
{
    // Check Session is Valid
    FanControlService.GetFanLastCalibration()
    .then(function(data) {
        if(ConnectionStatusOk == true && ConnectionStatusNa == false)
        {
            OnStateStatusOk();
        }
        var result = data.result;
        if(result != false && typeof result != undefined)
        {
            console.log("1 LastCalibration", result.LastCalibration);
            if(result.LastCalibration != "")
            {
                $("#id_fancontrol_fan_lastcalibration_value_td").text(result.LastCalibration);
            }
            else
            {
                $("#id_fancontrol_fan_lastcalibration_value_td").text("--");
            }
        }
        
    })
    .catch(function(errorObj) {
        console.log(errorObj)
    })

    NetworkPortInfosUpdateTimer = setTimeout(UpdateFanCalibrationTimestamp, FANCONTROL_STATUS_UPDATE_TIMEOUT);
    
}


function OnStateConnectionError(xhr, status, error)
{
    $("#id_fancontrol_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_fancontrol_online_circle_span").hide();
    $("#id_fancontrol_online_status_span").hide();
    $("#id_fancontrol_status_ok_span").hide();
    
    $("#id_fancontrol_offline_circle_span").css("display", "inline-block");
    $("#id_fancontrol_offline_status_span").show();
    $("#id_fancontrol_status_disconnected_span").show();
    
    if(ConnectionStatusOk)
    {
        alert($("#id_fancontrol_status_disconnected_span").text() + " (" + error + ")");
        ConnectionStatusOk = false;
    }
}

function OnStateDataErrorOccurred(error)
{
    $("#id_fancontrol_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    //$("#id_fancontrol_offline_circle_span").css("display", "inline-block");
    //$("#id_fancontrol_offline_status_span").show();
    
    // T.B.D. Define Error Message
    
}

function OnStateStatusOk()
{
    $("#id_fancontrol_status_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    $("#id_fancontrol_online_circle_span").show();
    $("#id_fancontrol_online_status_span").show();
    if(ConnectionStatusNa == false)
    {
        $("#id_fancontrol_status_ok_span").show();
    }
    else
    {
        $("#id_fancontrol_status_na_span").hide();
    }
        
    $("#id_fancontrol_offline_circle_span").css("display", "none");
    $("#id_fancontrol_offline_status_span").hide();
    $("#id_fancontrol_status_disconnected_span").hide();
}

FanControlService = (function () {

    let Public = {

        StartFanControlCalibration: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "StartFanControlCalibration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetFanControlSysVariables: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnStateConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetFanControlSysVariables",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },


        GetFanLastCalibration: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnStateConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetFanLastCalibration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        }

    }

    let Private = {
        dpScriptName: "module/FanControl/FanControlDp/"
    }

    return Public;

})();
