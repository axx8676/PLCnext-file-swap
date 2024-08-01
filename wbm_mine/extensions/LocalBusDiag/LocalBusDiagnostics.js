
SubPageActive = true;

LBDIAG_UPDATE_TIMEOUT = 1000;
AJAX_REQUEST_TIMEOUT = 3000;

LBDIAG_DIAG_STATUS_NONE_COLOR      = '#FFFFFF';
LBDIAG_DIAG_STATUS_OK_COLOR        = '#92D050';
LBDIAG_DIAG_STATUS_WARNING_COLOR   = '#FFC000';
LBDIAG_DIAG_STATUS_ERROR_COLOR     = '#ED1C24';
LBDIAG_DIAG_STATUS_EMPTY_COLOR     = '#808080';

LBDIAG_WARNING_FLASHER_ACTIVATED = true;

Lbdiag_DiagUpdateTimer = undefined;
Lbdiag_DiagModulesStatusColorsTimer = undefined;

Lbdiag_LastModulesNamesList = undefined;
Lbdiag_LastModulesRandomNumber = undefined;

Lbdiag_FlashingFieldsIds = [];

Lbdiag_isLocalBusErrorOccured = false;
Lbdiag_ModulesDataReady = false;
Lbdiag_reloadModulesList = false;

Lbdiag_activeLocalBus = "None";
LBDIAG_AXIOLINE_ID    = "Axioline";
LBDIAG_INTERBUS_ID    = "Interbus";

ConnectionStatusOk = true;

LbDiag_ModuleInfoModalVisible = false;

DiagStatusResult = {
    None:    "NONE",
    Ok:      "OK",
    Warning: "Warning",
    Error:   "Error" 
}


function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    window.clearTimeout(Lbdiag_DiagUpdateTimer);
    window.clearInterval(Lbdiag_DiagUpdateTimer);
    window.clearTimeout(Lbdiag_DiagModulesStatusColorsTimer);
    window.clearInterval(Lbdiag_DiagModulesStatusColorsTimer);
    
    delete SubPageActive;
    
    delete LBDIAG_UPDATE_TIMEOUT;
    delete AJAX_REQUEST_TIMEOUT;
    
    delete LBDIAG_DIAG_STATUS_NONE_COLOR;
    delete LBDIAG_DIAG_STATUS_OK_COLOR;
    delete LBDIAG_DIAG_STATUS_WARNING_COLOR;
    delete LBDIAG_DIAG_STATUS_ERROR_COLOR;
    delete LBDIAG_DIAG_STATUS_EMPTY_COLOR;
    
    delete LBDIAG_WARNING_FLASHER_ACTIVATED;
    
    delete Lbdiag_DiagUpdateTimer;
    delete Lbdiag_DiagModulesStatusColorsTimer;
    delete Lbdiag_LastModulesNamesList;
    delete Lbdiag_LastModulesRandomNumber;
    
    delete Lbdiag_FlashingFieldsIds;
    
    delete Lbdiag_isLocalBusErrorOccured;
    delete Lbdiag_ModulesDataReady;
    delete Lbdiag_reloadModulesList;
    
    delete Lbdiag_activeLocalBus;
    delete LBDIAG_AXIOLINE_ID;
    delete LBDIAG_INTERBUS_ID;
    
    delete DiagStatusResult;
    
    delete ConnectionStatusOk;
    
    delete LbDiag_ModuleInfoModalVisible;

    delete LocalBusDiagService;
}

$(document).ready(function(){
    ///
    /// Start Local Bus Diagnostics 
    ///
    MsDelay(100)
    .then(function()
    {
        // Check which localbus is active
        CheckActiveLocalBus();
        
        // Set LB Diagnostics status to reloading table
        OnStateDiagStatusReloadingTable();
        
        // Load Local Bus Modules List
        setTimeout(FirstLoadModulesList, 50);
    })
    
    $("#id_lbdiag_module_info_close_button").click( function(event){
        $("#id_div_lbdiag_module_infos_modal").hide();
        LbDiag_ModuleInfoModalVisible = false;
        event.preventDefault();
    });
    
    $("#id_lbdiag_update_diag_registers_button").click( function(event){

        let response = LocalBusDiagService.ConfirmDiagnostics();
        if(typeof response === 'undefined' || response.error == true)
        {  
            if(response.error)
            {
                console.log("Error: " + response.errorText);
            }
            alert($("#id_lbdiag_status_registerupdate_fail_span").text());
            return;
        }
        else
        {
            OnDiagOnline();
            ConnectionStatusOk = true;
        }
        
        OnDiagnosticRegistersUpdated();
    });
});

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        if(LbDiag_ModuleInfoModalVisible) {
            $("#id_div_lbdiag_module_infos_modal").hide();
        }
    }
}

