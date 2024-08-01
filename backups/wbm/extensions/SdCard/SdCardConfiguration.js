
SubPageActive = true;

SystemMessagesIds = {
    "NoChangesDetected"           : "id_sdcard_sm_no_changes_detected",
    "ResetLocalModifications"     : "id_sdcard_sm_reset_local_modification",
    "LocalModificationsReseted"   : "id_sdcard_sm_local_modification_reseted",
    "ApplyLocalModifications"     : "id_sdcard_sm_apply_local_modification",
    "SdCardSupportActivated"      : "id_sdcard_sm_sd_card_activated",
    "SdCardSupportDeactivated"    : "id_sdcard_sm_sd_card_deactivated",
    "RebootAfterActivation"       : "id_sdcard_sm_reboot_after_activation",
    "RebootAfterDeactivation"     : "id_sdcard_sm_reboot_after_deactivation",
    "LocalModificationDetected"   : "id_sdcard_sm_changes_detected",
    "UndefinedSystemMessage"      : "id_sdcard_sm_undefined_system_message",
    "ConfigurationErrorOccured"   : "id_sdcard_sm_config_error_occured",
    "CommunicationErrorOccured"   : "id_sdcard_sm_comm_error_occured",
    "RecoveryPasswordGenerated"   : "id_sdcard_sm_recovery_psswd_generated",
    "RecoveryPasswordGenerateErr" : "id_sdcard_sm_recovery_psswd_generate_err",
    "RecoveryPasswordSet"         : "id_sdcard_sm_recovery_psswd_set",
    "RecoveryPasswordSetErr"      : "id_sdcard_sm_recovery_psswd_set_err",
    "FactoryResetReactivationEnabled" : "id_sdcard_sm_factory_reset_reactivation_enabled",
    "FactoryResetReactivationDisabled": "id_sdcard_sm_factory_reset_reactivation_disabled"
} 

SdCardStatus = {
    Activated           : "Activated",
    Deactivated         : "Deactivated",
    RequestActivation   : "RequestActivation",
    RequestDeactivation : "RequestDeactivation",
    NotSupported        : "NotSupported"
}

EncryptedSdCardStatus = {
    Decrypted             : "Decrypted",
    Encrypted             : "Encrypted",
    RequestEncryption     : "RequestEncryption",
    RequestDecryption     : "RequestDecryption",
    None                  : "None"
}

SdCardStatusSystemMessages = {
    "Activated"           : SystemMessagesIds.SdCardSupportActivated,
    "Deactivated"         : SystemMessagesIds.SdCardSupportDeactivated,
    "RequestActivation"   : SystemMessagesIds.RebootAfterActivation,
    "RequestDeactivation" : SystemMessagesIds.RebootAfterDeactivation,
    "NotSupported"        : SystemMessagesIds.FunctionNotSupported
}

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    $("#id_sdcard_form_set_recovery_password").removeData('validator');
    $("#id_sdcard_form_set_encryption_password").removeData('validator');
    
    delete SubPageActive;

    delete SystemMessagesIds;
    delete SdCardStatus;
    delete EncryptedSdCardStatus;
    delete SdCardStatusSystemMessages;
    delete SdCardConfigService;
}


