var timeoutTimerInterval = 500;

var timeoutTimerHandle;
var timeout;
var sessionTimeoutT01 = null;

$(document).ready( function()
{   
    if(window.location.pathname.localeCompare("/wbm/") == 0 || window.location.pathname.indexOf("Login.html") > 0)
    {
        if(!Session.IsUserAuthenticationRequired())
        {
            window.location.href = "Main.html";
        }
    }
    else
    {
        if(!Session.IsSessionValid())
            window.location.href = "Login.html";
    
        timeout = Session.ProlongSession();
        if ((timeoutTimerHandle) == null && (Session.IsUserAuthenticationRequired()))
            timeoutTimerHandle = window.setTimeout("Session.TimeoutTimer();", timeoutTimerInterval);
    }
});

Session = (function () {
    // Public Part
    var Public = {
        IsUserAuthenticationRequired: function()
        {
            let authenticationRequired = true;
            
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("IsUserAuthenticationRequired.cgi", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.SCRIPT, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                authenticationRequired = isUserAuthenticationRequired;
            }
            else
            {
                console.warn("Failed to get authentication required state");
            }
            return authenticationRequired;
        },
        ProlongSession: function()
        {
            let sessionTimeout = 0;
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("ProlongSession.cgi", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.SCRIPT, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                sessionTimeout = timeout;
                sessionTimeoutT01 = Math.floor(performance.now());
            }
            else
            {
                console.log("Failed to get authentication required state with error = " + error);
            }

            return sessionTimeout;
        },
        TimeoutTimer: function()
        {
            let timeDiff = Math.floor(performance.now()) - sessionTimeoutT01;
            sessionTimeoutT01 = performance.now();
            
            timeout = timeout - timeDiff;

            if(timeout <= 0)
            {
                window.location.href='Login.html';
            }

            let date = new Date(timeout);
            date = new Date(date.toISOString().slice(0, -1));

            let days     = Math.floor((timeout / (3600*24*1000)));
            let daysPart = (days > 0)?(days + ":"):("");
            
            let hours     = Session.CheckTime(date.getHours());
            let hoursPart = ((hours > 0) || (days > 0))?(Session.CheckTime(date.getHours()) + ":"):("");
            
            let minutes = Session.CheckTime(date.getMinutes());
            let seconds = Session.CheckTime(date.getSeconds());
            let minutesSecondsPart = minutes + ":" + seconds
            let displayedTimeout = daysPart + hoursPart + minutesSecondsPart;
            
            $("#id_main_logout_timer_value").html(displayedTimeout);

            timeoutTimerHandle = window.setTimeout("Session.TimeoutTimer();", timeoutTimerInterval);
        },
        GetTotalTimeoutInMinutes: function()
        {
            let date = new Date(timeout);
            let minutes = timeout / (60*1000);
            return minutes;
        },
        IsSessionValid: function()
        {
            
            let sessionIsValid = false;
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("IsSessionValid.cgi", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.SCRIPT, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                sessionIsValid = isValid;
            }
            else
            {
                console.warn("Failed to get session valid state");
            }
            
            return sessionIsValid;
        },
        Logout: function()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("Logout.cgi", AjaxInterface.AjaxRequestType.GET,
                                                                        AjaxInterface.AjaxRequestDataType.HTML, "", null);
            let result = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if(result)
            {
                window.location.href = "Login.html";
            }
        },
        CheckTime: function(i) {
            // add zero in front of numbers < 10
            if (i < 10)
                i = "0" + i;

            return i;
        }
    }
    
    // Private Part
    var Private = {
    }
    
return Public;
})();


