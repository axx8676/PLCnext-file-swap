
function CleanUpPageData() {
    document.removeEventListener('keyup', CloseModalWithEsc);
    delete ProfiCloudV3Service;
}

function ProfiCloudV3RegisterButtons() {
    // Define click handler for apply button
    $('#id_proficloudv3_apply_features_button').click(function (event) {
        event.preventDefault();

        ProfiCloudV3StopStatusTimer();

        // send data to the backend 
        ProfiCloudV3SetConfig();

        return false;
    });

    // Define click handler for reset button
    $('#id_proficloudv3_discard_features_button').click(function (event) {
        $("#id_proficloudv3_discard_modal").show();
        event.preventDefault();
        return false;
    });
    $('#id_proficloudv3_discard_ok_btn').click(function (event) {
        event.preventDefault();
        $("#id_proficloudv3_discard_modal").hide();
        $("#id_div_loader").show();
        location.reload();
        window.location.href = "#extensions/ProfiCloudV3/ProficloudServices.html";
        return false;
    });
    $('#id_proficloudv3_discard_cancle_btn').click(function (event) {
        event.preventDefault();

        $("#id_proficloudv3_discard_modal").hide();

        return false;
    });

    // define click event to enable/disable config buttons
    $('#id_proficloudv3_service_value').click(function (event) {
        let enabled = $("#id_proficloudv3_service_value").is(":checked");
        ProfiCloudV3SetInteractionEnabled(enabled);
    });

    $('#id_proficloudv3_service_devicemanagement_value').click(function (event) {
        let enabled = $("#id_proficloudv3_service_devicemanagement_value").is(":checked");
        ProfiCloudV3EnableDeviceManagementOptions(enabled);
    });

    $('#id_proficloudv3_service_timeseriesdata_value').click(function (event) {
        let enabled = $("#id_proficloudv3_service_timeseriesdata_value").is(":checked");
        ProfiCloudV3EnableTimeSeriesDataOptions(enabled);
    });

    $('#id_proficloudv3_service_remanent_buffering_enabled_value').click(function (event) {
        let enabled = $("#id_proficloudv3_service_remanent_buffering_enabled_value").is(":checked");
        ProfiCloudV3EnableRemanetBufferingOptions(enabled);
    });

    $('#id_proficloudv3_location_select').change(function (event) {
        let location = $("#id_proficloudv3_location_select").val();
        ProfiCloudV3EnableAnycloudDataOptions(location);
    });
}

$(document).ready(function () {
    ProfiCloudV3RegisterButtons();

    // load content
    ProfiCloudV3Refresh();

    IsSoftwareUpdateEnabled();
    
    // Show page content after page elements are loaded
    $("#id_proficloudv3_page_global_div").show();
});

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event) {
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

var ProfiCloudV3StatusTimer = null;

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

/**
 * Appends the errorText in the message area for errors.
 * 
 * @param errorText The error text to insert.
 * @param id (optional) The id of the message element.
 */
function ProfiCloudV3AppendError(errorText, id) {
    // escape
    errorText = ProfiCloudV3EscapeHtml(errorText);
    // replace newline with br
    errorText = errorText.replace("\n", "<br>");
    // get current text
    // update html content
    if(id == null || $('#' + id) == null) {
        return;
    }
    let str = $('#' + id).html();
    // if text is not empty add new line before inserting text
    if (str && str.trim() != "") {
        str += "<br>" + errorText;
    } else {
        str = errorText;
    }
    $('#' + id).html(str);
}

function ProfiCloudV3ClearSetConfigError() {
    $('#id_proficloudv3_error_message_setconfig_value').html("");
}

function ProfiCloudV3ClearGetStatusError() {
    $('#id_proficloudv3_error_message_getstatus_value').html("");
}

function ProfiCloudV3ClearGetConfigError() {
    $('#id_proficloudv3_error_message_getconfig_value').html("");
}

function ProfiCloudV3ClearGetUuidError() {
    $('#id_proficloudv3_error_message_getuuid_value').html("");
}

function ProfiCloudV3ClearGetTrustStoreError() {
    $('#id_proficloudv3_error_message_gettruststores_value').html("");
}

function ProfiCloudV3ClearGetIdentityStoreError() {
    $('#id_proficloudv3_error_message_getidentitystores_value').html("");
}

function ProfiCloudV3ClearScmError() {
    $('#id_proficloudv3_error_message_scm_value').html("");
}

/**
 * Enables/Disables all elements for interaction.
 */
function ProfiCloudV3SetInteractionEnabled(enabled) {
    $('#id_proficloudv3_service_devicemanagement_value').attr("disabled", !enabled);
    $('#id_proficloudv3_service_timeseriesdata_value').attr("disabled", !enabled);
    $('#id_proficloudv3_location_select').attr("disabled", !enabled);
    $('#id_proficloudv3_identitystore_select').attr("disabled", !enabled);
    $('#id_proficloudv3_truststore_cloud_select').attr("disabled", !enabled);
    $('#id_proficloudv3_truststore_cloudcommands_select').attr("disabled", !enabled);
    $("#id_proficloudv3_ciphers").attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_url_tls').attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_url_host').attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_url_port').attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_url_path').attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_clientid').attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_user').attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_pass').attr("disabled", !enabled);
    $('#id_proficloudv3_anycloud_topic').attr("disabled", !enabled);

    let tsdEnabled = $("#id_proficloudv3_service_timeseriesdata_value").is(":checked");
    let dmEnabled = $("#id_proficloudv3_service_devicemanagement_value").is(":checked");
    ProfiCloudV3EnableTimeSeriesDataOptions(tsdEnabled && enabled);
    ProfiCloudV3EnableDeviceManagementOptions(dmEnabled && enabled)
}

