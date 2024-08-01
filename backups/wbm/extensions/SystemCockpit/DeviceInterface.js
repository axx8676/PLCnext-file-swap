$(document).ready(function()
{

    // Controller reboot
    $("#id_cockpit_reboot_controller_btn").click(function () {
       $("#id_div_cockpit_reboot_confirm").show();
    });
    $("#id_cockpit_reboot_ok_btn").click(function () {
        DeviceInterfaceUi.RestartController();
        $("#id_div_cockpit_reboot_confirm").hide();
    });
    $("#id_cockpit_reboot_cancel_btn").click(function () {
       $("#id_div_cockpit_reboot_confirm").hide();
    });
    
    // Controller factory reset
    $("#id_cockpit_reset_factory_default_btn").click(function () {
       $("#id_div_cockpit_factory_reset_confirm").show();
    });
    
    $("#id_cockpit_factory_reset_ok_btn").click(function () {
       DeviceInterfaceUi.ResetControllerToFactoryDefault();
       $("#id_div_cockpit_factory_reset_confirm").hide();
    });
    
    $("#id_cockpit_factory_reset_cancel_btn").click(function () {
       $("#id_div_cockpit_factory_reset_confirm").hide();
    });
    
});

DeviceInterfaceUi = (function () {

    let Public = {

        InitDiagSections: function()
        {
            $.each( Private.uiDiagSections, function( key, uiDiagSection ) {
                Private.InitDiagSection(uiDiagSection);
            });
        },
        InitControlSection: function()
        {   
            if(WbmModules.CheckWbmModuleAvailable(DeviceInterfaceService.GetWbmModuleName()) == false)
            {
                return false;
            }
            $("#id_cockpit_control_di_content_div").css("display", "inline-block");
            if(DeviceInterfaceService.HasControlPermissions())
            {
                Private.InitControlSection();
            }
            if($("#id_main_activated_sp_div").is(":visible"))
            {
                $("#id_cockpit_factory_reset_warning_span").hide()
                $("#id_cockpit_factory_reset_warning_span_sp").show()
            }
        },
        RunUpdateDiagDataCycle: function(updateCounter)
        {
            Private.uiUpdateCounter = updateCounter;
            // Update data every second
            if((Private.uiUpdateCounter % 2) == 0)
            {
                this.UpdateDiDiagSections();
            }
            $('#id_cockpit_status_leds_box span.led').each(function (idx, element) {
                Private.UpdateLedStatusLedValue(element);
            });
        },
        UpdateDiDiagSections: function()
        {
            let dataSectionsNames = [];
            $.each( Private.uiDiagSections, function( key, uiDiagSection ) {
                if(uiDiagSection.visible)
                {
                    dataSectionsNames.push(uiDiagSection.sectionName);
                }
            });
            DeviceInterfaceService.GetDiagDataSectionsPromise(dataSectionsNames)
            .then(function (data) {
                if(data["error"] == false)
                {
                    $.each( data["result"], function( key, sectionData ) {
                        Private[Private.uiDiagSections[key].updateSectionContent](sectionData);
                    });
                }
                else
                {
                    Private.ResetDiagSections();
                }
            })
            .catch(function (errorObj) {
                console.log(errorObj);
                Private.ResetDiagSections();
            });
        },
        RestartController: function()
        {
            let response = DeviceInterfaceService.RestartController();
            if(response == null)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.restartControllerFailed, "Bad Gateway");
            }
            else if(response["result"] == false)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.restartControllerFailed, response["errorText"]);
            }
            else
            {
                window.location.href = "Login.html";
            }
        },
        ResetControllerToFactoryDefault: function()
        {
            let response = DeviceInterfaceService.ResetControllerToFactoryDefault();
            if(response == null)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.resetToFactoryDefaultsFailed, "Bad Gateway");
            }
            else if(response["result"] == false)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.resetToFactoryDefaultsFailed, response["errorText"]);
            }
            else
            {
                window.location.href = "Login.html";
            }
        }
    }

    let Private = {
        uiUpdateCounter: 0,
        messagesTags: {
            restartControllerFailed      : "c_cockpit_restart_controller_failed_error",
            resetToFactoryDefaultsFailed : "c_cockpit_reset_to_factory_defaults_restored"
        },
        uiDiagSections:
        {   
            enabled: true,
            StatusIndicators: {
                sectionName: "StatusIndicators",
                visible: false,
                targetConfig: null,
                sectionDivId: "id_cockpit_status_leds_box_div",
                initSectionContent: "InitStatusIndicatorsSection",
                updateSectionContent: "UpdateStatusIndicatorsSection",
                resetSectionContent: "ResetStatusIndicatorsSection",
            },
            Utilization: {
                sectionName: "Utilization",
                visible: false,
                targetConfig: null,
                sectionDivId: "id_cockpit_utilitation_box_div",
                initSectionContent: null,
                updateSectionContent: "UpdateUtilizationSection",
                resetSectionContent: "ResetUtilizationSection",
            },
            Health: {
                sectionName: "Health",
                visible: false,
                targetConfig: null,
                sectionDivId: "id_cockpit_health_box_div",
                initSectionContent: null,
                updateSectionContent: "UpdateHealthSection",
                resetSectionContent: "ResetHealthSection",
            },
            DateTime: {
                sectionName: "DateTime",
                visible: false,
                targetConfig: null,
                sectionDivId: "id_cockpit_datetime_box_div",
                initSectionContent: null,
                updateSectionContent: "UpdateDateTimeSection",
                resetSectionContent: "ResetDateTimeSection",
            }
        },
        uiControlSection:
        {
            sectionName: "DeviceControl",
            visible: false,
            targetConfig: null,
            sectionDivId: "id_cockpit_control_di_content_div"
        },
        ResetDiagSections: function()
        {
            $.each( this.uiDiagSections, function( key, uiDiagSection ) {
                if(key != "enabled")
                {
                    Private[uiDiagSection.resetSectionContent]();
                }
                
            });
        },
        InitControlSection: function()
        {
            this.uiControlSection.targetConfig = DeviceWbmConfigs["Cockpit"]["ControlSection"]["DeviceControl"];
            if(typeof this.uiControlSection.targetConfig === "undefined")
            {
                return false;
            }
            if(DeviceWbmConfigs["Cockpit"]["ControlSection"]["DeviceControl"]["Enabled"] == false)
            {
                return false;
            }
            $('#' + this.uiControlSection.sectionDivId + ' button.cockpit-control-btn').each(function (idx, element) {
                $(element).removeClass("disabled");
            });
            
        },
        InitDiagSection: function(uiDiagSection)
        {
            let sectionConfig = DeviceWbmConfigs["Cockpit"]["DiagnosticSection"][uiDiagSection.sectionName];
            if(typeof sectionConfig === "undefined")
            {
                return;
            }
            uiDiagSection.targetConfig = sectionConfig;
            uiDiagSection.visible = uiDiagSection.targetConfig["Enabled"];
            if(uiDiagSection.visible == false)
            {
                $("#" + uiDiagSection.sectionDivId).hide();
            }
            if(uiDiagSection.initSectionContent != null)
            {
                Private[uiDiagSection.initSectionContent]()
            }
        },
        InitStatusIndicatorsSection: function()
        {
            if(this.uiDiagSections["StatusIndicators"].visible == false)
            {
                $("#id_cockpit_status_leds_box_div").hide();
                return true;
            }
            let statusIndicatorsHtml = "<hr>";
            $.each( this.uiDiagSections["StatusIndicators"].targetConfig["Items"], function( idx, statusIndicatorElement ) {
                let elementLeftaligned = ((idx % 2 ) == 0);
                if(elementLeftaligned)
                {
                    statusIndicatorsHtml += '<div style="display: inline-block; width: 60%; margin-left: 10%;">'
                }
                else
                {
                    statusIndicatorsHtml += '<div style="display: inline-block;">'
                }
                if(statusIndicatorElement.Name != "LeaveEmpty")
                {
                    statusIndicatorsHtml += '<span id="id_cockpit_status_indicator_' + statusIndicatorElement.Name + '_name_span" style="display:inline-block; width: 100px;">' + statusIndicatorElement.DisplayName + ':</span>'
                                     +  '<span id="id_cockpit_status_indicator_' + statusIndicatorElement.Name + '_led_span" class="led"  led-color=""  led-state=""></span>';
                }
                statusIndicatorsHtml += '</div>';
                                     
                if(!elementLeftaligned)
                {
                    statusIndicatorsHtml += '<br></br>';
                }
                $("#id_cockpit_status_leds_content_div").html(statusIndicatorsHtml);
            });
        },
        UpdateStatusIndicatorsSection: function(statusIndicatorsItems)
        {
            $.each( Private.uiDiagSections.StatusIndicators.targetConfig["Items"], function( key, indicatorConfigItem ) {
                let ledName = "StaticFalse";
                let ledStateCode = 0;
                let ledColorCode = 0;
                $.each( statusIndicatorsItems, function( i_key, indicatorItem ) {
                    if(indicatorConfigItem.Name == indicatorItem.fullName)
                    {
                        ledName = indicatorItem.fullName;
                        ledStateCode = indicatorItem.stateCode;
                        ledColorCode = indicatorItem.colorCode;
                        return;
                    }
                });
                Private.SetLedStatusAttrValue(ledName, ledStateCode);
                Private.SetLedColorAttrValue(ledName, ledColorCode);
            });
        },
        ResetStatusIndicatorsSection: function()
        {
            $('#id_cockpit_status_leds_box span.led').each(function (idx, ledElement) {
                $(ledElement).attr("led-state", "off");
                $(ledElement).attr("led-color", "");
            });
        },
        UpdateUtilizationSection: function(sectionData)
        {
            CockpitUi.SetProgressbarVal("id_cockpit_utilitation_memory_bar_div", sectionData["memoryUsagePercent"], "%");
            
            // User Partition
            let userPartitionUsagePercent = sectionData["userPartitionUsagePercent"];
            CockpitUi.SetProgressbarVal("id_cockpit_utilitation_user_partition_bar_div", userPartitionUsagePercent, "%");
            let userPartitionUsage = CockpitUtilities.BytesToSize(sectionData["userPartitionUsage"]) + "/" + CockpitUtilities.BytesToSize(sectionData["userPartitionTotal"]);
            $("#id_cockpit_utilitation_user_partition_bar_val_span").text(userPartitionUsage);
            
            // CPU Load
            CockpitUi.SetProgressbarVal("id_cockpit_utilitation_cpu_load_total_bar_div", sectionData["cpuLoadTotal"], "%");
            
            let cpuCoreElements = $('#id_cockpit_utilitation_cpu_cores_div div.cpu-core-load');
            let cpuCoresCount = sectionData["cpuCoresCount"];
            if(cpuCoreElements.length != cpuCoresCount)
            {
                this.BuildUtilizationCpuCoresContent(cpuCoresCount);
            }
            $.each( sectionData["cpuCoresLoad"], function( idx, cpuLoadElement ) {
                let elementNumber = (idx + 1);
                CockpitUi.SetProgressbarVal("id_cockpit_utilitation_cpu_" + elementNumber + "_load_bar_div", cpuLoadElement, "%");
            });
        },
        ResetUtilizationSection: function()
        {
            CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_memory_bar_div");
            
            CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_user_partition_bar_div");
            
            $("#id_cockpit_utilitation_user_partition_bar_val_span").text("N/A");
            $("#id_cockpit_utilitation_user_partition_bar_val_span").css("color", "#666A6E");

            CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_cpu_load_total_bar_div");
            
            
            let cpuCoreElements = $('#id_cockpit_utilitation_cpu_cores_div div.cpu-core-load');
            $.each( cpuCoreElements, function( idx, cpuCoreElement ) {
                let elementNumber = (idx + 1);
                CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_cpu_" + elementNumber + "_load_bar_div");
            });
        },
        BuildUtilizationCpuCoresContent: function(cpuCoresCount)
        {
            let cpuCoresHtml = "";
            for (let i = 1; i <= cpuCoresCount; i++) {
              cpuCoresHtml += '<div style="display: inline-block; width: 100%; margin-left: 5%;" class="cpu-core-load">'
                           +    '<div class="cockpit-element-header" style="width: 159px;">'
                           +       '<span style="display: inline-block; " class="c_cockpit_cpu_load_core_val">CPU Load (Core</span>'
                           +       '<span style="display: inline-block; ">&nbsp;' + i + '</span>'
                           +       '<span style="display: inline-block; ">):</span>'
                           +   '</div>'
                           +   '<div id="id_cockpit_utilitation_cpu_' + i + '_load_progress_div" class="cockpit-progress" style="diplay: inline-block;">'
                           +     '<div id="id_cockpit_utilitation_cpu_' + i + '_load_bar_div" style="width: 0%;" class="cockpit-progress-container">N/A</div>'
                           +   '</div></div><br></br>'
            }
            $('#id_cockpit_utilitation_cpu_cores_div').html(cpuCoresHtml);
        },
        UpdateHealthSection: function(sectionData)
        {
            // Board temperature
            if(sectionData["boardTemperature"] != -128)
            {
                CockpitUi.SetProgressbarVal("id_cockpit_health_board_temperature_bar_div", sectionData["boardTemperature"], "°C");
            }
            else
            {
                this.ResetHealthSection();
            }
        },
        ResetHealthSection: function()
        {
            CockpitUi.ResetProgressbarVal("id_cockpit_health_board_temperature_bar_div");
        },
        UpdateDateTimeSection: function(sectionData)
        {
            $("#id_cockpit_datetime_timestamp_input").val(this.GetTimeStampString(sectionData["currentTimestamp"]));
            
            let systemUpTimeString = this.GetSystemUpTimeString(sectionData["systemUpTime"]);
            $("#id_cockpit_datetime_system_uptime_input").val(systemUpTimeString);
        },
        ResetDateTimeSection: function()
        {
            $("#id_cockpit_datetime_timestamp_input").val("N/A");
            $("#id_cockpit_datetime_system_uptime_input").val("N/A");
        },
        GetSystemUpTimeString: function(systemUpTimeSeconds)
        {
            let date = new Date(systemUpTimeSeconds * 1000);
            date = new Date(date.toISOString().slice(0, -1));
            
            let days     = Math.floor((systemUpTimeSeconds / (3600*24)));
            let daysPart = (days > 0)?(days + ":"):("");
            let hours     = this.CheckTime(date.getHours());
            let hoursPart = ((hours > 0) || (days > 0))?(this.CheckTime(date.getHours()) + ":"):("");
            let minutes = this.CheckTime(date.getMinutes());
            let seconds = this.CheckTime(date.getSeconds());
            let minutesSecondsPart = minutes + ":" + seconds
            let displayedTimeout = daysPart + hoursPart + minutesSecondsPart;
            return displayedTimeout;
        },
        CheckTime: function(i) {
            // add zero in front of numbers < 10
            if (i < 10)
                i = "0" + i;

            return i;
        },
        GetTimeStampString: function(timestamp)
        {
            if (timestamp === null)
            {
                return "";    
            }
            
            var dateTimeObject = new Date(timestamp / 1000);
            
            var dateTimeString = dateTimeObject.toLocaleString("de-DE", { 
                timeZone: "UTC", 
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit", 
                second: "2-digit"
            });
            
            //remove, if exist
            return dateTimeString.replace(","," ");
        },
        
        SetLedStatusAttrValue: function(ledName, statusCode)
        {
            let ledState = "";
            switch(statusCode) {
                case 0:
                    ledState = "off";
                break;
                
                case 1:
                    ledState = "on";
                break;
                
                case 2:
                    ledState = "flash05Hz";
                break;
                
                case 3:
                    ledState = "flash2Hz";
                break;
                
                case 4:
                    ledState = "alt05Hz";
                break;
                
                case 5:
                    ledState = "alt2Hz";
                break;
                
                default:
                    ledState = "undefined";
            }
            $('[id="id_cockpit_status_indicator_' + ledName + '_led_span"]').attr("led-state", ledState);
            
        },
        SetLedColorAttrValue: function(ledName, colorCode)
        {
            let ledColor = "";
            // Check Green
            if((colorCode & 65536))
            {
                ledColor = "green";
            }
            // Check Yellow
            if((colorCode & 131072))
            {
                if(ledColor.length > 0)
                {
                    ledColor += "|";
                }
                ledColor += "yellow";
            }
            // Check Red
            if((colorCode & 262144))
            {
                if(ledColor.length > 0)
                {
                    ledColor += "|";
                }
                ledColor += "red";
            }
            $('[id="id_cockpit_status_indicator_' + ledName + '_led_span"]').attr("led-color", ledColor);
        },
        UpdateLedStatusLedValue: function(ledElement)
        {
            let ledState = $(ledElement).attr("led-state");
            switch (ledState) {
              case "off":
                    this.SwitchOffLed(ledElement);
                break;
              case "on":
                    this.SwitchOnLed(ledElement);
                break;
              case "flash05Hz":
                    this.Flash05HzLed(ledElement);
                break;
              case "flash2Hz":
                    this.Flash2HzLed(ledElement);
                break;
              case "alt05Hz":
                this.Alter05HzLed(ledElement);
                break;
              case "alt2Hz":
                this.Alter2HzLed(ledElement);
                break;
              case "": // not set yet
                break;
              default:
                console.log("Undefined led state of " + ledState);
            }
        },
        ResetLedColors: function(ledElement)
        {
            $(ledElement).removeClass (function (index, className) {
                return (className.match (/(^|\s)led-\S+/g) || []).join(' ');
            });
        },
        SetLedColor: function(ledElement, color)
        {
            let elementColorClass = "led-" + color;
            if($(ledElement).hasClass(elementColorClass))
            {
                return true;
            }
            this.ResetLedColors(ledElement);
            switch (color)
            {
                case "green":
                case "red":
                case "yellow":
                    $(ledElement).addClass(elementColorClass);
                break;
                default:
                    console.log("Failed to set led color '" + color + "' for item " + $(ledElement).attr("id") + ".");
                    return false;
            }
            return true;
        },
        ToggleLedColor: function(ledElement)
        {
            let color = $(ledElement).attr("led-color");
            let elementColorClass = "led-" + color;
            if($(ledElement).hasClass(elementColorClass))
            {
                this.SwitchOffLed(ledElement);
            }
            else
            {
                this.ResetLedColors(ledElement);
                this.SetLedColor(ledElement, color);
            }
        },
        AlternateLedColor(ledElement, color1, color2)
        {
            let elementColor1Class = "led-" + color1;
            let elementColor2Class = "led-" + color2;
            if(!$(ledElement).hasClass(elementColor1Class) && !$(ledElement).hasClass(elementColor2Class))
            {
                this.SetLedColor(ledElement, color1);
            }
            else if($(ledElement).hasClass(elementColor1Class))
            {
                this.ResetLedColors(ledElement);
                this.SetLedColor(ledElement, color2);
            }
            else if($(ledElement).hasClass(elementColor2Class))
            {
                this.ResetLedColors(ledElement);
                this.SetLedColor(ledElement, color1);
            }
        },
        SwitchOffLed: function(ledElement)
        {
            this.ResetLedColors(ledElement);
        },
        SwitchOnLed: function(ledElement)
        {
            let color = $(ledElement).attr("led-color");
            this.SetLedColor(ledElement, color);
        },
        Flash05HzLed: function(ledElement)
        {
            this.ToggleLedColor(ledElement);
        }
        ,
        Flash2HzLed: function(ledElement)
        {
            if((this.uiUpdateCounter % 4) == 0)
            {
                this.ToggleLedColor(ledElement);
            }
        },
        Alter05HzLed: function(ledElement)
        {
            let alterColors = $(ledElement).attr("led-color").split("|");
            if(alterColors.length != 2)
            {
                console.log("Failed to alternate colors for item with id " + $(ledElement).attr("id") + ". Given colors count != 2.");
                return false;
            }
            this.AlternateLedColor(ledElement, alterColors[0], alterColors[1]);
        },
        Alter2HzLed: function(ledElement)
        {
            let alterColors = $(ledElement).attr("led-color").split("|");
            if(alterColors.length != 2)
            {
                console.log("Failed to alternate colors for item with id " + $(ledElement).attr("id") + ". Given colors count != 2.");
                return false;
            }
            if((this.uiUpdateCounter % 4) == 0)
            {
                this.AlternateLedColor(ledElement, alterColors[0], alterColors[1]);
            }
        }
    }

    return Public;

})();

