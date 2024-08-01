

AJAX_REQUEST_TIMEOUT_MS = 3000;


$(document).ready(function()
{    
    AjaxInterface.SetupEnvironment();
});

var AjaxInterface = (function () {
    ///
    ///  Start Ajax Interface Implementation
    ///
    
    ///
    /// Public Object
    ///
    var AjaxWrapper =
    {
        AjaxConnectionIsActive: true,
        AjaxInterfaceException: function(errorCode, errorText)
        {
            this.Code = errorCode;
            this.Text = errorText;
        }
    };
    
    ///
    /// Private Object
    /// 
    var Private = {
        _AjaxWrapperValidateRequestConfigs: function(requestConfigs)
        {
            if(   typeof requestConfigs === "undefined"
               || requestConfigs == null)
            {
                throw new AjaxInterface.AjaxInterfaceException(AjaxInterface.AjaxInterfaceErrorCode.InvalidConfigObject, "requestConfigs must be an initialized object of type AjaxInterface.AjaxRequestConfigs");
            }
            
            // Check URL
            if(   typeof requestConfigs.Url !== "string" 
               || requestConfigs.Url.length == 0)
            {
                throw new AjaxInterface.AjaxInterfaceException(AjaxInterface.AjaxInterfaceErrorCode.InvalidUrl, "Invalid URL format or the URL is an empty string!");
            }
            let values = Object.keys(AjaxInterface.AjaxRequestType).map(function(e) {
                return AjaxInterface.AjaxRequestType[e]
            })
            // Check Request Type
            if (values.indexOf(requestConfigs.RequestType) == -1) {
                throw new AjaxInterface.AjaxInterfaceException(AjaxInterface.AjaxInterfaceErrorCode.InvalidRequestType, "Invalid Request type!");
            }
            // Check data
            if(typeof requestConfigs.Url !== "string")
            {
                throw new AjaxInterface.AjaxInterfaceException(AjaxInterface.AjaxInterfaceErrorCode.InvalidDataContent, "Data must be from type string!");
            }
            
            // Check Async
            if(typeof requestConfigs.Async !== "boolean")
            {
                throw new AjaxInterface.AjaxInterfaceException(AjaxInterface.AjaxInterfaceErrorCode.InvalidDataContent, "Async must be from type boolean!");
            }
            // Check Timeout
            if(isNaN(requestConfigs.Timeout) == true)
            {
                throw new AjaxInterface.AjaxInterfaceException(AjaxInterface.AjaxInterfaceErrorCode.InvalidTimeout, "Timeout must be a number!");
            }
        }
    }
    ///
    /// Private Properties / Configuration
    ///
    
    ///
    /// Public Properties / Configuration
    ///
    
    ///
    /// Timeout for async Ajax requests
    ///
    Object.defineProperty( AjaxWrapper, "AjaxRequestTimeout", {
        value: AJAX_REQUEST_TIMEOUT_MS,
        writable: true,
        enumerable: false,
        configurable: true
    });
    
    ///
    /// Ajax Request Type
    ///
    Object.defineProperty( AjaxWrapper, "AjaxRequestType", {
        value: {
            POST: "POST",
            GET:  "GET",
            HEAD: "HEAD",
            None: "NONE"
        },
        writable: false,
        enumerable: true,
        configurable: false
    });
    
    ///
    /// Ajax Request Data Type
    ///
    Object.defineProperty( AjaxWrapper, "AjaxRequestDataType", {
        value: {
            HTML: "html",
            JSON: "json",
            XML:  "xml",
            SCRIPT: "script",
            UrlEncoded: "x-www-form-urlencoded",
            None: "NONE"
        },
        writable: false,
        enumerable: true,
        configurable: false
    });

    ///
    /// When sending data to the server, use this content type.
    /// Default is "application/x-www-form-urlencoded; charset=UTF-8", which is fine for most cases.
    /// The W3C XMLHttpRequest specification dictates that the charset is always UTF-8.
    /// Specifying another charset will not force the browser to change the encoding.
    ///
    Object.defineProperty( AjaxWrapper, "AjaxRequestContentType", {
        value: {
            APPLICATION_FORM_URL: "application/x-www-form-urlencoded; charset=UTF-8",
            APPLICATION_HTML: "application/html; charset=UTF-8",
            APPLICATION_JSON: "application/json; charset=UTF-8",
            TEXT_PLAIN: "text/plain; charset=UTF-8",
            None: null
        },
        writable: false,
        enumerable: true,
        configurable: false
    });
    
    ///
    /// Ajax Request Error Code
    ///
    Object.defineProperty( AjaxWrapper, "AjaxInterfaceErrorCode", {
        value: {
            None:                "None",
            InvalidConfigObject: "InvalidConfigObject",
            InvalidUrl:          "InvalidUrl",
            InvalidRequestType:  "InvalidRequestType",
            InvalidDataType:     "InvalidDataType",
            InvalidDataContent:  "InvalidDataContent",
            InvalidTimeout:      "InvalidTimeout"
        },
        writable: false,
        enumerable: true,
        configurable: false
    });
    ///
    /// Ajax Callback function
    ///
    Object.defineProperty( AjaxWrapper, "AjaxCallBackFunctions", {
        value: {
            OnSuccessCallBack   : null,
            OnProgressCallBack  : null,
            OnLoadCallBack      : null,
            OnCompletedCallBack : null,
            OnErrorCallback     : null
        },
        writable: false,
        enumerable: false,
        configurable: false
    });
    
    ///
    /// Ajax Request Configs object
    ///
    Object.defineProperty( AjaxWrapper, "AjaxRequestConfigs", {
        value: {
            Url: "",
            RequestType: AjaxWrapper.AjaxRequestType.None,
            DataType: AjaxWrapper.AjaxRequestDataType.None,
            Data: "",
            ContentType: AjaxWrapper.AjaxRequestContentType.APPLICATION_FORM_URL,
            CallBacks: AjaxWrapper.AjaxCallBackFunctions,
            Async: false,
            Timeout: AJAX_REQUEST_TIMEOUT_MS
        },
    writable: false,
    enumerable: true,
    configurable: false
    });
    
    ///
    /// Public Functions
    ///
    
    AjaxWrapper.CreateSyncRequestConfig = function(url, requestType, dataType, data, callbacks, contentType)
    {
        let requestConfigObject = AjaxWrapper.AjaxRequestConfigs;
        requestConfigObject.Url = url;
        requestConfigObject.RequestType = requestType;
        requestConfigObject.DataType = dataType;
        requestConfigObject.Data = data;
        requestConfigObject.CallBacks = callbacks;
        requestConfigObject.ContentType = contentType;
        return requestConfigObject;
    }
    
    AjaxWrapper.CreateAsyncRequestConfig = function(url, requestType, dataType, data, callbacks, timeout, contentType)
    {
        let requestConfigObject = AjaxWrapper.AjaxRequestConfigs;
        requestConfigObject.Url = url;
        requestConfigObject.RequestType = requestType;
        requestConfigObject.DataType = dataType;
        requestConfigObject.Data = data;
        requestConfigObject.CallBacks = callbacks;
        if(timeout != null)
        {
            requestConfigObject.Timeout = timeout;
        }
        requestConfigObject.ContentType = contentType;
        return requestConfigObject;
    }
    
    AjaxWrapper.PerformSyncRequest = function(requestConfigs)
    {
        // Validate request. On error an exception will be thrown
        Private._AjaxWrapperValidateRequestConfigs(requestConfigs);
        
        // Process request
        let result = {};
        $.ajax({ // $.ajax: performs a sync AJAX request
            url : requestConfigs.Url,
            type: requestConfigs.RequestType,
            dataType: requestConfigs.DataType,
            data: requestConfigs.Data,
            contentType: requestConfigs.ContentType,
            async: false,
            cache: false,
            success: function(data){
                this.AjaxConnectionIsActive = true;
                result = data;
            },
            error: function(xhr, status, error) {
                console.error(CurrentActiveWbmPage + " Page - Connection Error occured - Error: " + error + " Status: " + status);
                //if(this.AjaxConnectionIsActive == true)
                //{
                    // Set connection to inactive (offline)
                    AjaxConnectionIsActive = false;
                    // Call connection error handler callback 
                    if(requestConfigs.CallBacks != null && typeof requestConfigs.CallBacks.OnErrorCallback !== "undefined" 
                    && requestConfigs.CallBacks.OnErrorCallback != null)
                    {
                        requestConfigs.CallBacks.OnErrorCallback(xhr, status, error);
                    }
                //}
                result = null;
           }
        });
    
        return result;
    }
    
    AjaxWrapper.PerformAsyncPromiseRequest = function(requestConfigs)
    {
        // Validate request. On error an exception will be thrown
        Private._AjaxWrapperValidateRequestConfigs(requestConfigs);
        return new Promise(function (resolve, reject) {
            try
            {
                $.ajax({ // $.ajax: performs an async AJAX request
                    url : requestConfigs.Url,
                    type: requestConfigs.RequestType,
                    data: requestConfigs.Data,
                    contentType: requestConfigs.ContentType,
                    dataType: requestConfigs.DataType,
                    async: true,
                    timeout: requestConfigs.Timeout,
                    success: function(data, status, xhr)
                    {
                        this.AjaxConnectionIsActive = true;
                        if(requestConfigs.CallBacks != null && typeof requestConfigs.CallBacks.OnSuccessCallBack !== "undefined" 
                        && requestConfigs.CallBacks.OnSuccessCallBack != null)
                        {
                            requestConfigs.CallBacks.OnSuccessCallBack(data, status, xhr);
                        }
                        resolve(data);
                    },
                    error: function(xhr, status, error) {
                        let errorObj = {};
                        errorObj.xhr = xhr;
                        errorObj.status = status;
                        errorObj.error = error;
                        AjaxConnectionIsActive = false;
                        // check status && error
                        console.error("Communication Error while requesting Json data from URL = " + requestConfigs.Url + " Error: " + error);

                        if(   requestConfigs.CallBacks != null && typeof requestConfigs.CallBacks.OnErrorCallback !== "undefined" 
                           && requestConfigs.CallBacks.OnErrorCallback != null)
                           {
                               requestConfigs.CallBacks.OnErrorCallback(xhr, status, error);
                           }
                        // Reject data => Promise result is invalid/rejected
                        reject(errorObj);
                    }
                });
            } catch(exception) {
                if(exception instanceof TypeError) {
                  console.log('There was a type error.');
                  reject("Type Error");
                }
                else if(exception instanceof NetworkError) {
                  console.log('There was a network error.');
                  reject("Network Error");
                }
            }
        });
        
    }
    
    
    AjaxWrapper.PerformAsyncRequest = function(requestConfigs)
    {
        // Validate request. On error an exception will be thrown
        Private._AjaxWrapperValidateRequestConfigs(requestConfigs);
        
        let xhrGlobal = $.ajax({ // $.ajax: performs an async AJAX request
            url : requestConfigs.Url,
            type: requestConfigs.RequestType,
            data: requestConfigs.Data,
            contentType: requestConfigs.ContentType,
            dataType: requestConfigs.DataType,
            async: true,
            timeout: requestConfigs.Timeout,
            xhr: function(){
            var xhr = $.ajaxSettings.xhr() ;
                xhr.upload.onprogress = function(evt){
                    if(   typeof requestConfigs.CallBacks.OnProgressCallBack !== "undefined" 
                    && requestConfigs.CallBacks.OnProgressCallBack != null)
                    {
                        requestConfigs.CallBacks.OnProgressCallBack(evt);
                    }
                } ;
                xhr.upload.onload = function(evt)
                { 
                    if(   typeof requestConfigs.CallBacks.OnLoadCallBack !== "undefined" 
                    && requestConfigs.CallBacks.OnLoadCallBack != null)
                    {
                        requestConfigs.CallBacks.OnLoadCallBack(evt);
                    }
                };
                return xhr ;
            },
            success: function(data, status, xhr)
            {
                this.AjaxConnectionIsActive = true;
                if(requestConfigs.CallBacks != null && typeof requestConfigs.CallBacks.OnSuccessCallBack !== "undefined" 
                && requestConfigs.CallBacks.OnSuccessCallBack != null)
                {
                    requestConfigs.CallBacks.OnSuccessCallBack(data, status, xhr);
                }
                
            },
            error: function(xhr, status, error) {
                console.error("Connection Error occured - Error: " + error + " Status: " + status);
                // Set connection to inactive (offline)
                AjaxConnectionIsActive = false;
                // Call connection error handler callback 
                if(requestConfigs.CallBacks != null && typeof requestConfigs.CallBacks.OnErrorCallback !== "undefined" 
                && requestConfigs.CallBacks.OnErrorCallback != null)
                {
                    requestConfigs.CallBacks.OnErrorCallback(xhr, status, error);
                }
            },
            complete: function(xhr, status) 
            { 
                if(requestConfigs.CallBacks != null && typeof requestConfigs.CallBacks.OnCompletedCallBack !== "undefined" 
                && requestConfigs.CallBacks.OnCompletedCallBack != null)
                {
                    requestConfigs.CallBacks.OnCompletedCallBack(xhr, status);
                }
            },
        });
        
        return xhrGlobal;
    }

    AjaxWrapper.SetupEnvironment = function()
    {
        $.ajaxSetup({
            headers:
            { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')}
        });
    }

    return AjaxWrapper;
})();