function ShowSelectedModuleDetails(event)
{
    $("#id_div_lbdiag_module_infos_modal").show();
    event.preventDefault();
}

function CheckActiveLocalBus()
{
    Lbdiag_activeLocalBus = LocalBusDiagService.CheckActiveLocalBus();    
    $("#id_subpagetitle_lb_diag_active_bus").text("(" + Lbdiag_activeLocalBus + ")");
}

/// 
/// Loads the Local Bus List for the first time
/// 
/// @returns {none}
/// 
 
function FirstLoadModulesList()
{   
    LocalBusDiagService.ListModulesTable()
    .then(function(modulesListTableRows) {
        ConnectionStatusOk = true;
        ReloadDevicesListTable(modulesListTableRows);
        // start updating diagnostic data
        LbUpdateDiagnosticsData();
        MainPageUtilities.HideDivLoader();
    })
    .catch(function(errorObj) {
        // check status && error
        console.log("Communication Error while requesting local bus modules table on first load. Error: " + errorObj.error);
        MainPageUtilities.HideDivLoader();
    });
}


/// 
/// Diagnostics Data update function which is called permanent every 1 second. This function:
///     - Checks if device list changed (new engineer project), when yes it reloades all diagnostics data and modules structures
///     - updates the diagnostics data fields 
/// @returns {none}
/// 
function LbUpdateDiagnosticsData()
{
    if(typeof SubPageActive == undefined)
    {
        return;
    }

    LocalBusDiagService.GetModulesChangesRandomNumber()
    .then(function(modulesRandomString) {
        var modulesListChanged = CheckModulesListChanged(modulesRandomString);
        // if Devices Table content changed or bus error has occured
        if((modulesListChanged == true) && (Lbdiag_isLocalBusErrorOccured == false) || (Lbdiag_reloadModulesList == true))
        {
            // Set Local bus Diagnostics Status to New Configs
            OnStateDiagStatusNewConfigs();
            $("#id_div_loader").show();
            
            // Set Local bus Diagnostics status to reloading table
            OnStateDiagStatusReloadingTable();
            // Reload Modules List table
            LocalBusDiagService.ListModulesTable()
            .then(function(modulesListTableRows) {
                ReloadDevicesListTable(modulesListTableRows);
                $("#id_div_loader").hide();
                // Request and Update values for Diagnostics data and Status registers
                ProcessDiagnosticsDataUpdate();
                if(ConnectionStatusOk == true)
                {
                    OnDiagStatusOk();
                }
            })
            .catch(function(errorObj) {
                // check status && error
                console.warn("Communication Error while requesting local bus modules table. Error: " + errorObj.error);

            });
        }
        else
        {
            // Request and Update values for Diagnostics data and Status registers
            ProcessDiagnosticsDataUpdate();
        }
    })
    .catch(function(errorObj) {
        // check status && error
        console.log("Communication Error while getting modules changed random number. Error: " + errorObj.error);

    });
    
    Lbdiag_DiagModulesStatusColorsTimer = setTimeout(ResetLbModulesStatusColors, (LBDIAG_UPDATE_TIMEOUT/2));
    
    // Set Updating Timer Time Out
    Lbdiag_DiagUpdateTimer = setTimeout(LbUpdateDiagnosticsData, LBDIAG_UPDATE_TIMEOUT);
    
    if(GlobalConnectionStatusOk == false)
    {
        OnConnectionError(null, null, null);
        ConnectionStatusOk = false;
    }
    
    if(ConnectionStatusOk == true)
    {
        OnDiagOnline();
    }
}

