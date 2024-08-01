SubPageActive = true;
um_selectedStoreTabID = localStorage.getItem("UmActiveTabKey");

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete SubPageActive;
    
    delete um_selectedStoreTabID;
    
    delete UserManagement;
    
    // Reset Validators
    UmPageUtilities.CleanUpValidations();
    $(document).off("LanguageChanged");
}


$(document).ready(function()
{
    // User Management
    UserManagement.BuildUserManagementContent();

    // User Manager Configuration
    SessionPolicyConfig.InitSessionPolicyConfigContent();
    PasswordRulesConfig.InitPasswordRulesConfigContent("admin");
    PasswordRulesConfig.InitBlockListTableItems();
    UserManagement.UpdateIsUserAuthenticationEnabled();

    // Input validiation
    UmPageUtilities.InitInputValidations();

    ///
    /// Restore the Last selected Diagnosis Tab 
    ///
    if((typeof um_selectedStoreTabID !== "undefined") && ($("#" + um_selectedStoreTabID).length != 0))
    {
        UmPageUtilities.SwitchUmDiagnosticsTab(um_selectedStoreTabID);
    }

    Language.UpdateActivePageMessages();
    ///
    /// Handle specific events
    ///

    $("#id_usermanager_div_loader").hide();

    $(".pxc-pd-tabs h2 a").click(function(event){

        um_selectedStoreTabID = $(this).attr('id');
        UmPageUtilities.SwitchUmDiagnosticsTab(um_selectedStoreTabID); 
        localStorage.setItem("UmActiveTabKey", um_selectedStoreTabID);
        event.preventDefault();
    });

    $((  "#id_usermanager_input_new_password_confirm,"
       + "#id_usermanager_input_new_password")).each(function(){
        $(this).on('input',function(e){
            $('#id_div_modal_add_user').validate().resetForm();
        });
    });
 
    $((  "#id_usermanager_set_user_password_input_new_password_confirm,"
       + "#id_usermanager_set_user_password_input_new_password")).each(function(){
        $(this).on('input',function(e){
            $('#id_form_set_user_password').validate().resetForm();
        });
    });

    $("#id_usermanager_form_add_user_btn_cancel").click(function(event)
    {
        $('#id_div_modal_add_user').hide();
        
        $('#id_form_add_user')[0].reset();
        
        $('#id_div_modal_add_user').validate().resetForm();
    });

    $("#id_usermanager_system_use_notification_edit_btn").click(function(event)
    {

        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
            UserManagement.GetSystemUseNotificationDpScriptName() + "GetSystemUseNotification?",
            AjaxInterface.AjaxRequestType.POST,
            AjaxInterface.AjaxRequestDataType.JSON,
            "",
            UmPageUtilities.GetAjaxCallbacks());

        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        $("#id_usermanager_system_use_notification_textarea").val("");
        $("#id_usermanager_system_use_notification_span").text("");
        if(response != null && typeof response !== "undefined")
        {
            if(response.error == false)
            {
                $(response.result.SystemUseNotification).each(function(idx, notificationLine){
                    if(idx < (response.result.SystemUseNotification.length - 1))
                    {
                        notificationLine += "\n";
                    }
                    $("#id_usermanager_system_use_notification_span").append(notificationLine);
                });
                $("#id_usermanager_system_use_notification_textarea").val($("#id_usermanager_system_use_notification_span").text());
                $("#id_div_modal_edit_system_use_notification").show();
            }
            else
            {
                alert($("#id_usermanager_system_use_notification_query_error").text() + response.errorText);
                console.error(($("#id_usermanager_system_use_notification_query_error").text() + response.errorText));
            }
        }
    });
    
    $("#id_usermanager_edit_system_use_notification_save_btn").click(function(event)
    {
        event.preventDefault();
        let notificationValue = $("#id_usermanager_system_use_notification_textarea").val();
        let requestData = ("SystemUseNotification=" + ((notificationValue.length > 0)?(notificationValue):(" ")));

        //requestData = requestData.escapeSpecialChars();
        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
            UserManagement.GetSystemUseNotificationDpScriptName() + "SetSystemUseNotification?",
            AjaxInterface.AjaxRequestType.POST,
            AjaxInterface.AjaxRequestDataType.JSON,
            requestData,
            UmPageUtilities.GetAjaxCallbacks());

        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        if(response != null && typeof response !== "undefined")
        {
            if(response.error == false)
            {
                window.location.href = UserManagement.GetPageLocationReference();
                location.reload();
            }
            else
            {

                alert($("#id_usermanager_edit_system_use_notification_status_error").text() +  ". " + response.errorText);
                console.error(($("#id_usermanager_edit_system_use_notification_status_error").text() + ". " + response.errorText));
            }
        }
    });
    $("#id_usermanager_edit_system_use_notification_cancel_btn").click(function(event)
    {
        $("#id_div_modal_edit_system_use_notification").hide();
        $('#id_form_edit_system_use_notification')[0].reset();
    });
    $("#id_form_add_user").submit(function(event)
    {
        if($("#id_form_add_user").valid() == true)
        {
            let serializedArray = $(this).serializeArray();
            let response = UserManagement.AddUser(serializedArray);
            if(!response.error)
            {
                window.location.href = UserManagement.GetPageLocationReference();
                location.reload();
            }
            else
            {
                alert(response.errorText);
                $("#id_div_modal_add_user").hide();
                $('#id_form_add_user')[0].reset();
            }
        }
        event.preventDefault();
    });
    $("#id_form_remove_user").submit(function(event)
    {
        let serializedArray = $(this).serializeArray();
        let response = UserManagement.RemoveUser(serializedArray);

        if(!response.error)
        {
            window.location.href = UserManagement.GetPageLocationReference();
            location.reload();
        }
        else
        {
            alert(response.errorText);
            $("#id_div_modal_remove_user").hide();
            $('#id_form_remove_user')[0].reset();
        }
        event.preventDefault();
    });
    
    $("#id_usermanager_form_remove_user_btn_cancel").click(function(event)
    {
        $('#id_div_modal_remove_user').hide();
        $('#id_form_remove_user')[0].reset();
    });

    $("#id_form_set_user_password").submit(function(event)
    {
        UserManagement.ClearComponentMessages();
        if($("#id_form_set_user_password").valid() == true)
        {
            var serializedArray = $(this).serializeArray();
            let response = UserManagement.SetUserPassword(serializedArray);

            $("#id_div_modal_set_user_password").hide();
            $('#id_form_set_user_password')[0].reset();
        }
        
        event.preventDefault();
    });
    
    $("#id_form_set_user_password_btn_cancel").click(function(event)
    {
        $('#id_div_modal_set_user_password').hide();

        $('#id_form_set_user_password')[0].reset();
         $('#id_form_set_user_password').validate().resetForm();
    });
    
    $("#id_form_modify_user_config").submit(function(event)
    {
        $("#id_usermanager_div_loader").show();
        UserManagement.ClearComponentMessages();
        let response = UserManagement.ModifyUserConfigFromModal();
        if(!response.error)
        {
            window.location.href = UserManagement.GetPageLocationReference();
            location.reload();
        }
        else
        {
            $('#id_usermanager_edit_user_table').find('input[type="checkbox"].user-role-check').each(function(idx, input) {
                $(input).prop('checked', false);
            });
            $("#id_div_modal_modify_user_roles").hide();
            $('#id_form_modify_user_config')[0].reset();
        }
        $("#id_usermanager_div_loader").hide();
        event.preventDefault();
    });
    
    $("#id_usermanager_form_modify_user_roles_btn_cancel").click(function(event)
    {
        $('#id_div_modal_modify_user_roles').hide();
        $('#id_form_modify_user_config')[0].reset();
        $('#id_usermanager_edit_user_table').find('input[type="checkbox"].user-role-check').each(function(idx, input) {
            $(input).prop('checked', false);
        });
    });
    
    $("#id_btn_change_authentication_enabled").click(function(event)
    {
        UserManagement.UpdateIsUserAuthenticationEnabled();
        $("#id_div_modal_change_authentication_enabled").show();
    });
    
    $("#id_form_change_authentication_enabled").submit(function(event)
    {
        event.preventDefault();
        let enabledState = $("#id_usermanager_form_change_authentication_enabled_cb").prop('checked');
        let response = UserManagement.SetUserAuthenticationEnabledState(enabledState);
        if(!response.error)
        {
            window.location.href = UserManagement.GetPageLocationReference();
            location.reload();
        }
        else
        {
            alert(response.errorText);
            $("#id_div_modal_change_authentication_enabled").hide();
            $('#id_form_hange_authentication_enabled')[0].reset();
        }
    });
    
    $("#id_usermanager_form_change_authentication_enabled_btn_cancel").click(function(event)
    {
        $('#id_div_modal_change_authentication_enabled').hide();
        $('#id_form_hange_authentication_enabled')[0].reset();
    });
    ///
    /// Password Complexity Rules
    ///
    $("#id_usermanager_pcr_blocklist_add_btn").click(function(event)
    {
        if(PasswordRulesConfig.GetConfigEnabled())
        {
            PasswordRulesConfig.AddNewPasswordBlockTableItem("");
        
            Language.UpdateActivePageMessages();
        }
        
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_pcr_blocklist_table").on("click", "button.rm-blocked-passwd", function(event){
        
        $(this).closest("tr").remove();
        event.preventDefault();
        return false;
    });
    
    $('#id_usermanager_pcr_roleruleset_val_select').on('change', function(event) {
        PasswordRulesConfig.SwitchDisplayedPasswordRuleset(this.value);
        event.preventDefault();
        return false;
    });
    
    ///
    /// System Use Notification
    ///
    $("#id_usermanager_system_use_notification_enable_disable_btn").click(function(event)
    {
        $("#id_usermanager_sun_enable_disable_modal").show();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_sun_enable_disable_save_btn").click(function(event)
    {
        $("#id_usermanager_sun_enable_disable_modal").show();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_sun_enable_disable_cancel_btn").click(function(event)
    {
        $("#id_usermanager_sun_enable_disable_modal").hide();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_sun_edit_save_btn").click(function(event)
    {
        $("#id_usermanager_sun_edit_content_modal").show();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_sun_edit_cancel_btn").click(function(event)
    {
        $("#id_usermanager_sun_edit_content_modal").hide();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_system_use_notification_edit_btn").click(function(event)
    {
        $("#id_usermanager_sun_edit_content_modal").show();
        
        event.preventDefault();
        return false;
    });

    $((  "#id_usermanager_sc_apply_config_button,"
       + "#id_usermanager_pcr_apply_config_button")).each(function(){
        $(this).on('click',function(e){
            SessionPolicyConfig.ClearComponentMessages();
            PasswordRulesConfig.ClearComponentMessages();
            // Validate use input
            let scValidResult = $("#id_usermanager_sc_config_table_form").valid();
            if(!scValidResult)
            {
                SessionPolicyConfig.OnInvalidUserInput();
            }
            let pcrValidResult = $("#id_usermanager_pcr_config_table_form").valid();
            if(!pcrValidResult)
            {
                PasswordRulesConfig.OnInvalidUserInput();
            }
            if((scValidResult == true) && (pcrValidResult == true))
            {
                $("#id_usermanager_save_restart_modal").show();
            }
        });
    });
    
    $((  "#id_usermanager_pcr_discard_config_button,"
       + "#id_usermanager_sc_discard_config_button")).each(function(){
        $(this).on('click',function(event){
            $("#id_usermanager_discard_modal").show();
            event.preventDefault();
            return false;
        });
    });
    
    $("#id_usermanager_discard_cancle_btn").click(function(event)
    {
        $("#id_usermanager_discard_modal").hide();
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_discard_ok_btn").click(function(event)
    {
        window.location.href = UserManagement.GetPageLocationReference();
        location.reload();
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_restart_conf_cancle_btn").click(function(event)
    {
        $("#id_usermanager_save_restart_modal").hide();
        event.preventDefault();
        return false;
    });
    
    $("#id_usermanager_restart_conf_ok_btn").click(function(event)
    {
        event.preventDefault();
        SessionPolicyConfig.ClearComponentMessages();
        PasswordRulesConfig.ClearComponentMessages();
        
        let result = SessionPolicyConfig.SetSessionPolicyConfigContent();

        if(result == true)
        {
            result = PasswordRulesConfig.SetPasswortBlocklistItems();
        }
        
        if(result == true)
        {
            result = PasswordRulesConfig.SetPasswordRulesConfigContent();
        }
        
        if(result == true)
        {
            result = UmPageUtilities.RestartSystem();
        }
        
        if(result == true)
        {
            $("#id_lanconfig_discard_modal").hide();
            window.location.href = "Login.html";
        }
        else
        {
            $("#id_usermanager_save_restart_modal").hide();
        }
        event.preventDefault();
        return false;
    });
    $("#id_usermanager_restart_conf_cancle_btn").click(function(event)
    {
        $("#id_usermanager_save_restart_modal").hide();
        
        // Validate Input
        
        return false;
    });
});

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        if($("#id_div_modal_change_authentication_enabled").is(":visible"))
        {
            $("#id_usermanager_form_change_authentication_enabled_btn_cancel").click();
        }
        else if($("#id_div_modal_edit_system_use_notification").is(":visible"))
        {
            $("#id_usermanager_edit_system_use_notification_cancel_btn").click();
        }
        else if($("#id_div_modal_add_user").is(":visible"))
        {
            $("#id_usermanager_form_add_user_btn_cancel").click();
        }
        else if($("#id_div_modal_remove_user").is(":visible"))
        {
            $("#id_usermanager_form_remove_user_btn_cancel").click();
        }
        else if($("#id_div_modal_set_user_password").is(":visible"))
        {
            $("#id_form_set_user_password_btn_cancel").click();
        }
        else if($("#id_div_modal_modify_user_roles").is(":visible"))
        {
            $("#id_usermanager_form_modify_user_roles_btn_cancel").click();
        }
        else if($("#id_usermanager_save_restart_modal").is(":visible"))
        {
            $("#id_usermanager_restart_conf_cancle_btn").click();
        }
        else if($("#id_usermanager_discard_modal").is(":visible"))
        {
            $("#id_usermanager_discard_cancle_btn").click();
        }
    }
}

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("User Manager: Event subscriber on LanguageChanged - Selected language: "+ e.message);

    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_form_add_user");
        ReloadValidation("#id_form_set_user_password");
        ReloadValidation("#id_usermanager_sc_config_table_form");
        ReloadValidation("#id_usermanager_pcr_config_table_form");
    }catch(e){}
}

///
/// User Manager Configuration Object
///
SessionPolicyConfig = (function () {
    // Public Part
    let Public = {
        InitSessionPolicyConfigContent: function()
        {

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                UserManagement.GetUserManagementDpScriptName() + "GetSessionPolicyConfig?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                UmPageUtilities.GetAjaxCallbacks());
                
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                Private.InitSessionPolicyConfigTable(response.result);
            }
            else
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.SessionConfigQueryError, response.errorText, false);
                Private.SetSessionPolicyConfigContentIsDisabled(true);
                PasswordRulesConfig.DisableConfigurationOnError();
            }
        },
        SetSessionPolicyConfigContent: function()
        {
            let sessionPolicyConfig = Private.GetSessionPolicyConfigFromTable();
            let configJsonStr = JSON.stringify(sessionPolicyConfig);

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                UserManagement.GetUserManagementDpScriptName() + "SetSessionPolicyConfig?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                configJsonStr,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                return true;
            }
            else
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.SessionConfigQueryError, response.errorText, true);
            }
            return false;
        },
        DisableConfigurationOnError: function()
        {
            Private.SetSessionPolicyConfigContentIsDisabled(true);
        },
        ClearComponentMessages: function()
        {
            UmPageUtilities.ClearUmErrorMessages(Private.messagesContainerId);
        },
        OnInvalidUserInput: function()
        {
            UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.SessionConfigInvalidInput, "-", false);
            UmPageUtilities.AddUmErrorMessage(Private.policyConfigMessagesContainerId, Private.messagesTags.SessionConfigInvalidInput, "-", false);
        }
    }
    
    // Private Part
    let Private = {
        sessionPolicyParameter: null,
        messagesContainerId: "id_usermanager_sessionconfig_messages_div",
        policyConfigMessagesContainerId: "id_usermanager_rulesconfig_messages_div",
        messagesTags: {
            SessionConfigQueryError:   "c_usermanager_sessionconfig_query_error",
            SessionConfigInvalidInput: "c_usermanager_sc_config_invalid_message",
        },
        ///
        /// Session configuration
        ///
        InitSessionPolicyConfigTable: function(sessionPolicy)
        {
            this.sessionPolicyParameter = sessionPolicy;
            $('#id_usermanager_sm_table_issue_timeout_val_input').prop('checked', sessionPolicy.issueTimeoutToAdminUsers);
            $('#id_usermanager_sm_table_init_timeout_val_input').val(sessionPolicy.timeoutInitialSeconds);
            $('#id_usermanager_sm_table_timeout_inc_val_input').val(sessionPolicy.timeoutIncrementSeconds);
            $('#id_usermanager_sm_table_max_timeout_val_input').val(sessionPolicy.timeoutMaximumSeconds);
            $('#id_usermanager_sm_table_max_concsessions_val_input').val(sessionPolicy.maxConcurrentSessionsCount);
            $('#id_usermanager_sm_table_max_sessiontime_val_input').val(sessionPolicy.maxSessionTimeMinutes);
        },
        GetSessionPolicyConfigFromTable: function()
        {
            let configObj = {};
            this.sessionPolicyParameter.issueTimeoutToAdminUsers   = $('#id_usermanager_sm_table_issue_timeout_val_input').prop('checked');
            this.sessionPolicyParameter.timeoutInitialSeconds      = Number($('#id_usermanager_sm_table_init_timeout_val_input').val());
            this.sessionPolicyParameter.timeoutIncrementSeconds    = Number($('#id_usermanager_sm_table_timeout_inc_val_input').val());
            this.sessionPolicyParameter.timeoutMaximumSeconds      = Number($('#id_usermanager_sm_table_max_timeout_val_input').val());
            this.sessionPolicyParameter.maxConcurrentSessionsCount = Number($('#id_usermanager_sm_table_max_concsessions_val_input').val());
            this.sessionPolicyParameter.maxSessionTimeMinutes      = Number($('#id_usermanager_sm_table_max_sessiontime_val_input').val());
            
            configObj.sessionPolicyParameter = this.sessionPolicyParameter;
            return configObj;
        },
        SetSessionPolicyConfigContentIsDisabled: function(disableState)
        {
            // Password Policy Parameters
            $("#id_usermanager_sm_table_issue_timeout_val_input").prop('disabled', disableState);
            $("#id_usermanager_sm_table_init_timeout_val_input").prop('disabled', disableState);
            $("#id_usermanager_sm_table_timeout_inc_val_input").prop('disabled', disableState);
            $("#id_usermanager_sm_table_max_timeout_val_input").prop('disabled', disableState);
            $("#id_usermanager_sm_table_max_concsessions_val_input").prop('disabled', disableState);
            $("#id_usermanager_sm_table_max_sessiontime_val_input").prop('disabled', disableState);
            
            if(disableState == true)
            {
                $("#id_usermanager_sc_apply_config_button").removeClass("pxc-btn-pa");
                $("#id_usermanager_sc_apply_config_button").addClass("pxc-btn-dis");
                $("#id_usermanager_sc_discard_config_button").removeClass("pxc-btn");
                $("#id_usermanager_sc_discard_config_button").addClass("pxc-btn-dis");
            }
        },
    }
    