$(document).ready(function(){   

    WbmUtilities.ReadDeviceWbmConfigs();

    SdCardConfigUI.Init();

    SdCardConfigUI.UpdateSdCardSupportStatus();
    
    // Show page content after page elements are loaded
    $("#id_sdcard_page_global_div").show();
    
    Validation("#id_sdcard_form_set_recovery_password");
    Validation("#id_sdcard_form_set_encryption_password");
 
    //$( "#id_sdcard_configs_table_form input[type='checkbox']").change(function(event){
    $( "#id_sdcard_configs_ext_sdcard_support_cb").change(function(event){
        if ($(this).prop("checked")) {
            $(this).val("RequestActivation");
        }
        else {
            $(this).val("RequestDeactivation");
        }
        SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.LocalModificationDetected, "");
        event.preventDefault();
     }); 
     
    $('#id_sdcard_activate_ext_card_support_button').click(function(event) {
        event.preventDefault();
        $("#id_div_loader").show();
        SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ApplyLocalModifications, "");

        const response = SdCardConfigService.SetSdCardSupportStatus("RequestActivation");
        if(!response.result)
        {   
            alert("Error: " + response.errorText);
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured, " - Error: " + response.errorText);
            $("#id_div_loader").hide();
        }
        if(response.result == true)
        {
            location.reload();
        }
        return false;
    });
    
    $('#id_sdcard_deactivate_ext_card_support_button').click(function(event) {
        event.preventDefault();
        $("#id_div_loader").show();
        SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ApplyLocalModifications, "");

        const response = SdCardConfigService.SetSdCardSupportStatus("RequestDeactivation");
        if(!response.result)
        {   
            alert("Error: " + response.errorText);
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured, " - Error: " + response.errorText);
            $("#id_div_loader").hide();
        }
        if(response.result == true)
        {
            location.reload();
        }
        return false;
    });
    
    $("#id_sdcard_discard_ok_btn").click(function(event)
    {
        $("#id_sdcard_discard_modal").hide();
        $("#id_div_loader").show();
        SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ResetLocalModifications, "");
        event.preventDefault();
        location.reload();
        window.location.href = "#extensions/SdCard/SdCardConfiguration.html";
        return false;
    });

    $("#id_sdcard_discard_cancle_btn").click(function(event)
    {
        $("#id_sdcard_discard_modal").hide();
        event.preventDefault();
        return false;
    });

    /*
     *  Recovery Password
     */
     // Setting Revocery Password
    $("#id_sdcard_set_recovery_password_button").click(function(event)
    {
        $('#id_div_modal_set_recovery_password').show();
        
        event.preventDefault();
    });
    
    $("#id_form_set_recovery_password_btn_cancel").click(function(event)
    {
        $('#id_div_modal_set_recovery_password').hide();
        $('#id_sdcard_form_set_recovery_password')[0].reset();
        
        event.preventDefault();
    });
    
    $("#id_sdcard_form_set_recovery_password").submit(function(event)
    {
        if($("#id_sdcard_form_set_recovery_password").valid() == true)
        {
            $("#id_div_loader").show();
            let serializedArray = $(this).serializeArray();
            const response = SdCardConfigService.SetRecoverySecret(serializedArray);
            if(response == null)
            {
                SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured);
                $("#id_div_loader").hide();
            }
            else if(!response.result)
            {   
                alert("Error: " + response.errorText);
                SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured, " - Error: " + response.errorText);
                $("#id_div_loader").hide();
            }
            else if(response.result == true)
            {
                location.reload();
            }
            return false;
            //$("#id_div_modal_set_recovery_password").hide();
            //$('#id_sdcard_form_set_recovery_password')[0].reset();
        }
        
        event.preventDefault();
    });
    
    // Deleting Recovery Password
    $("#id_sdcard_del_recovery_password_button").click(function(event)
    {
        $('#id_div_modal_sdcard_del_recovery_password_confirm').show();
        
        event.preventDefault();
    });
    
    $("#id_sdcard_del_recovery_password_cancel_btn").click(function(event)
    {
        $('#id_div_modal_sdcard_del_recovery_password_confirm').hide();
        
        event.preventDefault();
    });
    
    $("#id_sdcard_del_recovery_password_ok_btn").click(function(event)
    {
        $("#id_div_loader").show();
        const response = SdCardConfigService.RemoveRecoverySecret();
        if(response == null)
        {
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured);
            alert($("#" + SystemMessagesIds.ConfigurationErrorOccured).text() + ". Bad Gateway");
            $("#id_div_loader").hide();
        }
        else if(!response.result)
        {   
            alert("Error: " + response.errorText);
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured, " - Error: " + response.errorText);
            $("#id_div_loader").hide();
        }
        else if(response.result == true)
        {
            location.reload();
        }
        return false;
        
        event.preventDefault();
    });
    
    /*
     *  SD Card Encryption
     */
     // Activating SD Card Encryption
    $("#id_sdcard_activate_ext_card_encryption_button").click(function(event)
    {
        $('#id_div_modal_activate_sd_card_encryption').show();
        
        event.preventDefault();
    });
    // Activation Cancel
    $("#id_sdcard_form_activate_encryption_btn_cancel").click(function(event)
    {
        $('#id_div_modal_activate_sd_card_encryption').hide();
        $('#id_sdcard_generate_encryption_pass_section').hide();
        $('#id_sdcard_enter_encryption_pass_section').show();
        $("#id_sdcard_form_set_encryption_password")[0].reset();
        
        event.preventDefault();
    });
    
    $("#id_sdcard_form_set_encryption_password").submit(function(event)
    {
        
        if($("#id_sdcard_form_set_encryption_password").valid() == true)
        {
            $("#id_div_loader").show();
            
            const encryptionSecretSelection = $("#id_sdcard_encryption_password_source_select").val();

            let serializedArray = [];
            if(encryptionSecretSelection == "GENERATE")
            {
                const secret = $("#id_sdcard_generated_encryption_password_val").val();
                serializedArray.push({ name: "secret", value: secret });
            }
            else if (encryptionSecretSelection == "ENTER")
            {
                serializedArray = $('input[name!=KeySource]', this).serializeArray();
                
            }
            const response = SdCardConfigService.EnableEncryption(serializedArray);
            if(response == null)
            {
                SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured);
                alert($("#" + SystemMessagesIds.ConfigurationErrorOccured).text());
                $("#id_div_loader").hide();
            }
            else if(!response.result)
            {   
                alert("Error: " + response.errorText);
                SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured, " - Error: " + response.errorText);
                $("#id_div_loader").hide();
            }
            else if(response.result == true)
            {
                location.reload();
            }
            return false;
            //$("#id_div_modal_activate_sd_card_encryption").hide();
            //$('#id_sdcard_form_set_encryption_password')[0].reset();
        }
        
        event.preventDefault();
    });
    
    
    
    // Encryption password source
    $("#id_sdcard_encryption_password_source_select").change(function(event)
    {
        
        if($(this).val() == "GENERATE")
        {
            // Hide ENTER section
            $("#id_sdcard_enter_encryption_pass_section").hide();
            $("#id_sdcard_set_encryption_password_input").val($("#id_sdcard_set_encryption_password_input").defaultValue);
            $("#id_sdcard_set_encryption_password_confirm_input").val($("#id_sdcard_set_encryption_password_confirm_input").defaultValue);
            if(SdCardConfigUI.UpdateGeneratedEncryptionPassword())
            {
                // Show GENERATE Section
                $("#id_sdcard_generate_encryption_pass_section").show();
            }
            else
            {
                $(this).val("ENTER");
                $("#id_sdcard_enter_encryption_pass_section").show();
            }
        }
        else if($(this).val() == "ENTER")
        {
            // Hide GENERATE section
            $("#id_sdcard_generate_encryption_pass_section").hide();
            
            // Show ENTER section
            $("#id_sdcard_enter_encryption_pass_section").show();
        }

        event.preventDefault();
    });
     
    // Deactivating SD Card Encryption
    $("#id_sdcard_deactivate_ext_card_encryption_button").click(function(event)
    {
        $('#id_div_modal_sdcard_deactivate_encryption_confirm').show();
        
        event.preventDefault();
    });
    
    
    // Show generated Encryption password checkbox
    $("#id_sdcard_show_generated_encryption_pass_cb").change(function(event)
    {
        if($(this).prop("checked"))
        {
            $("#id_sdcard_generated_encryption_password_val").prop("type", "text");
        }
        else
        {
            $("#id_sdcard_generated_encryption_password_val").prop("type", "password");
        }
        
        event.preventDefault();
    });
    
    // Copy generated Encryption password to clipboard
    
    $("#id_sdcard_copy_encryption_password_to_clipbord").click(function(event)
    {
        navigator.clipboard.writeText($("#id_sdcard_generated_encryption_password_val").val());
        event.preventDefault();
    });
    
    
    // Deactivate Encryption button
    $("#id_sdcard_deactivate_encryption_cancel_btn").click(function(event)
    {
        $('#id_div_modal_sdcard_deactivate_encryption_confirm').hide();
        
        event.preventDefault();
    });
    
    $("#id_sdcard_deactivate_encryption_ok_btn").click(function(event)
    {
        $("#id_div_loader").show();
        $('#id_div_modal_sdcard_deactivate_encryption_confirm').hide();
        const response = SdCardConfigService.DisableEncryption();
        if(response == null)
        {
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured);
            $("#id_div_loader").hide();
        }
        else if(!response.result)
        {   
            alert("Error: " + response.errorText);
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured, " - Error: " + response.errorText);
            $("#id_div_loader").hide();
        }
        else if(response.result == true)
        {
            location.reload();
        }
        return false;
        
        event.preventDefault();
    });
    
    $((  "#id_sdcard_set_encryption_password_confirm_input,"
       + "#id_sdcard_set_encryption_password_input")).each(function(){
        $(this).on('input',function(e){
            $('#id_sdcard_form_set_encryption_password').validate().resetForm();
        });
    });
    
    $((  "#id_sdcard_set_recovery_password_input,"
       + "#id_sdcard_set_recovery_password_confirm_input")).each(function(){
        $(this).on('input',function(e){
            $('#id_sdcard_form_set_recovery_password').validate().resetForm();
        });
    });
    
    $("#id_sdcard_factory_reset_activation").change(function() {

       $("#id_div_loader").show();
       
       let response = null; 
       if($(this).is(":checked")) {
           response = SdCardConfigService.EnableSdReactivationAfterFactoryReset();
       }
       else
       {
           response = SdCardConfigService.DisableSdReactivationAfterFactoryReset();
       }
       
       if(response == null)
        {
            alert($("#" + SystemMessagesIds.ConfigurationErrorOccured).text() + ". UnknownError");
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured);
        }
        else if(!response.result)
        {   
            alert("Error: " + response.errorText);
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.ConfigurationErrorOccured, " - Error: " + response.errorText);
        }
        else if($(this).is(":checked"))
        {
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.FactoryResetReactivationEnabled, ""); 
        }
        else if(!$(this).is(":checked"))
        {
            SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.FactoryResetReactivationDisabled, ""); 
        }
        $("#id_div_loader").hide();
       event.preventDefault();
       return false;
    }); 
    
 });
 