function ProfiCloudV3ButtonBarEnable(enable) {
    if (enable) {
        $('#id_proficloudv3_apply_features_button').show();
        $('#id_proficloudv3_discard_features_button').show();
    } else {
        $('#id_proficloudv3_apply_features_button').hide();
        $('#id_proficloudv3_discard_features_button').hide();
    }
}

/**
 * Starts the timer which executes the ProfiCloudV3UpdateStatus method each 1000 milliseconds.
 */
function ProfiCloudV3StartStatusTimer() {
    if (ProfiCloudV3StatusTimer == null) {
        ProfiCloudV3StatusTimer = setInterval(ProfiCloudV3Service.GetStatus, 1000);
    }
}

/**
 * Stops the timer which executes the ProfiCloudV3UpdateStatus.
 */
function ProfiCloudV3StopStatusTimer() {
    if (ProfiCloudV3StatusTimer != null) {
        clearInterval(ProfiCloudV3StatusTimer);
        ProfiCloudV3StatusTimer = null;
    }
    ProfiCloudV3ButtonBarEnable(true);
}

function ProficloudV3ClearStoreOptions() {
    // remove all options
    $('#id_proficloudv3_identitystore_select').find('option')
        .remove()
        .end();
    // add empty option to allow to clear the value
    $('#id_proficloudv3_identitystore_select').append($('<option>', { 
        value: "",
        text : "---" 
    }));
    // remove all options
    $('#id_proficloudv3_truststore_cloud_select').find('option')
        .remove()
        .end();
    // add empty option to allow to clear the value
    $('#id_proficloudv3_truststore_cloud_select').append($('<option>', { 
        value: "",
        text : "---" 
    }));
    // remove all options
    $('#id_proficloudv3_truststore_cloudcommands_select').find('option')
        .remove()
        .end();
    // add empty option to allow to clear the value
    $('#id_proficloudv3_truststore_cloudcommands_select').append($('<option>', { 
        value: "",
        text : "---" 
    }));
    Language.UpdateActivePageMessages();
}

/**
 * Reloads all data of this page.
 */
function ProfiCloudV3Refresh() {
    ProficloudV3ClearStoreOptions();

    // reload UUID
    ProfiCloudV3Service.GetCloudUuid();
    // reload status of proficloud component
    ProfiCloudV3Service.GetStatus();
    // reload configuration of the proficloud component
    ProfiCloudV3Service.GetTrustStores();
    // reload configuration of the proficloud component
    ProfiCloudV3Service.GetIdentityStores();
    // reload configuration of the proficloud component
    ProfiCloudV3Service.GetConfig();
}

function IsSoftwareUpdateEnabled() {
    ProfiCloudV3Service.IsSoftwareUpdateEnabled();
}