function ProcessDiagnosticsDataUpdate()
{
    // Update local bus Diagnostic Registers and check Bus errors
    LocalBusDiagService.ReadDiagnosticRegisters()
    .then(function(diagnosticRegistersData) {
        ConnectionStatusOk = true;
        if(diagnosticRegistersData.error)
        {
            console.log("Error: " + diagnosticRegistersData.errorText);
        }
        UpdateBusDiagnosticRegisters(diagnosticRegistersData);
        
        // Update Device List Diagnostics
        UpdateModulesListDiagnostics();
    })
    .catch(function(errorObj) {
        console.log(errorObj);
    });
}


/// 
/// Checks if the devices list changes (e.g. new Engineer Project)
/// @returns {bool} true when the devices list has been changed. Otherwise false
/// 
function CheckModulesListChanged(modulesRandomString)
{
    var result = false;
    try
    {
        var responseEntries  = modulesRandomString.split(';');
        if(responseEntries.length == 3)
        {
            var rondomNumberEntry  = responseEntries[0];
            var devicesStringEntry = responseEntries[1];
            var lbDataReadyEntry   = responseEntries[2];
            var randomNumberElements  = rondomNumberEntry.split('=');
            var modulesStringElements = devicesStringEntry.split('=');
            var lbDataReadyElements   = lbDataReadyEntry.split('=');
            if(randomNumberElements.length == 2 && modulesStringElements.length == 2 && randomNumberElements[0] == 'Random' && modulesStringElements[0] == 'ModulesString')
            {
                var currentModulesListStringValue = modulesStringElements[1];
                if(Lbdiag_LastModulesRandomNumber != parseInt(randomNumberElements[1]) || JSON.stringify(Lbdiag_LastModulesNamesList) !== JSON.stringify(currentModulesListStringValue))
                {
                    if(typeof Lbdiag_LastModulesRandomNumber !== "undefined")
                    {
                        result = true;
                    }
                    console.log("Localbus Modules List changed!");
                    Lbdiag_LastModulesRandomNumber = parseInt(randomNumberElements[1]);
                    Lbdiag_LastModulesNamesList    = currentModulesListStringValue;
                }
            }
            if(lbDataReadyElements.length == 2 && lbDataReadyElements[0] == "LocalBusDataReady")
            {
                let modulesDataReady = (lbDataReadyElements[1]=="1");
                if(modulesDataReady != Lbdiag_ModulesDataReady)
                {
                    result = true;
                }
                Lbdiag_ModulesDataReady = modulesDataReady;
            }
        }
    }
    catch(e)
    {
        console.log("Error on checking modules list changes occurres, Error: ", e);
    }
    
    return result;
}

