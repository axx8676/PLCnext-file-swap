SubPageActive = true;

SecurityProfileStatus = {
    Activated           : "activated",
    Deactivated         : "deactivated",
    NotSupported        : "not_supported"
}


function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete SubPageActive;

    delete SecurityProfileStatus;

    delete SecurityProfileService;
}


$(document).ready(function(){   


    UpdateSecurityProfileStatus();

    $('#id_secprofile_apply_config_button').click(function(event) {
        
        var activatingSecurityProfile = $("#id_secprofile_profile_enabled_cb").prop("checked");
        if(activatingSecurityProfile == true)
        {
            $("#id_secprofile_activation_warning_div").show();
            $("#id_secprofile_activation_ok_btn").show();
            $("#id_secprofile_deactivation_warning_div").hide();
            $("#id_secprofile_deactivation_ok_btn").hide();
        }
        else
        {
            $("#id_secprofile_activation_warning_div").hide();
            $("#id_secprofile_activation_ok_btn").hide();
            $("#id_secprofile_deactivation_warning_div").show();
            $("#id_secprofile_deactivation_ok_btn").show();
        }
        
        $("#id_div_secprofile_apply_confirm").show();

        event.preventDefault();
        return false;
    });
    
    $('#id_secprofile_discard_config_button').click(function(event) {
        $("#id_secprofile_discard_modal").show();
        event.preventDefault();
        return false;
    });
    
    $("#id_secprofile_discard_ok_btn").click(function(event)
    {
        $("#id_secprofile_discard_modal").hide();
        $("#id_div_loader").show();
        event.preventDefault();
        window.location.href = "#extensions/Spm/SecurityProfile.html";
        location.reload();

        return false;
    });
    $("#id_secprofile_discard_cancle_btn").click(function(event)
    {
        $("#id_secprofile_discard_modal").hide();
        event.preventDefault();
        return false;
    });
    
    $('#id_secprofile_operation_cancel_btn').click(function(event) {
        $("#id_div_secprofile_apply_confirm").hide();

        event.preventDefault();
        return false;
    });
    
    $('#id_secprofile_activation_ok_btn').click(function(event) {
        $("#id_div_secprofile_apply_confirm").hide();
        if(SetSecurityProfileStatus("Activated"))
        {
            location.reload();
        }
        else
        {
            $("#id_div_secprofile_apply_confirm").hide();
        }
        event.preventDefault();
        return false;
    });
    
    $('#id_secprofile_deactivation_ok_btn').click(function(event) {
        $("#id_div_secprofile_apply_confirm").hide();
        if(SetSecurityProfileStatus("Deactivated"))
        {
            location.reload();
        }
        else
        {
            $("#id_div_secprofile_apply_confirm").hide();
        }
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

function UpdateSecurityProfileStatus()
{
    let response = SecurityProfileService.GetActivationStatus();
    if(!response.error)
    {   
        if(response.result == "Activated")
        {
            $("#id_secprofile_status_activated").show();
            $("#id_secprofile_profile_enabled_cb").prop("checked", true);
        }
        else if(response.result == "Deactivated")
        {
            $("#id_secprofile_status_deactivated").show();
        }
        else if(response.result == "Activating")
        {
            $("#id_secprofile_status_activating").show();
            $("#id_secprofile_apply_config_button").hide();
            $("#id_secprofile_profile_enabled_cb").prop("checked", true);
            $("#id_secprofile_profile_enabled_cb").prop("disabled", true);
        }
        else if(response.result == "Deactivating")
        {
            $("#id_secprofile_status_deactivating").show();
            $("#id_secprofile_apply_config_button").hide();
            $("#id_secprofile_profile_enabled_cb").prop("disabled", true);
        }
    }
    else
    {
        $("#id_secprofile_sm_status_read_failed").show();
        $("#id_secprofile_status_add_info").text((": " + response.errorText));
        $("#id_secprofile_status_add_info").show();
        $("#id_secprofile_apply_config_button").hide();
        $("#id_secprofile_profile_enabled_cb").prop("disabled", true);
    }
}

function SetSecurityProfileStatus(activationStatus)
{
    let result = false;

    let response = SecurityProfileService.SetActivationStatus(activationStatus);
    if(response != null && typeof response.error !== "undefined" && response.error)
    {   
        if(activationStatus == "Activated")
        {
            alert($("#id_secprofile_activation_error").text() + response.errorText);
        }
        else if(activationStatus == "Deactivated")
        {
            alert($("#id_secprofile_deactivation_error").text() + response.errorText);
        }
    }
    else if(response != null && typeof response.error !== "undefined" && !response.error)
    {
        result = true;
    }
    return result;
}

 
function OnConnectionError(xhr, status, error)
{
    alert($("#id_secprofile_connection_error").text() + error);
}

SecurityProfileService = (function () {

    let Public = {

        GetActivationStatus: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetActivationStatus",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetActivationStatus: function (activationStatus)
        {
            let requestData = "ActivationStatus=" + activationStatus;

            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "SetActivationStatus",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData,
                ajaxCallbackFunctions,
                null);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }

    }

    let Private = {
        dpScriptName: "module/Spm/SpmDp/"
    }

    return Public;

})();
