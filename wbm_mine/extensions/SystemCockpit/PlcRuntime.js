$(document).ready(function()
{

    $("#id_cockpit_control_controller_stop_btn").click(function () {
        PlcRuntimeUi.StopPlc();
    });
    
    $("#id_cockpit_control_execute_hotstart_btn").click(function () {
        PlcRuntimeUi.StartPlc("Hot");
    });
    
    $("#id_cockpit_control_execute_warmstart_btn").click(function () {
       PlcRuntimeUi.StartPlc("Warm");
    });
    
    $("#id_cockpit_control_execute_coldstart_btn").click(function () {
       PlcRuntimeUi.StartPlc("Cold");
    });
    
    $("#id_cockpit_save_retain_data_btn").click(function () {
       PlcRuntimeUi.SaveRetainData();
    });
    
    $("#id_cockpit_restore_last_retain_data_btn").click(function () {
       PlcRuntimeUi.RestoreLastRetainData();
    });
    
});

PlcRuntimeUi = (function () {

    let Public = {
        
        InitPlcDiagSections: function()
        {
            Private.plcRuntimeEnabled = WbmModules.CheckWbmModuleAvailable(PlcRuntimeService.GetWbmModuleName());
            if(Private.plcRuntimeEnabled == false)
            {
                return false;
            }
            
            $.each( Private.uiPlcDiagSections, function( key, uiDiagSection ) {
                Private.InitDiagSection(uiDiagSection);
                
            });
        },
        InitControlSection: function()
        {
            if(WbmModules.CheckWbmModuleAvailable(PlcRuntimeService.GetWbmModuleName()) == false)
            {
                return false;
            }
            $("#id_cockpit_control_plc_content_div").css("display", "inline-block");
            if(PlcRuntimeService.HasControlPermissions() == true)
            {
                Private.InitControlSection();
            }

            Private.runStopSwitchSupported = DeviceInterfaceService.IsRunStopSwitchSupported();
            
            return true;
        },
        RunUpdateDiagDataCycle: function(updateCounter)
        {
            // Check if section is enabled
            if(Private.plcRuntimeEnabled == false)
            {
                return null;
            }
            // Update data every second
            if((Private.uiUpdateCounter++ % 2) != 0)
            {
                return false;
            }
            PlcRuntimeService.GetPlcRuntimeStatus()
            .then(function (data) {
                if(data["error"] == false)
                {
                    Private.UpdatePlcRuntimeSection(data["result"]);
                    Private.UpdatePlcRuntimeControlSection(data["result"]);
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
            return true;
        },
        StartPlc: function(startKind)
        {
            let response = PlcRuntimeService.StartPlc(startKind);
            if(response != null && response["result"] == false)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.plcStartError, response["errorText"]);
            }
            else if(response == null)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.plcStartError, "Bad Gateway");
            }
        },
        StopPlc: function()
        {
            let response = PlcRuntimeService.StopPlc();
            if(response != null && response["result"] == false)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.plcStopError, response["errorText"]);
            }
            else if(response == null)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.plcStopError, "Bad Gateway");
            }
        },
        SaveRetainData: function()
        {
            let response = PlcRuntimeService.SaveRetainData();
            if(response == null)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.saveRetainDataError, "Bad Gateway");
            }
            else if(response["result"] == false)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.saveRetainDataError, response["errorText"]);
            }
            else
            {
                CockpitUi.ShowCockpitInfoMessage(Private.messagesTags.retainDataSaved);
            }
        },
        RestoreLastRetainData: function()
        {
            let response = PlcRuntimeService.RestoreLastRetainData();
            if(response == null)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.restoreLastRetainDataError, "Bad Gateway");
            }
            else if(response["result"] == false)
            {
                CockpitUi.ShowCockpitErrorMessage(Private.messagesTags.restoreLastRetainDataError, response["errorText"]);
            }
            else
            {
                CockpitUi.ShowCockpitInfoMessage(Private.messagesTags.lastRetainDataRestored);
            }
        }
    }

    let Private = {
        uiUpdateCounter: 0,
        plcRuntimeEnabled: false,
        messagesTags: {
            restoreLastRetainDataError : "c_cockpit_restore_last_retain_data_error",
            lastRetainDataRestored     : "c_cockpit_last_retain_data_restored",
            saveRetainDataError        : "c_cockpit_save_retain_data_error",
            retainDataSaved            : "c_cockpit_retain_data_saved",
            plcStopError               : "c_cockpit_plc_stop_error",
            plcStartError              : "c_cockpit_plc_start_error",
        },
        plcStatusDpScriptName:  "module/PlcRuntime/PlcStatusDp/",
        plcControlDpScriptName: "module/PlcRuntime/PlcControlDp/",
        controlSectionEnabled: null,
        uiPlcDiagSections:
        {   
            enabled: true,
            PlcRuntime: {
                sectionName: "PlcRuntime",
                enabled: false,
                visible: false,
                targetConfig: null,
                sectionDivId: "id_cockpit_plcruntime_box_div",
                initSectionContent: null,
                updateSectionContent: "UpdatePlcRuntimeSection",
                resetSectionContent: "ResetPlcRuntimeSection",
            }
        },
        runStopSwitchSupported: false,
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
            else
            {
                $("#" + uiDiagSection.sectionDivId).show();
            }
            if(uiDiagSection.initSectionContent != null)
            {
                Private[uiDiagSection.initSectionContent]()
            }
        },
        InitControlSection: function()
        {
            this.controlSectionEnabled = true;
            $("#id_cockpit_control_controller_stop_btn").removeClass("disabled");
            $("#id_cockpit_control_controller_stop_btn").removeClass("disabled");
        },
        UpdatePlcRuntimeControlSection: function(runtimeStatus)
        {
            if(this.controlSectionEnabled != true)
            {
                return;
            }
            
            if(this.runStopSwitchSupported == true && DeviceInterfaceService.IsRunStopSwitchInRun() == false)
            {
                $("#id_cockpit_control_execute_hotstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_warmstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_coldstart_btn").addClass("disabled");
                
                $("#id_cockpit_control_controller_stop_btn").addClass("disabled");
                
                $("#id_cockpit_save_retain_data_btn").addClass("disabled");
                $("#id_cockpit_restore_last_retain_data_btn").addClass("disabled");
            }
            else if(runtimeStatus["plcState"].startsWith('Ready'))
            {
                $("#id_cockpit_control_execute_hotstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_warmstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_coldstart_btn").addClass("disabled");
                
                $("#id_cockpit_control_controller_stop_btn").addClass("disabled");
                
                $("#id_cockpit_save_retain_data_btn").removeClass("disabled");
                $("#id_cockpit_restore_last_retain_data_btn").removeClass("disabled"); 
            }
            else if(runtimeStatus["plcState"].startsWith('Stop'))
            {
                if(!runtimeStatus["plcState"].includes('FatalError'))
                {
                    if(runtimeStatus["plcState"].includes('Hot'))
                    {
                        $("#id_cockpit_control_execute_hotstart_btn").removeClass("disabled");
                    }
                    
                    $("#id_cockpit_control_execute_coldstart_btn").removeClass("disabled");
                    $("#id_cockpit_control_execute_warmstart_btn").removeClass("disabled");
                }

                $("#id_cockpit_control_controller_stop_btn").addClass("disabled");
                
                $("#id_cockpit_save_retain_data_btn").removeClass("disabled");
                $("#id_cockpit_restore_last_retain_data_btn").removeClass("disabled");  
            }
            else if(runtimeStatus["plcState"].startsWith('Running'))
            {
                $("#id_cockpit_control_execute_hotstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_warmstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_coldstart_btn").addClass("disabled");
                
                $("#id_cockpit_control_controller_stop_btn").removeClass("disabled");
                
                $("#id_cockpit_save_retain_data_btn").removeClass("disabled");
                $("#id_cockpit_restore_last_retain_data_btn").addClass("disabled");
            }
            else if(runtimeStatus["plcState"].startsWith('Halt'))   
            {
                $("#id_cockpit_control_execute_hotstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_warmstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_coldstart_btn").addClass("disabled");
                
                $("#id_cockpit_control_controller_stop_btn").removeClass("disabled");
                
                $("#id_cockpit_save_retain_data_btn").removeClass("disabled");
                $("#id_cockpit_restore_last_retain_data_btn").addClass("disabled");  
            }
            else
            {
                console.error("Unknown PLC state", runtimeStatus["plcState"]);
                $("#id_cockpit_control_execute_hotstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_warmstart_btn").addClass("disabled");
                $("#id_cockpit_control_execute_coldstart_btn").addClass("disabled");
                
                $("#id_cockpit_control_controller_stop_btn").addClass("disabled");
                
                $("#id_cockpit_save_retain_data_btn").addClass("disabled");
                $("#id_cockpit_restore_last_retain_data_btn").addClass("disabled"); 
            }
        },
        UpdatePlcRuntimeSection: function(runtimeStatus)
        {
            $("#id_cockpit_plcruntime_status_input").val(runtimeStatus["plcState"]);
            
            let usedProgramMemory = runtimeStatus["maxProgMemorySize"] - runtimeStatus["unusedProgMemorySize"];
            let programMemoryUsagePercent = Math.floor((usedProgramMemory/runtimeStatus["maxProgMemorySize"]) * 100);
            CockpitUi.SetProgressbarVal("id_cockpit_plcruntime_prog_memory_bar_div", programMemoryUsagePercent, "%");
            
            let programMemoryUsage = CockpitUtilities.BytesToSize(usedProgramMemory) + "/" + CockpitUtilities.BytesToSize(runtimeStatus["maxProgMemorySize"]);
            $("#id_cockpit_plcruntime_prog_memory_val_span").text(programMemoryUsage);
                        
            let dataMemoryUsagePercent = Math.floor((runtimeStatus["usedDataMemorySize"]/runtimeStatus["maxDataMemorySize"]) * 100);
            CockpitUi.SetProgressbarVal("id_cockpit_plcruntime_data_memory_bar_div", dataMemoryUsagePercent, "%");

            let dataMemoryUsage = CockpitUtilities.BytesToSize(runtimeStatus["usedDataMemorySize"]) + "/" + CockpitUtilities.BytesToSize(runtimeStatus["maxDataMemorySize"]);
            $("#id_cockpit_plcruntime_data_memory_val_span").text(dataMemoryUsage);
            
            let retainMemoryUsagePercent = 0;
            if(runtimeStatus["maxRetainMemorySize"] != 0)
            {
                retainMemoryUsagePercent = Math.floor((runtimeStatus["usedRetainMemorySize"]/runtimeStatus["maxRetainMemorySize"]) * 100);
            }
            CockpitUi.SetProgressbarVal("id_cockpit_plcruntime_retain_memory_bar_div", retainMemoryUsagePercent, "%");

            let retainMemoryUsage = "0 Byte/0 MB";
            if(runtimeStatus["maxRetainMemorySize"] != 0)
            {
                retainMemoryUsage = CockpitUtilities.BytesToSize(runtimeStatus["usedRetainMemorySize"]) + "/" + CockpitUtilities.BytesToSize(runtimeStatus["maxRetainMemorySize"]);
            }
            $("#id_cockpit_plcruntime_retain_memory_val_span").text(retainMemoryUsage);
            
            
        },
        ResetDiagSections: function()
        {            
            $("#id_cockpit_plcruntime_status_input").val("N/A");

            CockpitUi.ResetProgressbarVal("id_cockpit_plcruntime_prog_memory_bar_div");
            $("#id_cockpit_plcruntime_prog_memory_val_span").text("N/A");
            $("#id_cockpit_plcruntime_prog_memory_val_span").css("color", "#666A6E");
            
            CockpitUi.ResetProgressbarVal("id_cockpit_plcruntime_data_memory_bar_div");
            $("#id_cockpit_plcruntime_data_memory_val_span").text("N/A");
            $("#id_cockpit_plcruntime_data_memory_val_span").css("color", "#666A6E");
            
            CockpitUi.ResetProgressbarVal("id_cockpit_plcruntime_retain_memory_bar_div");
            $("#id_cockpit_plcruntime_retain_memory_val_span").text("N/A");
            $("#id_cockpit_plcruntime_retain_memory_val_span").css("color", "#666A6E");;
        },
        ResetPlcRuntimeSection: function()
        {
            CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_memory_bar_div");
            
            CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_user_partition_bar_div");
            
            CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_cpu_load_total_bar_div");
            
            let cpuCoreElements = $('#id_cockpit_utilitation_cpu_cores_div div.cpu-core-load');
            $.each( cpuCoreElements, function( idx, cpuCoreElement ) {
                let elementNumber = (idx + 1);
                CockpitUi.ResetProgressbarVal("id_cockpit_utilitation_cpu_" + elementNumber + "_load_bar_div");
            });
        },
    }

    return Public;

})();