function ProfiCloudV3SetConfig() {
    // The response will contain a possbible error message. Response:
    // {
    //    error: false,
    //    message: "",
    //    result: null
    // }

    // prepare parameter to update
    let requestData = {};

    // Get feature states defined by the user and store them in the request data object
    // connection
    requestData["connection/enabled"] = $("#id_proficloudv3_service_value").is(":checked");
    requestData["connection/location"] = $("#id_proficloudv3_location_select").val();
    requestData["connection/identityStore"] = $("#id_proficloudv3_identitystore_select").val();
    requestData["connection/ciphers"] = $("#id_proficloudv3_ciphers").val();
    requestData["connection/trustStoreCloud"] = $("#id_proficloudv3_truststore_cloud_select").val();
    requestData["connection/trustStoreCloudCommand"] = $("#id_proficloudv3_truststore_cloudcommands_select").val();
    requestData["connection/anycloudTls"] = $("#id_proficloudv3_anycloud_url_tls").is(":checked");
    requestData["connection/anycloudHost"] = $("#id_proficloudv3_anycloud_url_host").val();
    let anycloudPortStr = $("#id_proficloudv3_anycloud_url_port").val();
    let anycloudPort = Number(anycloudPortStr);
    if(isNaN(anycloudPort)) {
        requestData["connection/anycloudPort"] = (anycloudPortStr == "" ? 0 : anycloudPortStr);
    } else {
        requestData["connection/anycloudPort"] = anycloudPort;
    }
    requestData["connection/anycloudPath"] = $("#id_proficloudv3_anycloud_url_path").val();
    requestData["connection/anycloudClientId"] = $("#id_proficloudv3_anycloud_clientid").val();
    requestData["connection/anycloudUsername"] = $("#id_proficloudv3_anycloud_user").val();
    requestData["connection/anycloudPassword"] = $("#id_proficloudv3_anycloud_pass").val();
    requestData["connection/anycloudMqttTopic"] = $("#id_proficloudv3_anycloud_topic").val();
    // services
    let dmEnabled = $("#id_proficloudv3_service_devicemanagement_value").is(":checked");
    requestData["trafficLight/enabled"] = dmEnabled;
    requestData["timeSeriesData/enabled"] = $("#id_proficloudv3_service_timeseriesdata_value").is(":checked");

    // Device Management
    requestData["firmwareUpdate/enabled"] = dmEnabled ? $("#id_proficloudv3_service_dm_firmwareupdate_enabled_value").is(":checked") : false;
    requestData["firmwareUpdate/force"] = $("#id_proficloudv3_service_dm_firmwareupdate_force_value").is(":checked");
    requestData["appUpdate/enabled"] = dmEnabled ? $("#id_proficloudv3_service_dm_applicationupdate_enabled_value").is(":checked") : false;
    requestData["appUpdate/force"] = $("#id_proficloudv3_service_dm_applicationupdate_force_value").is(":checked");

    // TSD
    requestData["timeSeriesData/samplingInterval"] = Number($("#id_proficloudv3_buffering_table_sampling_interval_val_input").val());
    requestData["timeSeriesData/publishInterval"] = Number($("#id_proficloudv3_service_timeseriesdata_sending_interval_val_input").val());
    requestData["timeSeriesData/remanentBuffering"] = $("#id_proficloudv3_service_remanent_buffering_enabled_value").is(":checked");
    requestData["timeSeriesData/writeInterval"] = Number($("#id_proficloudv3_buffering_table_write_interval_val_input").val());
    requestData["timeSeriesData/maxFileSize"] = Number($("#id_proficloudv3_buffering_table_max_file_size_val_input").val());
    requestData["timeSeriesData/deleteRatio"] = Number($("#id_proficloudv3_buffering_table_delete_ratio_val_input").val());

    ProfiCloudV3Service.SetConfig(requestData);
}

function SetVariableSelect(option, selectId, warningId, warningParamId, stores) {
    // Check if the value exists in the option list
    if(!ProficloudV3ContainsOption(selectId, option)) {
        // does not exist. Add option
        $('#' + selectId).append($('<option>', { 
            value: option,
            text : option 
        }));
    }
    if(!stores.includes(option) && option != "") {
        // show warning of missing option
        $(warningId).show();
        // insert value into warning text 
        $(warningParamId).html(option);
    } else {
        $(warningId).hide();
    }
    // set value
    $("#" + selectId).val(option);
}

