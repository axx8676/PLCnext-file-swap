

$(document).ready(function()
{   
    LanguageManager.SetupUrlVariables();
    LanguageAlreadyInitialized = true;
    try
    {   
        Language.UpdateActivePageMessages();
    }
    catch(e)
    {
        console.error("An error occurred while loading Language.js", e);
    }
});

var Language = (function () {
    // Public Part
    let Public = {
        
        UpdateActivePageMessages: function()
        {
            return LanguageManager.UpdateActivePageMessages();
        },
        GetSelectedLanguage: function()
        {
            return LanguageManager.GetSelectedLanguage();
        },
        ChangeLanguage: function(hEvent, lang)
        {
            LanguageManager.ChangeLanguage(hEvent, lang);
        }
    }
    
    // Private Part
    let Private = {
    }
    
return Public;
})();

