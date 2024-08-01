SubPageActive = true;

SCM_DATA_PROVIDER_SCRIPT_NAME = "module/Scm/SystemServicesDp/";

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete SubPageActive;
    delete SCM_DATA_PROVIDER_SCRIPT_NAME;
}

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

$(document).ready(function(){   

    MsDelay(100)
    .then(function()
    {
        // Query and build system services list
        BuildSystemServicesTable();
        
        // Show page content after page elements are loaded
        $("#id_sysservices_page_global_div").show();
    })
    $('#id_sysservices_discard_config_button').click(function(event) {
        $("#id_sysservices_discard_modal").show();
        event.preventDefault();
        return false;
    });
        $("#id_sysservices_discard_ok_btn").click(function(event)
    {
        $("#id_sysservices_discard_modal").hide();
        $("#id_div_loader").show();
        event.preventDefault();
        location.reload();
        window.location.href = "#extensions/Scm/SystemServices.html";
        return false;
    });
    $("#id_sysservices_discard_cancle_btn").click(function(event)
    {
        $("#id_sysservices_discard_modal").hide();
        event.preventDefault();
        return false;
    });
    
    $('#id_sysservices_apply_config_button').click(function(event) {
        $("#id_div_sysservices_apply_confirm").show();
        event.preventDefault();
        return false;
    });
    
    $('#id_sysservices_apply_cancel_btn').click(function(event) {
        $("#id_div_sysservices_apply_confirm").hide();
        event.preventDefault();
        return false;
    });
    
    $('#id_sysservices_apply_ok_btn').click(function(event) {
        
        let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
        ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;
    
        let servicesObject = GetSystemServicesConfigObject();
        let servicesObjectString = JSON.stringify(servicesObject);
        let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                                    SCM_DATA_PROVIDER_SCRIPT_NAME + "ReconfigureSystemServices", // url
                                    AjaxInterface.AjaxRequestType.POST, // requestType: HTTP Request type
                                    AjaxInterface.AjaxRequestDataType.JSON, // dataType: The type of data that you're expecting back
                                    servicesObjectString, // data: The data to send
                                    ajaxCallbackFunctions, // callbacks
                                    1000, // timeout
                                    null
        );
        AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
        .then(function (data) {
            if(data != null)
            {
                if(!data.error)
                {
                    window.location.href = "Login.html";//location.reload(true);
                }
                else
                {
                    alert($("#id_sysservices_sm_config_error").text() + data.errorText);
                    $("#id_div_sysservices_apply_confirm").hide();
                }
            }
            else
            {
                alert($("#id_sysservices_sm_config_error").text() + "Data Error");
                console.log("System Services - Failed to set System Services list");
                location.reload(true);
            }
        }).catch(function (errorObj) {
            // Unknown execption
            console.log(errorObj);
            location.reload(true);
        });
        event.preventDefault();
        return false;
    });
    
 });
 
function BuildSystemServicesTable()
{
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
    ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                                                            SCM_DATA_PROVIDER_SCRIPT_NAME + "ListSystemServices",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            ajaxCallbackFunctions,
                                                            null);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    if(response != null)
    {
        if(!response.error)
        {
            $("#id_sysservices_apply_config_button").show();
            let systemServices = response.result;
            $(systemServices).each(function(idx, systemService) {
                AddSystemServicesTableEntry(systemService, (idx + 1));
            });
        }
        else
        {
            alert($("#id_sysservices_sm_request_error").text());
        }
    }
} 

function AddSystemServicesTableEntry(systemService, number)
{
    let evenOdd = "odd";
    if(number % 2 == 0)
    {
        evenOdd = "odd";
    }
    let checked = (systemService.IsEnabled)?("checked"):("");
    let defChecked = (systemService.DefaultValue)?("checked"):("");
    let tableEntryHtml = '<tr class= "' + evenOdd + '">'
                       + '<td><span id="id_sysservices_' + number + '_id_span" style="display: inline-block; max-width: 280px; word-wrap:break-word;">' + systemService.Id + '</span></td>'
                       + '<td><span id="id_sysservices_' + number + '_name_span" style="display: inline-block; max-width: 540px; word-wrap:break-word;">' + systemService.Name + '</span></td>'
                       + '<td><input type="checkbox" disabled ' + defChecked + ' id="id_sysservices_' + number + '_def_activation_input"></td>'
                       + '<td><input type="checkbox" ' + checked + ' id="id_sysservices_' + number + '_activation_input"></td>'
                       + '</tr>';
    $("#id_sysservices_services_table > tbody > tr").eq((number - 1)).after(tableEntryHtml);
}

function GetSystemServicesConfigObject()
{
    let servicesObject = {
        SystemServices: []
    };
    $('#id_sysservices_services_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
        let serviceNumber = idx + 1;
        let systemServiceElement = {};
        systemServiceElement.Id =  $("#id_sysservices_" + serviceNumber + "_id_span").text();
        systemServiceElement.IsEnabled = $("#id_sysservices_" + serviceNumber + "_activation_input").is(":checked");
        servicesObject.SystemServices.push(Object.assign({},systemServiceElement));
    });
    return servicesObject;
}

function OnConnectionError(xhr, status, error)
{
   alert($("#id_sysservices_sm_connection_error").text() + error);
}