function ProficloudV3DisplayConfig(config) {
    if(config == null) {
        return;
    }
    // set check box if enabled or not
    ProfiCloudV3SetInteractionEnabled(config["connection/enabled"]);

    if (config["connection/enabled"]) {
        $("id_proficloudv3_disabled_message").hide();
    } else {
        $("id_proficloudv3_disabled_message").show();
    }

    // connection params
    $("#id_proficloudv3_service_value").prop('checked', config["connection/enabled"]);

    SetVariableSelect(
        config["connection/identityStore"],
        'id_proficloudv3_identitystore_select',
        "#id_proficloudv3_identitystore_select_warning",
        "#id_proficloudv3_identitystore_select_warning_param",
        ProfiCloudV3Service.IdentityStores
    );
    SetVariableSelect(
        config["connection/trustStoreCloud"],
        'id_proficloudv3_truststore_cloud_select',
        "#id_proficloudv3_truststore_cloud_warning",
        "#id_proficloudv3_truststore_cloud_warning_param",
        ProfiCloudV3Service.TrustStores
    );
    SetVariableSelect(
        config["connection/trustStoreCloudCommand"],
        'id_proficloudv3_truststore_cloudcommands_select',
        "#id_proficloudv3_truststore_cloudcommands_warning",
        "#id_proficloudv3_truststore_cloudcommands_warning_param",
        ProfiCloudV3Service.TrustStores
    );

    $("#id_proficloudv3_ciphers").val(config["connection/ciphers"]);
    $("#id_proficloudv3_location_select").val(config["connection/location"]);
    $("#id_proficloudv3_anycloud_url_tls").prop('checked', config["connection/anycloudTls"]);
    $("#id_proficloudv3_anycloud_url_host").val(config["connection/anycloudHost"]);
    $("#id_proficloudv3_anycloud_url_port").val(config["connection/anycloudPort"]);
    if($("#id_proficloudv3_anycloud_url_port").val() == 0) {
        $("#id_proficloudv3_anycloud_url_port").val('');
    }
    $("#id_proficloudv3_anycloud_url_path").val(config["connection/anycloudPath"]);
    $("#id_proficloudv3_anycloud_clientid").val(config["connection/anycloudClientId"]);
    $("#id_proficloudv3_anycloud_user").val(config["connection/anycloudUsername"]);
    $("#id_proficloudv3_anycloud_pass").val(config["connection/anycloudPassword"]);
    $("#id_proficloudv3_anycloud_topic").val(config["connection/anycloudMqttTopic"]);

    // Services
    let dmEnabled = config["logging/enabled"] || config["trafficLight/enabled"] || config["firmwareUpdate/enabled"] || config["appUpdate/enabled"];
    $("#id_proficloudv3_service_devicemanagement_value").prop('checked', dmEnabled);
    $("#id_proficloudv3_service_timeseriesdata_value").prop('checked', config["timeSeriesData/enabled"]);

    // Device Management
    $("#id_proficloudv3_service_dm_firmwareupdate_enabled_value").prop('checked', config["firmwareUpdate/enabled"]);
    $("#id_proficloudv3_service_dm_firmwareupdate_force_value").prop('checked', config["firmwareUpdate/force"]);
    $("#id_proficloudv3_service_dm_applicationupdate_enabled_value").prop('checked', config["appUpdate/enabled"]);
    $("#id_proficloudv3_service_dm_applicationupdate_force_value").prop('checked', config["appUpdate/force"]);

    // TSD
    $("#id_proficloudv3_service_timeseriesdata_sending_interval_val_input").val(config["timeSeriesData/publishInterval"]);
    $("#id_proficloudv3_service_remanent_buffering_enabled_value").prop('checked', config["timeSeriesData/remanentBuffering"]);
    $("#id_proficloudv3_buffering_table_sampling_interval_val_input").val(config["timeSeriesData/samplingInterval"]);
    $("#id_proficloudv3_buffering_table_write_interval_val_input").val(config["timeSeriesData/writeInterval"]);
    $("#id_proficloudv3_buffering_table_max_file_size_val_input").val(config["timeSeriesData/maxFileSize"]);
    $("#id_proficloudv3_buffering_table_delete_ratio_val_input").val(config["timeSeriesData/deleteRatio"]);
    $("#id_proficloudv3_timeseriesdata_qos_input").val(config["timeSeriesData/qualityOfService"]);

    ProfiCloudV3EnableAnycloudDataOptions(config["connection/location"]);

    let enabled = $("#id_proficloudv3_service_value").is(":checked");
    ProfiCloudV3SetInteractionEnabled(enabled);
}

function ProficloudV3DisplayStatus(status) {
    // show status in HTML.
    if (status.connectionState) {
        switch (status.connectionState) {
            case "Connecting":
                ProfiCloudV3StartStatusTimer();
                break;
            case "Connected":
                ProfiCloudV3StartStatusTimer();
                break;
            case "Disconnected":
                ProfiCloudV3StopStatusTimer();
                break;
            case "Broken":
                ProfiCloudV3StartStatusTimer();
                break;
            default:
                ProfiCloudV3StartStatusTimer();
                break;
        }
        $("#id_proficloudv3_info_status_connection_value").attr('class', 'c_proficloudv3_info_status_connection_value_' + ProfiCloudV3EscapeHtml(status.connectionState));
    }

    if(status.errors && status.errors.length > 0) {
        for(let i = 0; i < status.errors.length; i++) {
            ProfiCloudV3AppendError(status.errors[i].message, 'id_proficloudv3_error_message_getstatus_value');
        }
    }
    Language.UpdateActivePageMessages();
}

