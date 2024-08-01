SESSION_WATCHER_UPDATE_TIMEOUT = 2000; // ms
PROJECT_NAME_UPDATE_TIMEOUT = 5000; // ms
GLOBAL_AJAX_REQUEST_TIMEOUT = 3000;

GlobalConnectionStatusOk = true;
ConnectionStatusOk = true;
var CurrentActiveWbmPage = "Main";
var DefaultWindowsAlert = window.alert;
var CurrentlySelectedLocationHref = "";

Main_Menus_Links_Requests = [
]

$(window).on('hashchange', function(e) {

    e.stopImmediatePropagation();
    if(CurrentlySelectedLocationHref == e.currentTarget.location.href)
    {
        e.preventDefault();
        return false;
    }
    let perfEntries = window.performance.getEntriesByType("navigation");
    if (perfEntries[0].type == "back_forward") {

        location.reload(true);
    }
    let newUrl = e.originalEvent.newURL;
    
    let urlParameters = WbmUtilities.GetPageUrlParameters(newUrl);
    let menuEntryId = null;

    if(urlParameters.Type == "EmptyLink")
    {
        $("#id_menu_main_subitem_home").click();
        e.originalEvent.newURL = e.originalEvent.newURL + "Home.html";
    }
    else if(urlParameters.Type == "LegacyPage")
    {
        menuEntryId = "id_menu_subitem_" + urlParameters["subPageUrlElements"].pageName.toLowerCase();
    }
    
    if((menuEntryId != null) && (urlParameters["subPageUrlElements"].pageName != 'LegalInformation'))
    {
        MainPageUtilities.UpdateSelectedMenuItemElements(urlParameters["subPageUrlElements"].pageName, urlParameters["subPageUrlElements"].moduleName, menuEntryId);
    }
});

$(document).ready(function()
{   
    WbmUtilities.ReadDeviceWbmConfigs();
    
    // Build Main Menu items
    $(Main_Menus_Links_Requests).each(function(idx, MenuConfig) {
        let result = MainPageUtilities.BuildMenuItems(MenuConfig.Menu, MenuConfig.LinksRequests);
        if(result == null)
        {
            console.error("Failed to list items for main menu", MenuConfig.Menu);
            return false;
        }
    });
    
    // Update Header fields
    MainPageUtilities.UpdateHeaderFields();

    // Build Modules Main Menu items
    MainPageUtilities.BuildModulesMainMenusItems();
    
    // Check of general language extensions are available and build the items if not existing
    MainPageUtilities.BuildMainLangExtensions();
    // Check if language extensions registered by the WBM modules are available and build the items if not existing
    MainPageUtilities.BuildModulesLangExtensions();
    
    MainPageUtilities.BuildHelpMenuItems();
    
    MainPageUtilities.UpdateSecurityProfileStatus();
    MainPageUtilities.UpdateIntegrityCheckStatus();
    MainPageUtilities.UpdatePasswordStatusFields();
    
    MainPageUtilities.SessionWatcherRun();
    
    MainPageUtilities.UpdateProjectName();
    
    Language.UpdateActivePageMessages();
    
    MainPageUtilities.HideDivLoader();
    //If the user enters the ip address only, the start page will appear.
    //In order to get this whole framework working properly, it is neccessary to have the name of the start page in the link.
    if ( (window.location.pathname.indexOf("Main.html") == -1) || (window.location.href.indexOf("Main.html#") == -1) )
    {
        window.location.href = "Main.html#Home.html";
    }
    // Add support for Promise if browser is Internet Explorer
    if(navigator.userAgent.indexOf("MSIE ") > -1 || navigator.userAgent.indexOf("Trident/") > -1)
    {
        ES6Promise.polyfill();
        ObjectAssign.polyfill();
    }
    
    //Initialize menu
    $("#id_div_mainmenu").tabs("#id_div_maincontentpanel",{effect: 'ajax', history: true});
    MainPageUtilities.InitMenuItem("overview");
    MainPageUtilities.InitMenuItem("config");
    MainPageUtilities.InitMenuItem("diagnostics");
    MainPageUtilities.InitMenuItem("security");
    MainPageUtilities.InitMenuItem("administration");
    
    GlobalInternallySelectedPageHref = $(this).attr('href');
    
    //setTimeout(MainPageUtilities.SetupModulesPagesEntries, 100);

    $('#id_main_menus_div a').one('click', function(event) {
        event.stopImmediatePropagation();
        
        let currentObjectId = $(this).attr('id');
        if(typeof currentObjectId != 'undefined' && currentObjectId != 'id_lnk_legalinformation')
        {
            MainPageUtilities.UpdateSelectedMenuItemElements($("#" + currentObjectId).attr("page_name"), $("#" + currentObjectId).attr("module_name"), currentObjectId);
            event.preventDefault();
        }
        return true;
    });
    $( "#id_main_menus_div a" ).contextmenu(function(event) {
      let itemhref = $("#" + event.target.id).attr("href");
      if(itemhref.charAt(0) != "#")
      {
          $("#" + event.target.id).prop("href", "#" + itemhref);
      }
    });

    $("#id_main_messages_box_div").on("click", ".msg-hide", function(event){
        $(this).parent().parent().addClass("hidden-by-user");
        MainPageUtilities.HideUserNotificationItem($(this).parent().parent().attr("id"));
        
        event.preventDefault(); 
        return false;
    });
    
    $("#id_main_session_prolong_button").on("click", function(event){
        
        timeout = Session.ProlongSession();
        event.preventDefault(); 
        return false;
    });
});

