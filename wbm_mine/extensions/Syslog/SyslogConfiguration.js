
var SYSLOG_DATA_PROVIDER_SCRIPT_NAME = "module/Syslog/SyslogConfiguration/"
var SYSLOG_PAGE_LOCATION_REFERENCE = "#extensions/Syslog/SyslogConfiguration.html";

var SYSLOG_DEFAULT_PORTS = {
    "TCP": "601",
    "UDP": "514",
    "TLS": "6514"
}

var Syslog_ServerConfigurations = {
    Activated: false,
    Destinations: [],
}

var Syslog_SelectedServersTableIndex = 0;

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete this.Syslog_ServerConfigurations;
    delete this.Syslog_SelectedServersTableIndex;
    delete this.SYSLOG_DATA_PROVIDER_SCRIPT_NAME;
    delete this.SYSLOG_DEFAULT_PORTS;

    // Reset Validator
    $("#id_syslogconfig_addedit_syslogserver_form").removeData('validator');
}

$(document).ready(function (){

    // Init Validations
    Validation("#id_syslogconfig_addedit_syslogserver_form");
    $("#id_syslogconfig_addedit_syslogserver_form").validate().settings.ignore = [];

    // Read Syslog Configurations
    SyslogConfiguration.UpdateSyslogConfigurationData();

    SyslogConfiguration.BuildTrustStoreList();

    setTimeout(SyslogConfiguration.UpdatePlaceHolders, 200);

    $("#id_div_loader").hide();

    // add server button
    $("#id_syslogconfig_add_server_btn").click(function (event) {

        // protocol tls
        if ($("#id_syslogconfig_server_protocol_select option:selected").val() == "TLS") {
            $('#id_syslogconfig_server_config_truststore_tr').show();
        }
        else {
            $('#id_syslogconfig_server_config_truststore_tr').hide();
        }

        $("#id_syslogconfig_form_add_server_title").show();
        $("#id_syslogconfig_form_edit_server_title").hide();
        $('#id_syslogconfig_div_modal_addedit_server').show();


        // set ok button attribute "used-option"
        $("#id_syslogconfig_addedit_server_ok_btn").attr("used-option", "add-server");
        
        event.preventDefault();
        return false;
    });

    // edit server button
    $("#id_syslogconfig_servers_table").on("click", "button.edit-server", function (event) {

        Syslog_SelectedServersTableIndex = $(this).closest('tr').index();

        if (Syslog_SelectedServersTableIndex > 0) {
            $("#id_syslogconfig_form_add_server_title").hide();
            $("#id_syslogconfig_form_edit_server_title").show();
            $('#id_syslogconfig_div_modal_addedit_server').show();

            $("#id_syslogconfig_addedit_server_ok_btn").attr("used-option", "edit-server");
            SyslogConfiguration.SetModalSyslogServerOptions(Syslog_ServerConfigurations.Destinations[(Syslog_SelectedServersTableIndex - 1)]);
        }
        else {
            console.error("Syslog Configuration - Internal Error occured");
        }

        event.stopPropagation();
        event.preventDefault();
        return false;
    });

    // add/edit ok button
    $("#id_syslogconfig_addedit_server_ok_btn").click(function (event) {

        if ($("#id_syslogconfig_addedit_syslogserver_form").valid()) {
            let destConfig = SyslogConfiguration.GetModalServerOptions();

            if ($("#id_syslogconfig_addedit_server_ok_btn").attr("used-option") == "add-server") {
                Syslog_ServerConfigurations.Destinations.push(destConfig);
                SyslogConfiguration.AddNewServersTableEntry(destConfig);
                Language.UpdateActivePageMessages();
            }
            else if ($("#id_syslogconfig_addedit_server_ok_btn").attr("used-option") == "edit-server") {
                let configIndex = Syslog_SelectedServersTableIndex - 1;
                let dLength = Syslog_ServerConfigurations.Destinations.length;

                if ((configIndex >= 0) && (dLength > 0) && ((configIndex) < dLength)) {
                    Syslog_ServerConfigurations.Destinations[configIndex] = destConfig;
                    SyslogConfiguration.UpdateConfigurationsTable();
                }
                else {
                    console.error("Syslog Configuration - Internal Error occured");
                }

                Syslog_SelectedServersTableIndex = 0;
            }

            $('#id_syslogconfig_div_modal_addedit_server').hide();
            SyslogConfiguration.ClearTableConfigModal();
        }

        event.preventDefault();
        return false;
    });

    // add/edit cancel button
    $("#id_syslogconfig_addedit_server_cancel_btn").click(function (event) {
        event.preventDefault();

        $('#id_syslogconfig_div_modal_addedit_server').hide();
        SyslogConfiguration.ClearTableConfigModal();

        return false;
    });

    // remove server button
    $("#id_syslogconfig_servers_table").on("click", "button.remove-server", function (event) {

        Syslog_SelectedServersTableIndex = $(this).closest('tr').index();

        if (Syslog_SelectedServersTableIndex > 0) {
            $("#id_syslogconfig_div_modal_remove_server_confirm").show();
        }

        event.stopPropagation();
        event.preventDefault();
        return false;
    });

    // remove server ok button
    $("#id_syslogconfig_remove_server_ok_btn").click(function (event) {

        let serverIndex = Syslog_SelectedServersTableIndex - 1;

        if ((serverIndex >= 0)
            && (Syslog_ServerConfigurations.Destinations.length > 0)
            && ((serverIndex) < Syslog_ServerConfigurations.Destinations.length)) {
            Syslog_ServerConfigurations.Destinations.splice(serverIndex, 1);
            SyslogConfiguration.UpdateConfigurationsTable();
        }
        else {
            console.error("Syslog Configuration - Internal Error occured");
        }

        Syslog_SelectedServersTableIndex = 0;
        $("#id_syslogconfig_div_modal_remove_server_confirm").hide();

        Language.UpdateActivePageMessages();

        event.preventDefault();
        return false;
    });

    // remove server cancle button
    $("#id_syslogconfig_remove_server_cancel_btn").click(function (event) {

        Syslog_SelectedServersTableIndex = 0;

        $("#id_syslogconfig_div_modal_remove_server_confirm").hide();

        event.preventDefault();
        return false;
    });

    // apply config button
    $("#id_syslogconfig_apply_config_btn").click(function (event) {
        event.preventDefault();

        Syslog_ServerConfigurations.Activated = $("#id_syslogconfig_activation_status_checkbox").is(":checked");
        $("#id_div_loader").show();
        if (SyslogConfiguration.ApplySyslogConfig(Syslog_ServerConfigurations)) {
            location.reload();
            window.location.href = SYSLOG_PAGE_LOCATION_REFERENCE;
        }
        else {
            $("#id_div_loader").hide();
        }
        return false;
    });

    // discard button
    $("#id_syslogconfig_discard_config_btn").click(function (event) {
        $("#id_syslogconfig_discard_modal").show();
        event.preventDefault();
        return false;
    });

    // discard ok button
    $("#id_syslogconfig_discard_ok_btn").click(function (event) {
        $("#id_syslogconfig_discard_modal").hide();
        $("#id_div_loader").show();
        event.preventDefault();
        location.reload();
        window.location.href = SYSLOG_PAGE_LOCATION_REFERENCE;
        return false;
    });

    // discard cancel button
    $("#id_syslogconfig_discard_cancle_btn").click(function (event) {
        $("#id_syslogconfig_discard_modal").hide();
        event.preventDefault();
        return false;
    });

    // protocol tls
    $('#id_syslogconfig_server_protocol_select').on('change', function () {
        if ($(this).val() == "TLS") {
            $('#id_syslogconfig_server_config_truststore_tr').show();
        }
        else {
            $('#id_syslogconfig_server_config_truststore_tr').hide();
        }
    });
});

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        if($("#id_syslogconfig_div_modal_addedit_server").is(":visible"))
        {
            $("#id_syslogconfig_addedit_server_cancel_btn").click();
        }
        else if($("#id_syslogconfig_div_modal_remove_server_confirm").is(":visible"))
        {
            $("#id_syslogconfig_remove_server_cancel_btn").click();
        }
        else if($("#id_syslogconfig_discard_modal").is(":visible"))
        {
            $("#id_syslogconfig_discard_cancle_btn").click();
        }
    }
}

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {

    console.log("Syslog configuration - Event subscriber on LanguageChanged - Selected language: " + e.message);
    setTimeout(SyslogConfiguration.UpdatePlaceHolders, 200);
    // Reset validator and reinit validation to change language
    try {
        ReloadValidation("#id_syslogconfig_addedit_syslogserver_form");
        $("#id_syslogconfig_addedit_syslogserver_form").validate().settings.ignore = [];
    } catch (e) { }
}