function ProficloudV3ContainsOption(id, value) {
    
    var ddl = document.getElementById(id);
    if(ddl == null) {
        return false;
    }
    for(let i = 0; i < ddl.options.length; i++) {
        if(ddl.options[i].value == value) {
            return true;
        }
    }
    return false;
}

function ProficloudV3SetTrustStores(stores) {
    ProfiCloudV3Service.TrustStores = stores;
    $.each(stores, function (i, item) {
        if(!ProficloudV3ContainsOption("id_proficloudv3_truststore_cloud_select",item)) {
            $('#id_proficloudv3_truststore_cloud_select').append($('<option>', { 
                value: item,
                text : item 
            }));
        }
    });
    if(!ProfiCloudV3Service.TrustStores.includes($('#id_proficloudv3_truststore_cloud_select').val())){
        if($('#id_proficloudv3_truststore_cloud_select').val() != "") {
            $("#id_proficloudv3_truststore_cloud_warning").show();
        }
        $("#id_proficloudv3_truststore_cloud_warning_param").html($('#id_proficloudv3_truststore_cloud_select').val());
    } else {
        $("#id_proficloudv3_truststore_cloud_warning").hide();
    }
    $.each(stores, function (i, item) {
        if(!ProficloudV3ContainsOption("id_proficloudv3_truststore_cloudcommands_select",item)) {
            $('#id_proficloudv3_truststore_cloudcommands_select').append($('<option>', { 
                value: item,
                text : item 
            }));
        }
    });
    if(!ProfiCloudV3Service.TrustStores.includes($('#id_proficloudv3_truststore_cloudcommands_select').val())){
        if($('#id_proficloudv3_truststore_cloudcommands_select').val() != "") {
            $("#id_proficloudv3_truststore_cloudcommands_warning").show();
        }
        $("#id_proficloudv3_truststore_cloudcommands_warning_param").html($('#id_proficloudv3_truststore_cloudcommands_select').val());
    } else {
        $("#id_proficloudv3_truststore_cloudcommands_warning").hide();
    }
}


function ProficloudV3SetIdentityStores(stores) {
    ProfiCloudV3Service.IdentityStores = stores;
    $.each(stores, function (i, item) {
        if(!ProficloudV3ContainsOption("id_proficloudv3_identitystore_select",item)) {
            $('#id_proficloudv3_identitystore_select').append($('<option>', { 
                value: item,
                text : item 
            }));
        }
    });
    if(!ProfiCloudV3Service.IdentityStores.includes($('#id_proficloudv3_identitystore_select').val())){
        if($('#id_proficloudv3_identitystore_select').val() != "") {
            $("#id_proficloudv3_identitystore_select_warning").show();
        }
        $("#id_proficloudv3_identitystore_select_warning_param").html($('#id_proficloudv3_identitystore_select').val());
    } else {
        $("#id_proficloudv3_identitystore_select_warning").hide();
    }
}

function ProfiCloudV3EnableAnycloudDataOptions(location) {
    let isOtherMqttBroker = location != "GermanyFrankfurt" && location != "ChinaShanghai";
    if(isOtherMqttBroker) {
        $("#id_proficloudv3_anycloud_url_tls_row").show();
        $("#id_proficloudv3_anycloud_url_host_row").show();
        $("#id_proficloudv3_anycloud_url_port_row").show();
        $("#id_proficloudv3_anycloud_url_path_row").show();
        $("#id_proficloudv3_anycloud_clientid_row").show();
        $("#id_proficloudv3_truststore_cloudcommands_row").hide();
        $("#id_proficloudv3_anycloud_user_row").show();
        $("#id_proficloudv3_anycloud_pass_row").show();
        $("#id_proficloudv3_anycloud_topic_row").show();
        $("#id_proficloudv3_devicemanagement_row").hide();
        $("#id_proficloudv3_section_devicemanagement").hide();
    } else {
        $("#id_proficloudv3_anycloud_url_tls_row").hide();
        $("#id_proficloudv3_anycloud_url_host_row").hide();
        $("#id_proficloudv3_anycloud_url_port_row").hide();
        $("#id_proficloudv3_anycloud_url_path_row").hide();
        $("#id_proficloudv3_anycloud_clientid_row").hide();
        $("#id_proficloudv3_truststore_cloudcommands_row").show();
        $("#id_proficloudv3_anycloud_user_row").hide();
        $("#id_proficloudv3_anycloud_pass_row").hide();
        $("#id_proficloudv3_anycloud_topic_row").hide();
        $("#id_proficloudv3_devicemanagement_row").show();
        $("#id_proficloudv3_section_devicemanagement").show();
    }
}

