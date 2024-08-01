
function CleanUpPageData() {

    delete DeviceInterfaceService;
    delete DeviceInterfaceUi;

}

$(document).ready(function () {
    DeviceInterfaceUi.UpdateGeneralData();
    MainPageUtilities.HideDivLoader();
    DeviceInterfaceUi.DisplayGeneralDataTable();
});

DeviceInterfaceUi = (function () {
    let Public = {

        UpdateGeneralData: function ()
        {
            let response = DeviceInterfaceService.GetGeneralData();
            if (response !== null && typeof response["result"]["GeneralData"] !== "undefined")
            {   let generalData = response["result"]["GeneralData"];
                $("#id_gd_device_type_value_span").text(generalData.articleName);
                $("#id_gd_order_nr_value_td").text(generalData.orderNumber);
                $("#id_gd_serial_nr_value_span").text(generalData.serialNumber);
                $("#id_gd_fw_version_value_span").text(generalData.fullFirmwareVersion);
                $("#id_gd_hw_version_value_span").text(generalData.hardwareVersion);
                $("#id_gd_fpga_version_value_span").text(generalData.fpgaVersion);
                if(  generalData["splcSupported"] == true && generalData["splcFirmwareVersion"] != ""
                   && WbmModules.CheckWbmModuleAvailable(SplcService.GetWbmModuleName()) == true)
                {
                    this.UpdateSplcGeneralData(generalData);
                }
            }
            else
            {
                $("#id_gd_device_type_value_span").text("N/A");
                $("#id_gd_order_nr_value_td").text("N/A");
                $("#id_gd_serial_nr_value_span").text("N/A");
                $("#id_gd_fw_version_value_span").text("N/A");
                $("#id_gd_hw_version_value_span").text("N/A");
                $("#id_gd_fpga_version_value_span").text("N/A");
            }
        },
        DisplayGeneralDataTable: function()
        {
            $("#id_generaldata_info_table").show();
        },
        UpdateSplcGeneralData: function(generalData)
        {   
            $("#id_generaldata_splc_info_table").show();
            
            // SPLC Firmware Version
            $("#id_gd_splc_fw_version_value_span").text(generalData.splcFirmwareVersion);
            
            // SPLC FPGA Version
            $("#id_gd_splc_fpga_version_value_span").text((generalData.splcFpgaVersion.length == 0)?("N/A"):(generalData.splcFpgaVersion));
            
            // SPLC Hardware Version
            let response = SplcService.ReadSettings("RevisionHw");
            if(response != null && response["error"] == false)
            {
                //let formattedRevisionHw = this.FormatRevisionHwStr(response["result"].value);
                $("#id_gd_splc_hw_version_value_span").text("N/A");
            }
            
            // SPLC Serial Number
            response = SplcService.ReadSettings("SerialNumber");
            if(response != null && response["error"] == false)
            {
                $("#id_gd_splc_serial_no_value_span").text(response["result"].value);
            }
        },
        FormatRevisionHwStr: function(revisionHw)
        {
            let revisionHwTemp = revisionHw;
            revisionHwTemp = revisionHwTemp.replaceAll(' ', '');
            let revisionItems = revisionHwTemp.split(',');
            if(revisionItems.length != 2)
            {
                return "N/A";
            }
            if(this.IsOldHwRevisionFormatAvailable(revisionItems) == false)
            {
                return (revisionItems[0] + " " + revisionItems[1]);
            }
            else
            {
                return (this.FormatRevisionHwItem(revisionItems[0]) + " " + this.FormatRevisionHwItem(revisionItems[1]));
            }
        },
        IsOldHwRevisionFormatAvailable: function(revisionItems)
        {
            if(revisionItems[0].length != 18)
            {
                return false;
            }
            return (revisionItems[0][15] != '-' && revisionItems[1][15] != '-');
        },
        FormatRevisionHwItem: function(revisionItem)
        {
            if(revisionItem.length != 18)
            {
                return "N/A";
            }
            // Swap bytes to get the formatted string
            let formattedRevisionItem = revisionItem[1] + revisionItem[0]
                                      + revisionItem[3] + revisionItem[2]
                                      + revisionItem[5] + revisionItem[4]
                                      + revisionItem[7] + revisionItem[6]
                                      + revisionItem[9] + revisionItem[8]
                                      + revisionItem[11] + revisionItem[10]
                                      + '-' + revisionItem[12] + revisionItem[15]
                                      + '-' + revisionItem[16] + revisionItem[17];
            return formattedRevisionItem;
        }
    }
    return Public;

})();

DeviceInterfaceService = (function () {

    let Public = {

        GetGeneralData: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetDataSection?SectionName=GeneralData",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        GetWbmModuleName: function()
        {
            return Private.moduleName;
        }
    }

    let Private = {
        dpScriptName: "module/Di/DeviceInterfaceDp/",
        moduleName: "Di"
    }

    return Public;

})();

SplcService = (function () {

    let Public = {

        ReadSettings: function (name)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "ReadSettings?name=" + name,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },
        GetWbmModuleName: function()
        {
            return Private.moduleName;
        }
    }

    let Private = {
        dpScriptName: "module/Splc/SplcConfigDp/",
        moduleName: "Splc"
    }

    return Public;

})();