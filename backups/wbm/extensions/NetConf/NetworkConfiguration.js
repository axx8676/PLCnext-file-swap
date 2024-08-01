SubPageActive = true;
networkConfigurationSelectedTabId = localStorage.getItem("NetworkConfigurationActiveTab");

DefaultEthernetInfoConfigs = {
    DefaultConfigs: true,
    SwitchedLanInterface: {
        Supported: false
    },
    LanInterfacesCount: 1,
    LanPortsCount: 2,
    InterfacePrefix: "LAN",
    PortPrefix: "X",
    PortPostfix:"",
    PortCounterOffset: 0,
    PortBackwardCounter: false,
    ExtLanInterfaces: {
        Supported: false,
    }
}

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    NetworkConfigurationUi.StopPortInfosUpdateTimer();
    NetloadLimiterUi.StopUpdateTimer();

    delete NetworkConfigurationUi;

    delete NetworkConfigurationService;

    delete NetloadLimiterService;

    delete NetloadLimiterUi;
    
    delete WLANConfigurationUi;
    
    delete WLANConfigurationService;
    
    delete SubPageActive;

    delete DefaultEthernetInfoConfigs;

    delete networkConfigurationSelectedTabId;

    $("#id_lanconfig_interfaces_tables_form").removeData('validator');
    $("#id_netload_limiter_tables_form").removeData('validator');
    $("#id_wlan-configuration_tables_form").removeData('validator');
    $("#id_extlan-configuration_tables_form").removeData('validator');
    $(document).off("LanguageChanged");
}

$(".pxc-pd-tabs h2 a").click(function(event){
        
    selectedTabID = $(this).attr('id');
    SwitchTab(selectedTabID);
    localStorage.setItem("NetworkConfigurationActiveTab", selectedTabID);
    event.preventDefault();
});

function SwitchTab(currentTabId)
{
    var currentTab = $('#' + currentTabId);
    // hide last tab content
    var lastActiveTabId = currentTab.parent().parent().find('a.pxc-tab-on').attr('data-tab-id');
    $('#' + lastActiveTabId).hide();
    // show tab content
    var newActiveTabId = currentTab.attr('data-tab-id');
    $('#' + newActiveTabId).show();
    // set class 'pxc-tab-on' to new tab
    currentTab.parent().parent().find('a.pxc-tab-on').removeClass('pxc-tab-on');
    currentTab.addClass('pxc-tab-on');
}

$(document).ready(function(){
    
    $("#id_div_loader").show();
    //var t00 = performance.now();
    // Check configuration permissions
    let hasSetPermissions = NetworkConfigurationService.HasSetPermissions();
    if(hasSetPermissions)
    {
        NetworkConfigurationUi.EnableConfigButtons();
        WLANConfigurationUi.EnableConfigButtons();
        EXTNetworkConfigurationUi.EnableConfigButtons();
    }
    else
    {
        NetworkConfigurationUi.DisableConfigButtons();
        WLANConfigurationUi.DisableConfigButtons();
        EXTNetworkConfigurationUi.DisableConfigButtons();
    }
    
    WbmUtilities.ReadDeviceWbmConfigs();
    
    // Build LAN config tables
    NetworkConfigurationUi.BuildConfigurationTables(hasSetPermissions);
    
    // Show rplc ip help messageonly for RPLC targets
    NetworkConfigurationUi.ShowHelpInfoMessage();

    // TODO Seems that this is called twice! Once during BuildConfigurationTables and then here again
    // Check if network config changed notification was sent
    NetworkConfigurationUi.UpdateNetworkConfigChanged();
    
    //Build WLAN config tables
    WLANConfigurationUi.BuildConfigurationTables(hasSetPermissions);
    
    //Build Additional Settings table
    EXTNetworkConfigurationUi.BuildConfigurationTables(hasSetPermissions);
    
    // Init Validators
    Validation("#id_lanconfig_interfaces_tables_form");
    
    // Show page content after page elements are loaded
    $("#id_lanconfig_page_global_div").show();
        
    $("#id_div_loader").hide();
    
    $("#id_lanconfig_save_config_restart_button").click(function(event)
    {
        if($("#id_lanconfig_interfaces_tables_form").valid() == true)
        {
            $("#id_lanconfig_save_restart_modal").show();
        }
        event.preventDefault();
        return false;
    });
    $("#id_lanconfig_restart_conf_ok_btn").click(function(event)
    {
        if($("#id_lanconfig_interfaces_tables_form").valid() == true)
        {
            $("#id_div_loader").show();
        
            setTimeout(function(){ NetworkConfigurationUi.SaveNetworkConfiguration(true); }, 30);
        }

        event.preventDefault();
        return false;
    });
    $("#id_lanconfig_restart_conf_cancle_btn").click(function(event)
    {
        $("#id_lanconfig_save_restart_modal").hide();
        let result = true;
        event.preventDefault();
        return false;
    });
    $("#id_lanconfig_discard_config_button").click(function(event)
    {
        $("#id_lanconfig_discard_modal").show();
        event.preventDefault();
        return false;
    });
    $("#id_lanconfig_discard_ok_btn").click(function(event)
    {
        $("#id_lanconfig_discard_modal").hide();
        $("#id_div_loader").show();
        window.location.href = "NetworkConfiguration.html";
        event.preventDefault();
        location.reload();
        return false;
    });
    $("#id_lanconfig_discard_cancle_btn").click(function(event)
    {
        $("#id_lanconfig_discard_modal").hide();
        event.preventDefault();
        return false;
    });

    NetloadLimiterUi.Setup();

    if((typeof networkConfigurationSelectedTabId !== "undefined") && ($("#" + networkConfigurationSelectedTabId).length != 0)) {
        SwitchTab(networkConfigurationSelectedTabId);
    }
}); 

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("Network Configuration: Event subscriber on LanguageChanged - Selected language: "+ e.message);
    
    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_lanconfig_interfaces_tables_form");
        ReloadValidation("#id_wlan-configuration_tables_form");
        ReloadValidation("#id_extlan-configuration_tables_form");
        NetloadLimiterUi.OnLanguageChanged();
    }catch(e){}
}

NetworkConfigurationService = (function () {

    let Public = {

        HasSetPermissions: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "HasSetPermissions",
                AjaxInterface.AjaxRequestType.POST,
                "",     // Let the browser guess depending on the returned value. Either "" or a JSON object is returned.
                "",
                null);

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);

            let result = false;
            if (typeof response["HasSetPermissions"] !== "undefined") {
                result = response.HasSetPermissions;
            }
            return result;
        },

        GetConfiguration: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetNetworkConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetConfigurationPromise: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = Private.OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.getMethodsDpScriptName + "GetNetworkConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetInterfaceSettings: function(ifaceNumber)
        {
            let ifaceSettings = null;

            let query = "InterfaceNumber=" + encodeURIComponent(ifaceNumber);

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "GetInterfaceIpSettings?" + query,
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if (response == null || response.error == true || typeof response === "undefined") {
                console.error("Failed to request IP Settings for LAN interface " + ifaceNumber);
            }
            else {
                ifaceSettings = response.result.InterfaceIpSettings;
            }
            return ifaceSettings;
        },

        HasConfigurationChanged: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetNetworkConfigChanged",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            return (response != null && response.NetworkConfigChanged == true);
        },

        SetNetworkConfiguration: function (networkConfigObj)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "SetNetworkConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON, JSON.stringify(networkConfigObj), null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        RestartSystemPromise: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.setMethodsDpScriptName + "RestartSystem", // url
                AjaxInterface.AjaxRequestType.POST, // requestType: HTTP Request type
                AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                null, // data: The data to send
                null, // callbacks
                1000, // timeout
                null
            );
           return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
        },

        SetConnectionStatus: function (newState) {
            Private.ConnectionStatusOk = newState;
        }
    }

    let Private = {

        getMethodsDpScriptName: "module/NetConf/NetConfGetDp/",
        setMethodsDpScriptName: "module/NetConf/NetConfSetDp/",
        ConnectionStatusOk: true,

        OnConnectionError: function(xhr, status, error)
        {
            //### Handle if needed
            if (Private.ConnectionStatusOk) {
                Private.ConnectionStatusOk = false;
            }
        }


    }

    return Public;

})();