function ProfiCloudV3EnableTimeSeriesDataOptions(enable) {
    $("#id_proficloudv3_service_remanent_buffering_enabled_value").attr("disabled", !enable);
    $("#id_proficloudv3_service_timeseriesdata_sending_interval_val_input").attr("disabled", !enable);
    $('#id_proficloudv3_buffering_table_sampling_interval_val_input').attr("disabled", !enable);
    $('#id_proficloudv3_timeseriesdata_qos_input').attr("disabled", true);

    let bufferingEnabled = $("#id_proficloudv3_service_remanent_buffering_enabled_value").is(":checked");
    ProfiCloudV3EnableRemanetBufferingOptions(enable && bufferingEnabled);
}

function ProfiCloudV3EnableDeviceManagementOptions(enable) {
    $("#id_proficloudv3_service_dm_firmwareupdate_enabled_value").attr("disabled", !enable);
    $("#id_proficloudv3_service_dm_firmwareupdate_force_value").attr("disabled", !enable);
    $('#id_proficloudv3_service_dm_applicationupdate_enabled_value').attr("disabled", !enable);
    $('#id_proficloudv3_service_dm_applicationupdate_force_value').attr("disabled", !enable);
}

function ProfiCloudV3EnableRemanetBufferingOptions(enable) {
    $('#id_proficloudv3_buffering_table_write_interval_val_input').attr("disabled", !enable);
    $('#id_proficloudv3_buffering_table_max_file_size_val_input').attr("disabled", !enable);
    $('#id_proficloudv3_buffering_table_delete_ratio_val_input').attr("disabled", !enable);
}

