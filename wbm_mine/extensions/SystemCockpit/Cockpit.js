SubPageActive = true;

function CleanUpPageData()
{
    
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete SubPageActive;
    CockpitUi.Reset();
    delete CockpitUi
    
    delete DeviceInterfaceUi;
    
    delete DeviceInterfaceService;
    delete SystemCockpitService;

    UserManagementUi.CleanUpData();
    delete UserManagementUi;
    delete UserManagementService;

    delete CockpitUtilities;
}

$(document).ready(function()
{
    CockpitUi.Initialize();
    
    CockpitUi.UpdateDiagData();
    Language.UpdateActivePageMessages();
    
    CockpitUi.Display();
    
    $(".collapsible").click(function () {
        let $cockpitContainer = $(this).parent().parent().parent();
        $cockpitContainer.find(".container-content").slideToggle('middle');
        if($cockpitContainer.hasClass('collapsed')) {
          $cockpitContainer.removeClass('collapsed');
          $(this).removeClass("pxc-btn-plus");
          $(this).addClass("pxc-btn-minus");
        } 
        else
        { 
          $cockpitContainer.addClass('collapsed');
          $(this).removeClass("pxc-btn-minus");
          $(this).addClass("pxc-btn-plus");
        }
    });
    
});

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}


CockpitUi = (function () {
    // Public Part
    let Public = {
        Initialize: function()
        {
            if(!Private.CheckTargetConfigAvailable())
            {
                console.warn("Cockpit - Failed to read target specific config");
                return false;
            }
            
            UserManagementUi.Initialize();
            
            DeviceInterfaceUi.InitDiagSections();

            PlcRuntimeUi.InitPlcDiagSections();
            
            Private.InitControlSection();
        },
        Display: function()
        {
            $("#id_cockpit_content").show();
        },
        Reset: function()
        {
            window.clearTimeout(Private.uiUpdateTimer);
            Private.uiUpdateTimer = null;
        },
        UpdateDiagData: function()
        {
            DeviceInterfaceUi.RunUpdateDiagDataCycle(Private.uiUpdateCounter);
            PlcRuntimeUi.RunUpdateDiagDataCycle(Private.uiUpdateCounter);
            
            
            $('#id_cockpit_content div.cockpit-progress-container').each(function (idx, element) {
                let widthPercent = $(element).width() / $(element).parent().width() * 100;
                if($(element).text() != "N/A")
                {
                    ((widthPercent == 0) && $(element).text())?($(element).css("color", "#0098A1")):($(element).css("color", "white"));
                }
            });
            
            Private.uiUpdateTimer = setTimeout(CockpitUi.UpdateDiagData, Private.UI_UPDATE_DURATION_MS);
        },
        ShowCockpitErrorMessage: function (errorLanTag, errorText) {
            Private.ClearCockpitMessageBox();
            if($("#id_webconfig_error_" + errorLanTag + "_span").length)
            {
                return;
            }
            let messageHtml = '<div class="c_cockpit_error_message_box" style="margin: 3px 0;">'
                + '<div class="pxc-error-general-msg-wrp"><div class="pxc-error-msg">'
                + '<div class="pxc-exclamation"><div>!</div></div>'
                + '<span class="pxc-msg-txt ' + errorLanTag + '" id="id_cockpit_error_' + errorLanTag + '_span"></span>'
                + '<span class="c_cockpit_error_message" style="display: inline-block; margin: 0 24px;"></span>'
                + '<span style="display: inline-block; margin: 0 -20px;">' + errorText + '</span>'
                + '<button class="pxc-btn-remove" id="id_cockpit_msg_hide_btn" style="float: right; display: inline-block; transform: translate(-50%, -50%);" onclick="CockpitUi.ClearCockpitMessageBox()"></button>'
                + '</div></div></div>';
                
            let errorMessage = $(messageHtml).hide();
            $("#" + Private.globalMessagesContainerId).append(errorMessage);
            $("#" + Private.globalMessagesContainerId).find("div.c_cockpit_error_message_box").fadeIn("slow");
            Language.UpdateActivePageMessages();
        },
        ShowCockpitInfoMessage: function (messageLanTag) {
            Private.ClearCockpitMessageBox();
            let messageHtml = '<div class="c_cockpit_info_message_box" style="margin: 3px 0;">'
                + '<div class="pxc-info-general-msg-wrp"><div class="pxc-info-msg">'
                + '<div class="pxc-information"><div>!</div></div>'
                + '<span class="pxc-msg-txt ' + messageLanTag + '"></span>'
                + '<button class="pxc-btn-remove" id="id_cockpit_msg_hide_btn" style="float: right; display: inline-block; transform: translate(-50%, -90%);" onclick="CockpitUi.ClearCockpitMessageBox()"></button>'
                + '</div></div></div>';
                
            let infoMessage = $(messageHtml).hide();
            $("#" + Private.globalMessagesContainerId).append(infoMessage);
            $("#" + Private.globalMessagesContainerId).find("div.c_cockpit_info_message_box").fadeIn("slow");

            Language.UpdateActivePageMessages();
        },
        ClearCockpitMessageBox: function()
        {
            Private.ClearCockpitMessageBox();
        },
        SetProgressbarVal: function(elementId, value, unit)
        {
            let progressbarWidth = value;
            if(value > 0 && value < 7)
            {
                progressbarWidth = 6;
            }
            $("#" + elementId).text(value + unit);
            $("#" + elementId).width(progressbarWidth + "%");
        },
        ResetProgressbarVal: function(elementId)
        {
            $("#" + elementId).text("N/A");
            $("#" + elementId).width("0%");
            $("#" + elementId).css("color", "#666A6E");;
        }
    }

    // Private Part
    let Private = {
        UI_UPDATE_DURATION_MS: 500,
        globalMessagesContainerId: "id_cockpit_global_messages_div",
        uiUpdateTimer: undefined,
        uiUpdateCounter: 0,
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
        InitControlSection: function()
        {
            if(typeof DeviceWbmConfigs["Cockpit"]["ControlSection"]["Enabled"] !== "undefined" && DeviceWbmConfigs["Cockpit"]["ControlSection"]["Enabled"] == false)
            {
                return;
            }
            
            let enabledControlSectionsCtr = 0;

            if(SystemCockpitService.ControlSectionEnabled() == true)
            {
                if(DeviceWbmConfigs["Cockpit"]["ControlSection"]["DeviceControl"]["Enabled"] == true)
                {
                    DeviceInterfaceUi.InitControlSection();
                    enabledControlSectionsCtr++;
                }
                if(DeviceWbmConfigs["Cockpit"]["ControlSection"]["PlcControl"]["Enabled"] == true)
                {
                    PlcRuntimeUi.InitControlSection();
                    enabledControlSectionsCtr++;
                }
            }

            if(   (typeof DeviceWbmConfigs["Cockpit"]["ControlSection"].UserPasswordChange === "undefined")
                   || (DeviceWbmConfigs["Cockpit"]["ControlSection"].UserPasswordChange.Enabled == true))
            {
                UserManagementUi.EnableControlSection(enabledControlSectionsCtr);
                enabledControlSectionsCtr++;
            }

            if(enabledControlSectionsCtr > 0)
            {
                $("#id_cockpit_control_box").show();
            }
            else
            {
                $("#id_cockpit_control_box").hide();
            }
        },
        CheckTargetConfigAvailable: function()
        {
            if(typeof DeviceWbmConfigs === "undefined" || typeof DeviceWbmConfigs["Cockpit"] === "undefined")
            {
                return false;
            }
            return true;
        },
        ClearCockpitMessageBox: function () {
            $("#" + this.globalMessagesContainerId).find("div.c_cockpit_info_message_box").remove();
            $("#" + this.globalMessagesContainerId).find("div.c_cockpit_error_message_box").remove();
        },
    }
    
return Public;
})();


CockpitUtilities = (function () {

    let Public = {

        BytesToSize(bytes) {
           let sizes = ['Bytes', 'KB', 'MB', 'GB'];

           if (!+bytes)
           {
               return '0 Byte';
           }
           const i = Math.floor(Math.log(bytes) / Math.log(1000))

           return `${parseFloat((bytes / Math.pow(1000, i)).toFixed(2))} ${sizes[i]}`
        }
    }

    let Private = {
    }

    return Public;

})();

SystemCockpitService = (function () {

    let Public = {

        ControlSectionEnabled: function () {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "ControlSectionEnabled",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if (typeof response !== "undefined" && response != null)
            {   
                return response["result"];
            }
            else
            {
                console.error("Failed to check control section status");
                return null;
            }
        }
    }

    let Private = {
        dpScriptName: "module/SystemCockpit/SystemCockpitDp/"
    }

    return Public;

})();