document.addEventListener('keyup', CloseModalWithEsc);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("SD Card: Event subscriber on LanguageChanged - Selected language: "+ e.message);

    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_sdcard_form_set_recovery_password");
        ReloadValidation("#id_sdcard_form_set_encryption_password");
    }catch(e){}
}

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}
 
 
function OnConnectionError(xhr, status, error)
{
    SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.CommunicationErrorOccured, " - Error: " + error); 
}

SdCardConfigUI = (function () {

    let Public = {
        Init: function()
        {
            if(DeviceWbmConfigsLoaded && (typeof DeviceWbmConfigs.SdCard !== "undefined"))
            {
                // comparision with true because value type can be undefined
                Private.supportConfigDisabled = (DeviceWbmConfigs.SdCard.DisableSupportConfig == true);
            }
            if(!Private.supportConfigDisabled)
            {
                $("#id_sdcard_config_table_config_header_tr").show();
                $("#id_sdcard_config_table_support_section_tr").show();
                $("#id_sdcard_config_table_factory_reset_section_tr").show();
            }
        },
        ShowSystemMessage: function(messageSpanId, optTextExtension)
        {    
            // disable all messages in the system messages block
            $("#id_sdcard_system_messages_status_box_td span").each(function(){
                $(this).hide();
            });
            $("#" + messageSpanId).show();
            $("#id_sdcard_sm_opt_text_extension").show();
            $("#id_sdcard_sm_opt_text_extension").text(optTextExtension);
            $("#id_sdcard_sm_opt_text_extension").css("color", $("#" + messageSpanId).css("color"));
        },
        
        UpdateGeneratedEncryptionPassword: function()
        {
            // id_sdcard_generated_encryption_password_val
            const response = SdCardConfigService.GenerateEncryptionSecret();
            if(response == null)
            {
                SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.RecoveryPasswordGenerateErr,""); 
                alert($("#" + SystemMessagesIds.RecoveryPasswordGenerateErr).text());
                return false;
            }
            else if(response.error)
            {   
                alert("Error: " + response.errorText);
                SdCardConfigUI.ShowSystemMessage(SystemMessagesIds.RecoveryPasswordGenerateErr, " - " + response.errorText);
                $("#id_div_loader").hide();
                return false;
            }
            $("#id_sdcard_generated_encryption_password_val").val(response.result)
            return true;
        },
        UpdateSdCardSupportStatus: function()
        {
            
            // Request and set Sd Card settings Status
            const response = SdCardConfigService.GetExternalSdCardStatus();
            if(response.error)
            {   
                alert("Error: " + response.errorText);
                return null;
            }
            const sdCardState = response.result;
			
            const externalSdCardState = Private.ParseExternalSdCardState(sdCardState.externalSdState);
            const encryptedSdCardState = Private.ParseEncryptedSdCardState(sdCardState.encryptedSdState);
            const encryptionActivated = ((encryptedSdCardState == EncryptedSdCardStatus.Encrypted) 
                                       ||(encryptedSdCardState == EncryptedSdCardStatus.RequestEncryption));
                
            Private.UpdateExternalSDCardStatus(externalSdCardState, encryptionActivated);
            
            Private.UpdateEncryptedSDCardStatus(encryptedSdCardState, sdCardState.sdCardInserted, sdCardState.encryptionSupported);
            
            Private.UpdateBootDeviceStatus(sdCardState.bootDevice, externalSdCardState);
            
            Private.UpdateRecoverySecretIsPresent(sdCardState.recoverySecretPresent);
            
            Private.UpdateSdActivationPersistence(sdCardState.isSdReactivatedAfterFactoryReset);
        }
    }

    let Private = {
        supportConfigDisabled: false,
        UpdateExternalSDCardStatus: function(externalSdCardStatus, encryptionActivated)
        {
            // Show Sd Card Status
            SdCardConfigUI.ShowSystemMessage(SdCardStatusSystemMessages[externalSdCardStatus], "");
            if(   (externalSdCardStatus == SdCardStatus.Activated) 
                ||(externalSdCardStatus == SdCardStatus.RequestActivation))
            {
                $("#id_sdcard_activate_ext_card_support_button" ).hide();
                $("#id_sdcard_deactivate_ext_card_support_button" ).show();
                $("#id_sdcard_ext_card_encryption_buttons_section").removeClass("disabled");
                if(!encryptionActivated)
                {
                    $("#id_sdcard_system_messages_activation_warning_tr").show();
                }
            }
            else
            {
                $("#id_sdcard_activate_ext_card_support_button" ).show();
                $("#id_sdcard_deactivate_ext_card_support_button" ).hide();
                $("#id_sdcard_system_messages_activation_warning_tr").hide();
            }
            
            if(externalSdCardStatus == SdCardStatus.Activated)
            {
                $("#id_sdcard_external_sdcard_support_activated").show();
            }
            else if(externalSdCardStatus == SdCardStatus.RequestActivation)
            {
                $("#id_sdcard_external_sdcard_support_activation_request").show();
            }
            else if(externalSdCardStatus == SdCardStatus.Deactivated)
            {
                $("#id_sdcard_external_sdcard_support_deactivated").show();
            }
            else if(externalSdCardStatus == SdCardStatus.RequestDeactivation)
            {
                $("#id_sdcard_external_sdcard_support_deactivation_request").show();
            }
        },
     
        UpdateEncryptedSDCardStatus: function(encryptedSdCardStatus, sdCardInserted, encryptionSupported)
        {
              // Show Sd Card Status
            if(   (encryptedSdCardStatus == EncryptedSdCardStatus.Encrypted) 
                ||(encryptedSdCardStatus == EncryptedSdCardStatus.RequestEncryption))
            {
                $("#id_sdcard_activate_ext_card_encryption_button" ).hide();
                $("#id_sdcard_deactivate_ext_card_encryption_button" ).show();
            }
            else
            {
                $("#id_sdcard_activate_ext_card_encryption_button" ).show();
                $("#id_sdcard_deactivate_ext_card_encryption_button" ).hide();
            }
            
            if(!sdCardInserted)
            {
                $("#id_sdcard_ext_not_available").show();
                $("#id_sdcard_activate_ext_card_encryption_button" ).addClass("disabled");
                $("#id_sdcard_deactivate_ext_card_encryption_button" ).addClass("disabled");
            }
            else if(!encryptionSupported)
            {
                $("#id_sdcard_ext_no_encryption_support").show();
                $("#id_sdcard_activate_ext_card_encryption_button" ).addClass("disabled");
                $("#id_sdcard_deactivate_ext_card_encryption_button" ).addClass("disabled");
                
            }
            else if(encryptedSdCardStatus == EncryptedSdCardStatus.None)
            {
                $("#id_sdcard_ext_no_encryption_unknown").show();
                $("#id_sdcard_activate_ext_card_encryption_button" ).addClass("disabled");
                $("#id_sdcard_deactivate_ext_card_encryption_button" ).addClass("disabled");
                
            }
            else if(encryptedSdCardStatus == EncryptedSdCardStatus.RequestEncryption)
            {
                $("#id_sdcard_ext_encryption_request").show();
                $("#id_sdcard_encryption_sd_card_info_warnings_tr").show();
                $("#id_sdcard_sm_reboot_after_encryption").show();
            }
            else if(encryptedSdCardStatus == EncryptedSdCardStatus.RequestDecryption)
            {
                $("#id_sdcard_ext_decryption_request").show();
                $("#id_sdcard_encryption_sd_card_info_warnings_tr").show();
                $("#id_sdcard_sm_reboot_after_decryption").show();
            }
            else if(encryptedSdCardStatus == EncryptedSdCardStatus.Encrypted)
            {
                $("#id_sdcard_ext_encrypted").show();
            }
            else if(encryptedSdCardStatus == EncryptedSdCardStatus.Decrypted)
            {
                $("#id_sdcard_ext_not_encrypted").show();
            }
            
        },
     
        UpdateBootDeviceStatus: function(bootDevice, externalSdCardState)
        {
            if(bootDevice == "internalSD")
            {
                $("#id_sdcard_internal_sdcard_storage").show();
                $("#id_sdcard_external_sdcard_storage").hide();
            }
            else if(bootDevice == "externalSD")
            {
                $("#id_sdcard_internal_sdcard_storage").hide();
                $("#id_sdcard_external_sdcard_storage").show();
                $("#id_sdcard_ext_card_encryption_buttons_section").removeClass("disabled");
				if(externalSdCardState == SdCardStatus.NotSupported)
				{
					$("#id_sdcard_external_sdcard_support_activated").show();
				}
            }
        },
        
        UpdateRecoverySecretIsPresent: function(recoverySecretIsSet)
        {
            if(recoverySecretIsSet == true)
            {
                $("#id_sdcard_recovery_passwort_set").show();
                $("#id_sdcard_set_recovery_password_button").hide();
                $("#id_sdcard_del_recovery_password_button").show();
            }
            else if (recoverySecretIsSet == false)
            {
                $("#id_sdcard_recovery_passwort_not_set").show();
                $("#id_sdcard_set_recovery_password_button").show();
                $("#id_sdcard_del_recovery_password_button").hide();
            }
        },
        
        UpdateSdActivationPersistence: function (isSdReactivatedAfterFactoryReset)
        {
            $("#id_sdcard_factory_reset_activation").prop('checked', isSdReactivatedAfterFactoryReset);
            $("#id_sdcard_factory_reset_activation").removeClass("disabled");
        },
        
        ParseExternalSdCardState: function(sdCardState)
        {
            stateElements = sdCardState.split("|");
            if(stateElements.includes(SdCardStatus.Activated))
            {
                return SdCardStatus.Activated;
            }
            
            if(stateElements.includes(SdCardStatus.Deactivated))
            {
                return SdCardStatus.Deactivated;
            }
            
            if(stateElements.includes(SdCardStatus.RequestActivation))
            {
                return SdCardStatus.RequestActivation;
            }
            
            if(stateElements.includes(SdCardStatus.RequestDeactivation))
            {
                return SdCardStatus.RequestDeactivation;
            }
            
            return SdCardStatus.NotSupported;
            
        },
        
        ParseEncryptedSdCardState: function(encryptedSdCardState)
        {    
            stateElements = encryptedSdCardState.split("|");
            
            if(stateElements.includes(EncryptedSdCardStatus.RequestEncryption))
            {
                return EncryptedSdCardStatus.RequestEncryption;
            }
            
            if(stateElements.includes(EncryptedSdCardStatus.RequestDecryption))
            {
                return EncryptedSdCardStatus.RequestDecryption;
            }
            
            if(stateElements.includes(EncryptedSdCardStatus.Decrypted))
            {
                return EncryptedSdCardStatus.Decrypted;
            }
            
            if(stateElements.includes(EncryptedSdCardStatus.Encrypted))
            {
                return EncryptedSdCardStatus.Encrypted;
            }

            if(stateElements.includes(EncryptedSdCardStatus.None))
            {
                return EncryptedSdCardStatus.None;
            }
    
            return EncryptedSdCardStatus.NotSupported;
        },
        
        ParseRecoverySecretIsPresent: function(recoverySecretState)
        {    
            stateElements = recoverySecretState.split("|");
            if(stateElements.includes("recovery_secret_present"))
            {
                return true;
            }
            
            if(stateElements.includes("recovery_secret_not_present"))
            {
                return false;
            }
            
            return null;
        },
    }

    return Public;

})();