ProfiCloudV3Service = (function () {

    let Public = {
        Config: null,
        IdentityStores: [],
        TrustStores: [],
        /**
        * Updates the UUID.
        */
        GetCloudUuid: function ()
        {
            // The response will contain the UUID as String e.g.:
            // {
            //    error: false,
            //    message: "",
            //    result: "741aa071-fb2e-474b-96a7-b52c92e079eb"
            // }

            ProfiCloudV3ClearGetUuidError();

            // Prepare ajax callback container object
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            // Set error callback. Will be executed if an HTTP Status Error is returned.
            ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
                // print error
                ProfiCloudV3AppendError("Failed to get UUID:" + JSON.stringify(error), "id_proficloudv3_error_message_getuuid_value");
            };

            // Prepare ajax request to retrieve UUID
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetCloudUuid", // url
                AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                null, // data: The data to send
                ajaxCallbackFunctions, // callbacks
                null // timeout
            );

            // Execute ajax request
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
                // handle error
                if (data.error) {
                    ProfiCloudV3AppendError(data.message, "id_proficloudv3_error_message_getuuid_value");
                } else {
                    // set UUID in HTML. Escape result before inserting in HTML
                    $("#id_proficloudv3_clouduuid_value").html(ProfiCloudV3EscapeHtml(data.result));
                }
            }).catch(function (errorObj) {
                // Unknown execption
                console.error(errorObj);
                ProfiCloudV3AppendError("Failed to get UUID.", "id_proficloudv3_error_message_getuuid_value");
            });
        },

        /**
        * Updates the status.
        */
        GetStatus: function ()
        {
            // The response will contain the state
            // {
            //    error: false,
            //    message: "",
            //    result: {
            //      state: "",
            //      isRunning: false
            //    }
            // }

            // Prepare ajax callback container object
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            // Set error callback. Will be executed if an HTTP Status Error is returned.
            ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
                ProfiCloudV3ClearGetStatusError();
                // print error
                ProfiCloudV3AppendError("Failed to get status:" + JSON.stringify(error), "id_proficloudv3_error_message_getstatus_value");
                ProfiCloudV3StartStatusTimer();
            };

            // Prepare ajax request to retrieve proficloud status
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetStatus", // url
                AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                null, // data: The data to send
                ajaxCallbackFunctions, // callbacks
                null // timeout
            );

            // Execute ajax request
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
                ProfiCloudV3ClearGetStatusError();
                // check if an error occurred
                if (data.error) {
                    // show error message
                    ProfiCloudV3AppendError(data.message == null ? "" : data.message, "id_proficloudv3_error_message_getstatus_value");
                } else if(data.result) {
                    ProficloudV3DisplayStatus(data.result);
                } else {
                    ProfiCloudV3AppendError("Failed to get status.", "id_proficloudv3_error_message_getstatus_value");
                }
            }).catch(function (errorObj) {
                ProfiCloudV3ClearGetStatusError();
                // Unknown execption
                console.error(errorObj);
                ProfiCloudV3AppendError("Failed to get status.", "id_proficloudv3_error_message_getstatus_value");
                ProfiCloudV3StartStatusTimer();
            });
        },

        /**
        * Reads the configuration from the backend and sets the values in the WEB-UI
        */
        GetConfig: function ()
        {
            // {
            //   error: false,
            //   message: "",
            //   result: {
            //     "<key>": <value>,
            //   }
            // }
            // The response will contain the states of the features e.g.:
            // {
            //   error: false,
            //   message: "",
            //   result: {
            //     "<feature>/<key>":"<value>"
            //   }
            ProfiCloudV3ClearGetConfigError();

            // Prepare ajax callback container object
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            // Set error callback. Will be executed if an HTTP Status Error is returned.
            ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
                // print error
                ProfiCloudV3AppendError("Failed to get config:" + JSON.stringify(error), "id_proficloudv3_error_message_getconfig_value");
            };

            // Prepare ajax request to retrieve proficloud config
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetConfig", // url
                AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                null, // data: The data to send
                ajaxCallbackFunctions, // callbacks
                null // timeout
            );

            // Execute ajax request
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
                if (data.error) {
                    // show error message
                    ProfiCloudV3AppendError(data.message, "id_proficloudv3_error_message_getconfig_value");
                } else if (data.result) {
                    ProfiCloudV3Service.Config = data.result;
                    ProficloudV3DisplayConfig(ProfiCloudV3Service.Config);
                } else {
                    // show error
                    ProfiCloudV3AppendError(data, "id_proficloudv3_error_message_getconfig_value");
                }
            }).catch(function (errorObj) {
                // Unknown execption
                console.error(errorObj);
                ProfiCloudV3AppendError("Failed to get config.", "id_proficloudv3_error_message_getconfig_value");
            });
        },

        /**
        * Sets the feature states.
        */
        SetConfig: function (requestData)
        {
            ProfiCloudV3ButtonBarEnable(false);
            $('#id_proficloudv3_apply_config_message').show();
            ProfiCloudV3ClearSetConfigError();

            // Prepare ajax callback container object
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            // Set error callback. Will be executed if an HTTP Status Error is returned.
            ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
                $('#id_proficloudv3_apply_config_message').hide();
                ProfiCloudV3ButtonBarEnable(true);
                // print error
                ProfiCloudV3AppendError("Failed to update the configuration:" + JSON.stringify(error), "id_proficloudv3_error_message_setconfig_value");
                
                ProfiCloudV3StartStatusTimer();
            };

            // Prepare ajax request to retrieve proficloud config
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "SetConfig", // url
                AjaxInterface.AjaxRequestType.POST, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                JSON.stringify(requestData), // data: The data to send
                ajaxCallbackFunctions, // callbacks
                null, // timeout
                null //AjaxInterface.AjaxRequestContentType.APPLICATION_JSON // contentType: When sending data to the server, use this content type 
            );

            // Execute ajax request
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
                $('#id_proficloudv3_apply_config_message').hide();
                ProfiCloudV3ButtonBarEnable(true);

                // handle error
                if (data.error) {
                    ProfiCloudV3AppendError(data.message, 'id_proficloudv3_error_message_setconfig_value');
                    if(data.result) {
                        for(let i = 0; i < data.result.length; i++) {
                            ProfiCloudV3AppendError(data.result[i].key + ': ' + data.result[i].message, 'id_proficloudv3_error_message_setconfig_value');
                        }
                    }
                }
                
                // reload information
                ProfiCloudV3Refresh();
            }).catch(function (errorObj) {
                // Unknown execption
                console.error(errorObj);
                ProfiCloudV3AppendError("Failed to update the configuration.", "id_proficloudv3_error_message_setconfig_value");

                $('#id_proficloudv3_apply_config_message').hide();
                ProfiCloudV3ButtonBarEnable(true);

                ProfiCloudV3StartStatusTimer();
            });
        },

        /**
         * Loads the trust store names
         */
        GetTrustStores: function() {
            ProfiCloudV3ClearGetTrustStoreError();

            // Prepare ajax callback container object
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            // Set error callback. Will be executed if an HTTP Status Error is returned.
            ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
                // print error
                ProfiCloudV3AppendError("Failed to get the list of trust stores:" + JSON.stringify(error), "id_proficloudv3_error_message_gettruststores_value");
            };

            // Prepare ajax request to retrieve proficloud config
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetTrustStores", // url
                AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                null, // data: The data to send
                ajaxCallbackFunctions, // callbacks
                null // timeout
            );

            // Execute ajax request
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
                if (data.error) {
                    // show error message
                    ProfiCloudV3AppendError(data.message, "id_proficloudv3_error_message_gettruststores_value");
                } else if (data.result) {
                    ProficloudV3SetTrustStores(data.result);
                    ProficloudV3DisplayConfig(ProfiCloudV3Service.Config);
                } else {
                    // show error
                    ProfiCloudV3AppendError("Failed to get the list of trust stores.", "id_proficloudv3_error_message_gettruststores_value");
                }
            }).catch(function (errorObj) {
                // Unknown execption
                console.error(errorObj);
                ProfiCloudV3AppendError("Failed to get the list of trust stores.", "id_proficloudv3_error_message_gettruststores_value");
            });
        },

        /**
         * Loads the identity store names
         */
        GetIdentityStores: function() {
            ProfiCloudV3ClearGetIdentityStoreError();
            // Prepare ajax callback container object
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            // Set error callback. Will be executed if an HTTP Status Error is returned.
            ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
                // print error
                ProfiCloudV3AppendError("Failed to get identity stores:" + JSON.stringify(error), "id_proficloudv3_error_message_getidentitystores_value");
            };

            // Prepare ajax request to retrieve proficloud config
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetIdentityStores", // url
                AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                null, // data: The data to send
                ajaxCallbackFunctions, // callbacks
                null // timeout
            );

            // Execute ajax request
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
                if (data.error) {
                    // show error message
                    ProfiCloudV3AppendError(data.message, "id_proficloudv3_error_message_getidentitystores_value");
                } else if (data.result) {
                    ProficloudV3SetIdentityStores(data.result);
                    ProficloudV3DisplayConfig(ProfiCloudV3Service.Config);
                } else {
                    // show error
                    ProfiCloudV3AppendError("Failed to get identity stores.", "id_proficloudv3_error_message_getidentitystores_value");
                }
            }).catch(function (errorObj) {
                // Unknown execption
                console.error(errorObj);
                ProfiCloudV3AppendError("Failed to get identity stores.", "id_proficloudv3_error_message_getidentitystores_value");
            });
        },
        
        IsSoftwareUpdateEnabled: function() {
            ProfiCloudV3ClearScmError();
            // Prepare ajax callback container object
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            // Set error callback. Will be executed if an HTTP Status Error is returned.
            ajaxCallbackFunctions.OnErrorCallback = function (xhr, status, error) {
                // print error
                ProfiCloudV3AppendError("Failed to check SCM status:" + JSON.stringify(error), "id_proficloudv3_error_message_scm_value");
            };

            // Prepare ajax request to retrieve proficloud config
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetSystemServices", // url
                AjaxInterface.AjaxRequestType.GET, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                null, // data: The data to send
                ajaxCallbackFunctions, // callbacks
                null // timeout
            );

            // Execute ajax request
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig).then(function (data) {
                if (data.error) {
                    // show error message
                    ProfiCloudV3AppendError(data.message, "id_proficloudv3_error_message_scm_value");
                } else if (data.result) {
                    let systemServices = data.result;
                    $(systemServices).each(function(idx, systemService) {
                        if(systemService['Id'] == "SOFTWARE UPDATE") {
                            if(!systemService['IsEnabled']){
                                $("#enablesoftwareupdate").show();
                            }
                        }
                    });
                } else {
                    // show error
                    ProfiCloudV3AppendError("Failed to check SCM status.", "id_proficloudv3_error_message_scm_value");
                }
            }).catch(function (errorObj) {
                // Unknown execption
                console.error(errorObj);
                ProfiCloudV3AppendError("Failed to check SCM status.", "id_proficloudv3_error_message_scm_value");
            });
        }
    }

    let Private = {
        dpScriptName: "module/ProfiCloudV3/ProfiCloudV3Dp/"
    }

    return Public;

})();