function UpdateBusDiagnosticRegisters(diagnosticRegistersData)
{
    if(diagnosticRegistersData == false || diagnosticRegistersData.error == true || typeof diagnosticRegistersData.error == undefined)
    {   
        return;
    }
    //console.log("Status Register", data.result.statusRegister);
    //console.log("Param Register", data.result.paramRegister);
    //console.log("Diag Status", diagnosticRegistersData);
    var lastIsLocalBusErrorOccured = Lbdiag_isLocalBusErrorOccured;
    if(diagnosticRegistersData.result.statusRegister & 0x0002)
    {
        OnPeripheralError();
        $("#id_lbdiag_diag_status_register_td").css('background-color', LBDIAG_DIAG_STATUS_ERROR_COLOR);
        if(Lbdiag_activeLocalBus == "Interbus")
        {
            $("#id_lbdiag_update_diag_registers_tr").show();
        }
    }
    else if(diagnosticRegistersData.result.statusRegister & 0x0004)
    {
        $("#id_lbdiag_update_diag_registers_tr").hide();
        Lbdiag_isLocalBusErrorOccured = true;
        OnBusError();
        $("#id_lbdiag_diag_status_register_td").css('background-color', LBDIAG_DIAG_STATUS_ERROR_COLOR);
    }
    else if(diagnosticRegistersData.result.statusRegister & 0x0008)
    {
        $("#id_lbdiag_update_diag_registers_tr").hide();
        Lbdiag_isLocalBusErrorOccured = true;
        OnHardwareError();
        $("#id_lbdiag_diag_status_register_td").css('background-color', LBDIAG_DIAG_STATUS_ERROR_COLOR);
    }
    else
    {
        Lbdiag_isLocalBusErrorOccured = false;
        $("#id_lbdiag_update_diag_registers_tr").hide();
        if(   (diagnosticRegistersData.result.statusRegister & 0x00FF) != 0x00e0 
            &&((diagnosticRegistersData.result.statusRegister &  0x0280) == 0x0280))
        {
            OnSysfailSet();
        }
        else if((diagnosticRegistersData.result.statusRegister & 0x00FF) == 0x00e0)
        {
            if(Lbdiag_ModulesDataReady == true && (($("#id_lbdiag_axl_modules_list_table tr").length > 2) || ($("#id_lbdiag_ib_modules_list_table tr").length > 2)))
            {
                OnDiagStatusOk();
            }
        }
        else if(diagnosticRegistersData.result.statusRegister & 0x0001)
        {
            OnUserError();
            $("#id_lbdiag_diag_status_register_td").css('background-color', LBDIAG_DIAG_STATUS_ERROR_COLOR);
            if(Lbdiag_activeLocalBus == "Interbus")
            {
                $("#id_lbdiag_update_diag_registers_tr").show();
            }
        }
        $("#id_lbdiag_diag_status_register_td").css('background-color', LBDIAG_DIAG_STATUS_OK_COLOR);
    }
    if(lastIsLocalBusErrorOccured != Lbdiag_isLocalBusErrorOccured)
    {

        Lbdiag_reloadModulesList = true;
    }
    else
    {
        Lbdiag_reloadModulesList = false;

    }
    $("#id_lbdiag_diag_status_register_val").text(HexStrPad4(diagnosticRegistersData.result.statusRegister));
    $("#id_lbdiag_diag_param_register_1_val").text(HexStrPad4(diagnosticRegistersData.result.paramRegister1)); 
    $("#id_lbdiag_diag_param_register_2_val").text(HexStrPad4(diagnosticRegistersData.result.paramRegister2)); 
}

/// 
/// Updates the diagnostics data in the devices list
/// @returns {none}
/// 
function UpdateModulesListDiagnostics()
{
    var activeModalVal = "";

    if(Lbdiag_activeLocalBus == LBDIAG_AXIOLINE_ID)
    {
        if(LbDiag_ModuleInfoModalVisible == true)
        {
            activeModalVal += $("#id_lbdiag_module_number_value").text(); 
        }

        LocalBusDiagService.GetModulesDiagData(activeModalVal)
        .then(function(diagObject) {
            AxlUpdateModulesListDiagnostics(diagObject);
        })
        .catch(function(errorObj) {
            console.log(errorObj);
        });
    }
    else if(Lbdiag_activeLocalBus == LBDIAG_INTERBUS_ID)
    {
        LocalBusDiagService.GetModulesDiagData("")
        .then(function(diagObject) {
            LbUpdateModulesListDiagnostics(diagObject);
        })
        .catch(function(errorObj) {
            console.log(errorObj);
        });
    } 
}

