SubPageActive = true;

Home_ActiveTipOfTheDayNumber = 0;

HOME_MIN_DISPLAY_DURATION = 5; // 5 seconds

Home_TriggerSwitchToNextTipOfDayTimer = undefined;

function CleanUpPageData()
{
    delete SubPageActive;

    delete Home_ActiveTipOfTheDayNumber;

    delete HOME_MIN_DISPLAY_DURATION;

    window.clearTimeout(Home_TriggerSwitchToNextTipOfDayTimer);
    delete Home_TriggerSwitchToNextTipOfDayTimer;
}

$(document).ready(function()
{
    UpdateArtnameInfo();
    // Build Tip of the day items
    let result = BuildTipOfTheDayItems();
    if(result == true)
    {
        TriggerSwitchToNextTipOfDay();
        LanguageManager.SetupUrlVariables();
        Language.UpdateActivePageMessages();
    }
});


function UpdateArtnameInfo()
{
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                            "InfoValues.cgi?artname",
                            AjaxInterface.AjaxRequestType.POST,
                            AjaxInterface.AjaxRequestDataType.TEXT, 
                            "", null);

    $(document).prop('title', AjaxInterface.PerformSyncRequest(ajaxReqConfig) + " - Home");
}

function TriggerSwitchToNextTipOfDay()
{
    try
    {
        if(typeof SubPageActive === "undefined" || SubPageActive == false || typeof Home_ActiveTipOfTheDayNumber  === "undefined")
        {
            return false;
        }
        let prev_actipTipOfTheDayNumber = Home_ActiveTipOfTheDayNumber;
        Home_ActiveTipOfTheDayNumber++;
        /*
        $("#id_lanconfig_status_div span:not('.exclude')").each(function(){
            $(this).hide();
        });
        */
        let tipOfDayEntriesLength = $("#id_home_tip_of_the_day_entries_div").find('div:not(".exclude")').length;
        if(tipOfDayEntriesLength > 0)
        {
            
            if(typeof Home_ActiveTipOfTheDayNumber  !== "undefined")
            {
                if(Home_ActiveTipOfTheDayNumber > tipOfDayEntriesLength)
                {
                    Home_ActiveTipOfTheDayNumber = 1;
                }
                if(tipOfDayEntriesLength > 1)
                {
                    // Hide last active Tip of the day
                    $("#id_home_tipoftheday_" + prev_actipTipOfTheDayNumber + "_div").fadeOut(600,function(){
                        // Show next tip of the day
                        $("#id_home_tipoftheday_" + Home_ActiveTipOfTheDayNumber + "_div").fadeIn(600);
                    });
                }
                let displayDuration = parseInt($("#id_home_tipoftheday_" + Home_ActiveTipOfTheDayNumber + "_div").attr("duration"));
                if(displayDuration < HOME_MIN_DISPLAY_DURATION)
                {
                    displayDuration = HOME_MIN_DISPLAY_DURATION;
                }
    
                Home_TriggerSwitchToNextTipOfDayTimer = setTimeout(TriggerSwitchToNextTipOfDay, (displayDuration * 1000));
            }
            
        }
        else
        {
            return false;
        }
    }
    catch(e)
    {
        log.debug("TriggerSwitchToNextTipOfDay - exception occurred", e);
    }
}

function BuildTipOfTheDayItems()
{
    let result = false;
    
    // Load WBM Device configs
    WbmUtilities.ReadDeviceWbmConfigs();
    if(typeof DeviceWbmConfigsLoaded !== "undefined" && DeviceWbmConfigsLoaded == true && typeof DeviceWbmConfigs.TipOfTheDayEntries !== "undefined")
    {
        if (DeviceWbmConfigs.TipOfTheDayEntries.length == 0)
        {
            $("#id_home_tip_of_the_day_div").hide();
            return false;
        }
        $(DeviceWbmConfigs.TipOfTheDayEntries).each(function(idx, tipOfTheDayEntry) {
            letItemNumber = (idx + 1);
            let display = (letItemNumber == 1)?("inline-block"):("none");
            let tipOfTheDayItemHtml = '<div style="display:' + display + '; margin-left:200px;" id="id_home_tipoftheday_' + letItemNumber + '_div" item-number="' + letItemNumber + '" duration="' + tipOfTheDayEntry.Duration + '">';
            $(tipOfTheDayEntry.TextLines).each(function(idx, textLine) {
                
                tipOfTheDayItemHtml += '<span style="display:inline-block;margin-left:' + textLine.MarginLeft + '; color: ' + textLine.TextColor + ';" class="' + textLine.ItemTextLangIdentifier + '"></span></br>';
            });
            tipOfTheDayItemHtml += '</div>';
            $("#id_home_tip_of_the_day_entries_div").append(tipOfTheDayItemHtml); 
        });
        result = true;
    }
    else
    {
        console.error("Failed to load Device WBM config file");
    }
    
    return result;
}