return Public;
})();    

PasswordRulesConfig = (function () {
    // Public Part
    var Public = {
        InitPasswordRulesConfigContent: function(initRulesetName)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                UserManagement.GetUserManagementDpScriptName() + "GetPasswordRoleRulesets?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                Private.InitPasswordPolicyConfigTable(response.result.passwordRoleRulesets, initRulesetName);
            }
            else
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.RulesConfigQueryError, response.errorText, false);
                Private.SetRulesPolicyConfigContentIsDisabled(true);
                SessionPolicyConfig.DisableConfigurationOnError();
            }
        },
        SetPasswordRulesConfigContent: function()
        {
            let ruleSetsObj = {};
            Private.BackupRulesPolicyConfigTable(Private.currentRuleset);
            ruleSetsObj.passwordRoleRulesets = Private.passwordRoleRulesets;
            let rulesetsJsonStr = JSON.stringify(ruleSetsObj);

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                UserManagement.GetUserManagementDpScriptName() + "SetPasswordRoleRulesets?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                rulesetsJsonStr,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                return true;
            }
            else
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.RulesConfigSetError, response.errorText, true);
            }
            
        },
        InitBlockListTableItems: function()
        {

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                UserManagement.GetUserManagementDpScriptName() + "GetPasswordBlockList?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                Private.BuildPasswordBlocklistTable(response.result.passwordsBlockList);
            }
            else
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.BlockedPasswordsQueryError, response.errorText, false);
                Private.SetRulesPolicyConfigContentIsDisabled(true);
                SessionPolicyConfig.DisableConfigurationOnError();
            }
        },
        SetPasswortBlocklistItems: function()
        {
            let blockListConfigObj = Private.GetPasswordBlockListTableItems();
            let listJsonStr = JSON.stringify(blockListConfigObj);

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                UserManagement.GetUserManagementDpScriptName() + "SetPasswordBlockList?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                listJsonStr,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                return true;
            }
            else
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.BlockedPasswordsSetError, response.errorText, true);
            }
            return false;
        },
        ///
        /// Password Rules Configuration
        ///
        AddNewPasswordBlockTableItem: function(blockedPasswort)
        {
            Private.AddNewPasswordBlockTableItem(blockedPasswort);
        },
        
        SwitchDisplayedPasswordRuleset: function(currentRuleset)
        {
            prevRuleset = Private.currentRuleset;
            // Backup configuration for prev selsected ruleset
            Private.BackupRulesPolicyConfigTable(prevRuleset);
            // Update config values for currently (new) selected roleset
            Private.UpdateRulesPolicyConfigTable(currentRuleset);
        },
        DisableConfigurationOnError: function()
        {
            Private.SetRulesPolicyConfigContentIsDisabled(true);
        },
        ClearComponentMessages: function()
        {
            UmPageUtilities.ClearUmErrorMessages(Private.messagesContainerId);
        },
        GetConfigEnabled: function()
        {
            return Private.configEnabled;
        },
        OnInvalidUserInput: function()
        {
            UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.PolicyConfigInvalidInput, "-", false);
            UmPageUtilities.AddUmErrorMessage(Private.sessionConfigMessagesContainerId, Private.messagesTags.PolicyConfigInvalidInput, "-", false);
        }
    }
    
    // Private Part
    var Private = {
        passwordRoleRulesets: [],
        currentRuleset: "",
        passwordsBlockList: [],
        messagesContainerId: "id_usermanager_rulesconfig_messages_div",
        sessionConfigMessagesContainerId: "id_usermanager_sessionconfig_messages_div",
        configEnabled: false,
        messagesTags: {
            RulesConfigQueryError:      "c_usermanager_rulesconfig_query_error",
            BlockedPasswordsQueryError: "c_usermanager_blocklist_query_error",
            RulesConfigSetError:        "c_usermanager_rulesconfig_set_error",
            BlockedPasswordsSetError:   "c_usermanager_blocklist_set_error",
            PolicyConfigInvalidInput:   "c_usermanager_pcr_config_invalid_message"
        },
        ///
        /// Password Rules Configuration
        ///
        InitPasswordPolicyConfigTable: function(rulesets, initRulesetName)
        {
            this.passwordRoleRulesets = rulesets;
            this.UpdateRulesPolicyConfigTable(initRulesetName);
            this.configEnabled = true;
        },
        UpdateRulesPolicyConfigTable: function(rulesetName)
        {
            let rulesetFound = false;
            $(this.passwordRoleRulesets).each(function(idx, rulesetItem){
                if(rulesetItem.roleRulesetName == rulesetName)
                {
                    // Role suleset name
                    $("#id_usermanager_pcr_roleruleset_val_select").val(rulesetName);
                    // Password Policy Parameters
                    $("#id_usermanager_pcr_roleruleset_min_ascii_count_val_input").val(rulesetItem.passwordPolicyParameter.minASCIICount);
                    $("#id_usermanager_pcr_roleruleset_min_mixed_char_val_input").val(rulesetItem.passwordPolicyParameter.minMixedCharCount);
                    $("#id_usermanager_pcr_roleruleset_min_num_count_val_input").val(rulesetItem.passwordPolicyParameter.minNumberCount);
                    $("#id_usermanager_pcr_roleruleset_allowed_symbols_val_input").val(rulesetItem.passwordPolicyParameter.allowedASCIISymbols);
                    $("#id_usermanager_pcr_roleruleset_min_symbols_count_val_input").val(rulesetItem.passwordPolicyParameter.minSymbolCount);
                    $("#id_usermanager_pcr_roleruleset_block_username_val_input").prop('checked', rulesetItem.passwordPolicyParameter.blockUsername);
                    $("#id_usermanager_pcr_roleruleset_block_reused_passwd_val_input").prop('checked', rulesetItem.passwordPolicyParameter.blockReusedPasswords);
                    $("#id_usermanager_pcr_roleruleset_reused_gen_count_val_input").val(rulesetItem.passwordPolicyParameter.reusedGenerationCount);
                    $("#id_usermanager_pcr_roleruleset_check_block_list_val_input").prop('checked', rulesetItem.passwordPolicyParameter.checkBlockList);
                    $("#id_usermanager_pcr_roleruleset_min_char_count_val_input").val(rulesetItem.passwordPolicyParameter.minCharCount);
                    $("#id_usermanager_pcr_roleruleset_check_passwd_ch_interval_val_input").prop('checked', rulesetItem.passwordPolicyParameter.checkPwChangableInterval);
                    $("#id_usermanager_pcr_admin_ruleset_interval_count_val_input").val(rulesetItem.passwordPolicyParameter.intervalCount);
                    $("#id_usermanager_pcr_admin_ruleset_interval_type_val_select").val(rulesetItem.passwordPolicyParameter.intervalType);
                    $("#id_usermanager_pcr_roleruleset_allowed_pass_changes_val_input").val(rulesetItem.passwordPolicyParameter.allowedPasswordChanges);
                    // Expiration Policy Parameters
                    $("#id_usermanager_pcr_admin_ruleset_policy_active_val_input").prop('checked', rulesetItem.expirationPolicyParameter.policyActive);
                    $("#id_usermanager_pcr_roleruleset_lock_user_active_val_input").prop('checked', rulesetItem.expirationPolicyParameter.lockUserActive);
                    $("#id_usermanager_pcr_roleruleset_days_to_expiration_val_input").val(rulesetItem.expirationPolicyParameter.daysToExpiration);
                    $("#id_usermanager_pcr_roleruleset_days_to_warning_val_input").val(rulesetItem.expirationPolicyParameter.daysToWarning);
                    
                    rulesetFound = true;
                }
            });
            if(rulesetFound)
            {
                this.currentRuleset = rulesetName;
            }
            else
            {
                this.SetRulesPolicyConfigContentIsDisabled(true);
                Private.configEnabled = false;
            }
        },
        BackupRulesPolicyConfigTable: function(rulesetName)
        {
            $(this.passwordRoleRulesets).each(function(idx, rulesetItem){
                if(rulesetItem.roleRulesetName == rulesetName)
                {
                    // Role suleset name
                    $("#id_usermanager_pcr_roleruleset_val_select").val(rulesetName);
                    // Password Policy Parameters
                    rulesetItem.passwordPolicyParameter.minASCIICount            = Number($("#id_usermanager_pcr_roleruleset_min_ascii_count_val_input").val());
                    rulesetItem.passwordPolicyParameter.minMixedCharCount        = Number($("#id_usermanager_pcr_roleruleset_min_mixed_char_val_input").val());
                    rulesetItem.passwordPolicyParameter.minNumberCount           = Number($("#id_usermanager_pcr_roleruleset_min_num_count_val_input").val());
                    rulesetItem.passwordPolicyParameter.allowedASCIISymbols      = $("#id_usermanager_pcr_roleruleset_allowed_symbols_val_input").val();
                    rulesetItem.passwordPolicyParameter.minSymbolCount           = Number($("#id_usermanager_pcr_roleruleset_min_symbols_count_val_input").val());
                    rulesetItem.passwordPolicyParameter.blockUsername            = $("#id_usermanager_pcr_roleruleset_block_username_val_input").prop('checked');
                    rulesetItem.passwordPolicyParameter.blockReusedPasswords     = $("#id_usermanager_pcr_roleruleset_block_reused_passwd_val_input").prop('checked');
                    rulesetItem.passwordPolicyParameter.reusedGenerationCount    = Number($("#id_usermanager_pcr_roleruleset_reused_gen_count_val_input").val());
                    rulesetItem.passwordPolicyParameter.checkBlockList           = $("#id_usermanager_pcr_roleruleset_check_block_list_val_input").prop('checked');
                    rulesetItem.passwordPolicyParameter.minCharCount             = Number($("#id_usermanager_pcr_roleruleset_min_char_count_val_input").val());
                    rulesetItem.passwordPolicyParameter.checkPwChangableInterval = $("#id_usermanager_pcr_roleruleset_check_passwd_ch_interval_val_input").prop('checked');
                    rulesetItem.passwordPolicyParameter.intervalCount            = Number($("#id_usermanager_pcr_admin_ruleset_interval_count_val_input").val());
                    rulesetItem.passwordPolicyParameter.intervalType             = $("#id_usermanager_pcr_admin_ruleset_interval_type_val_select").val();
                    rulesetItem.passwordPolicyParameter.allowedPasswordChanges   = Number($("#id_usermanager_pcr_roleruleset_allowed_pass_changes_val_input").val());
                    // Expiration Policy Parameters
                    rulesetItem.expirationPolicyParameter.policyActive           = $("#id_usermanager_pcr_admin_ruleset_policy_active_val_input").prop('checked');
                    rulesetItem.expirationPolicyParameter.lockUserActive         = $("#id_usermanager_pcr_roleruleset_lock_user_active_val_input").prop('checked');
                    rulesetItem.expirationPolicyParameter.daysToExpiration       = Number($("#id_usermanager_pcr_roleruleset_days_to_expiration_val_input").val());
                    rulesetItem.expirationPolicyParameter.daysToWarning          = Number($("#id_usermanager_pcr_roleruleset_days_to_warning_val_input").val());
                }
            });
        },
        SetRulesPolicyConfigContentIsDisabled: function(disableState)
        {
            // Password Policy Parameters
            $("#id_usermanager_pcr_roleruleset_min_ascii_count_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_min_mixed_char_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_min_num_count_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_allowed_symbols_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_min_symbols_count_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_block_username_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_block_reused_passwd_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_reused_gen_count_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_check_block_list_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_min_char_count_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_check_passwd_ch_interval_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_admin_ruleset_interval_count_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_admin_ruleset_interval_type_val_select").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_allowed_pass_changes_val_input").prop('disabled', disableState);
            // Expiration Policy Parameters
            $("#id_usermanager_pcr_admin_ruleset_policy_active_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_lock_user_active_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_days_to_expiration_val_input").prop('disabled', disableState);
            $("#id_usermanager_pcr_roleruleset_days_to_warning_val_input").prop('disabled', disableState);
            
            $('#id_usermanager_pcr_blocklist_table').find('input[type="text"].um-block-passwd').each(function(idx, input) {
                $(input).prop('disabled', disableState);
            });
            $('#id_usermanager_pcr_blocklist_table').find('input[type="button"].pxc-btn-remove').each(function(idx, input) {
                $(input).prop('disabled', disableState);
            });
            
            $("#id_usermanager_pcr_blocklist_add_tr").prop('disabled', disableState);
            if(disableState == true)
            {
                $("#id_usermanager_pcr_apply_config_button").removeClass("pxc-btn-pa");
                $("#id_usermanager_pcr_apply_config_button").addClass("pxc-btn-dis");
                $("#id_usermanager_pcr_discard_config_button").removeClass("pxc-btn");
                $("#id_usermanager_pcr_discard_config_button").addClass("pxc-btn-dis");
            }
        },
        AddNewPasswordBlockTableItem: function(blockedPasswort)
        {
            let passwdRowHtml = "";
            let currentPasswordsSize = $('#id_usermanager_pcr_blocklist_table').find('tbody>tr:not(".exclude")').length;
            let passwordsNumber = 1;
            
            $('#id_usermanager_pcr_blocklist_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
                if(parseInt($(row).attr("passwd-number")) >= passwordsNumber)
                {
                    passwordsNumber = (parseInt($(row).attr("passwd-number")) + 1);
                }
            });
            let attrRowId = 'id_usermanager_pcr_blocked_passwd_' + passwordsNumber + '_tr';
            passwdRowHtml += '<tr id="' + attrRowId + '" passwd-number="' + passwordsNumber + '" >'
                             +      '<td passwd-number="' + passwordsNumber + '" id="id_usermanager_pcr_blocked_passwd_' + passwordsNumber + '_val_td">'
                             +           '<input type="text" class="um-block-passwd" name="blocked_passwd_' + passwordsNumber + '" id="id_usermanager_pcr_blocked_passwd_' + passwordsNumber + '_input"></input>'
                             +       '</td>'
                             +      '<td passwd-number="' + passwordsNumber + '" id="id_usermanager_pcr_blocked_passwd_' + passwordsNumber + '_btn_td">'
                             +          '<div class="centered">'
                             +              '<button class="pxc-btn-remove tooltip rm-blocked-passwd" id="id_usermanager_pcr_blocked_passwd_' + passwordsNumber + '_rm_btn"><span class="tooltip-text-topleft c_usermanager_remove_blocked_passwd"></span></button>'
                             +          '</div>'
                             +      '</td>'
                             +  '</tr>';
            
            $("#id_usermanager_pcr_blocklist_table > tbody > tr").eq(currentPasswordsSize).after(passwdRowHtml);

             $("#id_usermanager_pcr_blocked_passwd_" + passwordsNumber + "_input").val(blockedPasswort);
        },
        BuildPasswordBlocklistTable: function(blocklist)
        {
            $(blocklist).each(function(idx, blockItem){
                Private.AddNewPasswordBlockTableItem(blockItem);
            });
        },
        GetPasswordBlockListTableItems: function()
        {
            this.passwordsBlockList = [];
            let blockListObj = {};
            $('#id_usermanager_pcr_blocklist_table').find('input[type="text"].um-block-passwd').each(function(idx, input) {
                Private.passwordsBlockList.push($(input).val());
            });
            blockListObj.passwordsBlockList = this.passwordsBlockList;
            return blockListObj;
        }
    }
    
