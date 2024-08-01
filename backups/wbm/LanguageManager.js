LANGUAGE_EXTENSION_FILE = "extensions/LanguagesConfig.json"

var GlobalCurrentWbmPage = localStorage.getItem("GlobalCurrentWbmPage");
var GlobalCurrentWbmModule = localStorage.getItem("GlobalCurrentWbmModule");

$(document).ready(function () {
    try
    {
        LanguageManager.SetupUrlVariables();
        WbmUtilities.ReadDeviceWbmConfigs();
        LanguageManager.UpdateLanguageFilesContent();
        
        let language = LanguageManager.GetSelectedLanguage();
        LanguageManager.LoadGlobalMessages(language);
        LanguageManager.LoadHelpInfoItems(language);
        
        LanguageManager.LoadPageMessages(GlobalCurrentWbmPage, GlobalCurrentWbmModule);
        
        //("a").removeClass("pxc-on");
        $("#id_lang_" + language).addClass("pxc-on");
    }
    catch(e)
    {
        console.error("An error occurred while loading LanguageManager.js", e);
    }
});

LanguageManager = (function () {
    // Public Part
    let Public = {
        SetupUrlVariables: function()
        {
            let urlParameters = WbmUtilities.GetPageUrlParameters(document.URL);
            if((urlParameters.Type == "ModulePage") || (urlParameters.Type == "LegacyPage"))
            {
                GlobalCurrentWbmPage   = urlParameters["subPageUrlElements"].pageName;
                GlobalCurrentWbmModule = urlParameters["subPageUrlElements"].moduleName;
            }
            else if(urlParameters.Type == "Home")
            {
                GlobalCurrentWbmPage   = "Home";
                GlobalCurrentWbmModule = undefined;
            }
            else
            {
                GlobalCurrentWbmPage = undefined;
                GlobalCurrentWbmModule = undefined;
            }
            
        },
        UpdateActivePageMessages: function()
        {
            try
            {
                // Load language files content if not loaded
                this.UpdateLanguageFilesContent();
                
            	let language = Language.GetSelectedLanguage();
            	this.LoadGlobalMessages(language);
                this.LoadPageMessages(GlobalCurrentWbmPage, GlobalCurrentWbmModule);
            }
            catch(e)
            {
                console.log("UpdateActivePageMessages - Type error", e);
            }
        },
        UpdateHomePageMessages: function()
        {
            try
            {
                let language = Language.GetSelectedLanguage();
                Language.LoadHelpInfoItems(language);
            }
            catch(e)
            {
                console.log("UpdateHomePageMessages - Type error", e);
            }
            
        },
        AddLanguageItemIfNotExisting: function(languageCode, languageName)
        {
            let langCode = languageCode.toLowerCase();
            let menuId = "id_lang_" + langCode;
            // If language item does not exist, create new item
            if(!$("#" + menuId).length)
            {
                let langItemHtml = '<li><a id="id_lang_' + langCode + '" href="#" onclick="LanguageManager.ChangeLanguage(event, \'' + langCode + '\')">' + languageName + '</a></li>';
                $("#id_lang_elements_ul").append(langItemHtml);
            }
        },
        ChangeLanguage: function(hEvent, lang)
        {
            this.SetupUrlVariables();
            Private.loadedLanguageFilesList = [];
            $("a").removeClass("pxc-on");
            $("#id_lang_"+lang).addClass("pxc-on");
            $.cookie("language", lang, {expires: 365, path:'/wbm'});
            /* update stored language */
            this.LoadPageMessages(GlobalCurrentWbmPage, GlobalCurrentWbmModule);
            
            this.LoadGlobalMessages(lang);
            this.LoadHelpInfoItems(lang);
            if (hEvent.preventDefault)
            {  // W3C variant
                hEvent.preventDefault();
            }
            else
            { // IE<9 variant:
                hEvent.returnValue = false;
            }
            // Trigger LanguageChanges custom event
            $.event.trigger({ type: "LanguageChanged", message: lang});
        },
        LoadGlobalMessages: function(language)
        {
            // Load WBM global messages
            Private.LoadGeneralGlobalMessages(language);
            // Load global messages of all registered WBM modules
            Private.LoadModulesGlobalMessages(language);
        },
        LoadPageMessages: function(pageName, moduleName)
        {
            if(((moduleName == "undefined") || (typeof moduleName === "undefined")) && (pageName != "undefined"))
            {
                // Legacy WBM page
                Private.LoadLegacyPageMessages(GlobalCurrentWbmPage);
            }
            else if((moduleName != "undefined") && (typeof moduleName !== "undefined") && (pageName != "undefined"))
            {
                // Module WBM page
                Private.LoadModulePageMessages(pageName, moduleName);
            }
        },
        LoadHelpInfoItems: function(language)
        {
            let languageFileUrl = "language/help_info_" + language + ".txt";
            if(!Private.CheckLanguageFileExists(languageFileUrl))
            {
                languageFileUrl = "language/help_info_en.txt";
            }
            Private.LoadMessagesFromFile(languageFileUrl, "oTxtHelpInfoContent");
        },
        ChangeTextLanguageFromObj: function(oDialogTxt)
        {
            /* set object values to html page */
            for(n in oDialogTxt)
            {
                if (n.startsWith("p_"))
                {
                    $("."+n).attr("placeholder", oDialogTxt[n]);
                }
                else if (n.startsWith("c_"))
                {
                    $("."+n).html(oDialogTxt[n]);
                }
                else
                {
                    $("#"+n).html(oDialogTxt[n]);
                }
            }
        },
        GetSelectedLanguage: function()
        {
            return (typeof $.cookie("language") !== 'undefined')?($.cookie("language")):("en");
        },
        UpdateLanguageFilesContent: function()
        {
            if(Private.languageFilesList.length != 0)
            {
                // Language files list was already loaded
                return true;
            }
            let result = Private.UpdateLanguageFilesList();
            if(result == false)
            {
                console.error("Failed to query wbm files list");
                return false;
            }
            
            return true;
        }
    }
    
    // Private Part
    let Private = {
        languageFilesList: [], 
        loadedLanguageFilesList: [],
        UpdateLanguageFilesList: function()
        {            
            this.languageFilesList = [];
            Language_LanguageFilesList = [];
            let languageFiles = WbmUtilities.ListAllWbmLanguageFiles();
            
            if(languageFiles != false)
            {
                Private.languageFilesList = languageFiles;
            }
            return (languageFiles != false);
        },
        CheckLanguageFileExists: function(fileurl)
        {
            let result = (this.languageFilesList.indexOf(fileurl) != -1);
            return result;
        },
        LoadGeneralGlobalMessages: function(language)
        {
            let languageFileUrl = "language/language_"+language+".txt";
            if(!this.CheckLanguageFileExists(languageFileUrl))
            {
                languageFileUrl = "language/language_en.txt";
            }
            Private.LoadMessagesFromFile(languageFileUrl, "oTxtMainContent");
        },
        LoadMessagesFromFile: function(filePath, langObjectName)
        {
            // Check content is already loaded
            //if(this.loadedLanguageFilesList.indexOf(filePath) == -1)
            if(this.loadedLanguageFilesList.indexOf(filePath) == -1)
            {
                let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(filePath,
                                                                AjaxInterface.AjaxRequestType.GET,
                                                                AjaxInterface.AjaxRequestDataType.SCRIPT,
                                                                "", null);
                let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
                if(response == null)
                {
                    console.log("Failed to load language object from file " + filePath);
                    return false;
                }
                this.loadedLanguageFilesList.push(filePath);
            }
            if(window[langObjectName] !== 'undefined')
            {
                Public.ChangeTextLanguageFromObj(window[langObjectName]);
                return true;
            }
            else
            {
                console.error("Failed to load language from object '" + langObjectName + "'. Object not defined");
            }
        },

        LoadModulesGlobalMessages: function(language)
        {
            let appliedModules = [];
            // Apply to modules with corresponding language registration
            let languageSupportModules = this.ListLanguageSupportModules(language);
            $.each(languageSupportModules, function(modu_idx, moduleName) {
                let languageFileUrl = "extensions/"+ moduleName + "/language/Global_" + language + ".txt";
                let languageFileExists = Private.CheckLanguageFileExists(languageFileUrl);
                if(!languageFileExists)
                {
                    languageFileUrl = "extensions/"+ moduleName + "/language/Global_en.txt";
                    console.warn("Language file for " + language + " not found for module " + moduleName + ". Trying with english");
                }
                if(!languageFileExists && !Private.CheckLanguageFileExists(languageFileUrl))
                {
                    console.warn("Language file for " + language + " not found for module " + moduleName + ". Updating of language elements will be skipped");
                }
                else
                {
                    Private.LoadMessagesFromFile(languageFileUrl, "oTxt_Global_Content");
                    appliedModules.push(moduleName);
                }
            });
            // Iterate over all other modules with general web registrations in order to set fallback language to english
            let wbmModulesWithRegistrations = WbmModules.ListWbmModulesWithRegistrations();
            $(wbmModulesWithRegistrations).each(function(menu_idx, wbmModuleName) {
               if(!appliedModules.includes(wbmModuleName))
               {
                    let languageFileUrl = "extensions/"+ wbmModuleName + "/language/Global_" + language + ".txt";
                    // English fallback
                    if(!Private.CheckLanguageFileExists(languageFileUrl))
                    {
                        languageFileUrl = "extensions/"+ wbmModuleName + "/language/Global_en.txt";
                    }
                    if(Private.CheckLanguageFileExists(languageFileUrl))
                    {
                        Private.LoadMessagesFromFile(languageFileUrl, "oTxt_Global_Content");
                    }
                    else
                    {
                        console.log("Global language file for " + language + " not found for module " + wbmModuleName + ". Updating of language elements will be skipped");
                    }
               }
            });
            
            // If the language is registred globaly, check if the module has language files stored
            if((typeof DeviceWbmConfigs !== "undefined") || (DeviceWbmConfigs["AdditionalLanguageSupport"] == undefined))
            {
                return true;
            }
            let additionalLangSupport = DeviceWbmConfigs["AdditionalLanguageSupport"];
            let langIsGlobalySupported = false;
            $(additionalLangSupport).each(function(lan_idx, languageConfig) {
                if(languageConfig.LanguageCode == language)
                {
                    langIsGlobalySupported = true;
                }
            });
            if(langIsGlobalySupported == false || GlobalCurrentWbmPage == "Login")
            {
                return true;
            }
        },
        LoadLegacyPageMessages: function(pageName)
        {
            let langObjectName = "oTxt_" + pageName + "_Content";
            let language = LanguageManager.GetSelectedLanguage();
            let languageFileUrl = "language/"+ pageName + "_" + language + ".txt";
            if(!Private.CheckLanguageFileExists(languageFileUrl))
            {
                if(language == "en")
                {
                    return false;
                }
                languageFileUrl = "language/"+ pageName + "_en.txt";
                // Check if fallback language "english" is supported
                if(!Private.CheckLanguageFileExists(languageFileUrl))
                {
                    return false;
                }
            }
            Private.LoadMessagesFromFile(languageFileUrl, langObjectName);
        },
        LoadModulePageMessages: function(pageName, moduleName)
        {
            let language = Public.GetSelectedLanguage();
            if(moduleName == null)
            {
                return false;
            }
            if(!this.CheckModuleSupportsLanguage(language, moduleName) && !this.CheckModuleHasGlobalLangSupport(language, moduleName, pageName) && (language != "en"))
            {
                console.log("Language " + language + " not supported in module " + moduleName + ". English will be used per default");
                language = "en";
            }
            
            let languageFileUrl = "extensions/"+ moduleName + "/language/" + pageName + "_" + language + ".txt";
            let langFileFound = true;
            if(!Private.CheckLanguageFileExists(languageFileUrl))
            {
                console.warn("Language file for " + language + " not found for module " + moduleName + ". Trying with english");
                languageFileUrl = "extensions/"+ moduleName + "/language/" + pageName + "_en.txt";
                langFileFound = false;
            }
            if(!langFileFound && !Private.CheckLanguageFileExists(languageFileUrl))
            {
                console.warn("Language file for " + language + " not found for module " + moduleName + ". Updating of language elements will be skipped");
                return false;
            }
            
            let langObjectName = "oTxt_" + pageName + "_Content";
            Private.LoadMessagesFromFile(languageFileUrl, langObjectName);
            
            return true;
        },
        ListLanguageSupportModules: function(language)
        {
            let languageSupportModules = [];
            // Read language extension configs
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(LANGUAGE_EXTENSION_FILE, AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.JSON, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                let languagesConfig = result.LanguagesConfig;
                $(languagesConfig).each(function(lan_idx, languageConfig) {
                    let langCode = languageConfig.LanguageCode.toLowerCase();
                    if(langCode == language)
                    {
                        languageSupportModules = Object.assign({},languageConfig.ModulesSupport);
                    }
                });
            }
            return languageSupportModules;
        },
        CheckModuleSupportsLanguage: function(language, module)
        {
            let languageSupported = false;
            // Read language extension configs
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(LANGUAGE_EXTENSION_FILE, AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.JSON, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                $(result["LanguagesConfig"]).each(function(lan_idx, languageConfig) {
                    let langCode = languageConfig.LanguageCode.toLowerCase();
                    if(langCode == language)
                    {
                        $(languageConfig.ModulesSupport).each(function(mod_idx, moduleName) {
                            if(moduleName == module)
                            {
                                languageSupported = true;
                            }
                        });
                    }
                });
            }
            return languageSupported;
        },
        CheckModuleHasGlobalLangSupport: function(language, moduleName, pageName)
        {
            if(DeviceWbmConfigsLoaded == false || DeviceWbmConfigs["AdditionalLanguageSupport"] == undefined)
            {
                return false;
            }
            let languageSupported = false;
            let additionalLangSupport = DeviceWbmConfigs["AdditionalLanguageSupport"];
            $(additionalLangSupport).each(function(lan_idx, languageConfig) {
                let langCode = languageConfig.LanguageCode.toLowerCase();
                if(langCode == language)
                {
                    let languageFileUrl = "extensions/"+ moduleName + "/language/" + pageName + "_" + language + ".txt";
                    if(Private.CheckLanguageFileExists(languageFileUrl))
                    {
                        languageSupported = true;
                    }
                }
            });
            return languageSupported;
        },
        CheckHasLanguageSupport: function(language, module, languagesConfig)
        {
            let languageSupported = false;
            $(languagesConfig).each(function(lan_idx, languageConfig) {
                let langCode = languageConfig.LanguageCode.toLowerCase();
                if(langCode == language)
                {
                    $(languageConfig.ModulesSupport).each(function(mod_idx, moduleName) {
                        if(moduleName == module)
                        {
                            languageSupported = true;
                        }
                    });
                }
            });
            return languageSupported;
        }
    }
    
return Public;
})();