SyslogConfiguration = (function () {
    // Public Part
    let Public = {
        BuildTrustStoreList: function() {
            let request = AjaxInterface.CreateSyncRequestConfig(SYSLOG_DATA_PROVIDER_SCRIPT_NAME + "ListTrustStoreNames",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "", null);

            let response = AjaxInterface.PerformSyncRequest(request);

            if (response != null) {
                if (response.error) {
                    Private.AddErrorMessage(Private.messagesTags.SyslogConfigError, response.errorText);
                    request.result = false;
                }
                else if (typeof response.result != undefined) {
                    console.log(response.result);
                    $.each(response.result, function (i, trustStoreName) {
                        $("#id_syslogconfig_truststore_list").append("<option>" + Private.EncodeHtmlEntities(trustStoreName) + "</option>");
                    });
                }
            }
        },
        UpdatePlaceHolders: function() {
            $("#id_syslogconfig_server_config_port_input").attr("placeholder", $("#id_syslogconfig_server_default_port_placeholder").text());
            $("#id_syslogconfig_server_config_truststore_input").attr("placeholder", $("#id_syslogconfig_server_config_truststore_placeholder").text());
        },
        SetModalSyslogServerOptions: function(serverConfig) {
            $("#id_syslogconfig_server_config_hostname_input").val(serverConfig.Hostname);
            $("#id_syslogconfig_server_config_port_input").val(serverConfig.Port);
            $("#id_syslogconfig_server_protocol_select").val(serverConfig.Protocol);

            $("#id_syslogconfig_server_config_truststore_input").val(serverConfig.TrustStoreName);

            if (serverConfig.Protocol === "TLS") {
                $('#id_syslogconfig_server_config_truststore_tr').show();
            }
            else {
                $('#id_syslogconfig_server_config_truststore_tr').hide();
            }

            // filter options
            $("#id_syslogconfig_server_config_severity_select").val(serverConfig.Severity);

            $("input:checkbox[name=syslogconfig_server_facilities_cb]").each(function () {
                if (serverConfig.Facilities.includes($(this).val())) {
                    $(this).prop('checked', true);
                }
                else {
                    $(this).prop('checked', false);
                }
            });
        },
        ClearTableConfigModal: function() {
            let empty_ServerConfiguration = {
                "Hostname": "",
                "Port": 0,
                "TrustStoreName" : "",
                "Protocol": "TCP" ,
                "Severity": "Warning" ,
                "Facilities": ["auth"] ,
            }

            SyslogConfiguration.SetModalSyslogServerOptions(empty_ServerConfiguration);

            $('#id_syslogconfig_addedit_syslogserver_form').validate().resetForm();
            $("#id_syslogconfig_addedit_syslogserver_form").validate().settings.ignore = [];
        },
        GetModalServerOptions: function() {
            let serverConfig = {};

            serverConfig.Hostname = $("#id_syslogconfig_server_config_hostname_input").val();
            serverConfig.Port = String($("#id_syslogconfig_server_config_port_input").val());
            serverConfig.Protocol = $("#id_syslogconfig_server_protocol_select option:selected").text();

            serverConfig.TrustStoreName = $("#id_syslogconfig_server_config_truststore_input").val();


            if (serverConfig.Port === "0" || serverConfig.Port === "") {
                if (serverConfig.Protocol in SYSLOG_DEFAULT_PORTS) {
                    serverConfig.Port = SYSLOG_DEFAULT_PORTS[serverConfig.Protocol];
                }
                else {
                    console.log('unknown protocol key');
                }
            }

            // filter options
            serverConfig.Severity = $("#id_syslogconfig_server_config_severity_select option:selected").val();

            serverConfig.Facilities = [];
            $("input:checkbox[name=syslogconfig_server_facilities_cb]:checked").each(function () {
                serverConfig.Facilities.push($(this).val());
            });

            return serverConfig;
        },
        AddNewServersTableEntry: function(destination) {
            let currentTableSize = $('#id_syslogconfig_servers_table').find('tbody>tr:not(".exclude")').length;
            let currentRowInputPosition = (currentTableSize - 1);
            let evenOdd = ((currentRowInputPosition % 2) == 0)?("odd"):("even");
            let entryNumber = currentTableSize;
            let newTableEntryHtml = ''
                + '<tr class= "' + evenOdd + '" id="id_syslogconfig_dest_' + entryNumber + '_tr">'
                +   '<td id="id_syslogconfig_dest_' + entryNumber + '_ip_addr_td">'
                +       '<span id="id_syslogconfig_dest_' + entryNumber + '_ip_addr_span" style="display: inline-block;">' + Private.EncodeHtmlEntities(destination.Hostname) + '</span>'
                +   '</td>'
                +   '<td id="id_syslogconfig_dest_' + entryNumber + '_port_td">'
                +       '<span id="id_syslogconfig_dest_' + entryNumber + 'port_span" style="display: inline-block; ">' + Private.EncodeHtmlEntities(destination.Port) + '</span>'
                +   '</td>'
                +   '<td id="id_syslogconfig_dest_' + entryNumber + '_protocol_td">'
                +       '<span id="id_syslogconfig_dest_' + entryNumber + '_protocol_span" style="display: inline-block; ">' + destination.Protocol + '</span>'
                +   '</td>'
                +   '<td id="id_syslogconfig_dest_' + entryNumber + '_facilities_td">'
                +       '<span <span id="id_syslogconfig_dest_' + entryNumber + '_facilities_span" style="display: inline-block; ">' + destination.Facilities.join(", ") + '</span></td>'
                +   '<td id="id_syslogconfig_dest_' + entryNumber + '_severity_td">'
                +       '<span id="id_syslogconfig_dest_' + entryNumber + '_severity_span" style="display: inline-block;" class="c_syslog_severity_' + destination.Severity.toLowerCase() + '"></span></td>'
                +   '<td>'
                +       '<div class="centered">'
                +           '<button id="id_syslogconfig_dest_' + entryNumber + '_edit_server_btn" class="pxc-btn-edit tooltip edit-server" id="id_syslogconfig_edit_server_' + currentRowInputPosition + '_btn">'
                +               '<span class="tooltip-text-topleft c_syslogconfig_edit_server_config">Edit Syslog Server Configuration</span>'
                +           '</button>'
                +           '<span>&nbsp; </span>'
                +           '<button id="id_syslogconfig_dest_' + entryNumber + '_remove_server_btn" class="pxc-btn-remove tooltip remove-server" id="id_syslogconfig_remove_server_' + currentRowInputPosition + '_btn">'
                +               '<span class="tooltip-text-topleft c_syslogconfig_remove_server_config">Remove Syslog Server Configuration</span>'
                +           '</button>'
                +       '</div>'
                +   '</td> '
                + '</tr>';

            $("#id_syslogconfig_servers_table > tbody > tr").eq(currentRowInputPosition).after(newTableEntryHtml);
        },
        UpdateConfigurationsTable: function() {
            // Clear table
            $("#id_syslogconfig_servers_table tr:gt(0)").not(":last").remove();

            // Check if server configurations are available and process those
            if (Syslog_ServerConfigurations.Destinations.length > 0) {
                $.each(Syslog_ServerConfigurations.Destinations, function (i, destination) {
                    SyslogConfiguration.AddNewServersTableEntry(destination);
                }
            )}

            Language.UpdateActivePageMessages();
        },
        UpdateSyslogConfigurationData: function() {
            let request = AjaxInterface.CreateSyncRequestConfig(SYSLOG_DATA_PROVIDER_SCRIPT_NAME + "GetConfig",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "", null);

            let response = AjaxInterface.PerformSyncRequest(request);

            if (response != null) {
                if (response.error) {
                    Private.AddErrorMessage(Private.messagesTags.SyslogConfigError, response.errorText);
                    request.result = false;
                }
                else if (typeof response.result != undefined) {
                    // Update Configuration Table
                    Syslog_ServerConfigurations = response.result

                    $("#id_syslogconfig_activation_status_checkbox").prop("checked", Syslog_ServerConfigurations.Activated);
                    SyslogConfiguration.UpdateConfigurationsTable();
                }
            }
        },
        ApplySyslogConfig: function(syslogConfig) {
            Private.ClearErrorMessages(Private.globalMessagesContainerId);
            let result = false;
            let request = AjaxInterface.CreateSyncRequestConfig(SYSLOG_DATA_PROVIDER_SCRIPT_NAME + "ApplyConfig",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                JSON.stringify(syslogConfig), null);

            let response = AjaxInterface.PerformSyncRequest(request);

            if (response != null) {
                if (response.error) {
                    Private.AddErrorMessage(Private.messagesTags.SyslogConfigError, response.errorText);
                }
                else {
                    console.log("Syslog configuration - Syslog configuration applied.");
                    result = true;
                }
            }
            return result;
        }
    }
    
    // Private Part
    let Private = {
        globalMessagesContainerId: "id_syslogconfig_global_messages_div",
        messagesTags: {
            SyslogConfigError:  "c_syslogconfig_error_msg_placeholder"
        },
        EncodeHtmlEntities: function(data) {
            let textArea = document.createElement('textarea');
            textArea.innerText = data;
            return textArea.innerHTML;
        },
        ClearErrorMessages: function(containerId)
        {
            $("#" + containerId).find("div.c_syslogconfig_error_message_box").remove();
        },
        AddErrorMessage: function(errorLanTag, errorText)
        {
            let messageHtml = '<div class="c_syslogconfig_error_message_box" style="margin: 3px 0;">'
                            +      '<div class="pxc-error-general-msg-wrp"><div class="pxc-error-msg">'
                            +         '<div class="pxc-exclamation"><div>!</div></div>'
                            +         '<span class="pxc-msg-txt ' + errorLanTag + '" id="id_syslogconfig_error_' + errorLanTag + '_span"></span>'
                            +         '<span class="c_syslogconfig_error_message" style="display: inline-block; margin: 0 24px;"></span>'
                            +         '<span style="display: inline-block; margin: 0 -20px;">' + errorText + '</span>'
                            +      '</div>'
                            + '</div></div>';
            let errorMessage = $(messageHtml).hide();
            $("#" + Private.globalMessagesContainerId).prepend(errorMessage);
            $("#" + Private.globalMessagesContainerId).find("div.c_syslogconfig_error_message_box").fadeIn("slow");

            Language.UpdateActivePageMessages();
        },
    }
    
return Public;
})();