return Public;
})();    



///
/// User Management Handler Object
///
UserManagement = (function () {
    
    // Public Part
    var Public = {
        BuildUserManagementContent: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "GetUserManagementConfig?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                Private.BuildUsersTable(response.result.usersConfig);
                Private.BuildUserEditModalRolesTable(response.result.allUserRoles);
                Private.userManagementConfig = response.result;
            }
            else
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.UsersListError, response.errorText, false);
                Private.BuildUsersTableOnListErr();
                Private.BuildUserRolesTableOnListErr();
            }
            setTimeout(Language.UpdateActivePageMessages(), 10);
        },
        UpdateIsUserAuthenticationEnabled: function()
        {

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "IsUserAuthenticationRequired?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null)
            {
                $("#id_usermanager_user_authentication_enabled_cb").prop('checked', response.result);
                $("#id_usermanager_form_change_authentication_enabled_cb").prop('checked', response.result);
            }
            
            ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "IsAuthenticationDeactivatable?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response.result == true)
            {
                $("#id_usermanager_authentication_enabled_tr").show();
            }
            else
            {
                $('#id_usermanger_general_config_table td:nth-child(2)').hide();
                $('#id_usermanager_system_use_notification_config_td').attr("width", "64%");
            }
        },
        SetUserAuthenticationEnabledState: function(enabledState)
        {
            let requestData = "userAthenticationEnabled=" + enabledState;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "SetAuthenticationRequiredState?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            return response;
        },
        ShowModalEditUserConfig: function(userNumber)
        {
            let username = $("#id_usermanager_user_" + userNumber + "_name_span").text();
            let userConfig = Private.userManagementConfig.usersConfig.find(function(obj) {
                 return obj.userName == username;
            });
            if(userConfig.hasAdminRuleset == true)
            {
                $("#id_usermanager_edit_user_table_passwd_ruleset_val_select").val('admin');
            }
            $(userConfig.userRoles).each(function(r_idx, userRole){
                $('#id_usermanager_edit_user_table_userrole_' + userRole + '_val_input').prop('checked', true);
            });
            $("#id_usermanager_edit_user_table_username_input").val(username);
            $("#id_div_modal_modify_user_roles").show();
        },
        ModifyUserConfigFromModal()
        {
            let userConfigObj = {};
            userConfigObj.userConfigItem = Private.GetUserEditModalContent();
            let userConfigJsonStr = JSON.stringify(userConfigObj);

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "ModifyUserConfig?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                userConfigJsonStr,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response == null) || (response.error == true))
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.EditUserError, response.errorText, true);
            }
            
            return response;
        },
        SetUserPassword: function(serializedArray)
        {
            for (let i in serializedArray) {
               serializedArray[i].value = UmPageUtilities.EncodeURIComponent(serializedArray[i].value);
            }
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "SetUserPassword?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                serializedArray,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response == null) || (response.error == true))
            {
                UmPageUtilities.AddUmErrorMessage(Private.messagesContainerId, Private.messagesTags.PasswordSetError, response.errorText, true);
            }
        },
        AddUser: function(serializedArray)
        {
            for (let i in serializedArray) {
               serializedArray[i].value = UmPageUtilities.EncodeURIComponent(serializedArray[i].value);
            }

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "AddUser?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                serializedArray,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            return response;
        },
        RemoveUser: function(serializedArray)
        {
            for (let i in serializedArray) {
               serializedArray[i].value = UmPageUtilities.EncodeURIComponent(serializedArray[i].value);
            }

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                this.GetUserManagementDpScriptName() + "RemoveUser?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                serializedArray,
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            
            return response;
        },
        // Management buttons/modals handler
        ShowModalAddUser: function()
        {
            $("#id_div_modal_add_user").show();
            $("#id_usermanager_add_user_input_username").focus();
        },
        ShowModalRemoveUser: function(userNumber)
        {
            let username = $("#id_usermanager_user_" + userNumber + "_name_span").text();
            $("#id_remove_user_username").val(username);
            $("#id_div_modal_remove_user").show();
        },
        ShowModalSetUserPassword: function(userNumber)
        {
            let username = $("#id_usermanager_user_" + userNumber + "_name_span").text();
            $("#id_set_password_username").val(username);
            $("#id_div_modal_set_user_password").show();
            $("#id_usermanager_set_user_password_input_new_password").focus();
        },
        ClearComponentMessages: function()
        {
            UmPageUtilities.ClearUmErrorMessages(Private.messagesContainerId);
        },
        GetUserManagementDpScriptName: function ()
        {
            return Private.userManagementDpScriptName;
        },
        GetSystemUseNotificationDpScriptName: function ()
        {
            return Private.systemUseNotificationDpScriptName;
        },
        GetPageLocationReference: function ()
        {
            return Private.pageLocationReference;
        }
    }
    
    // Private Part
    var Private = {
        userManagementConfig: null,
        userManagementDpScriptName: "module/Um/UserManagementDp/",
        systemUseNotificationDpScriptName: "module/Um/SystemUseNotificationDp/",
        pageLocationReference: "#extensions/Um/UserManager.html",
        messagesTags: {
            UsersListError:   "c_usermanager_user_list_error",
            EditUserError:    "c_usermanager_userconfig_edit_error",
            PasswordSetError: "c_usermanager_userpasswd_set_error"
        },
        messagesContainerId: "id_usermanager_usermanagement_messages_div",
        BuildUsersTable: function(usersConfig)
        {
            $(usersConfig).each(function(idx, userConfig){
                let userNumber = idx + 1;
                let userRulesetSpanClass = (userConfig.hasAdminRuleset == true)?("c_usermanager_admin_ruleset_h"):("c_usermanager_default_ruleset_h");
                let lineClassType = ((idx % 2) == 0)?("odd"):("even");
                let rolesEnumerationHtml = "";

                $(userConfig.userRoles).each(function(r_idx, userRole){
                    rolesEnumerationHtml += '<span>' + UmPageUtilities.EncodeHtmlEntities(userRole) + '</span>';
                    if(r_idx < (userConfig.userRoles.length - 1))
                    {
                        rolesEnumerationHtml += '<hr style="margin: 5px -2px; width: 104%;"></hr>';
                    }
                });
                let userRowHtml = '<tr class="' + lineClassType + '">'
                                +     '<td><span id="id_usermanager_user_' + userNumber + '_name_span">' + UmPageUtilities.EncodeHtmlEntities(userConfig.userName) + '</span>'
                                +     Private.GetUserPasswordStatesHtlmEntry(userConfig["passwordInfo"], userNumber) + '</td>'
                                +     '<td><div style="display: inline-block; width:180px; word-wrap:break-word;">' + rolesEnumerationHtml + '</div></td>'
                                +     '<td><span id="id_usermanager_user_' + userNumber + '_ruleset_span" class="' + userRulesetSpanClass +'"></span></td>'
                                +     '<td><div class="pxc-btm-btn-align centered">'
                                +         '<button id="id_usermanager_user_' + userNumber + '_set_passwd_btn"  class="pxc-btn-pa"  onclick="UserManagement.ShowModalSetUserPassword(' + userNumber + ')"><span class="c_usermanager_button_set_user_password">Set Password</span></button>'
                                +         '<button id="id_usermanager_user_' + userNumber + '_edit_user_btn"   class="pxc-btn-pa"   onclick="UserManagement.ShowModalEditUserConfig(' + userNumber + ')" style="margin: 0px 4px;"><span class="c_usermanager_button_edit_user">Edit User</span></button>'
                                +         '<button id="id_usermanager_user_' + userNumber + '_remove_user_btn" class="pxc-btn-pa" onclick="UserManagement.ShowModalRemoveUser(' + userNumber + ')"><span class="c_usermanager_button_remove_user">Remove User</span></button>'
                                +     '</div></td>'
                                + '</tr>';
                $("#id_usermanager_users_table > tbody > tr:last").after(userRowHtml);
            });
        },
        GetUserPasswordStatesHtlmEntry: function(passwordInfo, userNumber)
        {
            let statesHtml = "";
            let expirationHtmlContent = this.BuildPasswordExpirationHtmlContent(passwordInfo, userNumber);
            if(passwordInfo["passwordState"] == "Expired")
            {
                statesHtml = '<div class="tooltip" style="float: right; white-space: nowrap;"><img src="./images/status_icon_severity_urgent_warning.svg" id="id_usermanager_user_' + userNumber + '_status_img" alt="Warning" style="width:16px; height:16px; vertical-align: -1.75px; "></img>' + expirationHtmlContent + '</div>'
            }
            else if(passwordInfo["passwordState"] == "WarnAboutExpiration")
            {
                statesHtml = '<div class="tooltip" style="float: right; white-space: nowrap;">'
                          +     '<img src="./images/status_icon_severity_warning.svg" id="id_usermanager_user_' + userNumber + '_status_img" alt="Warning" style="width:16px; height:16px; vertical-align: -1.75px;"></img>'
                          +     expirationHtmlContent
                          + '</div>'
            }
            if(passwordInfo["isUsingInitialPassword"] == true)
            {
                statesHtml += '<div class="tooltip" style="float: right; white-space: nowrap;margin-right: 5px;">'
                           + '<img src="./images/status_icon_severity_urgent_warning.svg" id="id_usermanager_user_' + userNumber + '_initpasswd_changed_status_img" alt="Warning" style="width:16px; height:16px; vertical-align: -1.75px;"></img>'
                           + '<div class="tooltip-text-top" style="top: -23px; bottom: 94%; background-color: #FFC000 !important; font-weight: bold;">'
                           + '<span id="id_usermanager_user_' + userNumber + '_initpasswd_changed_span" class="pxc-msg-txt c_usermanager_init_password_unchanged_text" style="display:inline-block;"></span>'
                           + '</div>'
                           + '</div>'
            }
            
            return statesHtml;
        },
        BuildPasswordExpirationHtmlContent: function(passwordInfo, userNumber)
        {
            let infoHtmlContent = "";
            if(passwordInfo["passwordState"] == "Expired")
            {
                infoHtmlContent = '<div class="tooltip-text-top" style="top: -23px; bottom: 94%; background-color: #FFC000 !important; font-weight: bold;">'
                                +     '<span id="id_usermanager_user_' + userNumber + '_password_expired_span" class="pxc-msg-txt c_usermanager_password_expired_text" style="display:inline-block;"></span>'
                                + '</div>';
            }
            else if(passwordInfo["passwordState"] == "WarnAboutExpiration")
            {
                let expirationObject = WbmUtilities.GetTimeExpirationObject(passwordInfo["timeToExpire"]);
                if(expirationObject["unit"] == "n/a")
                {
                    return infoHtmlContent;
                }
                let pluralDativeExtHtml = (expirationObject["unit"] == "days")?('<span id="id_usermanager_user_' + userNumber + '_password_expiration_dative_ext"  class="c_glb_plural_dative_ext"   style="display:inline-block; margin-left: 0px;"></span>'):("");
                infoHtmlContent = '<div class="tooltip-text-top" style="top: -23px; bottom: 90%; background-color: #FFEE00 !important; color: #FF9D00; font-weight: bold;">'
                                +   '<span id="id_usermanager_user_' + userNumber + '_password_expiration_warning" class="c_usermanager_password_abouttoexpire_1_text"  style="display:inline-block; "></span>&nbsp;'
                                +   '<span id="id_usermanager_user_' + userNumber + '_password_expiration_value"   style="display:inline-block; margin-left: 0px;">' + expirationObject["value"] + '</span>&nbsp;'
                                +   '<span id="id_usermanager_user_' + userNumber + '_password_expiration_unit"    class="c_glb_' + expirationObject["unit"] + '_header" style="display:inline-block; margin-left: 0px;"></span>'
                                +   pluralDativeExtHtml + '&nbsp;'
                                +   '<span id="id_usermanager_user_' + userNumber + '_password_expiration_warning_2" class="c_usermanager_password_abouttoexpire_2_text" style="display:inline-block; margin-left: 0px;"></span>'
                                + '</div>';
            }
            return infoHtmlContent;
        },
        BuildUserEditModalRolesTable: function(allUserRoles)
        {
            $("#id_usermanager_edit_user_table_userroles_td").attr("rowspan", (allUserRoles.length + 1));
            $(allUserRoles).each(function(idx, userRole){
                let userRoleRowHtml = "";
                userRoleRowHtml = '<tr role-name="' + userRole + '" + class="user_role_entry" id="id_usermanager_edit_user_table_passwd_userrole_' + userRole + '_tr">'
                                +     '<td id="id_usermanager_edit_user_table_userrole_' + userRole + '_td">'
                                +          '<span id="id_usermanager_edit_user_table_userrole_' + userRole + '_span" style="display: inline-block; width: 180px;">' + userRole + '</span>'
                                +     '</td>'
                                +     '<td id="id_usermanager_edit_user_table_userrole_' + userRole + '_val_td">'
                                +          '<input type="checkbox" class="user-role-check" id="id_usermanager_edit_user_table_userrole_' + userRole + '_val_input" name="role"></input>'
                                +     '</td>'
                                + '</tr>';
                
                $("#id_usermanager_edit_user_table > tbody > tr:last").after(userRoleRowHtml);
            });
        },
        
        GetUserEditModalContent: function()
        {
            let userConfig = {};
            let userRoles = [];
            userConfig.userName = $("#id_usermanager_edit_user_table_username_input").val();
            $('#id_usermanager_edit_user_table').find('tbody>tr.user_role_entry').each(function(idx, row) {
                let ruleName = $(row).attr("role-name");
                let checked = $("#id_usermanager_edit_user_table_userrole_" + ruleName + "_val_input").is(":checked");
                if(checked)
                {
                    userRoles.push(ruleName);
                }
            });
            userConfig.userRoles = userRoles;
            userConfig.hasAdminRuleset = ("admin" == $("#id_usermanager_edit_user_table_passwd_ruleset_val_select").val());
            return userConfig;
        },
        // Error functions
        BuildUsersTableOnListErr: function()
        {
            let errorRowHtml = '<tr><td colspan="4"><span id="id_usermanager_user_list_error_span" class="c_usermanager_user_list_error" style="color:red;"></span></td></tr>';
            $("#id_usermanager_users_table > tbody > tr:last").after(errorRowHtml);
        },
        
        BuildUserRolesTableOnListErr: function()
        {
            let errorRowHtml = '<tr><td colspan="4"><span id="id_usermanager_roles_list_error_span" class="c_usermanager_roles_list_error" style="color:red;"></span></td></tr>';
            $("#id_usermanager_edit_user_table > tbody > tr:last").after(errorRowHtml);
        }
    }

    return Public;
})();