NetworkConfigurationUi = (function () {

    let Public = {

        EnableConfigButtons: function()
        {
            // Apply and Restart button
            $("#id_lanconfig_save_config_restart_button").removeClass("pxc-btn-dis");
            $("#id_lanconfig_save_config_restart_button").addClass("pxc-btn-pa");
            $("#id_lanconfig_save_config_restart_button").prop("disabled", false);
            $("#id_lanconfig_save_config_restart_button").show();

            // Discard button
            $("#id_lanconfig_discard_config_button").removeClass("pxc-btn-dis");
            $("#id_lanconfig_discard_config_button").addClass("pxc-btn");
            $("#id_lanconfig_discard_config_button").prop("disabled", false);
            $("#id_lanconfig_discard_config_button").show();
        },

        DisableConfigButtons: function()
        {
            // Save and Restart button
            $("#id_lanconfig_save_config_restart_button").removeClass("pxc-btn-pa");
            $("#id_lanconfig_save_config_restart_button").addClass("pxc-btn-dis");
            $("#id_lanconfig_save_config_restart_button").prop("disabled", true);
            $("#id_lanconfig_save_config_restart_button").hide();

            // Discard button
            $("#id_lanconfig_discard_config_button").removeClass("pxc-btn");
            $("#id_lanconfig_discard_config_button").addClass("pxc-btn-dis");
            $("#id_lanconfig_discard_config_button").prop("disabled", true);
            $("#id_lanconfig_discard_config_button").hide();
        },

        BuildConfigurationTables: function(hasSetPermissions)
        {
            let response = NetworkConfigurationService.GetConfiguration();
            let resultObject = null;
            if (response.error == true || typeof response === "undefined") {
                Private.OnStateDataErrorOccurred(response.errorText);
            }
            else {
                resultObject = response.result;
            }

            if (resultObject != null) {
                (DeviceWbmConfigsLoaded) ? (Private.activeEthernetInfoConfigs = DeviceWbmConfigs.EthernetInfoConfigs) : (Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs);
                let lanTablesHtml = Private.BuildLanTablesHtml(resultObject.LanInterfacesConfigs, "id_lanconfig_interfaces_div", hasSetPermissions);

                $("#id_lanconfig_interfaces_div").html(lanTablesHtml);

                Language.UpdateActivePageMessages();

                // Start Network Port Infos Update Timer
                Public.UpdateNetworkPortInfos();
            }
        },

        UpdateNetworkPortInfos: function ()
        {
            let result = true;

            NetworkConfigurationService.GetConfigurationPromise()
                .then(function (data) {
                    NetworkConfigurationService.SetConnectionStatus(true);
                    if (data.error) {
                        alert("Error: " + data.errorText);
                        result = false;
                    }

                    result = data.result;
                    $.each(result.LanInterfacesConfigs, function (index, ifaceConfig) {
                        // Update Ip Address
                        $("#id_lanconfig_lan_" + ifaceConfig.Number + "_ip_address_input").val(ifaceConfig.IpAddress);
                        // Update Subnet
                        $("#id_lanconfig_lan_" + ifaceConfig.Number + "_subnet_input").val(ifaceConfig.Subnet);
                        // Update Gateway
                        $("#id_lanconfig_lan_" + ifaceConfig.Number + "_gateway_input").val(ifaceConfig.Gateway);
                        // Update Mac (usually does not change, but it is possible to change it via linux cmd)
                        $("#id_lanconfig_lan_" + ifaceConfig.Number + "_mac_input").val(ifaceConfig.Mac);

                        // Update ports data
                        $.each(ifaceConfig.Ports, function (pindex, portdata) {
                            let portNumber = (pindex + 1);
                            $("#id_lanconfig_lan_" + ifaceConfig.Number + "_port_" + portNumber + "_baud_rate_input").val(Private.ParsePortBaudrate(portdata.Baudrate));
                            $("#id_lanconfig_lan_" + ifaceConfig.Number + "_port_" + portNumber + "_duplex_mode_input").val(Private.ParsePortDuplexMode(portdata.Duplex));
                            $("#id_lanconfig_lan_" + ifaceConfig.Number + "_port_" + portNumber + "_link_status_input").val(Private.ParsePortLinkStatus(portdata.Link));
                        });
                    });
                })
                .catch(function (errorObj) {
                    console.log(errorObj);
                });
            //var t00 = performance.now();
            //var t01 = performance.now();
            //console.log("UpdateNetworkPortInfos took " + (t01 - t00) + "ms");
            Public.UpdateNetworkConfigChanged();
            // Restart Network Port Infos Update Timer
            Private.networkPortInfosUpdateTimer = setTimeout(Public.UpdateNetworkPortInfos, Private.portInfosUpdateTimeout);
        },

        UpdateNetworkConfigChanged: function () {
            if ((Private.networkConfigChanged == false) && ((Private.networkChangedCheckCtr++ % 5) == 0)) {
                Private.networkConfigChanged = NetworkConfigurationService.HasConfigurationChanged();
                if (Private.networkConfigChanged) {
                    $("#id_lanconfig_config_changed_warning_div").css("display", "inline-block");
                }
            }
        },

        SaveNetworkConfiguration: function ()
        {
            $("#id_div_loader").show();
            let networkConfigObj = {};
            networkConfigObj.LanInterfacesConfigs = Private.GetNetworkInterfacesConfigs();
            let response = NetworkConfigurationService.SetNetworkConfiguration(networkConfigObj);
            if (response != null && response.error == true) {
                alert($("#id_lanconfig_config_save_error_span").text() + response.errorText);
                console.error("Failed to save IP Settings. Error: " + $("#id_lanconfig_config_save_error_span").text());
                $("#id_lanconfig_save_restart_modal").hide();
                $("#id_div_loader").hide();
            }
            else {
                // restart system
                NetworkConfigurationService.RestartSystemPromise().then(function (data) {
                    window.location.href = "Login.html";
                }).catch(function (errorObj) {
                    // Unknown execption
                    location.reload(true);
                });

            }
        },

        ShowHelpInfoMessage: function () {
            if(typeof Private.activeEthernetInfoConfigs["ShowRplcLanConfigHelp"] === "undefined" || !Private.activeEthernetInfoConfigs["ShowRplcLanConfigHelp"])
            {
                console.log("####### Private.activeEthernetInfoConfigs.ShowRplcLanConfigHelp {0}", Private.activeEthernetInfoConfigs.ShowRplcLanConfigHelp);
                return false;
            }
            let messageHtml = '<div class="c_lanconfig_help_message_box" style="margin: 3px 0;">'
                + '<div class="pxc-help-general-msg-wrp"><div class="pxc-help-msg">'
                + '<div class="pxc-help"><div>!</div></div>'
                + '<span class="pxc-msg-txt c_help_message_line1">Attention: Automatic setting of physical IP addresses!<br></span>'
                + '<span class="pxc-msg-txt c_help_message_line2">Example:<br></span>'
                + '<span class="pxc-msg-txt c_help_message_line3">- System IP address - 192.168.1.x<br></span>'
                + '<span class="pxc-msg-txt c_help_message_line4">- Physical IP address of FIRST controller - 192.168.1.x+1<br></span>'
                + '<span class="pxc-msg-txt c_help_message_line5">- Physical IP address of SECOND controller - 192.168.1.x+2</span>'
                + '</div></div><br></div>';
                
            let infoMessage = $(messageHtml).hide();
            $("#" + Private.rplcMessageInfoContainerId).html(infoMessage);
            //$("#" + Private.rplcMessageInfoContainerId).find("div.c_lanconfig_help_message_box").fadeIn("slow");
            $("#" + Private.rplcMessageInfoContainerId).find("div.c_lanconfig_help_message_box").show();

            Language.UpdateActivePageMessages();
            return true;
        },
        
        ParseDnsServersString: function(dnsServersStr)
        {
            let dnsServers = [];
            if (typeof dnsServersStr === "string") {
                let stringEntries = dnsServersStr.split(" ");
                $.each(stringEntries, function (idx, stringEntry) {
                    if (stringEntry !== "") {
                        dnsServers.push(stringEntry);
                    }
                });
                if (dnsServers.length == 0) {
                    dnsServers.push("");
                }
                if (dnsServers.length == 1) {
                    dnsServers.push("");
                }
                if (dnsServers.length == 2) {
                    dnsServers.push("");
                }
            }
            else {
                console.error("Dns name server variable must be in string format. Current type is " + (typeof dnsServersStr));
            }
            return dnsServers;
        },

        StopPortInfosUpdateTimer: function ()
        {
            window.clearTimeout(Private.networkPortInfosUpdateTimer);
            window.clearInterval(Private.networkPortInfosUpdateTimer);
        }
    }

    let Private = {

        portInfosUpdateTimeout: 1000,
        networkChangedCheckCtr: 0,
        networkConfigChanged: false,
        networkPortInfosUpdateTimer: undefined,
        activeEthernetInfoConfigs: undefined,
        rplcMessageInfoContainerId: "id_lanconfig_rplc_system_help_message_div",

        BuildLanTablesHtml: function (lanInterfacesConfigs, divId, hasSetPermissions)
        {
            let lanTablesHtml = "";
            let tmpPortCount = 0;
            let internalLanCount = 0;
            let switchInterfacePCounter = 0;

            lanTablesHtml += '<div class="cf pxc-cnt pxc-mod-main-table-alt-rows">';
            $.each(lanInterfacesConfigs, function (index, ifaceConfig) {
                let internLanInterface = true;
                let interfaceSettings = {};

                if(typeof Private.activeEthernetInfoConfigs["HideInterfaces"] != "undefined"
                   && Private.activeEthernetInfoConfigs["HideInterfaces"].includes(parseInt(ifaceConfig.Number)))
                {
                    console.log("Net Config: Hidden interface " + ifaceConfig.Number);
                    return false;
                }

                if (hasSetPermissions) {
                    interfaceSettings = NetworkConfigurationService.GetInterfaceSettings(ifaceConfig.Number);
                }

                if (hasSetPermissions) {
                    lanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_lanconfig_lan_' + ifaceConfig.Number + '_configs_table" ifacenumber ="' + ifaceConfig.Number + '" style="width:100%" style="float: left">';
                    lanTablesHtml += '<colgroup><col style="width: 30%"></col><col style="width: 35%"></col>';
                    lanTablesHtml += '<col style="width: 35%"></col>';
                }
                else {
                    lanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_lanconfig_lan_' + ifaceConfig.Number + '_configs_table" ifacenumber ="' + ifaceConfig.Number + '" style="width:65%" style="float: left">';
                    lanTablesHtml += '<colgroup><col style="width: 40%"></col><col style="width: 60%"></col>';
                }
                lanTablesHtml += '</colgroup>'
                if ((ifaceConfig.Number > Private.activeEthernetInfoConfigs.LanInterfacesCount
                    && Private.activeEthernetInfoConfigs.ExtLanInterfaces.Supported == true
                    && tmpPortCount >= Private.activeEthernetInfoConfigs.LanPortsCount
                    && typeof Private.activeEthernetInfoConfigs.DefaultConfigs != undefined)
                    || Private.activeEthernetInfoConfigs.DefaultConfigs == false) {
                    internLanInterface = false;
                }
                else {
                    internalLanCount = ifaceConfig.Number;
                }
                let switchModeTxtClass = "";
                let switchModeTxtSep  = "-";
                let isSwitchInterface = false;

                // Check if internal switched interface
                if (Private.activeEthernetInfoConfigs.SwitchedLanInterface.Supported == true
                    && parseInt(ifaceConfig.PortCount) > 1 && ifaceConfig.Ports.length > 1
                    && Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber == ifaceConfig.Number
                    && (Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber == ifaceConfig.Number
                        || Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber + 1 == ifaceConfig.Number)) {
                    switchModeTxtClass = "c_lanconfig_iface_switched_mode";
                    isSwitchInterface = true;
                    switchInterfacePCounter++;

                }// Check if lan interface is in 2 LAN Interfaces Mode 
                else if (internLanInterface == true
                    && Private.activeEthernetInfoConfigs.SwitchedLanInterface.Supported == true
                    && (tmpPortCount + parseInt(ifaceConfig.PortCount)) == ifaceConfig.Number
                    && (Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber == ifaceConfig.Number
                        || Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber + 1 == ifaceConfig.Number)) {
                    switchModeTxtClass = "c_lanconfig_iface_separated_mode";
                    isSwitchInterface = true;
                    switchInterfacePCounter++;
                }// Check if external Interface has switched ports
                else if (internLanInterface == false && parseInt(ifaceConfig.PortCount) > 1) {
                    switchModeTxtClass = "c_lanconfig_iface_switched_mode";
                }
                else
                {
                    switchModeTxtSep = "";
                }
                let ifacePrefix = (internLanInterface == true) ? (Private.activeEthernetInfoConfigs.InterfacePrefix) : (Private.activeEthernetInfoConfigs.ExtLanInterfaces.LanPrefix);
                let ifaceDisplayIndex = (ifaceConfig.Number - ((!internLanInterface) ? (internalLanCount) : (0)));
                // Table Name
                if (isSwitchInterface == true && Private.activeEthernetInfoConfigs.SwitchedLanInterface.EnableInterfaceLowerCounter == true) {
                    ifaceDisplayIndex = Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber;
                    lanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">'
                                  +  '<span>TCP/IP (' + ifacePrefix + ' ' + ifaceDisplayIndex + '.' + switchInterfacePCounter + ') ' + switchModeTxtSep + ' </span>'
                                  +     '<span class="' + switchModeTxtClass + '"></span></th>';
                }
                else {
                    lanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">'
                                  +    '<span>TCP/IP (' + ifacePrefix + ' ' + ifaceDisplayIndex + ') ' + switchModeTxtSep +  ' </span><span class="' + switchModeTxtClass + '"</span></th>';                }
                lanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">Status</th>';
                if (hasSetPermissions) {
                    lanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1" class="c_glb_th_configuration"></th>';
                }
                // IP Address
                lanTablesHtml += '<tr><td>';
                lanTablesHtml += '<span class="c_lanconfig_iface_ipaddress" style="display: inline-block; "> IP Address </span>';
                lanTablesHtml += '</td><td>';
                lanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_ip_address_input" name="lanconfig_lan_' + ifaceConfig.Number + '_ip_address_input"  value="' + ifaceConfig.IpAddress + '" disabled>';
                lanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    lanTablesHtml += '<td><input type="text" class="ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_ip_address_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_ip_address_config_input" value="' + interfaceSettings.IpAddress + '"></td>';
                }
                lanTablesHtml += '</tr>';
                // Subnet Mask
                lanTablesHtml += '<tr><td>';
                lanTablesHtml += '<span class="c_lanconfig_iface_subnet_mask" style="display: inline-block;">Subnet Mask</span>';
                lanTablesHtml += '</td><td>';
                lanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_subnet_input" name="lanconfig_lan_' + ifaceConfig.Number + '_subnet_input" value="' + ifaceConfig.Subnet + '"disabled>';
                lanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    lanTablesHtml += '<td><input type="text" class="subnet" id="id_lanconfig_lan_' + ifaceConfig.Number + '_subnet_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_subnet_config_input" value="' + interfaceSettings.Subnet + '"></td>';
                }
                lanTablesHtml += '</tr>';
                // Gateway
                lanTablesHtml += '<tr><td>';
                lanTablesHtml += '<span class="c_lanconfig_iface_gateway" style="display: inline-block;">Default Gateway</span>';
                lanTablesHtml += '</td><td>';
                lanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_gateway_input" name="lanconfig_lan_' + ifaceConfig.Number + '_gateway_input" value="' + ifaceConfig.Gateway + '"disabled>';
                lanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    lanTablesHtml += '<td><input type="text" class="ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_gateway_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_gateway_config_input" value="' + interfaceSettings.Gateway + '"></td>';
                }
                lanTablesHtml += '</tr>';
                // DNS Server Adresses
                let dnsNames = [];
                dnsNames = Public.ParseDnsServersString(ifaceConfig.DnsServers);

                let settingsDnsNames = [];
                if (hasSetPermissions) {
                    settingsDnsNames = Public.ParseDnsServersString(ifaceConfig.DnsServers);
                }

                lanTablesHtml += '<tr><td rowspan="4">';
                lanTablesHtml += '<span class="c_lanconfig_iface_dns_server" style="display: inline-block;">DNS Server Addresses</span>';
                lanTablesHtml += '</td></tr>';
                lanTablesHtml += '<tr><td>';
                lanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_1_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_1_input" value="' + dnsNames[0] + '"disabled>';
                lanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    lanTablesHtml += '<td><input type="text" class="opt-ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_1_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_1_config_input" value="' + settingsDnsNames[0] + '"></td>';
                }
                lanTablesHtml += '</tr>';
                lanTablesHtml += '<tr><td>'
                lanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_2_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_2_input" value="' + dnsNames[1] + '"disabled>';
                lanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    lanTablesHtml += '<td><input type="text" class="opt-ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_2_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_2_config_input" value="' + settingsDnsNames[1] + '"></td>';
                }
                lanTablesHtml += '</tr>';
                lanTablesHtml += '<tr><td>';
                lanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_3_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_3_input" value="' + dnsNames[2] + '"disabled>';
                lanTablesHtml += '</td>'
                if (hasSetPermissions) {
                    lanTablesHtml += '<td><input type="text" class="opt-ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_3_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_3_config_input" value="' + settingsDnsNames[2] + '"></td>';
                }
                lanTablesHtml += '</tr>';
                // MAC Address
                lanTablesHtml += '<tr><td>'
                lanTablesHtml += '<span class="c_lanconfig_iface_mac_address" style="display: inline-block; width: 300px;">MAC Address</span>';
                lanTablesHtml += '</td><td>';
                lanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_mac_input" name="lanconfig_lan_' + ifaceConfig.Number + '_mac_input" value="' + ifaceConfig.Mac + '"disabled>';
                lanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    lanTablesHtml += '<td></td>';
                }
                lanTablesHtml += '</tr>';
                // Lan Interface Ports
                $.each(ifaceConfig.Ports, function (pindex, portdata) {
                    let portNumber = pindex + 1;
                    let portCounter = pindex + 1; 
                    if(internLanInterface == true)
                    {
                        if (Private.activeEthernetInfoConfigs.PortBackwardCounter == true && Private.activeEthernetInfoConfigs.LanCountEqualsPortsCount == false) {
                            portCounter = Private.activeEthernetInfoConfigs.PortCounterOffset - index;
                        }
                        else if (Private.activeEthernetInfoConfigs.LanCountEqualsPortsCount == true) {
                            portCounter = pindex + 1 + Private.activeEthernetInfoConfigs.PortCounterOffset + index;
                        }
                        else {
                            portCounter = pindex + 1 + Private.activeEthernetInfoConfigs.PortCounterOffset;
                        }
                    }
                    
                    tmpPortCount++;
                    let portPrefix = (internLanInterface == true) ? (Private.activeEthernetInfoConfigs.PortPrefix) : (Private.activeEthernetInfoConfigs.ExtLanInterfaces.PortPrefix);
                    let portPostfix = (internLanInterface == true) ? (Private.activeEthernetInfoConfigs.PortPostfix) : ("");

                    let portColSpan = (hasSetPermissions) ? (3) : (2);
                    if (isSwitchInterface == true) {
                        let nPortIndex = (ifaceConfig.Number == (Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber + 1)) ? (parseInt(portCounter) + 1) : (portCounter - ifaceConfig.Number + 1);
                        if (Private.activeEthernetInfoConfigs.SwitchedLanInterface.EnablePortLowerCounter == true) {
                            lanTablesHtml += '<th colspan="' + portColSpan + '">Port ' + portPrefix + Private.activeEthernetInfoConfigs.SwitchedLanInterface.InterfaceNumber + '.' + nPortIndex + portPostfix + '</th>';
                        }
                        else {
                            lanTablesHtml += '<th colspan="' + portColSpan + '">Port ' + portPrefix + nPortIndex + portPostfix + '</th>';
                        }
                    }
                    else if (Private.activeEthernetInfoConfigs.LanCountEqualsPortsCount == true && internLanInterface == true && ifaceDisplayIndex == portCounter) {
                        lanTablesHtml += '<th colspan="' + portColSpan + '">Port ' + portPrefix + ifaceDisplayIndex + portPostfix + '</th>';
                    }
                    else {
                        lanTablesHtml += '<th colspan="' + portColSpan + '">Port ' + portPrefix + portCounter + portPostfix + '</th>';
                    }

                    // Data Rate
                    lanTablesHtml += '<tr><td>'
                    lanTablesHtml += '<span class="c_lanconfig_port_baud_rate" style="display: inline-block; width: 300px;">Data Rate</span>';
                    lanTablesHtml += '</td><td>';
                    lanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_port_' + portNumber + '_baud_rate_input" value="' + Private.ParsePortBaudrate(portdata.Baudrate) + '"disabled>';
                    lanTablesHtml += '</td>';
                    if (hasSetPermissions) {
                        lanTablesHtml += '<td></td>';
                    }
                    lanTablesHtml += '</tr>';
                    // Duplex Mode
                    lanTablesHtml += '<tr><td>';
                    lanTablesHtml += '<span class="c_lanconfig_port_duplex_mode" style="display: inline-block; width: 300px;">Duplex Mode</span>';
                    lanTablesHtml += '</td><td>';
                    lanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_port_' + portNumber + '_duplex_mode_input" value="' + Private.ParsePortDuplexMode(portdata.Duplex) + '"disabled>';
                    lanTablesHtml += '</td>';
                    if (hasSetPermissions) {
                        lanTablesHtml += '<td></td>';
                    }
                    lanTablesHtml += '</tr>';
                    // Link Status
                    lanTablesHtml += '<tr><td>';
                    lanTablesHtml += '<span class="c_lanconfig_port_link_status" style="display: inline-block; width: 300px;">Link Status</span>';
                    lanTablesHtml += '</td><td>';
                    lanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_port_' + portNumber + '_link_status_input" value="' + Private.ParsePortLinkStatus(portdata.Link) + '"disabled>';
                    lanTablesHtml += '</td>';
                    if (hasSetPermissions) {
                        lanTablesHtml += '<td></td>';
                    }
                    lanTablesHtml += '</tr>';
                });

                // end lan interface table
                lanTablesHtml += '</table>';
                if (ifaceConfig.Number != Object.keys(lanInterfacesConfigs).length) {
                    lanTablesHtml += '<br>';
                }
            });
            lanTablesHtml += '</div>';

            return lanTablesHtml;
        },

        GetNetworkInterfacesConfigs: function ()
        {
            let lanInterfacesConfigs = [];
            $('#id_lanconfig_interfaces_div').find('table').each(function (idx, configtable) {

                let lanInterfaceConfig = {};
                lanInterfaceConfig.Number = $(configtable).attr("ifacenumber");
                lanInterfaceConfig.IpAddress = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_ip_address_config_input").val();
                lanInterfaceConfig.Subnet = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_subnet_config_input").val();
                lanInterfaceConfig.Gateway = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_gateway_config_input").val();

                lanInterfaceConfig.DnsServers = "";
                let dnsServer1 = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_dns_1_config_input").val();
                if (dnsServer1 != "") {
                    lanInterfaceConfig.DnsServers += dnsServer1;
                }
                let dnsServer2 = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_dns_2_config_input").val();
                if (dnsServer2 != "") {
                    lanInterfaceConfig.DnsServers += ((lanInterfaceConfig.DnsServers != "") ? (" " + dnsServer2) : (dnsServer2));
                }

                let dnsServer3 = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_dns_3_config_input").val();
                if (dnsServer3 != "") {
                    lanInterfaceConfig.DnsServers += ((lanInterfaceConfig.DnsServers != "") ? (" " + dnsServer3) : (dnsServer3));
                }

                lanInterfacesConfigs.push(Object.assign({}, lanInterfaceConfig));
            });
            return lanInterfacesConfigs;
        },

        ParsePortLinkStatus: function(linkStatus)
        {
            return ((linkStatus == "1") ? "LinkUp" : "LinkDown");
        },

        ParsePortDuplexMode: function(duplexMode)
        {
            return ((duplexMode == "0") ? ("") : ((duplexMode == "1") ? $("#id_lanconfig_port_half_duplex_val").text() : $("#id_lanconfig_port_full_duplex_val").text()));
        },

        ParsePortBaudrate: function(baudrate)
        {
            return ((baudrate == "0") ? ("") : ((baudrate == "1") ? "10 Mbit/s" : ((baudrate == "2") ? "100 Mbit/s" : "1000 Mbit/s")));
        },

        OnStateDataErrorOccurred: function(error)
        {
            //### implement if needed (need to be checked)
            alert(error);
        }
    }

    return Public;

})();