SdCardConfigService = (function () {

    let Public = {

        GetExternalSdCardStatus: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetExternalSdCardStatus",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetSdCardSupportStatus: function (sdcardconfig)
        {
            let requestData = "sdcardsupport=" + encodeURIComponent(sdcardconfig);

            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "SetSdCardSupportStatus?" + requestData,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        
        SetRecoverySecret: function(serializedArray)
        {
            for (let i in serializedArray) {
               serializedArray[i].value = Private.EncodeURIComponent(serializedArray[i].value);
            }
            if(serializedArray.length == 2)
            {
                serializedArray.splice(1, 1)
            }
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "SetRecoverySecret",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                serializedArray,
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        
        RemoveRecoverySecret: function()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "RemoveRecoverySecret",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        
        EnableEncryption: function(serializedArray)
        {            
            for (let i in serializedArray) {
               serializedArray[i].value = Private.EncodeURIComponent(serializedArray[i].value);
            }
            if(serializedArray.length == 2)
            {
                serializedArray.splice(1, 1)
            }
            
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "EnableEncryption",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                serializedArray,
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        
        DisableEncryption: function()
        {
            
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "DisableEncryption",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        
        GenerateEncryptionSecret: function()
        {
            
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GenerateEncryptionSecret",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        EnableSdReactivationAfterFactoryReset: function()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "EnableSdReactivationAfterFactoryReset",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        
        DisableSdReactivationAfterFactoryReset: function()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "DisableSdReactivationAfterFactoryReset",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }
    }

    let Private = {
        dpScriptName: "module/SdCard/SdCardDp/",
        EncodeURIComponent: function(data)
        {
            let encodedData = data.replace(/ /g, "%20");
            return encodedData; //;
        }
    }

    return Public;

})();