UmPageUtilities = (function () {
    // Public Part
    let Public = {
        RestartSystem: function()
        {

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                UserManagement.GetUserManagementDpScriptName() + "RestartSystem?",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                UmPageUtilities.GetAjaxCallbacks());

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response.error == false))
            {
                return true;
            }
            else
            {
                return false;
            }
        },
        InitInputValidations: function()
        {
            Validation("#id_form_add_user");
            Validation("#id_form_set_user_password");
            Validation("#id_usermanager_sc_config_table_form");
            Validation("#id_usermanager_pcr_config_table_form");
            
            $("#id_usermanager_sc_config_table_form").validate().settings.ignore = [];
            $("#id_usermanager_pcr_config_table_form").validate().settings.ignore = [];
        },
        CleanUpValidations: function()
        {
            $("#id_form_add_user").removeData('validator');
            $("#id_form_set_user_password").removeData('validator');
            $("#id_usermanager_sc_config_table_form").removeData('validator');
            $("#id_usermanager_pcr_config_table_form").removeData('validator');
        },
        EncodeURIComponent: function(data)
        {
            let encodedData = data.replace(/ /g, "%20");
            return encodedData; //;
        },
        GetAjaxCallbacks: function()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = UmPageUtilities.OnConnectionError;
            return ajaxCallbackFunctions;
        },
        AddUmErrorMessage: function(containerId, errorLanTag, errorText, showAlert)
        {
            let messageHtml = '<div class="c_usermanager_error_message_box" style="margin: 3px 0;">'
                            +      '<div class="pxc-error-general-msg-wrp"><div class="pxc-error-msg">'
                            +         '<div class="pxc-exclamation"><div>!</div></div>'
                            +         '<span class="pxc-msg-txt ' + errorLanTag + '" id="id_usermanager_error_' + errorLanTag + '_span"></span>'
                            +         '<span class="c_usermanager_error_message" style="display: inline-block; margin: 0 24px;"></span>'
                            +         '<span style="display: inline-block; margin: 0 -20px;">' + errorText + '</span>'
                            +      '</div>'
                            + '</div></div>';
            let errorMessage = $(messageHtml).hide();
            $("#" + containerId).prepend(errorMessage);
            $("#" + containerId).find("div.c_usermanager_error_message_box").fadeIn("slow");

            
            Language.UpdateActivePageMessages();
            
            if(showAlert == true)
            {             
                alert($("#" + containerId + "_span").text() + ": " + errorText);
            }
        },
        OnConnectionError: function(xhr, status, error)
        {
            UmPageUtilities.AddUmErrorMessage(Private.globalMessagesContainerId, Private.messagesTags.ConnectionError, error, false);
            
        },
        ClearUmErrorMessages: function(containerId)
        {
            $("#" + containerId).find("div.c_usermanager_error_message_box").remove();
        },
        SwitchUmDiagnosticsTab: function(currentObjectId)
        {
            var currObject = document.getElementById(currentObjectId);
            var old_tab_id = $(currObject).parent().parent().find('a.pxc-tab-on').attr("data-tab-id");
            $('#' + old_tab_id).hide();
            var oldChildrens = $('#' + old_tab_id).find('.pxc-pd-tabsrow').children();
            for(i = 0; i < oldChildrens.length; i++)
            {
                var child = oldChildrens[i].getElementsByTagName('a');
                if(child.length == 1)
                {
                   if(child[0].getAttribute('class') == 'pxc-tab-on')
                   {
                       var elementToHide = child[0].getAttribute("data-tab-id");
                       $('#' + elementToHide).hide();
                   }
                }
            }
            var new_tab_id = $(currObject).attr("data-tab-id");
            $('#' + new_tab_id).show();
            $(currObject).parent().parent().find('a.pxc-tab-on').removeClass('pxc-tab-on');
            $(currObject).addClass('pxc-tab-on');
            var newChildrens = $('#' + new_tab_id).find('.pxc-pd-tabsrow').children();
            for(i = 0; i < newChildrens.length; i++)
            {
                var child = newChildrens[i].getElementsByTagName('a');
                if(child.length == 1)
                {
                   if(child[0].getAttribute('class') == 'pxc-tab-on')
                   {
                       var elementToshow = child[0].getAttribute("data-tab-id");
                       $('#' + elementToshow).show();
                   }
                }
            }
        },
        EncodeHtmlEntities: function(data)
        {
            let textArea = document.createElement('textarea');
            textArea.innerText = data;
            return textArea.innerHTML;
        }
    }
    
    // Private Part
    let Private = {
        globalMessagesContainerId: "id_usermanager_global_messages_div",
        messagesTags: {
            ConnectionError: "c_glb_connection_error2"
        },
    }
    
return Public;
})();
