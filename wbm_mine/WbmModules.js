
$(document).ready(function()
{
    WbmModules.Initialize();
});

WbmModules = (function () {
    // Public Part
    var Public = {
        Initialize: function()
        {
            Private.UpdateModulesMainMenusConfig();
            Private.UpdateModulesLangConfig();
            
        },
        GetMainMenusConfig: function()
        {
            return Private.modulesMainMenusConfig;
        },
        GetLanguageSupportConfig: function()
        {
            return Private.modulesLangConfig;
        },
        ListWbmModulesWithRegistrations: function()
        {
            let modulesList = [];
            $(Private.modulesMainMenusConfig).each(function(menu_idx, menuConfig) {
               $(menuConfig.MenuItems).each(function(menu_idx, menuItem) {
                   if(!modulesList.includes(menuItem.ModuleName))
                   {
                       modulesList.push(menuItem.ModuleName);
                   }
                });
            });
            
            $(Private.modulesLangConfig).each(function(menu_idx, langConfig) {
                $(langConfig.ModulesSupport).each(function(menu_idx, moduleName) {
                   if(!modulesList.includes(moduleName))
                   {
                       modulesList.push(moduleName);
                   }
                });
            });
            return modulesList;
        },
        CheckWbmModuleAvailable: function(moduleName)
        {
            let fileExists = false;
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("WbmModuleAvailable.cgi?moduleName=" + moduleName,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response["result"] !== "undefined")
            {
                return response["result"];
            }
            return false;
        }
    }
    
    // Private Part
    var Private = {
        modulesMainMenusConfig: null,
        modulesLangConfig: null,
        UpdateModulesMainMenusConfig: function()
        {
            // Read modules main menu config from file
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("extensions/MainMenusConfig.json", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.JSON, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                this.modulesMainMenusConfig = result.MainMenusConfig;
            }
        },
        UpdateModulesLangConfig: function()
        {
            // Read language extension configs
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("extensions/LanguagesConfig.json", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.JSON, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                this.modulesLangConfig = result.LanguagesConfig;
            }
        }
    }
    
return Public;
})();