/// 
/// Updates the diagnostics data in the devices list for Axioline
/// @returns {none}
/// 
function AxlUpdateModulesListDiagnostics(diagObject)
{
    if(diagObject == false || typeof diagObject == undefined)
    {   // return on communication error
        return;
    }
    var axlTableDevicesCount = $('#id_lbdiag_axl_modules_list_table tr').length - 2;   
    var moduleInfoModalVisible = $("#id_div_lbdiag_module_infos_modal").is(":visible");
    var moduleInfoModalNo = parseInt($("#id_lbdiag_module_number_value").text());
    // Check if an error is occured
    if(diagObject.error)
    {
        Lbdiag_isLocalBusErrorOccured = true;
        HandleDiagDataReadError(diagObject.result, diagObject.errorText);
        return;
    }
    else if(Lbdiag_isLocalBusErrorOccured == false && axlTableDevicesCount == 0)
    {
        return;
    }
    else if(Lbdiag_isLocalBusErrorOccured == true)
    {
        OnBusError();
        OnModulesListingError();
        if(axlTableDevicesCount > 0)
        {
            Lbdiag_LastModulesNamesList = [];
            $("#id_lbdiag_axl_modules_list_table tr:not('.exclude')").remove();
            console.log("An Error has occured while listing Interbus modules!");
        }
        return;
    }
    OnResetModulesListStatest();
    OnHideModuleError();
    
    $.each(diagObject.result.diagstates, function( index, diagState)
    {
        var diagnosticTdId   = "id_lbdiag_module_" + (index + 1) + "_disgnostic_td";
        var diagnosticSpanId = "id_lbdiag_module_" + (index + 1) + "_diagnostic_span";
        var tableProductTypeTdId = "id_lbdiag_module_" + (index + 1) + "_type";
        $("#" + diagnosticSpanId).text(HexStrPad4(diagState.Code));
        var isEmptyModule = ($("#" + tableProductTypeTdId).attr("emptySlot") == "true")?(true):(false);
        // Check if this is an empty axioline module (AXL SE)
        if(isEmptyModule == true)
        {
            $('#' + diagnosticTdId).css('background-color', LBDIAG_DIAG_STATUS_EMPTY_COLOR);
        }// Ok diagnostic status
        else if(diagState.Priority == 0)
        {
            $('#' + diagnosticTdId).css('background-color', LBDIAG_DIAG_STATUS_OK_COLOR);
        }// Error diagnostic status
        else if(diagState.Priority == 1)
        {
            $('#' + diagnosticTdId).css('background-color', LBDIAG_DIAG_STATUS_ERROR_COLOR);
        }// Warning diagnostic status
        else if(diagState.Priority == 2)
        {
            $('#' + diagnosticTdId).css('background-color', LBDIAG_DIAG_STATUS_WARNING_COLOR);
            if(LBDIAG_WARNING_FLASHER_ACTIVATED == true)
            {
                Lbdiag_FlashingFieldsIds.push(diagnosticTdId);
            }
        }
        if(((moduleInfoModalVisible == true)|| (LbDiag_ModuleInfoModalVisible == true)) && (moduleInfoModalNo == (index + 1)))
        {
            $("#id_lbdiag_diag_state_cons_no_value").text(diagState.ConsNo);
            $("#id_lbdiag_module_info_diag_state_prio_value").text(HexStrPad2(diagState.Priority));
            $("#id_lbdiag_module_info_diag_state_CGM_value").text(diagState.ChannelGroupModule);
            $("#id_lbdiag_module_info_diag_code_value").text(HexStrPad4(diagState.Code));
            $("#id_lbdiag_module_info_diag_text_value").text(diagState.Text);
            
            UpdateLbModuleDetailsDiagStatus(diagState.Priority);
            
            $("#id_lbdiag_module_info_diag_code_td").css('background-color', $('#' + diagnosticTdId).css('background-color'));
            $("#id_lbdiag_module_info_diag_text_td").css('background-color', $('#' + diagnosticTdId).css('background-color'));
            $("#id_lbdiag_module_info_status_id").css('background-color', $('#' + diagnosticTdId).css('background-color'));
        }  
    });
    
}

/// 
/// Updates the diagnostics data in the devices list for Interbus
/// @returns {none}
/// 
function LbUpdateModulesListDiagnostics(diagObject)
{
    
    var ibTableDevicesCount = $('#id_lbdiag_ib_modules_list_table tr').length - 2;
    if(typeof diagObject == undefined)
    {   // return on communication error
        return;
    }
    if(diagObject.error)
    {
        HandleDiagDataReadError(diagObject.result, diagObject.errorText);
        return;
    }
    
    OnHideModuleError();
    
    //console.log("LB Diag Data", diagObject);
    $.each(diagObject.result.diagstates, function(index, diagState)
    {
        var diagnosticTdId   = "id_lbdiag_module_" + (index + 1) + "_disgnostic_td";
        var diagnosticSpanId = "id_lbdiag_module_" + (index + 1) + "_diagnostic_span";
        
        if(diagState.PeripheralFault == false)
        {
            $('#' + diagnosticTdId).css('background-color', LBDIAG_DIAG_STATUS_OK_COLOR);
            $("#" + diagnosticSpanId).text("FALSE");
        }
        else
        {
            // Interbus module has peripheral error
            $('#' + diagnosticTdId).css('background-color', LBDIAG_DIAG_STATUS_ERROR_COLOR);
            $("#" + diagnosticSpanId).text("TRUE");
        }
    });
    
}

