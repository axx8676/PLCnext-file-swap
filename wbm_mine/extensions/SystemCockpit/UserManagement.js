$(document).ready(function()
{
    
    Validation("#id_cockpit_form_change_user_password");
    
    // Changing user password
    $("#id_cockpit_change_passwd_btn").click(function () {
        $("#id_cockpit_change_password_username").val(UserManagementUi.GetUserName());
       $("#id_cockpit_modal_change_user_password").show();
    });
    
    $("#id_cockpit_change_password_btn_cancel").click(function () {
       $("#id_cockpit_modal_change_user_password").hide();
       $('#id_cockpit_form_change_user_password')[0].reset();
       $('#id_cockpit_form_change_user_password').validate().resetForm();
    });
    
    $("#id_cockpit_form_change_user_password").submit(function(event)
    {
        if($("#id_cockpit_form_change_user_password").valid() == true)
        {
            UserManagementUi.ChangeUserPassword($(this).serializeArray());
            $("#id_cockpit_modal_change_user_password").hide();
            $('#id_cockpit_form_change_user_password')[0].reset();
            $('#id_cockpit_form_change_user_password').validate().resetForm();
        }
        event.preventDefault();
    });
    
    $((  "#id_cockpit_change_password_input_new,"
       + "#id_cockpit_change_password_input_new_confirm")).each(function(){
        $(this).on('input',function(e){
            $('#id_cockpit_form_change_user_password').validate().resetForm();
        });
    });
});

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("Cockpit: Event subscriber on LanguageChanged - Selected language: "+ e.message);

    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_cockpit_form_change_user_password");
    }catch(e){}
}

UserManagementUi = (function () {

    let Public = {
        Initialize: function()
        {
            let userName = UserManagementService.GetCurrentUserName();
            $("#id_cockpit_change_password_username").val(userName);
            Private.userName = userName;
        },
        GetUserName: function()
        {
            return Private.userName;
        },
        CleanUpData: function()
        {
            $("#id_cockpit_form_change_user_password").removeData('validator');
        },
        ChangeUserPassword: function(serializedArray)
        {
            let result = false;
            let response = UserManagementService.ChangeUserPassword(serializedArray);
            if(response == null)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.chengeUserPasswordError, "Bad Gateway");
            }
            else if(response["result"] == false)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.chengeUserPasswordError, response["errorText"]);
            }
            else
            {
                result = true;
                CockpitUi.ShowCockpitInfoMessage(Private.messagesTags.chengeUserPasswordSuccess);
            }
            return result;
        },
        EnableControlSection: function(enabledControlSectionsCtr)
        {
            if(enabledControlSectionsCtr == 0)
            {
                $("#id_cockpit_control_um_content_preline").css("display", "none");
            }
            $("#id_cockpit_control_um_content_div").css("display", "inline-block");
        }
    }

    let Private = {
        userName: "N/A",
        messagesTags: {
            chengeUserPasswordError    : "c_cockpit_change_user_password_error",
            chengeUserPasswordSuccess  : "c_cockpit_user_password_changed"
        },
    }

    return Public;

})();

UserManagementService = (function () {

    let Public = {

        GetCurrentUserName: function () {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.dpScriptName + "GetPasswordInfo",
                                                            AjaxInterface.AjaxRequestType.GET,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && typeof response["result"] !== "undefined")
            {
                return response.result.userName;
            }
            return null;
        },
        ChangeUserPassword: function(serializedArray)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.dpScriptName + "ChangeCurrentUserPassword?" + $.param(serializedArray),
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && typeof response !== "undefined")
            {
                return response;
            }
            return null;
        }
    }

    let Private = {
        wbmModuleName: "Um",
        dpScriptName: "module/Um/UserManagementInfoDp/"
    }

    return Public;

})();