EdgeNetworkConfigurationService = (function () {

    let Public = {
            
        GetConfiguration: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetWIFIConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                "",     // Let the browser guess depending on the returned value. Either "" or a JSON object is returned.
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetDefaultRountConfiguration: function ()
        {
             let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetRoutingConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                "",     // Let the browser guess depending on the returned value. Either "" or a JSON object is returned.
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetWLANConfiguration: function (networkConfigObj)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "SetWlanConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON, JSON.stringify(networkConfigObj), null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        
        SetDefaultGWConfiguration: function (networkConfigObj)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "SetDefaultGWConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON, JSON.stringify(networkConfigObj), null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

    }

    let Private = {

        getMethodsDpScriptName: "module/NetConf/EdgeNetConfigGetDp/",
        setMethodsDpScriptName: "module/NetConf/EdgeNetConfigSetDp/",
        ConnectionStatusOk: true,

        OnConnectionError: function(xhr, status, error)
        {
            //### Handle if needed
            if (Private.ConnectionStatusOk) {
                Private.ConnectionStatusOk = false;
            }
        }


    }

    return Public;

})();

WLANConfigurationUi = (function () {

    let Public = {

        EnableConfigButtons: function()
        {
            // Apply and Restart button
            $("#id_wlanconfig_save_config_restart_button").removeClass("pxc-btn-dis");
            $("#id_wlanconfig_save_config_restart_button").addClass("pxc-btn-pa");
            $("#id_wlanconfig_save_config_restart_button").prop("disabled", false);
            $("#id_wlanconfig_save_config_restart_button").show();

            // Discard button
            $("#id_wlanconfig_discard_config_button").removeClass("pxc-btn-dis");
            $("#id_wlanconfig_discard_config_button").addClass("pxc-btn");
            $("#id_wlanconfig_discard_config_button").prop("disabled", false);
            $("#id_wlanconfig_discard_config_button").show();
        },

        DisableConfigButtons: function()
        {
            // Save and Restart button
            $("#id_wlanconfig_save_config_restart_button").removeClass("pxc-btn-pa");
            $("#id_wlanconfig_save_config_restart_button").addClass("pxc-btn-dis");
            $("#id_wlanconfig_save_config_restart_button").prop("disabled", true);
            $("#id_wlanconfig_save_config_restart_button").hide();

            // Discard button
            $("#id_wlanconfig_discard_config_button").removeClass("pxc-btn");
            $("#id_wlanconfig_discard_config_button").addClass("pxc-btn-dis");
            $("#id_wlanconfig_discard_config_button").prop("disabled", true);
            $("#id_wlanconfig_discard_config_button").hide();
        },        
        
        BuildConfigurationTables: function(hasSetPermissions)
        {           
            let response = NetworkConfigurationService.GetConfiguration();
            let egderesponse = EdgeNetworkConfigurationService.GetConfiguration();
            
            let resultObject = null;
            let edgeresultObject = null;
            
            if (response.error == true || typeof response === "undefined") {
                Private.OnStateDataErrorOccurred(response.errorText);
            }
            else if (egderesponse.error == true || typeof egderesponse === "undefined") {
                Private.OnStateDataErrorOccurred(egderesponse.errorText);
            }
            else {
                resultObject = response.result;
                edgeresultObject = egderesponse.result;
            }
            
            if (resultObject != null && edgeresultObject != null) {
                
                Private.EnableWlanTab();
                Private.ConfigureButtons();
                
                if(!Private.activeEthernetInfoConfigs.hasOwnProperty('WLanInterfaces'))
                {
                    Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs;
                } 
                
                (DeviceWbmConfigsLoaded) ? (Private.activeEthernetInfoConfigs = DeviceWbmConfigs.EthernetInfoConfigs) : (Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs);
                let wlanTablesHtml = "";
                
                wlanTablesHtml = Private.BuildWLanTablesHtml(resultObject.LanInterfacesConfigs, edgeresultObject, hasSetPermissions);
                wlanTablesHtml += Private.BuildWLanLoginTable(edgeresultObject, hasSetPermissions);

                $("#id_wlan-configuration_div").html(wlanTablesHtml);
                Private.SetUserNameAndPassword(edgeresultObject, hasSetPermissions);

                Language.UpdateActivePageMessages();
            }
        },
        
        SaveNetworkConfiguration: function ()
        {
            $("#id_div_loader").show();
            let networkConfigObj = {};
            let wlanConfigObj = {};
            networkConfigObj.LanInterfacesConfigs = Private.GetWLANInterfacesConfigs();
            wlanConfigObj = Private.GetWLANExtraConfigs();
            let response = NetworkConfigurationService.SetNetworkConfiguration(networkConfigObj);
            let wlanresponse = EdgeNetworkConfigurationService.SetWLANConfiguration(wlanConfigObj);
            if (response != null && response.error == true && wlanresponse != null && wlanresponse.error == true) {
                console.log(response)
                alert($("#id_lanconfig_config_save_error_span").text() + response.errorText);
                console.error("Failed to save IP Settings. Error: " + $("#id_lanconfig_config_save_error_span").text());
                $("#id_lanconfig_save_restart_modal").hide();
                $("#id_div_loader").hide();
            }
            else {
                //restart system
                NetworkConfigurationService.RestartSystemPromise().then(function (data) {
                    window.location.href = "Login.html";
                }).catch(function (errorObj) {
                    //Unknown execption
                    location.reload(true);
                });

            }
        },
    }

    let Private = {
        activeEthernetInfoConfigs: undefined,
        
        EnableWlanTab: function ()
        {
            Validation("#id_wlan-configuration_tables_form");
            
            (DeviceWbmConfigsLoaded) ? (Private.activeEthernetInfoConfigs = DeviceWbmConfigs.EthernetInfoConfigs) : (Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs);

            if(!Private.activeEthernetInfoConfigs.hasOwnProperty('WLanInterfaces'))
            {
                Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs;
            }      
            
            if(Private.activeEthernetInfoConfigs.WLanInterfaces.Supported == true) {
        
                $("#pxc-tab-wlan-configuration-button").removeAttr("style");
    
            }          
        },
        
        BuildWLanTablesHtml: function (wlanInterfacesConfigs, wlanSettingsConfigs, hasSetPermissions)
        {
            let wlanTablesHtml = "";
            let wlanNum = 0;
            
            if( wlanSettingsConfigs.Disabled == false)
            {
                wlanTablesHtml += '<div class="cf pxc-cnt pxc-mod-main-table-alt-rows">';
            }
            else
            {
                wlanTablesHtml += '<div class="cf pxc-cnt pxc-mod-main-table-alt-rows" style="display: none;">';
            }

            let isWLANDhcpEnabled = Private.IsWLANDHCPEnabled(wlanSettingsConfigs.IpAssignMode);
            
            $.each(wlanInterfacesConfigs, function (index, ifaceConfig) {
                if(wlanSettingsConfigs.WlanNumber == ifaceConfig.Number)
                {
                    wlanNum++;
                    console.log("WLAN Net Config: WLAN interface " + ifaceConfig.Number);
                    if (hasSetPermissions) {
                        interfaceSettings = NetworkConfigurationService.GetInterfaceSettings(ifaceConfig.Number);
                    }

                    if (hasSetPermissions) {
                        wlanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_lanconfig_lan_' + ifaceConfig.Number + '_configs_table" ifacenumber ="' + ifaceConfig.Number + '" style="width:100%" style="float: left">';
                        wlanTablesHtml += '<colgroup><col style="width: 30%"></col><col style="width: 35%"></col>';
                        wlanTablesHtml += '<col style="width: 35%"></col>';
                    }
                    else {
                        wlanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_lanconfig_lan_' + ifaceConfig.Number + '_configs_table" ifacenumber ="' + ifaceConfig.Number + '" style="width:65%" style="float: left">';
                        wlanTablesHtml += '<colgroup><col style="width: 40%"></col><col style="width: 60%"></col>';
                    }
                    wlanTablesHtml += '</colgroup>'
                    //Table Name
                    wlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">'
                                      +    '<span>WLAN ' + wlanNum + '</span>';
                    wlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">Status</th>';
                    if (hasSetPermissions) {
                        wlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1" class="c_glb_th_configuration"></th>';
                    }
                    // IP Address
                    wlanTablesHtml += '<tr><td>';
                    wlanTablesHtml += '<span class="c_lanconfig_iface_ipaddress" style="display: inline-block; "> IP Address </span>';
                    wlanTablesHtml += '</td><td>';
                    wlanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_ip_address_input" name="lanconfig_lan_' + ifaceConfig.Number + '_ip_address_input"  value="' + ifaceConfig.IpAddress + '" disabled>';
                    wlanTablesHtml += '</td>';
                    if (hasSetPermissions && !isWLANDhcpEnabled) {
                        wlanTablesHtml += '<td><input type="text" class="ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_ip_address_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_ip_address_config_input" value="' + interfaceSettings.IpAddress + '"></td>';
                    }
                    if(isWLANDhcpEnabled && hasSetPermissions) {
                        wlanTablesHtml += '<td rowspan="7">';
                        wlanTablesHtml += '<span class="c_lanconfig_wlan_dhcp_message" style="display: inline-block; ">Please disable DHCP to configure a static IP address.</span>';
                        wlanTablesHtml += '</td>';
                    }
                    wlanTablesHtml += '</tr>';
                    // Subnet Mask
                    wlanTablesHtml += '<tr><td>';
                    wlanTablesHtml += '<span class="c_lanconfig_iface_subnet_mask" style="display: inline-block;">Subnet Mask</span>';
                    wlanTablesHtml += '</td><td>';
                    wlanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_subnet_input" name="lanconfig_lan_' + ifaceConfig.Number + '_subnet_input" value="' + ifaceConfig.Subnet + '"disabled>';
                    wlanTablesHtml += '</td>';
                    if (hasSetPermissions && !isWLANDhcpEnabled) {
                        wlanTablesHtml += '<td><input type="text" class="subnet" id="id_lanconfig_lan_' + ifaceConfig.Number + '_subnet_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_subnet_config_input" value="' + interfaceSettings.Subnet + '"></td>';
                    }
                    wlanTablesHtml += '</tr>';
                    // Gateway
                    wlanTablesHtml += '<tr><td>';
                    wlanTablesHtml += '<span class="c_lanconfig_iface_gateway" style="display: inline-block;">Default Gateway</span>';
                    wlanTablesHtml += '</td><td>';
                    wlanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_lan_' + ifaceConfig.Number + '_gateway_input" name="lanconfig_lan_' + ifaceConfig.Number + '_gateway_input" value="' + ifaceConfig.Gateway + '"disabled>';
                    wlanTablesHtml += '</td>';
                    if (hasSetPermissions && !isWLANDhcpEnabled) {
                        wlanTablesHtml += '<td><input type="text" class="ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_gateway_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_gateway_config_input" value="' + interfaceSettings.Gateway + '"></td>';
                    }
                    wlanTablesHtml += '</tr>';
                    // DNS Server Adresses
                    let dnsNames = [];
                    dnsNames = NetworkConfigurationUi.ParseDnsServersString(ifaceConfig.DnsServers);

                    let settingsDnsNames = [];
                    if (hasSetPermissions && !isWLANDhcpEnabled) {
                        settingsDnsNames = NetworkConfigurationUi.ParseDnsServersString(ifaceConfig.DnsServers);
                    }

                    wlanTablesHtml += '<tr><td rowspan="4">';
                    wlanTablesHtml += '<span class="c_lanconfig_iface_dns_server" style="display: inline-block;">DNS Server Addresses</span>';
                    wlanTablesHtml += '</td></tr>';
                    wlanTablesHtml += '<tr><td>';
                    wlanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_1_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_1_input" value="' + dnsNames[0] + '"disabled>';
                    wlanTablesHtml += '</td>';
                    if (hasSetPermissions && !isWLANDhcpEnabled) {
                        wlanTablesHtml += '<td><input type="text" class="opt-ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_1_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_1_config_input" value="' + settingsDnsNames[0] + '"></td>';
                    }
                    wlanTablesHtml += '</tr>';
                    wlanTablesHtml += '<tr><td>'
                    wlanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_2_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_2_input" value="' + dnsNames[1] + '"disabled>';
                    wlanTablesHtml += '</td>';
                    if (hasSetPermissions && !isWLANDhcpEnabled) {
                        wlanTablesHtml += '<td><input type="text" class="opt-ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_2_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_2_config_input" value="' + settingsDnsNames[1] + '"></td>';
                    }
                    wlanTablesHtml += '</tr>';
                    wlanTablesHtml += '<tr><td>';
                    wlanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_3_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_3_input" value="' + dnsNames[2] + '"disabled>';
                    wlanTablesHtml += '</td>'
                    if (hasSetPermissions && !isWLANDhcpEnabled) {
                        wlanTablesHtml += '<td><input type="text" class="opt-ipv4" id="id_lanconfig_lan_' + ifaceConfig.Number + '_dns_3_config_input" name="lanconfig_lan_' + ifaceConfig.Number + '_dns_3_config_input" value="' + settingsDnsNames[2] + '"></td>';
                    }
                    wlanTablesHtml += '</tr>';
                    // Enable & Disable WLAN DHCP Setting
                    wlanTablesHtml += '<tr><td>';
                    wlanTablesHtml += '<span class="c_lanconfig_iface_dhcp_wlan" style="display: inline-block;">Enable DHCP</span>';
                    wlanTablesHtml += '</td><td>';
                    wlanTablesHtml += '<input type="checkbox" id="id_lanconfig_lan_enable_wlan_dhcp_input" name="lanconfig_lan_enable_wlan_dhcp_input" ' + Private.ParseWLANDHCP(wlanSettingsConfigs.IpAssignMode) + ' disabled>';
                    wlanTablesHtml += '</td>'
                    if (hasSetPermissions) {
                        wlanTablesHtml += '<td><input type="checkbox" id="id_lanconfig_lan_enable_wlan_config_dhcp_input" name="lanconfig_lan_enable_wlan_config_dhcp_input" ' + Private.ParseWLANDHCP(wlanSettingsConfigs.IpAssignMode) + '></td>';
                    }
                    // MAC Address
                    wlanTablesHtml += '<tr><td>'
                    wlanTablesHtml += '<span class="c_lanconfig_iface_mac_address" style="display: inline-block; width: 300px;">MAC Address</span>';
                    wlanTablesHtml += '</td><td>';
                    wlanTablesHtml += '<input type="text" id="id_lanconfig_lan_' + ifaceConfig.Number + '_mac_input" name="lanconfig_lan_' + ifaceConfig.Number + '_mac_input" value="' + ifaceConfig.Mac + '"disabled>';
                    wlanTablesHtml += '</td>';
                    if (hasSetPermissions) {
                        wlanTablesHtml += '<td></td>';
                    }
                    wlanTablesHtml += '</tr>';                       
                    // end lan interface table
                    wlanTablesHtml += '</table>';
                    if (ifaceConfig.Number != Object.keys(wlanInterfacesConfigs).length) {
                        wlanTablesHtml += '<br>';
                    }
                }
            });
            wlanTablesHtml += '</div>';

            return wlanTablesHtml;
        },
        
        BuildWLanLoginTable: function (wlanInterfacesConfigs, hasSetPermissions)
        {
            let wlanTablesHtml = "";
            let wlanNum = 0;
            
            wlanTablesHtml += '<div class="cf pxc-cnt pxc-mod-main-table-alt-rows">';

            if(typeof Private.activeEthernetInfoConfigs["WLanInterfaces"] != "undefined"
               && Private.activeEthernetInfoConfigs.WLanInterfaces.Supported)
            {     
                if (hasSetPermissions) {
                    wlanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_lanconfig_wlan_login_configs_table" style="width:100%" style="float: left">';
                    wlanTablesHtml += '<colgroup><col style="width: 30%"></col><col style="width: 35%"></col>';
                    wlanTablesHtml += '<col style="width: 35%"></col>';
                }
                else {
                    wlanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_lanconfig_wlan_login_configs_table" style="width:65%" style="float: left">';
                    wlanTablesHtml += '<colgroup><col style="width: 40%"></col><col style="width: 60%"></col>';
                }
                wlanTablesHtml += '</colgroup>'
                // Table Name
                wlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">'
                                  +    '<span>WLAN Network Settings</span>';
                wlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">Status</th>';
                if (hasSetPermissions) {
                    wlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1" class="c_glb_th_configuration"></th>';
                }
                
                // WLAN SSID
                if( wlanInterfacesConfigs.Disabled == false)
                {
                    wlanTablesHtml += '<tr><td>';
                }
                else
                {
                    wlanTablesHtml += '<tr style="display: none;"><td>';
                }
                
                wlanTablesHtml += '<span class="c_lanconfig_iface_wlan_name" style="display: inline-block; "> Network Name </span>';
                wlanTablesHtml += '</td><td>';
                wlanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_wlan_network_name_input" name="lanconfig_wlan_network_name_input"  value="" disabled>';
                wlanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    wlanTablesHtml += '<td><input type="text" class="wlan-ssid" id="id_lanconfig_wlan_network_name_config_input" name="lanconfig_wlan_network_name_config_input" value=""></td>';
                }
                wlanTablesHtml += '</tr>';
                // WLAN Password
                if( wlanInterfacesConfigs.Disabled == false)
                {
                    wlanTablesHtml += '<tr><td>';
                }
                else
                {
                    wlanTablesHtml += '<tr style="display: none;"><td>';
                }
                wlanTablesHtml += '<span class="c_lanconfig_iface_wlan_password" style="display: inline-block;">Network Password</span>';
                wlanTablesHtml += '</td><td>';
                wlanTablesHtml += '</td>';
                if (hasSetPermissions) {
                    wlanTablesHtml += '<td><input type="password" class="wlan-password" id="id_lanconfig_wlan_password_config_input" name="lanconfig_wlan_password_config_input" value=""></td>';
                }
                wlanTablesHtml += '</tr>';
                // Enable & Disable WLAN
                wlanTablesHtml += '<tr><td>';
                wlanTablesHtml += '<span class="c_lanconfig_iface_enable_wlan" style="display: inline-block;">Enable WLAN</span>';
                wlanTablesHtml += '</td><td>';
                wlanTablesHtml += '<input type="checkbox" id="id_lanconfig_lan_enable_wlan_input" name="lanconfig_lan_enable_wlan_input" ' + Private.ParseWLANDisabled(wlanInterfacesConfigs.Disabled) + ' disabled>';
                wlanTablesHtml += '</td>'
                if (hasSetPermissions) {
                    wlanTablesHtml += '<td><input type="checkbox" id="id_lanconfig_lan_enable_wlan_config_input" name="lanconfig_lan_enable_wlan_config_input" ' + Private.ParseWLANDisabled(wlanInterfacesConfigs.Disabled) + '></td>';
                }
                wlanTablesHtml += '</tr>';
                // WLAN Connected
                if( wlanInterfacesConfigs.Disabled == false)
                {
                    wlanTablesHtml += '<tr><td>';
                }
                else
                {
                    wlanTablesHtml += '<tr style="display: none;"><td>';
                }
                wlanTablesHtml += '<span class="c_lanconfig_port_wlan_link_status" style="display: inline-block; width: 300px;">WIFI Connection Status</span>';
                wlanTablesHtml += '</td><td>';
                wlanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_wlan_link_status_input" value="' + Private.ParsePortLinkStatus(wlanInterfacesConfigs.OperateState) + '"disabled>';
                wlanTablesHtml += '</td>';                  
                if (hasSetPermissions) {
                    wlanTablesHtml += '<td></td>';
                }
                wlanTablesHtml += '</tr>';
                // end lan interface table
                wlanTablesHtml += '</table>';
            }
            wlanTablesHtml += '</div>';
            
            return wlanTablesHtml;
        },
        
        GetWLANInterfacesConfigs: function ()
        {
            let lanInterfacesConfigs = [];
            $('#id_wlan-configuration_div').find('table').each(function (idx, configtable) {

                let lanInterfaceConfig = {};
                lanInterfaceConfig.Number = $(configtable).attr("ifacenumber");
                
                //WLAN ip settings table
                if ($(configtable).attr("id") == "id_lanconfig_lan_" + lanInterfaceConfig.Number + "_configs_table") {
                    lanInterfaceConfig.IpAddress = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_ip_address_config_input").val();
                    lanInterfaceConfig.Subnet = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_subnet_config_input").val();
                    //If Gateway is set to 0.0.0.0 before DHCP is enabled give it a default value
                    if(($("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_gateway_config_input").val() == "0.0.0.0") && (Private.IsWLANDHCPEnabled(Private.GetDHCPNum($("#id_lanconfig_lan_enable_wlan_config_dhcp_input").prop('checked')))))
                    {
                        lanInterfaceConfig.Gateway = "192.168.3.1";
                    }
                    else
                    {
                        lanInterfaceConfig.Gateway = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_gateway_config_input").val();
                    }

                    lanInterfaceConfig.DnsServers = "";
                    let dnsServer1 = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_dns_1_config_input").val();
                    if (dnsServer1 != "") {
                        lanInterfaceConfig.DnsServers += dnsServer1;
                    }
                    let dnsServer2 = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_dns_2_config_input").val();
                    if (dnsServer2 != "") {
                        lanInterfaceConfig.DnsServers += ((lanInterfaceConfig.DnsServers != "") ? (" " + dnsServer2) : (dnsServer2));
                    }

                    let dnsServer3 = $("#id_lanconfig_lan_" + lanInterfaceConfig.Number + "_dns_3_config_input").val();
                    if (dnsServer3 != "") {
                        lanInterfaceConfig.DnsServers += ((lanInterfaceConfig.DnsServers != "") ? (" " + dnsServer3) : (dnsServer3));
                    }

                    lanInterfacesConfigs.push(Object.assign({}, lanInterfaceConfig));
                }

            });
            return lanInterfacesConfigs;
        },
        
        SetUserNameAndPassword: function (wlanInterfacesConfigs, hasSetPermissions)
        {
            if(hasSetPermissions)
            {
                $("#id_lanconfig_wlan_network_name_input").val(wlanInterfacesConfigs.SSID);
                $("#id_lanconfig_wlan_network_name_config_input").val(wlanInterfacesConfigs.SSID);
                $("#id_lanconfig_wlan_password_config_input").val(wlanInterfacesConfigs.Password);
            }
        },

        GetWLANExtraConfigs: function ()
        {

            let wlanExtraConfig = {};            

            //WLAN Extra Settings
            wlanExtraConfig.SSID = $("#id_lanconfig_wlan_network_name_config_input").val();
            wlanExtraConfig.Password = $("#id_lanconfig_wlan_password_config_input").val();
            wlanExtraConfig.Disabled = !$("#id_lanconfig_lan_enable_wlan_config_input").prop('checked');
            wlanExtraConfig.IpAssignMode = Private.GetDHCPNum($("#id_lanconfig_lan_enable_wlan_config_dhcp_input").prop('checked'));
                                           
            return wlanExtraConfig;
        },        
        
        ConfigureButtons : function()
        {           
            $("#id_wlanconfig_discard_config_button").click(function(event)
            {
                $("#id_lanconfig_discard_modal").show();
                event.preventDefault();
                return false;
            });
            
            $("#id_wlanconfig_save_config_restart_button").click(function(event)
            {
                if($("#id_wlan-configuration_tables_form").valid() == true)
                {
                    $("#id_wlanconfig_save_restart_modal").show();
                }
                event.preventDefault();
                return false;
            });
            
            $("#id_wlanconfig_restart_conf_ok_btn").click(function(event)
            {
                if($("#id_wlan-configuration_tables_form").valid() == true)
                {
                    $("#id_div_loader").show();
                
                    setTimeout(function(){ WLANConfigurationUi.SaveNetworkConfiguration(true); }, 30);
                }

                event.preventDefault();
                return false;
            });
            
            $("#id_wlanconfig_restart_conf_cancle_btn").click(function(event)
            {
                $("#id_wlanconfig_save_restart_modal").hide();
                let result = true;
                event.preventDefault();
                return false;
            });
            
        },
        
        ParsePortLinkStatus: function(linkStatus)
        {
            return ((linkStatus == true) ? "Connected" : "Not Connected");
        },
        
        ParseWLANDisabled: function(disabled)
        {
            return ((disabled == false) ? "checked": "");
        },

        IsWLANDHCPEnabled: function(dhcp_setting)
        {
            //0 = static IP
            //2 = DHCP
            //Reference the RSC service documentation for Interfaces.Ethernet.{AdapterIndex}.IpAssign

            return (dhcp_setting == 2);
        },

        GetDHCPNum: function(dhcp_setting)
        {
            //0 = static IP
            //2 = DHCP

            if(dhcp_setting)
            {
                return 2;
            }
            else
            {
                return 0;
            }
        },

        ParseWLANDHCP: function(dhcp_setting)
        {
            return ((Private.IsWLANDHCPEnabled(dhcp_setting)) ? "checked": "");
        },
        
        OnStateDataErrorOccurred: function(error)
        {
            //### implement if needed (need to be checked)
            alert(error);
        }
    }

    return Public;

} ) ();