PlcRuntimeService = (function () {

    let Public = {

        GetPlcRuntimeStatus: function () {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = Private.OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.plcStatusDpScriptName + "GetPlcRuntimeStatus",
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
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.plcStatusDpScriptName + "HasControlPermissions",
                                                            AjaxInterface.AjaxRequestType.GET,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response["result"] !== "undefined")
            {
                return response.result;
            }
            return null;
        },
        StartPlc: function(startKind)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.plcControlDpScriptName + "StartPlc?PlcStartKind=" + startKind,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response["result"] !== "undefined")
            {
                return response;
            }
            return null;
        },
        StopPlc: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.plcControlDpScriptName + "StopPlc",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response["result"] !== "undefined")
            {
                return response;
            }
            return null;
        },
        SaveRetainData: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.plcControlDpScriptName + "SaveRetainData",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response["result"] !== "undefined")
            {
                return response;
            }
            return null;
        },
        RestoreLastRetainData: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(Private.plcControlDpScriptName + "RestoreLastRetainData",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response["result"] !== "undefined")
            {
                return response;
            }
            return null;
        },
        GetWbmModuleName: function()
        {
            return Private.wbmModuleName;
        }
    }

    let Private = {
        wbmModuleName: "PlcRuntime",
        plcStatusDpScriptName:  "module/PlcRuntime/PlcStatusDp/",
        plcControlDpScriptName: "module/PlcRuntime/PlcControlDp/",
        OnConnectionError: function(xhr, status, error)
        {
            
        }
    }

    return Public;

})();