$(window).scroll(function(){
    if($(this).scrollTop() > 30)
    {
        $("#id_main_messages_box_div").addClass("sticky-err-header");
        $("#id_main_messages_box_div").css("width", $("#pxc-all").width());
    }
    else
    {
        $("#id_main_messages_box_div").removeClass("sticky-err-header");
        $("#id_main_messages_box_div").css("width", $("#pxc-all").width());
    }
});

MainPageUtilities = (function () {
    // Public Part
    let Public = {
        InitMenuItem: function(menuItem)
        {
            // Just fold all menu items on page load 
            if($.cookie("toggle_menu_"+menuItem) == "true")
            {
                $("#id_div_btn_menu_"+menuItem).css('backgroundPosition', '-97px -692px');
            }
            else
            {
                $("#id_div_btn_menu_"+menuItem).css('backgroundPosition', '-72px -716px');
                $("#id_menu_"+menuItem).slideToggle();
            }

            //Next section: bind the slidetoggle function to the clicks on the menu links and set the proper backgroundposition for the + - icon
            //Also change the backgroundposition on mouse hover in order to show the correct icon + -
            //The icon has four states: - unfolded and hovered, - unfolded and not hovered, - folded and unhovered, folded and hovered
            $('#id_div_btn_menu_'+menuItem+',#id_menu_title_'+menuItem).click(function()
            {
                var j = this.id.substr(this.id.lastIndexOf("_") + 1);
                $("#id_menu_"+j).slideToggle(function()
                {
                    if($(this).is(':visible'))
                    {
                        $('#id_div_btn_menu_'+j).css('backgroundPosition', '-97px -692px');
                        $.cookie("toggle_menu_"+j, "true", {expires: 365, path:'/wbm; Secure'});
                    }
                    else
                    {
                        $('#id_div_btn_menu_'+j).css('backgroundPosition', '-72px -716px');
                        $.cookie("toggle_menu_"+j, "false", {expires: 365, path:'/wbm; Secure'});
                    }
                });
            }).hover(function()
            {
                var j = this.id.substr(this.id.lastIndexOf("_") + 1);
                if($("#id_menu_"+j).is(':visible'))
                {
                    $("#id_div_btn_menu_"+j).css("backgroundPosition", "-379px -423px");
                }
                else
                {
                    $("#id_div_btn_menu_"+j).css("backgroundPosition", "-358px -443px");
                }
            }, function()
            {
                var j = this.id.substr(this.id.lastIndexOf("_") + 1);
                if($("#id_menu_"+j).is(':visible'))
                {
                    $("#id_div_btn_menu_"+j).css("backgroundPosition", "-97px -692px");
                }
                else
                {
                    $("#id_div_btn_menu_"+j).css("backgroundPosition", "-72px -716px");
                }
            });
        },
        HideDivLoader: function()
        {
            //console.log("### MAIN - hide loader");
            $("#id_main_div_loader").hide();
        },
        ShowDivLoader: function()
        {
            $("#id_main_div_loader").show();
        },
        ModulePageHrefOnMouseOut: function(event)
        {            
            event.stopImmediatePropagation();
            let itemhref = $("#" + event.target.id).attr("href");
            if(itemhref.charAt(0) == "#")
            {
               $("#" + event.target.id).prop("href", itemhref.replace("#", ""));
            }
        },

        BuildModulesMainMenusItems: function()
        {
            // Read modules main menu config from file
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("extensions/MainMenusConfig.json", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.JSON, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                let mainMenusConfig = result.MainMenusConfig;
                $(mainMenusConfig).each(function(menu_idx, menuConfig) {
                    let menuTitle = menuConfig.MenuTitle.toLowerCase();
                    let menuId = "id_menu_" + menuConfig.MenuTitle.toLowerCase();
                    // Check if menu exists, and create if missing
                    if(!$("#" + menuId).length)
                    {
                        MainPageUtilities.CreateNewMainMenu(menuTitle);
                    }
                    $(menuConfig.MenuItems).each(function(item_idx, menuItem) {
                        // add menu entry if it does not exist
                        let itemId = "id_menu_subitem_" + menuItem.ModuleName.toLowerCase() + "_" + menuItem.PageName.toLowerCase();
                        if(!$("#" + itemId).length)
                        {
                            MainPageUtilities.CreateMainMenuItem(menuItem, menuId);
                        }
                    });
                });
                Private.modulesMainMenusConfig = mainMenusConfig;
                Private.modulesPagesEntriesWasSetup = false;
            }
        },
        SetupModulesPagesEntries: function()
        {
            if(Private.modulesPagesEntriesWasSetup)
            {
                return false;
            }
            $(Private.modulesMainMenusConfig).each(function(menu_idx, menuConfig) {
                
                $(menuConfig.MenuItems).each(function(item_idx, menuItem) {
                    // add menu entry if it does not exist
                    let itemId = "id_menu_subitem_" + menuItem.ModuleName.toLowerCase() + "_" + menuItem.PageName.toLowerCase();
                    let elementHref = $("#" + itemId).attr("href");
                    if((typeof elementHref !== "undefined") && $("#" + itemId).length && (elementHref.charAt(0) != "#"))
                    {
                        $("#" + itemId).prop("href", "#" + elementHref);
                    }
                });
                Private.modulesPagesEntriesWasSetup = true;
                return true;
            });
        },
        BuildHelpMenuItems: function()
        {
            if(typeof DeviceWbmConfigsLoaded !== "undefined" && DeviceWbmConfigsLoaded == true && typeof DeviceWbmConfigs.HelpItems !== "undefined")
            {
                let orderNumberAjaxReqConfig = AjaxInterface.CreateSyncRequestConfig("InfoValues.cgi?ordernum", AjaxInterface.AjaxRequestType.POST,
                                                                               AjaxInterface.AjaxRequestDataType.HTML, "", null);
                let deviceOrderNumber = AjaxInterface.PerformSyncRequest(orderNumberAjaxReqConfig);
                $(DeviceWbmConfigs.HelpItems).each(function(idx, helpItem) {
                    
                    let itemWebLink = helpItem.ItemWeblink.replace('@@@OrderNumber@@@', deviceOrderNumber);
                    let helpInfoItemHtml = '<a href="' + itemWebLink + '" onclick="window.open(this.href); return false;" onkeypress="window.open(this.href); return false;" class="' + helpItem.ItemTextLangIdentifier + '"></a>';
                    $("#id_main_help_info_items_div").append(helpInfoItemHtml); 
                });
            }
            else 
            {    
                console.error("Failed to load Device WBM config file");
            }
        },
        BuildMenuItems: function(menuItem, mainMenuGetlinkRequests)
        {
            let result = true;
            
            $("#id_menu_" + menuItem).html("");
            $(mainMenuGetlinkRequests).each(function(idx, getLinkRequest) {
                let menuItemLinkAjaxReqConfig = AjaxInterface.CreateSyncRequestConfig(getLinkRequest, AjaxInterface.AjaxRequestType.POST,
                                                                        AjaxInterface.AjaxRequestDataType.HTML, "", null);
                let menuItemLink = AjaxInterface.PerformSyncRequest(menuItemLinkAjaxReqConfig);
                
                if(menuItemLink != null)
                {
                    $("#id_menu_" + menuItem).append(menuItemLink);
                }
                else
                {
                    result = false;
                    return false;
                }
            });
            return result;
        },
        CreateNewMainMenu: function(menuTitle)
        {
            let menuName = menuTitle.charAt(0).toUpperCase() + menuTitle.slice(1);
            let mainMenuHtml = '<div class="pxc-p-boxed">'
                             +     '<div class="c_btn_menuexpand c_btn_menu" id="id_div_btn_menu_' + menuTitle + '"></div>'
                             +     '<div class="pxc-filterpane">'
                             +         '<p class="pxc-filtertitle c_menu_title" id="id_menu_title_' + menuTitle + '">' + menuName + '</p>'
                             +             '<ul class="c_menu_list" id="id_menu_' + menuTitle + '">'
                             +             '</ul>'
                             +     '</div>'
                             + '</div>';
            $("#id_main_menus_div").append(mainMenuHtml);
            this.InitMenuItem(menuTitle);
        },
        CreateMainMenuItem: function(menuItem, menuId)
        {
            let getLinkRequestUrl = "PageLink.cgi?moduleName=" + menuItem.ModuleName + "&pageName=" + menuItem.PageName;
            let menuItemLinkAjaxReqConfig = AjaxInterface.CreateSyncRequestConfig(getLinkRequestUrl, AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.HTML, "", null);
            let menuItemLink = AjaxInterface.PerformSyncRequest(menuItemLinkAjaxReqConfig);
            if(menuItemLink != null)
            {
                $("#" + menuId).append(menuItemLink);
            }
        },
        UpdateProjectName: function()
        {
            if(typeof DeviceWbmConfigs !== undefined && DeviceWbmConfigs["DisplayProjectName"] == false)
            {
                $("#id_div_project_name").hide();
                return false;
            }
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig("PlcValues.cgi?projectname",
                                                                AjaxInterface.AjaxRequestType.POST,
                                                                AjaxInterface.AjaxRequestDataType.HTML,
                                                                "", null, 3000, null);
            
            // Request project name
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
            .then(function(response) {
                $("#id_main_project_name_span").text(": " + response);
                setTimeout(MainPageUtilities.UpdateProjectName, PROJECT_NAME_UPDATE_TIMEOUT);
            })
            .catch(function(errorObj) {
                console.log("Error while updating project name !!", errorObj);
                $("#id_main_project_name_span").text(": N/A");
                setTimeout(MainPageUtilities.UpdateProjectName, PROJECT_NAME_UPDATE_TIMEOUT);
            }); 
        },
        UpdateHeaderFields: function()
        {
            // HW version
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                                    "InfoValues.cgi?hwversion",
                                    AjaxInterface.AjaxRequestType.POST,
                                    AjaxInterface.AjaxRequestDataType.TEXT, 
                                    "", null);

            $("#id_main_info_hwversion").text(AjaxInterface.PerformSyncRequest(ajaxReqConfig));
            // SW-Version
            ajaxReqConfig.Url = "InfoValues.cgi?shortfwversion";
            $("#id_main_info_fwversion").text(AjaxInterface.PerformSyncRequest(ajaxReqConfig));
            
            // MAC
            ajaxReqConfig.Url = "InfoValues.cgi?mac[1]";
            $("#id_main_info_mac").text(AjaxInterface.PerformSyncRequest(ajaxReqConfig));
            
            // Home - Article name
            ajaxReqConfig.Url = "InfoValues.cgi?artname";
            $("#id_main_home_artname").text(AjaxInterface.PerformSyncRequest(ajaxReqConfig));
            
            // Home - Ordernumber
            ajaxReqConfig.Url = "InfoValues.cgi?ordernum";
            $("#id_main_home_ordernum").text(AjaxInterface.PerformSyncRequest(ajaxReqConfig));
        },
        UpdateSecurityProfileStatus: function()
        {
            let securtiyProfileStatus = Private.GetSecurityProfileStatus();
            if(securtiyProfileStatus == "Activated")
            {
                $("#id_main_activated_sp_div").show();
            }
            else if(securtiyProfileStatus == "Deactivated")
            {
                $("#id_main_deactivated_sp_div").show();
            }
        },
        UpdateIntegrityCheckStatus: function()
        {
            let securtiyProfileStatus = Private.GetSecurityProfileStatus();
            if(securtiyProfileStatus == "Activated")
            {
                let integrityCheckStatus = Private.GetIntegrityCheckStatus();
                if(integrityCheckStatus == true)
                {
                    $("#id_main_activated_sp_container_span").css('left', '38%');
                    $("#id_main_integrity_check_success_div").show();
                }
                else if (integrityCheckStatus == false)
                {
                    $("#id_main_activated_sp_container_span").css('left', '38%');
                    $("#id_main_integrity_check_failed_div").show();
                }
            }
        },
        UpdatePasswordStatusFields: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                                    Private.userManagementInfoDpScriptName + "GetPasswordInfo?",
                                    AjaxInterface.AjaxRequestType.POST,
                                    AjaxInterface.AjaxRequestDataType.JSON, 
                                    "", null);

            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if((response != null) && (response["error"] == false))
            {
				// Default password changed status
                if(response["result"]["isUsingInitialPassword"] == true)
                {
                     MainPageUtilities.DisplayUserNotificationItem("id_main_default_password_active_warning_div");
                }
                
                // Password expiration status
                let statusHtmlContent = Private.BuildPasswordStatusHtmlContent(response["result"]);
                if(statusHtmlContent == "")
                {
                    return true;
                }
                $("#id_main_password_expiration_warning_content").html(statusHtmlContent);
                
                MainPageUtilities.DisplayUserNotificationItem("id_main_password_expiration_warning_div");
            }
            return false;
        },
        BuildModulesLangExtensions: function()
        {
            
            let modulesLanguageConfig = WbmModules.GetLanguageSupportConfig();
            if(modulesLanguageConfig != null)
            {
                $(modulesLanguageConfig).each(function(lan_idx, languageConfig) {
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
        UpdateSelectedMenuItemElements: function(currentPageName, currentModuleName, currentObjectId)
        {
            var main_prevSelectedMenuItemId = localStorage.getItem("mainSelectedMenuItemIdKey");
            if(currentObjectId != main_prevSelectedMenuItemId)
            {
                MainPageUtilities.ShowDivLoader();
                setTimeout(MainPageUtilities.HideDivLoader, 300);
            }
            localStorage.setItem("mainSelectedMenuItemIdKey", currentObjectId);
            fUnloadPageJsFromDom(main_prevSelectedMenuItemId);
            GlobalCurrentWbmPage = $("#" + currentObjectId).attr("page_name");
            GlobalCurrentWbmModule = $("#" + currentObjectId).attr("module_name");
            localStorage.setItem("GlobalCurrentWbmPage", GlobalCurrentWbmPage);
            localStorage.setItem("GlobalCurrentWbmModule", GlobalCurrentWbmModule);   
        },
        SessionWatcherRun: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig("IsSessionValid.cgi?",
                                                                AjaxInterface.AjaxRequestType.POST,
                                                                AjaxInterface.AjaxRequestDataType.SCRIPT,
                                                                "", null, 7000, null);
            window.alert = function() { };
            // Check Session is Valid
            AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
            .then(function(data) {
                OnConnectionStatusok();
                window.alert = DefaultWindowsAlert;
                let date = new Date(timeout);
                date = new Date(date.toISOString().slice(0, -1));
                
                let remainingMinutes = Session.GetTotalTimeoutInMinutes();
                if((remainingMinutes < 2) && (isValid == true))
                {
                    if(MainPageUtilities.IsUserAuthenticationRequired())
                    {
                        MainPageUtilities.DisplayUserNotificationItem("id_main_session_timeout_warning_div");
                    }
                }
                else
                {
                    $("#id_main_session_timeout_warning_div").hide();
                    if(isValid == false)
                    {
                        window.location.href='Login.html';
                    }
                }
                MainPageUtilities.HideDivLoader();
            })
            .catch(function(errorObj) {
                console.log("Error while running session watcher !!", errorObj);
                OnMainConnectionError(errorObj.xhr, errorObj.status, errorObj.error);
                window.alert = DefaultWindowsAlert;
            });
            setTimeout(MainPageUtilities.SessionWatcherRun, SESSION_WATCHER_UPDATE_TIMEOUT);
        },
        IsUserAuthenticationRequired: function()
        {
            if(Private.userAuthenticationRequired == null)
            {
                Private.userAuthenticationRequired = Session.IsUserAuthenticationRequired();
            }
            return Private.userAuthenticationRequired;
        },
        HideUserNotificationItem: function(itemID)
        {
            if($("#" + itemID).is(":hidden"))
            {
                return false;
            }
            $("#" + itemID).hide();
            let disabledInfoItems = [];
            if(typeof sessionStorage["disabledInfoItems"] !== "undefined")
            {
                disabledInfoItems = JSON.parse(sessionStorage["disabledInfoItems"]);
            }
            if(disabledInfoItems.includes(itemID))
            {
                return false;
            }
            disabledInfoItems.push(itemID);
            sessionStorage.setItem('disabledInfoItems', JSON.stringify(disabledInfoItems));
            return true;
        },
        DisplayUserNotificationItem: function(itemID)
        {
            if(!$("#" + itemID).is(":hidden") || $("#id_main_session_timeout_warning_div").hasClass("hidden-by-user"))
            {
                return false;
            }
  
            let disabledInfoItems = [];
            if(typeof sessionStorage["disabledInfoItems"] !== "undefined")
            {
                disabledInfoItems = JSON.parse(sessionStorage["disabledInfoItems"]);
            }
            if(disabledInfoItems.includes(itemID))
            {
                return false;
            }
            $("#" + itemID).show();
            return true;
        }
    }
    
    // Private Part
    let Private = {
        systemIntegrityProviderScriptName: "module/SystemIntegrity/SystemIntegrityProvider/",
        userManagementInfoDpScriptName: "module/Um/UserManagementInfoDp/",
        userAuthenticationRequired: null,
        modulesPagesEntriesWasSetup: false,
        GetSecurityProfileStatus: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("module/Spm/SpmDp/GetActivationStatus",
                                                                AjaxInterface.AjaxRequestType.POST,
                                                                AjaxInterface.AjaxRequestDataType.HTML,
                                                                "",
                                                                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response == null || response.length == 0)
            {
                return "";
            }
            let jsonResponse = JSON.parse(response);
            if((jsonResponse != null) && (typeof jsonResponse !== "undefined") && (!jsonResponse.error))
            {   
                return jsonResponse.result;
            }
            else
            {
                console.error("Failed to get security profile status");
                return null;
            }
        },
        GetIntegrityCheckStatus: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(this.systemIntegrityProviderScriptName + "GetIntegrityCheckResult",
                                                                AjaxInterface.AjaxRequestType.POST,
                                                                AjaxInterface.AjaxRequestDataType.HTML,
                                                                "",
                                                                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response.length == 0)
            {
                return null;
            }
            let jsonResponse = JSON.parse(response);
            if((jsonResponse != null) && (typeof jsonResponse !== "undefined") && (!jsonResponse.error))
            {   
                return jsonResponse.result;
            }
            else
            {
                console.error("Failed to get integrity check status");
                return null;
            }
        },
        BuildPasswordStatusHtmlContent: function(passwordInfo)
        {
            let infoHtmlContent = "";
            if(typeof passwordInfo === "undefined")
            {
                return infoHtmlContent;
            }
            if(passwordInfo["passwordState"] == "WarnAboutExpiration")
            {
                let expirationObject = WbmUtilities.GetTimeExpirationObject(passwordInfo["timeToExpire"]);
                if(expirationObject["unit"] == "n/a")
                {
                    return infoHtmlContent;
                }
                let pluralDativeExtHtml = (expirationObject["unit"] == "days")?('<span id="id_main_user_password_expiration_dative_ext"  class="c_glb_plural_dative_ext pxc-msg-txt"   style="display:inline-block; margin-left: 0px;"></span>'):("");
                infoHtmlContent =   '<span id="id_main_user_password_expiration_warning" class="pxc-msg-txt c_main_password_expiration_text_warning"  style="display:inline-block; "></span>&nbsp;'
                                +   '<span id="id_main_user_password_expiration_value"   class="pxc-msg-txt" style="display:inline-block; margin-left: 0px;">' + expirationObject["value"] + '</span>&nbsp;'
                                +   '<span id="id_main_user_password_expiration_unit"    class="pxc-msg-txt c_glb_' + expirationObject["unit"] + '_header" style="display:inline-block; margin-left: 0px;"></span>'
                                +   pluralDativeExtHtml 
                                +   '<span id="id_main_user_password_expiration_warning_2" class="pxc-msg-txt c_main_password_expiration_text_warning_ext" style="display:inline-block; margin-left: 0px;"></span>';
                $("#id_main_password_expiration_warning_content").html
            }
            return infoHtmlContent;
        },
    }
    
return Public;
})();

function OnConnectionStatusok()
{
    if(GlobalConnectionStatusOk == false)
    {
        $("#id_main_connection_error_div").hide();
        GlobalConnectionStatusOk = true;
    }
}

function OnMainConnectionError(xhr, status, error)
{
    if(GlobalConnectionStatusOk == true)
    {
        console.log("Main - Connection error occurred: (" + error + ")");
        $("#id_main_connection_error_div").show();
        $("#id_main_session_timeout_warning_div").hide();
        GlobalConnectionStatusOk = false;
    }
}