EXTNetworkConfigurationUi = (function () {

    let Public = {

        EnableConfigButtons: function()
        {
            // Apply and Restart button
            $("#id_extlanconfig_save_config_restart_button").removeClass("pxc-btn-dis");
            $("#id_extlanconfig_save_config_restart_button").addClass("pxc-btn-pa");
            $("#id_extlanconfig_save_config_restart_button").prop("disabled", false);
            $("#id_extlanconfig_save_config_restart_button").show();

            // Discard button
            $("#id_extlanconfig_discard_config_button").removeClass("pxc-btn-dis");
            $("#id_extlanconfig_discard_config_button").addClass("pxc-btn");
            $("#id_extlanconfig_discard_config_button").prop("disabled", false);
            $("#id_extlanconfig_discard_config_button").show();
        },

        DisableConfigButtons: function()
        {
            // Save and Restart button
            $("#id_extlanconfig_save_config_restart_button").removeClass("pxc-btn-pa");
            $("#id_extlanconfig_save_config_restart_button").addClass("pxc-btn-dis");
            $("#id_extlanconfig_save_config_restart_button").prop("disabled", true);
            $("#id_extlanconfig_save_config_restart_button").hide();

            // Discard button
            $("#id_extlanconfig_discard_config_button").removeClass("pxc-btn");
            $("#id_extlanconfig_discard_config_button").addClass("pxc-btn-dis");
            $("#id_extlanconfig_discard_config_button").prop("disabled", true);
            $("#id_extlanconfig_discard_config_button").hide();
        },        
        
        BuildConfigurationTables: function(hasSetPermissions)
        {           
            let response = EdgeNetworkConfigurationService.GetDefaultRountConfiguration();
        
            let resultObject = null;
            if (response.error == true || typeof response === "undefined") {
                Private.OnStateDataErrorOccurred(response.errorText);
            }
            else {
                resultObject = response.result;
            }

            let ifconfigresponse = NetworkConfigurationService.GetConfiguration();
            let ifconfigresultObject = null;
            
            if (ifconfigresponse.error == true || typeof ifconfigresponse === "undefined") {
                Private.OnStateDataErrorOccurred(ifconfigresponse.errorText);
            }
            else {
                ifconfigresultObject = ifconfigresponse.result;
            }

            let egderesponse = EdgeNetworkConfigurationService.GetConfiguration();
            let edgeresultObject = null;
            if (egderesponse.error == true || typeof egderesponse == "undefined") {
                Private.OnStateDataErrorOccurred(egderesponse.errorText);
            }
            else {
                edgeresultObject = egderesponse.result;
            }
            
            if (resultObject != null && ifconfigresultObject != null && edgeresultObject != null) {
                Private.EnableExtTab();
                Private.ConfigureButtons();
                
                if(!Private.activeEthernetInfoConfigs.hasOwnProperty('ExtendedNetworkSettings'))
                {
                    Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs;
                } 
                
                (DeviceWbmConfigsLoaded) ? (Private.activeEthernetInfoConfigs = DeviceWbmConfigs.EthernetInfoConfigs) : (Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs);
                
                let extlanTablesHtml = "";             
                
                if (Private.activeEthernetInfoConfigs.hasOwnProperty('ExtendedNetworkSettings') && Private.activeEthernetInfoConfigs.ExtendedNetworkSettings.hasOwnProperty('DefaultRouteInterfaceNumbers'))
                {
                    extlanTablesHtml += Private.BuildDefaultRouteTablesHtml(resultObject, ifconfigresultObject.LanInterfacesConfigs, edgeresultObject, hasSetPermissions);
                }

                $("#id_extlan-configuration_div").html(extlanTablesHtml);

                Language.UpdateActivePageMessages();
            }
        },
        
        SaveNetworkConfiguration: function ()
        {
            $("#id_div_loader").show();
            let ExtLanConfigObj = {};
            ExtLanConfigObj = Private.GetExtRouteConfigs();
            let response = EdgeNetworkConfigurationService.SetDefaultGWConfiguration(ExtLanConfigObj);
            if (response != null && response.error == true) {
                console.log(response)
                alert($("#id_lanconfig_config_save_error_span").text() + response.errorText);
                console.error("Failed to save IP Settings. Error: " + $("#id_lanconfig_config_save_error_span").text());
                $("#id_lanconfig_save_restart_modal").hide();
                $("#id_div_loader").hide();
            }
            else {
                //restart system
                NetworkConfigurationService.RestartSystemPromise().then(function (data) {
                    window.location.href = "Login.html";
                }).catch(function (errorObj) {
                    //Unknown execption
                    location.reload(true);
                });

            }
        },
    }

    let Private = {
        activeEthernetInfoConfigs: undefined,
        
        EnableExtTab: function ()
        {
            Validation("#id_extlan-configuration_tables_form");
            
            (DeviceWbmConfigsLoaded) ? (Private.activeEthernetInfoConfigs = DeviceWbmConfigs.EthernetInfoConfigs) : (Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs);

            if(!Private.activeEthernetInfoConfigs.hasOwnProperty('ExtendedNetworkSettings'))
            {
                Private.activeEthernetInfoConfigs = DefaultEthernetInfoConfigs;
            }      
            
            if(Private.activeEthernetInfoConfigs.ExtendedNetworkSettings.Supported == true) {
        
                $("#pxc-tab-extlan-configuration-button").removeAttr("style");
            }          
        },
               
        BuildDefaultRouteTablesHtml: function (ExtlanInterfacesConfigs, ifconfigresultObject, edgeresultObject, hasSetPermissions) 
        {       
            let extlanTablesHtml = "";
            let wlanNum = 0;
            let ifaceName = "";

            $.each(ifconfigresultObject, function (index, ifaceConfig) {
                if(typeof Private.activeEthernetInfoConfigs["ExtendedNetworkSettings"] != "undefined"
                            && Private.activeEthernetInfoConfigs.ExtendedNetworkSettings.DefaultRouteInterfaceNumbers.includes(parseInt(ifaceConfig.Number)))
                {
                    if(edgeresultObject.WlanNumber == ifaceConfig.Number)
                    {
                        wlanNum++;
                        if( ifaceConfig.Name == ExtlanInterfacesConfigs.Route ) 
                        {
                            ifaceName = "WLAN " + wlanNum;
                        }
                    }
                    else 
                    {
                        if( ifaceConfig.Name == ExtlanInterfacesConfigs.Route ) 
                        {
                            ifaceName = ExtlanInterfacesConfigs.Route;
                        }
                    }
                }   
            });
        
            extlanTablesHtml += '<div class="cf pxc-cnt pxc-mod-main-table-alt-rows">';
            if (hasSetPermissions) {
                extlanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_default_route_configs_table" style="width:100%" style="float: left">';
                extlanTablesHtml += '<colgroup><col style="width: 30%"></col><col style="width: 35%"></col>';
                extlanTablesHtml += '<col style="width: 35%"></col>';
            }
            else {
                extlanTablesHtml += '<table  class="pxc-tbl-zebra" id="id_default_route_configs_table" style="width:65%" style="float: left">';
                extlanTablesHtml += '<colgroup><col style="width: 40%"></col><col style="width: 60%"></col>';
            }
            extlanTablesHtml += '</colgroup>'
            // Table Name
            extlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">'
                              +    '<span class="c_default_route_label"></span>';
            extlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1">Status</th>';
            if (hasSetPermissions) {
                extlanTablesHtml += '<th style="height:30px; vertical-align:middle;" colspan="1" class="c_glb_th_configuration"></th>';
            }
            
            // Default Route
            extlanTablesHtml += '<tr><td>';
            extlanTablesHtml += '<span class="c_lanconfig_default_route" style="display: inline-block;"> Default Route Interface </span>';
                       
            extlanTablesHtml += '</td><td>';
            

            
            if(ifaceName == "")
            {
                extlanTablesHtml += '<span class="c_lanconfig_no_default_route" style="display: inline-block;"> Please specify a default route interface </span>';
            }
            else
            {
                extlanTablesHtml += '<input type="text" class="diagnostic-input" id="id_lanconfig_default_route_input" name="lanconfig_wlan_default_route_input" value="' + ifaceName + '" disabled>';
            }
            extlanTablesHtml += '</td>';
            
            if (hasSetPermissions) {
                extlanTablesHtml += '<td><select type="text" id="id_lanconfig_default_route_input_config" name="lanconfig_lan_default_route_input_config" style="width:100%;">';
                $.each(ifconfigresultObject, function (index, ifaceConfig) {
                    if(typeof Private.activeEthernetInfoConfigs["ExtendedNetworkSettings"] != "undefined"
                           && Private.activeEthernetInfoConfigs.ExtendedNetworkSettings.DefaultRouteInterfaceNumbers.includes(parseInt(ifaceConfig.Number)))
                    {
                        let ignoreGateway = false;                      
                        if(edgeresultObject.WlanNumber == ifaceConfig.Number)
                        {
                            if( edgeresultObject.Disabled == false)
                            {
                                ifaceName = "WLAN " + wlanNum;
                            }
                            else
                            {
                                ignoreGateway = true;
                            }                        
                        }
                        else
                        {
                           ifaceName = ifaceConfig.Name;
                        }

                        //PLCNext returns 0.0.0.0 if no Gatway is set for an interface
                        interfaceSettings = NetworkConfigurationService.GetInterfaceSettings(ifaceConfig.Number);
                        if(interfaceSettings.Gateway == "0.0.0.0")
                        {
                            ignoreGateway = true;
                        }
                        
                        //Do not add the interface to the list of option if WLAN is disabled or no default gateway is specified for interface
                        if(!ignoreGateway)
                        {
                            if( ifaceConfig.Name == ExtlanInterfacesConfigs.Route )
                            {
                                extlanTablesHtml += '<option value="' + ifaceConfig.Name + '" selected>' + ifaceName + '</option>';
                            }
                            else
                            {
                                extlanTablesHtml += '<option value="' + ifaceConfig.Name + '">' + ifaceName + '</option>';
                            }
                        }
                    }
                });
                extlanTablesHtml += '</section></td>';
            }
            extlanTablesHtml += '</div>';           
            extlanTablesHtml += '</table>';
            extlanTablesHtml += '<br>';
            
            return extlanTablesHtml;
        },
        
        GetExtRouteConfigs: function ()
        {
            let ExtRouteConfig = {};
            
            ExtRouteConfig.Route = $("#id_lanconfig_default_route_input_config").val();

            return ExtRouteConfig;
        },
        
        ConfigureButtons : function()
        {
            $("#id_extlanconfig_discard_config_button").click(function(event)
            {
                $("#id_lanconfig_discard_modal").show();
                event.preventDefault();
                return false;
            });
            
            $("#id_extlanconfig_save_config_restart_button").click(function(event)
            {
                if($("#id_extlan-configuration_tables_form").valid() == true)
                {
                    $("#id_extlanconfig_save_restart_modal").show();
                }
                event.preventDefault();
                return false;
            });
            
            $("#id_extlanconfig_restart_conf_ok_btn").click(function(event)
            {
                if($("#id_extlan-configuration_tables_form").valid() == true)
                {
                    $("#id_div_loader").show();
                
                    setTimeout(function(){ EXTNetworkConfigurationUi.SaveNetworkConfiguration(true); }, 30);
                }

                event.preventDefault();
                return false;
            });
            
            $("#id_extlanconfig_restart_conf_cancle_btn").click(function(event)
            {
                $("#id_extlanconfig_save_restart_modal").hide();
                let result = true;
                event.preventDefault();
                return false;
            });
            
        },
        
        OnStateDataErrorOccurred: function(error)
        {
            //### implement if needed (need to be checked)
            alert(error);
        }
    }
    
    return Public;
    
}) ();