/// 
/// handels occured errors during requesting diag data
/// @returns {none}
/// 
 function HandleDiagDataReadError(errorData, errorText)
 {
    
    // Empty modules table
    console.log("Error occured while updating diagnostics data: Error type = \"" + errorData.type + "\", Error Code = " + errorData.errorCode + ", Error Text = ", errorText);
    if(errorData.type == "module")
    {
        OnModuleError(errorData.module, errorData.errorCode);
    }
    else if(errorData.type == "read")
    {
        if((errorData.errorCode & 0x0A60) == 0x0A60)
        {
            
            OnNoBusconfigAvailable();
        }

    }
    if(Lbdiag_activeLocalBus == LBDIAG_AXIOLINE_ID)
    {
        $("#id_div_lbdiag_module_infos_modal").hide();
        Lbdiag_LastModulesNamesList = [];
        $("#id_lbdiag_axl_modules_list_table tr:not('.exclude')").remove();
    }
    
 }
 

/// 
/// Updates Diagnostics Status field in the local bus (Module) Detail View 
/// 
/// @returns {none}
///   
function UpdateLbModuleDetailsDiagStatus(priority)
{
    // Get Diag State Priority Value
    
    if(priority == 0)
    {
        $("#id_lbdiag_diag_status_ok_span").show();
        $("#id_lbdiag_diag_status_warning_span").hide();
        $("#id_lbdiag_diag_status_error_span").hide();
    }
    else if(priority == 1)
    {
        $("#id_lbdiag_diag_status_ok_span").hide();
        $("#id_lbdiag_diag_status_warning_span").hide();
        $("#id_lbdiag_diag_status_error_span").show();
    }
    else if(priority == 2)
    {
        $("#id_lbdiag_diag_status_ok_span").hide();
        $("#id_lbdiag_diag_status_warning_span").show();
        $("#id_lbdiag_diag_status_error_span").hide();
    }
}


/// 
/// Reloades the Modules List dynamically on change 
/// @returns {none}
/// 
function ReloadDevicesListTable(modulesListTableRows)
{
    if(Lbdiag_isLocalBusErrorOccured == true)
    {
        return;
    }

    // flush table elements
    if(Lbdiag_activeLocalBus == LBDIAG_AXIOLINE_ID)
    {
        $("#id_lbdiag_axl_modules_list_table").show();
        $("#id_lbdiag_axl_modules_list_table tr:not('.exclude')").remove();
        modulesListTableRows = ($("#id_lbdiag_axl_modules_list_table > tbody").html() + modulesListTableRows);
        $("#id_lbdiag_axl_modules_list_table > tbody").html(modulesListTableRows);
    }
    else if(Lbdiag_activeLocalBus == LBDIAG_INTERBUS_ID)
    {
        $("#id_lbdiag_ib_modules_list_table").show();
        
        $("#id_lbdiag_ib_modules_list_table tr:not('.exclude')").remove();
        modulesListTableRows = ($("#id_lbdiag_ib_modules_list_table > tbody").html() + modulesListTableRows);
        $("#id_lbdiag_ib_modules_list_table > tbody").html(modulesListTableRows);
    }
    Language.UpdateActivePageMessages();
}

