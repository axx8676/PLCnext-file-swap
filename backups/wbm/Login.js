CurrentActiveWbmPage = "Login"

GlobalCurrentWbmPage = localStorage.getItem("GlobalCurrentWbmPage");
GlobalCurrentWbmModule = localStorage.getItem("GlobalCurrentWbmModule");

IsLoginPage = true;

$(document).ready(function()
{   
    Language.UpdateActivePageMessages();
    
    WbmUtilities.ReadDeviceWbmConfigs();
    
    Login.BuildSystemUseNotificationBox();
    
    // Check if language extensions and available and build the items if existing
    Login.BuildModulesLangExtensions();
    
    Login.BuildMainLangExtensions();
    
    Validation("#id_login_username_pass_form");
    $("#id_main_session_prolong_button").on("click", function(event){
        
        timeout = Session.ProlongSession();
        event.preventDefault(); 
        return false;
    });

    $("#id_login_button").click(function(event){

        if ($("#id_login_username_pass_form").valid()) {
            $("#id_login_username_pass_form")[0].submit();
            $("#id_login_username_pass_form").submit();
        }
    });
    $("#id_lang_" + Language.GetSelectedLanguage()).addClass("pxc-on");
    
});

$(document).on("LanguageChanged", LanguageChangedHandler);

function MsDelay(t, v)
{
    return new Promise(function(resolve) { 
       setTimeout(resolve.bind(null, v), t)
   });
}

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_login_username_pass_form");
    }catch(e){}
}


Login = (function () {
    // Public Part
    let Public = {
        BuildSystemUseNotificationBox: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("SystemUseNotificationGet.cgi?SystemUseNotification",
                                                                AjaxInterface.AjaxRequestType.POST,
                                                                AjaxInterface.AjaxRequestDataType.JSON,
                                                                "", null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            console.log("Sys use notification response:", response);
            if(response != null && typeof response.error !== "undefined")
            {
                Private.ActivateLogin();
                if(response.error == false)
                {
                    $("#id_login_system_use_notification_span").text("");
                    $(response.result.SystemUseNotification).each(function(idx, notificationLine){
                        let notificationUsedLine = notificationLine;
                        if(idx < (response.result.SystemUseNotification.length - 1))
                        {
                            notificationUsedLine += "\n";
                        }
                        $("#id_login_system_use_notification_span").append(notificationUsedLine);
                        
                    });
                    let systemUseNotificationText = $("#id_login_system_use_notification_span").text();
                    systemUseNotificationText = systemUseNotificationText.replace(/\s/g, "");
                    if(systemUseNotificationText.length > 0)
                    {
                        $("#id_login_system_use_notification_div").show();
                    }
                    else
                    {
                        $("#id_login_system_use_notification_span").text("");
                    }
                    Login.ClearComponentMessages();
                }
                else
                {
                    Login.AddLoginErrorMessage(Private.messagesBoxesIDs.SystemUseNotificationRequestErr, "Bad Gateway");
                }
            }
            else
            {
                Login.AddLoginErrorMessage(Private.messagesBoxesIDs.ControllerConnectionErr, "Bad Gateway");
                Private.DeactivateLogin();
                window.setTimeout("Login.BuildSystemUseNotificationBox();", Private.timeoutTimerInterval);
            }
        },
        BuildModulesLangExtensions: function()
        {
            // Read language extension configs
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("extensions/LanguagesConfig.json", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.JSON, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                let languagesConfig = result.LanguagesConfig;
                $(languagesConfig).each(function(lan_idx, languageConfig) {
                    LanguageManager.AddLanguageItemIfNotExisting(languageConfig.LanguageCode, languageConfig.LanguageName);
                });
            }
        },
        BuildMainLangExtensions: function()
        {
            if(DeviceWbmConfigsLoaded == false || DeviceWbmConfigs["AdditionalLanguageSupport"] == undefined)
            {
                return false;
            }
            let additionalLangSupport = DeviceWbmConfigs["AdditionalLanguageSupport"];
            $(additionalLangSupport).each(function(lan_idx, languageConfig) {
                LanguageManager.AddLanguageItemIfNotExisting(languageConfig.LanguageCode, languageConfig.LanguageName);
            });
        },
        AddLoginErrorMessage: function (errorBoxId, errorText) {
            $("#" + errorBoxId).show();
            $("#" + errorBoxId + " .c_login_error_text_code").html(errorText);
        },
        ClearComponentMessages: function () {
            $("#" + Private.messagesBoxesIDs.SystemUseNotificationRequestErr).hide();
            $("#" + Private.messagesBoxesIDs.ControllerConnectionErr).hide();
        }
    }

    // Private Part
    let Private = {
        globalMessagesContainerId: "id_login_global_messages_div",
        messagesBoxesIDs: {
            SystemUseNotificationRequestErr: "id_login_system_use_notification_request_error_div",
            ControllerConnectionErr: "id_login_connection_error_div"
        },
        timeoutTimerInterval: 3000,
        DeactivateLogin: function()
        {
            $("#id_login_username_input").prop( "disabled", true);
            $("#id_login_passwd_input").prop( "disabled", true);
            $("#id_login_button").hide();
        },
        ActivateLogin: function()
        {
            $("#id_login_username_input").prop( "disabled", false);
            $("#id_login_passwd_input").prop( "disabled", false);
            $("#id_login_button").show();
        }
    }

    return Public;
})();