NetloadLimiterService = (function () {

    let Public = {

        IsAvailable : function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "IsAvailable",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);

            return response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        HasSetPermissions: function(permissionObject)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "HasPermissionsTo" + permissionObject,
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);

            return response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetNetworkInterfaces : function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetNetworkInterfaces",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetNetloadLimiterSettings : function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetSettings",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetNetloadLimiterStates : function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetStates",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetNetloadLimiterStatistics : function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.getMethodsDpScriptName + "GetStatistics",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetNetloadLimiterConfiguration : function(requestData)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "SetConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                JSON.stringify(requestData),
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ResetNetloadLimiterStatistic : function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.setMethodsDpScriptName + "ResetStatistics",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }
    }

    let Private = {

        getMethodsDpScriptName: "module/NetConf/NetloadLimiterGetDp/",
        setMethodsDpScriptName: "module/NetConf/NetloadLimiterSetDp/",
        ConnectionStatusOk: true,

        OnConnectionError: function(xhr, status, error)
        {
            //### Handle if needed
            if (Private.ConnectionStatusOk) {
                Private.ConnectionStatusOk = false;
            }
        }


    }

    return Public;

})();

NetloadLimiterUi = (function () {

    let Public = {

        Setup : function()
        {
            if(Private.IsAvailable()) {
                Private.activeEthernetInfoConfigs = (DeviceWbmConfigsLoaded ? DeviceWbmConfigs.EthernetInfoConfigs : DefaultEthernetInfoConfigs);        
                var hasPermissionsOnApplyingConfiguration = Private.HasSetPermissions("SetConfiguration");
                var hasPermissionsOnResettingStatistics = Private.HasSetPermissions("ResetStatistics");
    
                Private.BuildNetloadLimiterTables(hasPermissionsOnApplyingConfiguration);
                Private.ConfigureButtons(hasPermissionsOnApplyingConfiguration, hasPermissionsOnResettingStatistics);
                Private.ConfigureLimitInputs(hasPermissionsOnApplyingConfiguration);

                Validation("#id_netload_limiter_tables_form");
            } else {
                $('#id_netload_limiter_tab').attr("class", "disabled-tab");
                delete networkConfigurationSelectedTabId;
            }
        },

        SetNetloadLimiterConfiguration : function()
        {
            var configurationRequests = [];
            let networkInterfacesReponse = NetloadLimiterService.GetNetworkInterfaces();
            $.each(networkInterfacesReponse.result.networkInterfaces, function(i, networkInterface){
                var idPrefix = Private.BuildIdPrefix(networkInterface.interfaceNumber, 'packets');
                // check if network interface exists on page
                if($('#' + idPrefix + 'set_limit').length > 0){
                    var enablePacketLimiter = ($('#' + idPrefix + 'setting').val() == 'Enable');
                    var packetLimit = parseInt($('#' + idPrefix + 'set_limit').val(), 10);
                    var packetLimiter = { 'enable' : enablePacketLimiter, 'limit' : packetLimit };
    
                    idPrefix = Private.BuildIdPrefix(networkInterface.interfaceNumber, 'byte');
                    var enableByteLimiter = ($('#' + idPrefix + 'setting').val() == 'Enable');
                    var byteLimit = parseInt($('#' + idPrefix + 'set_limit').val(), 10);
                    var byteLimiter = { 'enable' : enableByteLimiter, 'limit' : byteLimit };
    
                    configurationRequests.push({ 'interfaceNumber' : parseInt(networkInterface.interfaceNumber, 10),
                                            'packetLimiter' : packetLimiter,
                                            'byteLimiter' : byteLimiter});
                }
            });

            NetloadLimiterService.SetNetloadLimiterConfiguration(configurationRequests);
        },

        ResetNetloadLimiterStatistic : function()
        {
            NetloadLimiterService.ResetNetloadLimiterStatistic();
            Private.start = Date.now();
        },

        StopUpdateTimer : function()
        {
            window.clearTimeout(Private.updateTimer);
        },

        OnLanguageChanged : function()
        {
            Public.StopUpdateTimer();
            Private.UpdateNetloadLimiterData();

            var optionsEnable = $('.c_netload_limiter_configure_enable');
            $.each(optionsEnable, function(i, optionEnable){
                $(optionEnable).text($('#id_netload_limiter_config_enable').text());
            });

            var optionsDisable = $('.c_netload_limiter_configure_disable');
            $.each(optionsDisable, function(i, optionDisable){
                $(optionDisable).text($('#id_netload_limiter_config_disable').text());
            });

            ReloadValidation("#id_netload_limiter_tables_form");
        }

    }

    let Private = {

        activeEthernetInfoConfigs : undefined,
        updateTimer : undefined,
        updateCycleTime : 1000,

        tableColumns : 7,
        statusColSpan : 3,
        configColSpan : 3,

        lastStatistics : undefined,

        IsAvailable : function()
        {
            let response = NetloadLimiterService.IsAvailable();
            return response.isAvailable;
        },

        HasSetPermissions : function(permissionObject)
        {
            var response = NetloadLimiterService.HasSetPermissions(permissionObject);
            return response.hasPermissions;
        },

        ConfigureButtons : function(hasPermissionsOnApplyingConfiguration, hasPermissionsOnResettingStatistics)
        {
            if(hasPermissionsOnApplyingConfiguration) {

                Private.EnableButton('id_netload_limiter_apply_configuration', 'pxc_btn_pa');
                Private.EnableButton('id_netload_limiter_discard', 'pxc_btn');
                $("#id_netload_limiter_discard").click(function(event)
                {
                    $("#id_lanconfig_discard_modal").show();
                    event.preventDefault();
                    return false;
                });
            
                $("#id_netload_limiter_apply_configuration").click(function(event)
                {
                    if($("#id_netload_limiter_tables_form").valid()) {
                        $("#id_netload_limiter_apply_configuration_modal").show();
                    }
                    event.preventDefault();
                    return false;
                });
            
                $("#id_netload_limiter_apply_configuration_ok_btn").click(function(event)
                {
                    Public.SetNetloadLimiterConfiguration();
                    $("#id_netload_limiter_apply_configuration_modal").hide();
                    event.preventDefault();
                    return false;
                });
            
                $("#id_netload_limiter_apply_configuration_cancle_btn").click(function(event)
                {
                    $("#id_netload_limiter_apply_configuration_modal").hide();
                    event.preventDefault();
                    return false;
                });
            } else {
                Private.DisableButton('id_netload_limiter_apply_configuration', 'pxc_btn_pa');
                Private.DisableButton('id_netload_limiter_discard', 'pxc_btn');
            }
            
            if(hasPermissionsOnResettingStatistics) {
                Private.EnableButton('id_netload_limiter_reset_statistics', 'pxc_btn_pa');
                $("#id_netload_limiter_reset_statistics").click(function(event)
                {
                    $("#id_netload_limiter_reset_statistics_modal").show();
                    event.preventDefault();
                    return false;
                });
            
                $("#id_netload_limiter_reset_statistics_ok_btn").click(function(event)
                {
                    Public.ResetNetloadLimiterStatistic();
                    $("#id_netload_limiter_reset_statistics_modal").hide();
                    event.preventDefault();
                    return false;
                });
            
                $("#id_netload_limiter_reset_statistics_cancle_btn").click(function(event)
                {
                    $("#id_netload_limiter_reset_statistics_modal").hide();
                    event.preventDefault();
                    return false;
                });
            } else {
                Private.DisableButton('id_netload_limiter_reset_statistics', 'pxc_btn_pa');
            }
        },

        ConfigureLimitInputs : function(hasPermissionsOnApplyingConfiguration)
        {
            if(hasPermissionsOnApplyingConfiguration) {
                // set limit fields to get disabled if 'Disable' is selected
                var selectConfigs = $('.c_select_config');
                $.each(selectConfigs, function(i, selectConfig){
                    Private.ConfigureLimitInput(selectConfig);
                    
                    $(selectConfig).on("change", function(){
                        Private.ConfigureLimitInput(this);
                    });
                });

                // display warning if limit is '0'
                var setLimits = $('.c_set_limit');
                $.each(setLimits, function(i, setLimit){
                    // Initial configuration of limit warning is done in ConfigureLimitInput()

                    $(setLimit).on("input", function(){
                        Private.ConfigureLimitWarning(this);
                    });
                });
            }
        },

        ConfigureLimitInput : function(selectConfig)
        {
            var limitInput = $(selectConfig).parent().find('input');
            if($(selectConfig).val() == 'Disable'){
                limitInput.attr("readonly", true);
                limitInput.attr("disabled", true);
                Private.DisableLimitWarning(limitInput);
            } else {
                limitInput.attr("readonly", false);
                limitInput.attr("disabled", false);
                Private.ConfigureLimitWarning(limitInput);
            }

            return limitInput;
        },

        ConfigureLimitWarning : function(limitInput)
        {
            var limitWarning = $(limitInput).parent().parent().find("div[id$='set_limit_warning']");            
            if(($(limitInput).val().length != 0) && ($(limitInput).val() == 0)){
                limitWarning.css("display", "inline-block");
            } else {
                limitWarning.hide();
            }

            return limitWarning;
        },

        DisableLimitWarning : function(limitInput)
        {
            $(limitInput).parent().parent().find("div[id$='set_limit_warning']").hide();
        },

        ConfigureTables : function(hasPermissionsOnApplyingConfiguration)
        {
            if(!hasPermissionsOnApplyingConfiguration) {
                Private.statusColSpan = Private.tableColumns - 1;
                Private.configColSpan = 0;
            }
        },

        BuildNetloadLimiterTables : function(hasPermissionsOnApplyingConfiguration)
        {
            let networkInterfacesReponse = NetloadLimiterService.GetNetworkInterfaces();
            let settingsResponse = NetloadLimiterService.GetNetloadLimiterSettings();
            let statesResponse = NetloadLimiterService.GetNetloadLimiterStates();
            let statisticsReponse = NetloadLimiterService.GetNetloadLimiterStatistics();
            
            Private.ConfigureTables(hasPermissionsOnApplyingConfiguration);
            var netloadLimiterTables = '';
            var firstIndex = null;
            $.each(networkInterfacesReponse.result.networkInterfaces, function(i, networkInterface){
                if(Private.ShouldHideInterface(networkInterface.interfaceNumber)) {
                    return false;
                }
                var settings = settingsResponse.result.settings[i];
                var state = statesResponse.result.states[i];
                var statistic = statisticsReponse.result.statistics[i];

                netloadLimiterTables += Private.BuildTable(settings, state, statistic);
                if(firstIndex == null) {
                    firstIndex = i;
                }
            });

            if(firstIndex != null) {
                this.UpdateTimeSinceLastReset(statisticsReponse.result.statistics[firstIndex].durationSinceLastReset);
            }

            // save last statistics to detect changes in netload limiter events
            Private.lastStatistics = statisticsReponse.result.statistics;
            
            $('#id_netload_limiter_div').html(netloadLimiterTables);
            Language.UpdateActivePageMessages();
            
            // update states and statistics periodically
            Private.updateTimer = setTimeout(Private.UpdateNetloadLimiterData, Private.updateCycleTime);
        },

        ShouldHideInterface : function(interfaceNumber)
        {
            return ((typeof Private.activeEthernetInfoConfigs["HideInterfaces"] != "undefined") && Private.activeEthernetInfoConfigs["HideInterfaces"].includes(parseInt(interfaceNumber)));
        },

        BuildTable : function(settings, state, statistic)
        {
            var table = '<table class="pxc-tbl-zebra tbl-netload-limiter">';
            table += Private.BuildTableColgroup(Private.tableColumns);
            table += Private.BuildTableContent(settings, state, statistic);
            table += '</table><br>';

            return table;
        },

        BuildTableContent : function(settings, state, statistic)
        {
            var tableContent = Private.BuildSettingsAndStateHeader(settings.interfaceNumber);
            tableContent += Private.BuildSettingsAndState(settings.interfaceNumber, 'packets', settings.packetLimiter, state.packetLimiterActive);
            tableContent += Private.BuildSettingsAndState(settings.interfaceNumber, 'byte', settings.byteLimiter, state.byteLimiterActive);

            tableContent += Private.BuildStatisticHeader();
            tableContent += Private.BuildStatisticRow(statistic.interfaceNumber, 'packets', statistic.packetLimiter);
            tableContent += Private.BuildStatisticRow(statistic.interfaceNumber, 'byte', statistic.byteLimiter);

            tableContent += Private.BuildStatisticHeader2();
            tableContent += Private.BuildStatisticRow2(statistic.interfaceNumber, 'packets', statistic.packetLimiter);
            tableContent += Private.BuildStatisticRow2(statistic.interfaceNumber, 'byte', statistic.byteLimiter);

            return tableContent;
        },

        BuildTableColgroup : function(columns)
        {
            var width = 100 / columns;
            var firstColumnWidth = width* 1.4;
            var leftWidth = 100 - firstColumnWidth;
            var columnWidth = leftWidth / (columns - 1);

            var colgroup = '<colgroup>';
            colgroup += '<col style="width: ' + firstColumnWidth + '%;">';
            for(var i = 0; i < columns - 1; i++){
                colgroup += '<col style="width: ' + columnWidth + '%;">';
            }
            colgroup += '</colgroup>';

            return colgroup;
        },

        BuildSettingsAndStateHeader : function(interfaceNumber)
        {
            var classPrefix = 'c_netload_limiter_';
            var header = '<tr>';

            header += '<th>LAN ' + interfaceNumber + '</th>';
            header += '<th class="' + classPrefix + 'status_header" colspan="' + Private.statusColSpan + '"></th>';
            if(Private.configColSpan > 0) {
                header += '<th class="' + classPrefix + 'config_header" colspan="' + Private.configColSpan + '"></th>';
            }
            header += '</tr>';

            return header;
        },

        BuildSettingsAndState : function(interfaceNumber, type, limiterSettings, limiterState)
        {
            var stateData = Private.GetStateData(limiterSettings, limiterState, type);
            var row = '<tr>';
            row += '<td><span class="c_netload_limiter_' + type + '_limiter_name"></span></td>';
            row += '<td colspan="' + Private.statusColSpan + '">';
            var idPrefix = Private.BuildIdPrefix(interfaceNumber, type);
            var additionalAttributes = ((stateData.class == 'config_disabled') ? 'disabled' : 'class="' + stateData.class + '" readonly');
            row += '<input type="text" name="' + idPrefix + 'state_input" id="' + idPrefix + 'state" value="' + stateData.text + '" ' + additionalAttributes +  '/>';
            row += '</td>';
            if(Private.configColSpan > 0) {
                row += '<td colspan="' + Private.configColSpan + '">';
                row += '<select id="' + idPrefix + 'setting" name="' + type +'-limiter-config" class="c_select_config" style="width: 35%; margin-right: 10px;">';
                var enableSelected = (limiterSettings.enabled ? 'selected' : '');
                var disableSelected = (!limiterSettings.enabled ? 'selected' : '');
                row += '<option class="c_netload_limiter_configure_enable" value="Enable"'+ enableSelected + '>' + $("#id_netload_limiter_config_enable").text() + '</option>';
                row += '<option class="c_netload_limiter_configure_disable" value="Disable"' + disableSelected + '>' + $("#id_netload_limiter_config_disable").text() + '</option>';
                row += '</select>';
                row += '<div style="display: inline;">';
                row += 'Limit: <input name="' + idPrefix + 'set_limit_input" id="' + idPrefix + 'set_limit" class="positive-numeric-input c_set_limit" style="width: 25%; display: inline-block;" type="text" value="' + limiterSettings.limit + '" autocomplete="off"> <span class="c_netload_limiter_' + type + '_per_milliseconds_unit"></span>';
                row += '<span style="width: 12px; display: inline-block;"></span>'
                row += '</div>';
                row += '<div id="' + idPrefix + 'set_limit_warning" hidden>';
                row += '<div class="tooltip" style="display: inline-block;">';
                row += '<div class="tooltip-text-container">';
                row += '<span class="tooltip-text-top c_netload_limiter_set_limit_warning">'
                row += '</span>';
                row += '</div>';
                row += '<img src="./images/status_icon_severity_urgent_warning.svg" style="height: 12px; width: 12px; position: relative; top: -1.75px; vertical-align: middle;">';
                row += '</div>';
                row += '</div>';
                row += '</td>';
            }
            row += '</tr>';

            return row;
        },

        BuildStatisticHeader : function()
        {
            var classPrefix = 'c_netload_limiter_';
            var header = '<tr>';
            header += '<th class="' + classPrefix + 'statistic_header"></th>'
            header += '<th class="' + classPrefix + 'moving_average_header" colspan="2"></th>'
            header += '<th class="' + classPrefix + 'moving_average_max_header" colspan="2"></th>';
            header += '<th class="' + classPrefix + 'peak_header" colspan="2"></th>';
            header += '</tr>';

            return header;
        },

        BuildStatisticRow : function(interfaceNumber, type, statistic)
        {
            var classPrefix = 'c_netload_limiter_';
            var idPrefix = Private.BuildIdPrefix(interfaceNumber, type);
            var row = '<tr>';
            row += '<td><span class="' + classPrefix + type + '_per_milliseconds"></span></td>';
            row += '<td colspan="2"><input id="' + idPrefix + 'movingAverage" type="text" value="' + statistic.movingAverage + '" disabled></td>';
            row += '<td colspan="2"><input id="' + idPrefix + 'movingAverageMax" type="text" value="' + statistic.movingAverageMax + '" disabled></td>';
            row += '<td colspan="2"><input id="' + idPrefix + 'peak" type="text" value="' + statistic.peak + ' ' + '" disabled></td>';
            row += '</tr>';

            return row;
        },

        BuildStatisticHeader2 : function()
        {
            var classPrefix = 'c_netload_limiter_';
            var header = '<tr>';
            header += '<td></td>'
            header += '<th class="' + classPrefix + 'limiting_duration_header" colspan="3"></th>'
            header += '<th class="' + classPrefix + 'limiting_event_count_header" colspan="3"></th>';
            header += '</tr>';

            return header;
        },

        BuildStatisticRow2 : function(interfaceNumber, type, statistic)
        {
            var classPrefix = 'c_netload_limiter_';
            var idPrefix = Private.BuildIdPrefix(interfaceNumber, type);
            var row = '<tr>';
            row += '<td><span class="' + classPrefix + type + '_limiter_name"></span></td>';
            var formattedTime = Private.FormatTime(statistic.limitingDuration);
            row += '<td colspan="3"><input id="' + idPrefix + 'limitingDuration" type="text" value="' + formattedTime.value + '" style="width: 80%; display: inline-block;" disabled> <span id="' + idPrefix + 'limitingDurationUnit">' + formattedTime.unit + '<span></td>';
            row += '<td colspan="3"><input id="' + idPrefix + 'limitingEventCount" type="text" value="' + statistic.limitingEventCount + '" disabled></td>';
            row += '</tr>';

            return row;
        },

        BuildIdPrefix : function(interfaceNumber, type)
        {
            return 'interface' + interfaceNumber + '_' + type + '_limiter_';
        },

        BuildUnit : function(type)
        {
            return type + '/ms';
        },

        GetStateData : function(limiterSettings, limiterState, type)
        {
            var text = '';
            var stateClass = '';

            if(!limiterSettings.enabled){
                text = $('#id_netload_limiter_config_disabled').text();
                stateClass = 'config_disabled';
            } else {
                text = $('#id_netload_limiter_config_enabled').text() + ' (Limit: ' + limiterSettings.limit + ' ' + $('#id_netload_limiter_' + type + '_per_milliseconds_unit').text() + ')';
                if(limiterState) {
                    text += ' - ' + $('#id_netload_limiter_state_limiting').text();
                    stateClass = 'config_enabled state_limiting';

                } else {
                    text += ' - ' + $('#id_netload_limiter_state_not_limiting').text();
                    stateClass = 'config_enabled state_not_limiting';
                }
            }

            return { "text" : text, "class" : stateClass };
        },

        UpdateNetloadLimiterData : function()
        {   
            let settingsReponse = NetloadLimiterService.GetNetloadLimiterSettings();
            let stateReponse = NetloadLimiterService.GetNetloadLimiterStates();
            let statisticsReponse = NetloadLimiterService.GetNetloadLimiterStatistics();

            var statistics = statisticsReponse.result.statistics;
            var firstIndex = null;
            $.each(statistics, function(i, statistic){
                if(Private.ShouldHideInterface(statistic.interfaceNumber)) {
                    return false;
                }
                var settings = settingsReponse.result.settings[i];
                var state = stateReponse.result.states[i];
                var currentLimitingState = Private.GetCurrentLimtingState(state, statistic, Private.lastStatistics[i]);

                Private.UpdateSettingsAndState(settings, currentLimitingState);
                Private.UpdateStatistic(statistic);
                if(firstIndex == null) {
                    firstIndex = i;
                }
            });

            if(firstIndex != null) {
                Private.UpdateTimeSinceLastReset(statistics[firstIndex].durationSinceLastReset);
            }

            Private.lastStatistics = statistics;
            Private.updateTimer = setTimeout(Private.UpdateNetloadLimiterData, Private.updateCycleTime);
        },

        GetCurrentLimtingState : function(state, currentStatistic, lastStatistic)
        {
            var packetLimiterActive = (state.packetLimiterActive || Private.HasLimitingEventOccurred(currentStatistic.packetLimiter, lastStatistic.packetLimiter));
            var byteLimiterActive = (state.byteLimiterActive || Private.HasLimitingEventOccurred(currentStatistic.byteLimiter, lastStatistic.byteLimiter));

            return { "packetLimiterActive" : packetLimiterActive, "byteLimiterActive" : byteLimiterActive };
        },

        HasLimitingEventOccurred : function(currentLimiterStatistic, lastLimiterStatistic)
        {
            return (parseInt(currentLimiterStatistic.limitingEventCount) > parseInt(lastLimiterStatistic.limitingEventCount));
        },

        UpdateSettingsAndState : function(settings, state)
        {
            var id = '#' + Private.BuildIdPrefix(settings.interfaceNumber, "packets") + "state";
            var stateData = Private.GetStateData(settings.packetLimiter, state.packetLimiterActive, "packets");
            var element = $(id);
            element.val(stateData.text);
            if(stateData.class == 'config_disabled') {
                element.attr("class", "");
                element.attr("disabled", true);
            } else {
                element.attr("class", stateData.class);
                element.attr("readonly", true);
            }

            id = '#' + Private.BuildIdPrefix(settings.interfaceNumber, "byte") + "state";
            stateData = Private.GetStateData(settings.byteLimiter, state.byteLimiterActive, "byte");
            element = $(id);
            element.val(stateData.text);
            if(stateData.class == 'config_disabled') {
                element.attr("class", "");
                element.attr("disabled", true);
            } else {
                element.attr("class", stateData.class);;
                element.attr("readonly", true);
            }
        },

        UpdateStatistic : function(statistic)
        {
            var idPrefix = '#' + Private.BuildIdPrefix(statistic.interfaceNumber, "packets");
            Private.UpdateLimiterStatistic(statistic.packetLimiter, idPrefix);

            idPrefix = '#' + Private.BuildIdPrefix(statistic.interfaceNumber, "byte");
            Private.UpdateLimiterStatistic(statistic.byteLimiter, idPrefix);
        },

        UpdateLimiterStatistic : function(limiterStatistic, idPrefix)
        {
            $(idPrefix + 'movingAverage').val(limiterStatistic.movingAverage);
            $(idPrefix + 'movingAverageMax').val(limiterStatistic.movingAverageMax);
            $(idPrefix + 'peak').val(limiterStatistic.peak);
            var formattedTime = Private.FormatTime(limiterStatistic.limitingDuration);
            $(idPrefix + 'limitingDuration').val(formattedTime.value);
            $(idPrefix + 'limitingDurationUnit').text(formattedTime.unit);
            $(idPrefix + 'limitingEventCount').val(limiterStatistic.limitingEventCount);
        },

        FormatTime : function(timeMicroSeconds)
        {
            if(timeMicroSeconds < 1000000) {
                var value = timeMicroSeconds;
                var unit = 'µs';
            } else {
                var value = Math.round(timeMicroSeconds / 1000);
                var unit = 'ms';
            }

            return {"value" : value, "unit" : unit};
        },

        EnableButton : function(id, buttonClass)
        {
            var button = $('#' + id);
            button.removeClass("pxc-btn-dis");
            button.addClass(buttonClass);
            button.prop("disabled", false);
            button.show();
        },

        DisableButton : function(id, buttonClass)
        {
            var button = $('#' + id);
            button.removeClass(buttonClass);
            button.addClass("pxc-btn-dis");
            button.prop("disabled", true);
            button.hide();
        },

        UpdateTimeSinceLastReset : function(timeMicroSeconds)
        {
            const secondsPerDay = 60*60*24;
            const secondsPerHour = 60*60;
            const secondsPerMinute = 60;

            var timeString = '';
            var leftSeconds = Math.round(timeMicroSeconds / 1000 / 1000);
            var days = Math.floor(leftSeconds / secondsPerDay);
            if(days > 0) {
                timeString += Private.ShowToDigits(days) + ':';
            }
            leftSeconds -= days*secondsPerDay;

            var hours = Math.floor(leftSeconds / secondsPerHour);
            timeString += Private.ShowToDigits(hours) + ':';
            leftSeconds -= hours*secondsPerHour;

            var minutes = Math.floor(leftSeconds / secondsPerMinute);
            timeString += Private.ShowToDigits(minutes) + ':';
            leftSeconds -= minutes*secondsPerMinute;
            timeString += Private.ShowToDigits(leftSeconds);

            $('#id_time_since_last_reset_statistics').text(timeString);
        },

        ShowToDigits : function(number)
        {
            return ((number < 10) ? ('0' + number) : number);
        },

        packetLimitingDuration : 1000,
        byteLimitingDuration : 1502310,
        packetLimitingEventCount : 5,
        byteLimitingEventCount : 9,
        dummyCounter : 0,

        GetDummyStatistics : function()
        {
            Private.dummyCounter++;
            if(Private.dummyCounter == 3) {
                Private.packetLimitingDuration += 160;
                Private.byteLimitingDuration += 290;
                Private.packetLimitingEventCount++;
                Private.byteLimitingEventCount++;

                Private.dummyCounter = 0;
            }

            let packetLimiter = { "movingAverage" : "1", "movingAverageMax" : "8", "peak" : "31", "limitingDuration" : Private.packetLimitingDuration, "limitingEventCount" : Private.packetLimitingEventCount};
            let byteLimiter = { "movingAverage" : "12", "movingAverageMax" : "45", "peak" : "1256", "limitingDuration" : Private.byteLimitingDuration, "limitingEventCount" : Private.byteLimitingEventCount};
            let statistic = {"interfaceNumber" : "1", "packetLimiter" : packetLimiter, "byteLimiter" : byteLimiter, "durationSinceLastReset" : 25498752};    
            
            return { "result" : {"statistics" : [statistic]} };
        }
    }

    return Public;

})();