/// 
/// Opens the Local Bus Module Details View 
/// 
/// @param {string} moduleNo         : Module Number of the local bus module
/// @param {string} vendorName       : Vendor name of the local bus module
/// @param {string} productName      : Product Name of the local bus module
/// @param {string} productText      : Product Text of the local bus module
/// @param {string} orderNumber      : Order Number of the local bus module
/// @param {string} serialNumber     : Serial Number of the local bus module
/// @param {string} hardwareVersion  : Hardware Version of the local bus module
/// @param {string} firmwareVersion  : Firmware Version of the local bus module
/// @param {string} moduleLocation   : Location of the local bus module
/// @param {string} equipmentIdent   : Equipment identification or Function of the local bus module
/// @param {string} applDeviceAddr   : Application Device Address of the local bus module
/// @param {event}  event            : details button onClick event
/// @returns {none}
/// 
function OnShowAxioModuleInfosModal(moduleNo, vendorName, productName, productText, orderNumber, serialNumber, hardwareVersion, 
                               firmwareVersion, moduleLocation, equipmentIdent, applDeviceAddr, event)
{
    LbDiag_ModuleInfoModalVisible = true;
    // Local bus module General Data section
    $("#id_lbdiag_module_number_value").text(moduleNo);
    $("#id_lbdiag_module_info_vendor_name_value").text(vendorName);
    $("#id_lbdiag_module_info_product_name_value").text(productName);
    $("#id_lbdiag_module_info_product_text_value").text(productText);
    $("#id_lbdiag_module_info_order_number_value").text(orderNumber);
    $("#id_lbdiag_module_info_serial_number_value").text(serialNumber);
    $("#id_lbdiag_module_info_hardware_version_value").text(hardwareVersion);
    $("#id_lbdiag_module_info_firmware_version_value").text(firmwareVersion);
    
    
    // User Defined section
    $("#id_lbdiag_module_info_location_value").text(moduleLocation);
    $("#id_lbdiag_module_info_function_value").text(equipmentIdent);
    $("#id_lbdiag_module_info_app_device_addr_value").text(applDeviceAddr);
    
    //clear update timer 
    window.clearTimeout(Lbdiag_DiagUpdateTimer);
    // update diagnosis data and restart timer 
    LbUpdateDiagnosticsData(true);
    
    $("#id_div_lbdiag_module_infos_modal").show();
    
    event.preventDefault();
}

/// 
/// Resets the Local bus Modules Status colors to green in the module list
/// 
/// @returns {none}
///  
function ResetLbModulesStatusColors()
{
    $.each(Lbdiag_FlashingFieldsIds, function(index, item) {
        $("#" + item).css('background-color', LBDIAG_DIAG_STATUS_OK_COLOR);
    });           
}

/// 
/// converts an integer number to hex strin fotmat with 4 digita 0xXXXX
/// 
/// @param {integer} number : integer number
/// @returns {string} converted hex number
/// 
function HexStrPad4(number)
{
    if(number < 0x10)
    {
        return '0x000' + number.toString(16);
    }
    else if(number < 0x100)
    {
        return '0x00' + number.toString(16);
    }
    else if(number < 0x1000)
    {
        return '0x0' + number.toString(16);
    }
    else
    {
        return '0x' + number.toString(16)
    }
}

/// 
/// converts an integer number to hex strin fotmat with 2 digita 0xXX
/// 
/// @param {integer} number : integer number
/// @returns {string} converted hex number
/// 
function HexStrPad2(number)
{
    if(number < 0x10)
    {
        return '0x0' + number.toString(16);
    }
    else
    {
        return '0x' + number.toString(16)
    }
}

/*
async function AsyncAwaitRequestJsonFromControl(Url)
{
    var result = {};
    try
    {
        let response = await $.ajax({ // $.ajax: performs an async AJAX request
            url : Url,
            type: "GET",
            dataType: "json",
            async: true,
            timeout: AJAX_REQUEST_TIMEOUT,
            success: function(data)
            {
                ConnectionStatusOk = true;
                if(data.error)
                {
                    result = false;
                }
                result = data;            
            },
            error: function(xhr, status, error) {
                // check status && error
                console.log("Communication Error while requesting Json data from URL = " + Url + " Error: " + error);
                OnConnectionError(xhr, status, error);
                result = false;
            }
        });
    }
    catch(e)
    {
        console.log("Exception occurred on Async Request Json, Error: ", e);
        result = false;
    }
    
    return result;
}
*/


///
/// Functions for showing Pn Profinet diagnostics 
///