DeviceInterfaceService = (function () {

    let Public = {

        GetDiagDataSectionsPromise: function (dataSectionsNames) {
            let queryString = "";
            $.each( dataSectionsNames, function( key, sectionName ) {
                queryString += sectionName + "&";
            });
            if(queryString.length > 0)
            {
                queryString = queryString.slice(0, -1);
            }
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = Private.OnConnectionError;
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dpScriptName + "GetDataSections?" + queryString,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },
        HasControlPermissions: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.dpScriptName + "HasControlPermissions",
                                                            AjaxInterface.AjaxRequestType.GET,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && typeof response["result"] !== "undefined")
            {
                return response.result;
            }
            return null;
        },
        RestartController: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.dpControlScriptName + "RestartController",
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
        },
        ResetControllerToFactoryDefault: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.dpControlScriptName + "ResetControllerToFactoryDefault",
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
        },
        GetWbmModuleName: function()
        {
            return Private.wbmModuleName;
        },
        IsRunStopSwitchSupported: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.dpScriptName + "IsRunStopSwitchSupported",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && typeof response["result"] !== "undefined")
            {
                return response.result;
            }
            return null;
        },
        IsRunStopSwitchInRun: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.dpScriptName + "IsRunStopSwitchInRun",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && typeof response["result"] !== "undefined")
            {
                return response.result;
            }
            return null;
        }
    }

    let Private = {
        wbmModuleName: "Di",
        dpScriptName: "module/Di/DeviceInterfaceDp/",
        dpControlScriptName: "module/Di/DeviceInterfaceControlDp/",
        OnConnectionError: function(xhr, status, error)
        {
            
        }
        
    }

    return Public;

})();
