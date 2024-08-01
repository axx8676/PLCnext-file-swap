var DeviceWbmConfigsLoaded = false;

var GlobalInternallySelectedPageHref = "Home.html";

WbmUtilities = (function () {
    // Public Part
    let Public = {
        EncodeHtmlEntities: function(data)
        {
            let textArea = document.createElement('textarea');
            textArea.innerText = data;
            return textArea.innerHTML.replace(/<br\s?\/?>/g,"\n");
        },
        ReadDeviceWbmConfigs: function()
        {
            if(DeviceWbmConfigsLoaded == true)
            {
                return true;
            }
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("DeviceWbmConfigs.txt", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.SCRIPT, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                if(typeof DeviceWbmConfigs !== undefined)
                {
                    console.log("Device Wbm Configs", DeviceWbmConfigs);
                    DeviceWbmConfigsLoaded = true;
                }
                else
                {
                    console.log("Object DeviceWbmConfigs does not exist in the config file");
                    return false;
                }
            }
            else
            {
                console.log("Failed to read Device Wbm config file with error = " + error);
                return false;
            }
            return true;
        },
        GetPageUrlParameters: function(urlString)
        {
            let urlParameters = {};
            
            let urlElements = urlString.split('#');
            if(urlElements.length != 2)
            {
                if((urlElements.length == 1) && (urlElements[0].includes("wbm/Login.html") == true))
                {
                    let subPageUrlElements = {};
                    urlParameters.Type = "LegacyPage";
                    subPageUrlElements.pageName  = "Login";
                    subPageUrlElements.modulName = undefined;
                    urlParameters.subPageUrlElements = subPageUrlElements;
                }
                else
                {
                    urlParameters.Type = "Unknown";
                }
            }
            else
            {
                if(urlElements[1].length == 0)
                {
                    if(urlElements[0].includes("wbm/Login.html"))
                    {
                        let subPageUrlElements = {};
                        urlParameters.Type = "LegacyPage";
                        subPageUrlElements.pageName  = "Login";
                        subPageUrlElements.modulName = undefined;
                        urlParameters.subPageUrlElements = subPageUrlElements;
                    }
                    else
                    {
                        urlParameters.Type = "EmptyLink";
                    }
                }
                else if(urlElements[1] == GlobalInternallySelectedPageHref)
                {
                    urlParameters.Type = "Home";
                }
                else
                {
                    let subPageUrlElements = {};
                    let menuEntryId = null;
                    subPageUrlElements = Private.ExtractSubPageUrlElements(urlElements[1]);
                    urlParameters.subPageUrlElements = subPageUrlElements;
                    // WBM module page
                    if((typeof subPageUrlElements.moduleName !== "undefined") && (typeof subPageUrlElements.pageName !== "undefined"))
                    {
                        urlParameters.Type = "ModulePage";
                    } // WBM legacy page
                    else if(typeof subPageUrlElements.pageName !== "undefined")
                    {
                        urlParameters.Type = "LegacyPage";
                    }
                }
            }
            return urlParameters;
        },
        //CheckWbmFileExists: function(localPath)
        //{
        //    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(localPath, AjaxInterface.AjaxRequestType.GET,
        //                                                                AjaxInterface.AjaxRequestDataType.HEAD, "", null);
        //    let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        //    return (result != null)
        //},
        CheckWbmFileExists: function(filePath)
        {
            let fileExists = false;
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("Utilities.cgi?WbmFileExists",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            filePath,
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response.error == false)
            {
                return response.result;
            }
            return false;
        },
        ListAllWbmLanguageFiles: function()
        {
            let fileExists = false;
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("Utilities.cgi?ListTotalWbmLanguagesFiles",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(response != null && response.error == false)
            {
                return response.result;
            }
            return false;
        },
        GetTimeExpirationObject: function(timeToExpireInHours)
        {
            let expirationObject = {};
            if(timeToExpireInHours < 24 && timeToExpireInHours >= 0)
            {
                expirationObject.value = timeToExpireInHours;
                expirationObject.unit = "hours";
            }
            else if(timeToExpireInHours >= 24)
            {
                expirationObject.value = Math.floor(timeToExpireInHours / 24);
                (Math.floor(timeToExpireInHours / 24) > 1)?(expirationObject.unit = "days"):(expirationObject.unit = "day");
            }
            else
            {
                expirationObject.value = -1;
                expirationObject.unit = "n/a";
            }
            return expirationObject;
        },
        BytesToSize: function(bytes) {
            var sizes = ['Bytes', 'KB', 'MB'];
            var size = '0 Bytes';
            if (bytes != 0)
            {
                var intval = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)));
                size = (bytes / Math.pow(1000, intval)).toFixed(1) + ' ' + sizes[intval]
            }
            return size;
        }
    }
    
    // Private Part
    let Private = {
        ExtractSubPageUrlElements: function(subPageUrlPart)
        {
            let pageUrlElements = {};
            let modulePageMatch = subPageUrlPart.match(/^extensions\/([^&]+?)\/([^&]+)(.html?)/);
            let legacyPageMatch = subPageUrlPart.match(/^((?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)(.html?)/);
            if((modulePageMatch != null) && (modulePageMatch.length == 4))
            {
                pageUrlElements.moduleName = modulePageMatch[1];
                pageUrlElements.pageName = modulePageMatch[2];
            }
            else if((legacyPageMatch != null) && (legacyPageMatch.length == 3))
            {
                pageUrlElements.pageName   = legacyPageMatch[1];
                pageUrlElements.moduleName = undefined;
            }
            
            return pageUrlElements;
        }
    }
    
return Public;
})();


function fShowPopUpWindow(url, width, height, scrollbars)
{
    event.preventDefault(); 
    
    var left = (screen.width/2)-(width/2);
    var top = (screen.height/2)-(height/2);
    var newWindow = window.open (url, "_blank", "width="+width+", height="+height+", top="+top+", left="+left+", scrollbars="+scrollbars);

    if (window.focus)
    {
        newWindow.focus();
    }
}

function fUnloadPageJsFromDom(pageMenuItemId)
{
    var htmlFileName = $("#" + pageMenuItemId).attr("href");
    if(typeof htmlFileName == 'undefined')
    {
        return;
    }
        
    var jsFileName = htmlFileName.replace('.html','') + ".js";
    
    var allsuspects = document.getElementsByTagName("script");
    for (var i = allsuspects.length; i >= 0; i--) //search backwards within nodelist for matching elements to remove
    {
        if (allsuspects[i] && allsuspects[i].getAttribute("src")!=null && allsuspects[i].getAttribute("src").indexOf(jsFileName)!=-1)
        {             
            allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
        }
    }    
}



function fReadJsonObjectFromFile(filePath)
{
    let jsonObject = {};   
    $.ajax({
        url: filePath,
        dataType: 'json',
        cache: true,
        async: false,
        success: function(data)
        {
            jsonObject = data;
        },
        error: function(xhr, status, error) {
            // check status && error
            console.log("Failed to read main menus config with error = " + error);
            jsonObject = null;
        }
    });
    return jsonObject;
}