function OnDiagStatusOk()
{
    $("#id_lbdiag_status_ok_span").show();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_status_additional_text_red_span").hide();
    
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnStateDiagStatusReloadingTable()
{
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").show();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnStateDiagStatusNewConfigs()
{
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").show();
    $("#id_lbdiag_status_disconnected_span").hide();
    
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnConnectionError(xhr, status, error)
{
    $("#id_lbdiag_online_circle_span").hide();
    $("#id_lbdiag_online_status_span").hide();
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    
    $("#id_lbdiag_offline_circle_span").show();
    $("#id_lbdiag_offline_status_span").show();
    $("#id_lbdiag_status_disconnected_span").show();
    $("#id_lbdiag_offline_circle_span").css("display","inline-block");

    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();  
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
    if(ConnectionStatusOk == true)
    {
        ConnectionStatusOk = false;
    }
}

function OnDiagOnline()
{
    $("#id_lbdiag_online_circle_span").show();
    $("#id_lbdiag_online_status_span").show();
    
    $("#id_lbdiag_offline_circle_span").hide();
    $("#id_lbdiag_offline_status_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_offline_circle_span").css("display","none");
}

function OnModuleError(moduleNo, errorCode)
{
    $("#id_lbdiag_module_list_states > span").each(function(){
        $(this).hide();
    });
    
    $("#id_lbdiag_status_module_error_span").show();
    $("#id_lbdiag_status_additional_text_red_span").text(moduleNo + "! - Code: " + HexStrPad4(errorCode));
    $("#id_lbdiag_status_additional_text_red_span").show();
}

function OnResetModulesListStatest()
{
    $("#id_lbdiag_module_list_states > span").each(function(){
        $(this).hide();
    });
}

function OnModulesListingError()
{
    $("#id_lbdiag_module_list_states > span").each(function(){
        
        $(this).hide();
    });
    $("#id_lbdiag_status_list_error_span").show();
}

function OnNoBusconfigAvailable()
{
    $("#id_lbdiag_module_list_states > span").each(function(){
        $(this).hide();
    });
    
    $("#id_lbdiag_status_no_bus_config_span").show();
    $("#id_lbdiag_status_additional_text_red_span").text(Lbdiag_activeLocalBus);
    $("#id_lbdiag_status_additional_text_red_span").show();
}

function OnSysfailSet()
{
    $("#id_lbdiag_status_sysfail_span").show();
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnHideModuleError()
{
    $("#id_lbdiag_status_module_error_span").hide();
    $("#id_lbdiag_status_no_bus_config_span").hide();
    $("#id_lbdiag_status_additional_text_red_span").hide();
}

function OnPeripheralError()
{
    $("#id_lbdiag_status_periph_error_span").show();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();
    
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnUserError()
{
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").show();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();
    
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnBusError()
{
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").show();
    $("#id_lbdiag_status_hw_error_span").hide();
    
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnHardwareError()
{
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").show();
    
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").hide();
}

function OnDiagnosticRegistersUpdated()
{
    $("#id_lbdiag_status_periph_error_span").hide();
    $("#id_lbdiag_status_user_error_span").hide();
    $("#id_lbdiag_status_bus_error_span").hide();
    $("#id_lbdiag_status_hw_error_span").hide();
    
    $("#id_lbdiag_status_ok_span").hide();
    $("#id_lbdiag_status_reloading_table_span").hide();
    $("#id_lbdiag_status_new_configs_detected_span").hide();
    $("#id_lbdiag_status_disconnected_span").hide();
    $("#id_lbdiag_status_sysfail_span").hide();
    $("#id_lbdiag_status_register_updated_span").show();
}

LocalBusDiagService = (function () {

    let Public = {

        ConfirmDiagnostics: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ConfirmDiagnostics",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        CheckActiveLocalBus: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "CheckActiveLocalBus",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                ajaxCallbackFunctions);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ListModulesTable: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "ListModulesTable",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                ajaxCallbackFunctions, null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetModulesChangesRandomNumber: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetModulesChangesRandomNumber",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                ajaxCallbackFunctions,
                null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        ReadDiagnosticRegisters: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "ReadDiagnosticRegisters",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetModulesDiagData: function (activeModalVal)
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let data = "ActiveModalModule=" + encodeURIComponent(activeModalVal);

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetModulesDiagData?" + data,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                ajaxCallbackFunctions,
                null);

            // Update local bus Diagnostic Registers and check Bus errors
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        }

    }

    let Private = {
        dataProviderScriptName: "module/LocalBusDiag/LocalBusDiagDp/"
    }

    return Public;

})();
