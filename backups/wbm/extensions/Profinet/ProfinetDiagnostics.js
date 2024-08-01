SubPageActive = true;

ConnectionStatusOk = true;

pndiag_selectedStoreTabID = localStorage.getItem("PofinetDiagnosticsActiveTabKey");

PNDIAG_UPDATE_TIMEOUT = 1000;

/* Diagnosis Code Bit Masks */
PNDIAG_DIAG_CODE_BIT00_MASK = 0x0001; // set if not connected
PNDIAG_DIAG_CODE_BIT01_MASK = 0x0002; // set if data invalid
PNDIAG_DIAG_CODE_BIT02_MASK = 0x0004; // set if diagnosis is available
PNDIAG_DIAG_CODE_BIT03_MASK = 0x0008; // set if module difference is available in case of configuration difference
PNDIAG_DIAG_CODE_BIT04_MASK = 0x0010; // set  if AR is deactivated
PNDIAG_DIAG_CODE_BIT05_MASK = 0x0020; // set if neighborhood information is not available
PNDIAG_DIAG_CODE_BIT06_MASK = 0x0040; // neighborhood information not unique
PNDIAG_DIAG_CODE_BIT07_MASK = 0x0080; // Identify.cnf on alias received, but name of the device is already configured in another AR
PNDIAG_DIAG_CODE_BIT08_MASK = 0x0100; // Maintenance Required Information is available
PNDIAG_DIAG_CODE_BIT09_MASK = 0x0200; // Maintenance Demanded Information is available
PNDIAG_DIAG_CODE_BIT10_MASK = 0x0400; // Channel or Manufacturer Specific Diagnosis Information are available

PNDIAG_DIAG_STATUS_NONE_COLOR         = '#FFFFFF';
PNDIAG_DIAG_STATUS_OK_COLOR           = '#92D050';
PNDIAG_DIAG_STATUS_WARNING_COLOR      = '#FFC000';
PNDIAG_DIAG_STATUS_ERROR_COLOR        = '#ED1C24';
PNDIAG_DIAG_STATUS_DEACTIVATED_COLOR  = '#808080';

PNDIAG_DEVICE_LIST_TAB_ID = 'id_pndiag_device_list_tab';
PNDIAG_DEVICE_TREE_TAB_ID = 'id_pndiag_tree_view_tab';

Pndiag_DeviceListLoaded = false;
Pndiag_DeviceTreeLoaded = false;

Pndiag_DiagUpdateTimer = undefined;
Pndiag_ResetDiagColorsUpdateTimer = undefined;

PnDiag_DeviceInfoModalVisible = false;
PnDiag_ModuleInfoModalVisible = false;
PnDiag_SubmoduleInfoModalVisible = false;

PnDiag_ModalArUserId = 0;
PnDiag_ModalSlotId = 0;
PnDiag_ModalSubslotId = 0;

Pndiag_LastDevicesChangesRandomNumber = 0;
Pndiag_LastDevicesListStringValue = "";

DiagStatusResult = {
    None:          "NONE",
    Ok:            "OK",
    Warning:       "Warning",
    Error:         "Error",
    ArDeactivated: "AR deactivated"    
}

DiagResultText = {
    None: "None",
    Ok: "Ok",
    DeviceDisconnected:           "DeviceDisconnected",
    DiagnosisIsAvailable:         "DiagnosisIsAvailable",
    NeighborhoodInfoNotAvailable: "NeighborhoodInfoNotAvailable",
    NeighborhoodInfoNotUnique:    "NeighborhoodInfoNotUnique",
    NeighbInfoConnNotAvailable:   "NeighbInfoConnNotAvailable",
    ModuleDifference:             "ModuleDifference",
    MaintenanceRequired:          "MaintenanceRequired",
    MaintenanceDemanded:          "MaintenanceDemanded",
    DiagInfoIsAvailable:          "DiagInfoIsAvailable",
    DeviceAlreadyConfigured:      "DeviceAlreadyConfigured",
    ArDeactivated:                "ArDeactivated",
    ManufacturerDiagnosis:        "ManufacturerDiagnosis"
}    

DiagResultTextClasses = {
    None:          "c_pndiag_diag_text_none_span",
    Ok:            "c_pndiag_diag_text_ok_span",
    Warning:       "c_pndiag_diag_textclass_device_warning",
    Error:         "c_pndiag_diag_textclass_device_error",
    ArDeactivated: "c_pndiag_diag_status_ar_deactivated"
}

DiagnosisResult = {
    Status: DiagStatusResult.None,
    Code:   0x0000,
    TextClass : DiagResultTextClasses.Ok,
    DiagColor: PNDIAG_DIAG_STATUS_NONE_COLOR 
}

PnDevicesDiagnosisData = {};


PnTreeElementsNamesIds = {
    "station"      : "id_pndiag_treenode_station",
    "ip-addr"      : "id_pndiag_treenode_ipaddr",
    "vendor-id"    : "id_pndiag_treenode_vendor_id",
    "device-id"    : "id_pndiag_treenode_device_id",
    "modules"      : "id_pndiag_treenode_modules",
    "module-id"    : "id_pndiag_treenode_module_id",
    "slot"         : "id_pndiag_treenode_slot_number",
    "slot-number"  : "id_pndiag_treenode_slot_number",
    "sub-modules"  : "id_pndiag_treenode_sub_modules",
    "node-id"      : "id_pndiag_treenode_node_id",
    "submodule-id" : "id_pndiag_treenode_submodule_id",
    "subslot"      : "id_pndiag_treenode_subslot",
    "type"         : "id_pndiag_treenode_type",
    "sub-elements" : "id_pndiag_treenode_subelements",
    "pn-devices"   : "id_pndiag_pn_devices"
}

DiagnosisCounter = 0;

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        if(PnDiag_DeviceInfoModalVisible) {
            OnHideDeviceInfoModal();
        } else if(PnDiag_ModuleInfoModalVisible) {
            OnHideModuleInfoModal();
        } else if(PnDiag_SubmoduleInfoModalVisible) {
            OnHideSubmoduleInfoModal();
        }
    }
}

function CleanUpPageData()
{
    window.clearTimeout(Pndiag_DiagUpdateTimer);
    window.clearInterval(Pndiag_DiagUpdateTimer);
    window.clearTimeout(Pndiag_ResetDiagColorsUpdateTimer);
    window.clearInterval(Pndiag_ResetDiagColorsUpdateTimer);
    
    delete SubPageActive;
    delete ConnectionStatusOk;
    
    delete pndiag_selectedStoreTabID;

    delete PNDIAG_UPDATE_TIMEOUT;
    
    /* Diagnosis Code Bit Masks */
    delete PNDIAG_DIAG_CODE_BIT00_MASK; // set if not connected
    delete PNDIAG_DIAG_CODE_BIT01_MASK; // set if data invalid
    delete PNDIAG_DIAG_CODE_BIT02_MASK; // set if diagnosis is available
    delete PNDIAG_DIAG_CODE_BIT03_MASK; // set if module difference is available in case of configuration difference
    delete PNDIAG_DIAG_CODE_BIT04_MASK; // set  if AR is deactivated
    delete PNDIAG_DIAG_CODE_BIT05_MASK; // set if neighborhood information is not available
    delete PNDIAG_DIAG_CODE_BIT06_MASK; // neighborhood information not unique
    delete PNDIAG_DIAG_CODE_BIT07_MASK; // Identify.cnf on alias received, but name of the device is already configured in another AR
    delete PNDIAG_DIAG_CODE_BIT08_MASK; // Maintenance Required Information is available
    delete PNDIAG_DIAG_CODE_BIT09_MASK; // Maintenance Demanded Information is available
    delete PNDIAG_DIAG_CODE_BIT10_MASK; // Channel or Manufacturer Specific Diagnosis Information are available

    delete PNDIAG_DIAG_STATUS_NONE_COLOR;
    delete PNDIAG_DIAG_STATUS_OK_COLOR;
    delete PNDIAG_DIAG_STATUS_WARNING_COLOR;
    delete PNDIAG_DIAG_STATUS_ERROR_COLOR;
    delete PNDIAG_DIAG_STATUS_DEACTIVATED_COLOR;

    delete PNDIAG_DEVICE_LIST_TAB_ID;
    delete PNDIAG_DEVICE_TREE_TAB_ID;

    delete Pndiag_DeviceListLoaded;
    delete Pndiag_DeviceTreeLoaded;

    delete Pndiag_DiagUpdateTimer;
    delete Pndiag_ResetDiagColorsUpdateTimer;
    
    delete PnDiag_DeviceInfoModalVisible;
    delete PnDiag_ModuleInfoModalVisible;
    delete PnDiag_SubmoduleInfoModalVisible;

    delete PnDiag_ModalArUserId;
    delete PnDiag_ModalSlotId;
    delete PnDiag_ModalSubslotId;

    delete Pndiag_LastDevicesChangesRandomNumber;
    delete Pndiag_LastDevicesListStringValue;

    delete DiagStatusResult;

    delete DiagResultText;

    delete DiagResultTextClasses;

    delete DiagnosisResult;

    delete PnDevicesDiagnosisData;
    delete PnDevicesActivationData;


    delete PnTreeElementsNamesIds;

    delete DiagnosisCounter;

    delete ProfinetService;
}
    
$(document).ready(function(){
    
    $("#id_div_loader").show();
    
    ///
    /// Update PN Controller/Device activation statuses
    ///
    UpdatePnControllerDeviceStatus();
    
    ///
    /// Try to Set Controller Overview Fields 
    ///
    BuildControllerOverviewFields();
    
    // show hidded elements after loading and restoring Tabs  
    $("#id_pndiag_controller_overview_table").show();
    $("#id_pndiag_profinet_controller_hr").show();
    $("#id_pndiag_profinet_controller_h").show();


    ///
    /// Start Profinet Diagnostics 
    ///
    
    // Set PN Diagnostics status to reloading table
    OnDiagStatusReloadingTable();
    
    // Start loading PN objects/tables
    setTimeout(FirstLoadPnDiagnosticObjects, 50);

    
    ///
    /// Handle specific events
    ///
    
    $(".pxc-pd-tabs h2 a").click(function(event){
        
        pndiag_selectedStoreTabID = $(this).attr('id');
        SwitchPnDiagnosticsTab(pndiag_selectedStoreTabID);
        localStorage.setItem("PofinetDiagnosticsActiveTabKey", pndiag_selectedStoreTabID);
        event.preventDefault();
    });
    
    
    ///
    /// Details Modal events
    ///
    
    $("#id_pndiag_device_details_ok_button").click(OnHideDeviceInfoModal);
    $("#id_pndiag_module_details_ok_button").click(OnHideModuleInfoModal);
    $("#id_pndiag_submodule_details_ok_button").click(OnHideSubmoduleInfoModal);

    // Mutation Observer to watch changes on specific HTML elements
    var DomChangesObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if(mutation.target.id == 'id_pndiag_treenode_type') {
                if(Pndiag_DeviceTreeLoaded == true) {
                    UpdateTreeNodesNames('id_pndiag_devices_tree');
                }
            }
      });    
    });
    if($("#id_pndiag_treenode_type").length) {
        DomChangesObserver.observe($("#id_pndiag_treenode_type")[0], { characterData: true, childList:true, subtree:true, attributes: true, attributeOldValue: true });
    }
}); 

function UpdatePnControllerDeviceStatus()
{
    let response = ProfinetService.GetPnDeviceControllerStatus();
    if(typeof response !== "undefined" && response != null) {
        if(response.result.PnControllerEnabled) {
            $("#id_pndiag_controller_status_td").css("background-color", "blue");
            $("#id_pndiag_controller_status_activated").show();
            $("#id_pndiag_controller_status_deactivated").hide();
        } else {
            $("#id_pndiag_controller_status_td").css("background-color", "gray");
            $("#id_pndiag_controller_status_activated").hide();
            $("#id_pndiag_controller_status_deactivated").show();
        }
        if(response.result.PnDeviceEnabled) {
            $("#id_pndiag_device_status_td").css("background-color", "blue");
            $("#id_pndiag_device_status_activated").show();
            $("#id_pndiag_device_status_deactivated").hide();
        } else {
            $("#id_pndiag_device_status_td").css("background-color", "gray");
            $("#id_pndiag_device_status_activated").hide();
            $("#id_pndiag_device_status_deactivated").show();
        }
    }
}

function BuildControllerOverviewFields()
{
    let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
    ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig("InfoValues.cgi?artname", AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.HTML, "", ajaxCallbackFunctions);
    
    $("#id_pndiag_device_name_input").val(AjaxInterface.PerformSyncRequest(ajaxReqConfig));
    // Take first Ethernet Interface with Index 0
    
    let controllerConfig = ProfinetService.GetControllerConfig();

    $("#id_pndiag_ip_address_input").val(controllerConfig.ipAddress);
    $("#id_pndiag_subnet_mask_input").val(controllerConfig.subnetMask);
    $("#id_pndiag_std_gateway_input").val(controllerConfig.defaultGateway);

    ///
    /// Restore the Last selected Diagnosis Tab 
    ///
    if((typeof pndiag_selectedStoreTabID !== "undefined") && ($("#" + pndiag_selectedStoreTabID).length != 0)) {
        SwitchPnDiagnosticsTab(pndiag_selectedStoreTabID);
    }
}

/// 
/// Loads the Profinet Devices List for the first time
/// 
/// @returns {none}
///

function FirstLoadPnDiagnosticObjects()
{
    // Check Session is Valid
    ProfinetService.GetControllerTree()
    .then(function(data) {
        ConnectionStatusOk = true;
        if(data.error) {
            console.log("Error: " + data.errorText);
            result = false;
        }

        // Reload Devices List table
        ReloadDevicesListTable(data);
        
        OnDiagStatusReloadingDevicesTree();
        
        OnLoadPnDevicesTree(data, false);
        // start updating diagnostic data
        OnPnUpdateDiagnosticsData();
        
        // Set PN Diagnostics Status to Ok
        OnDiagStatusOk();
        Language.UpdateActivePageMessages();
        $("#id_div_loader").hide();
    })
    .catch(function(errorObj) {
        // check status && error
        console.log(errorObj);

    });
}


/// 
/// Diagnostics Data update function which is called permanent every 1 second. This function:
///     - Checks if device list changed (new engineer project), when yes it reloades all diagnostics data and devices structures
///     - updates the diagnostics data fields 
/// @returns {none}
/// 
function OnPnUpdateDiagnosticsData(initial)
{
    ProfinetService.GetDevicesChangesRandomNum()
    .then(function(response) {
        ConnectionStatusOk = true;
        // Check Device List Modifications
        var devicesTableChanged = CheckDevicesListChanged(response);
        // if Devices Table content changed
        if(devicesTableChanged == true) {
            // Clear Pn Devices Diagnosis Data
            PnDevicesDiagnosisData = {};
            
            // Set PN Diagnostics Status to New Configs
            OnDiagStatusNewConfigs();
            $("#id_div_loader").show();
            
            // Set PN Diagnostics status to reloading table
            OnDiagStatusReloadingTable();
            
            
            // Request PN Devices List
            ProfinetService.GetControllerTree()
            .then(function(data) {
                ConnectionStatusOk = true;
                if(data.error) {
                    console.log("Error: " + data.errorText);
                    result = false;
                }
                // Reload Devices List table
                ReloadDevicesListTable(data);
                
                // Load PN-Devices Tree
                OnLoadPnDevicesTree(data, true);
                
                ProcessDiagnosisAtChange();
                
                // Set PN Diagnostics Status to Ok
                OnDiagStatusOk();
                Language.UpdateActivePageMessages();
                $("#id_div_loader").hide();
            })
            .catch(function(errorObj) {
                // check status && error
                console.log(errorObj);
            });
        } else {
            ProcessDiagnosisAtChange();
        }
    })
    .catch(function(errorObj) {
        // check status && error
        console.log(errorObj);

    });

    // Set Updating Timer Time Out
    Pndiag_DiagUpdateTimer = setTimeout(OnPnUpdateDiagnosticsData, PNDIAG_UPDATE_TIMEOUT);

    if(GlobalConnectionStatusOk == false) {
        ConnectionStatusOk = false;
        OnConnectionError(null, null, null);
    }
    if(initial == true) {
        $("#id_div_loader").hide();
    }
}

function ProcessDiagnosticsDataUpdate(diagnosisInformation)
{
    // Update Device List Diagnostics
    UpdateDeviceListDiagnostics(diagnosisInformation); 

    // Update Devices Tree Diagnosrics Data
    UpdateDevicesTreeDiagnostics(diagnosisInformation);
}
///
/// Profinet Devices List Functions 
///

/// 
/// Reloades the Devices List dynamically on change 
/// @returns {none}
/// 
function ReloadDevicesListTable(jsonDevicesTree)
{  
    let deviceListTableRowsHtml = "";
    var deviceNumber = 0;
    if(jsonDevicesTree != null && jsonDevicesTree.result != undefined) {
        $.each(jsonDevicesTree.result.children, function(index, pnDevice)
        {
            let pnDeviceRowHtml  = '"<tr class="odd">';
            deviceNumber++;
            // Device ID Column
            pnDeviceRowHtml += '<td id="id_pndiag_device_' + pnDevice.localNodeId + '_id_td">' + deviceNumber + '</td>';
            // Device Name Column
            if(pnDevice.hasWbm == true) {
                let deviceWbmLink = 'http://' + pnDevice.ipAddress;
                pnDeviceRowHtml += '<td class="break-line" id="id_pndiag_device_' + pnDevice.localNodeId + '_name_td"><a target="_blank" rel="noopener noreferrer" href="' + deviceWbmLink + '">' + pnDevice.dnsName + '* </a></td>';
            } else {
                pnDeviceRowHtml += '<td id="id_pndiag_device_' + pnDevice.localNodeId + '_name_td">' + pnDevice.stationName + '</td>';
            }
            // IP Address
            pnDeviceRowHtml += '<td id="id_pndiag_device_' + pnDevice.localNodeId + '_ipaddr_td">' + pnDevice.ipAddress + '</td>';
            // Diagnosis Field
            pnDeviceRowHtml += '<td id="id_pndiag_device_' + pnDevice.localNodeId + '_disgnosis_td">'
                            +      '<span id="id_pndiag_device_' + pnDevice.localNodeId + '_diagnosis_span" style="color:white; font-weight: bold;"></span>'
                            +      '<span id="id_pndiag_device_' + pnDevice.localNodeId + '_diagnosis_code" style="color:white; font-weight: bold;"></span>'
                            +  '</td>';

            pnDeviceRowHtml += '<td style="text-align:center;">'
                            +      '<button class="pxc-btn-show tooltip" id="id_pndiag_device_' + pnDevice.localNodeId + '_details_button" onclick="ShowDeviceDiagnosis(' + pnDevice.arUserId + ')" align="center">'
                            +           '<span class="tooltip-text-right">Details</span>'
                            +       '</button>'
                            +  '</td>';

            pnDeviceRowHtml += '<td style="text-align:center;">'
                            +      '<button class="pxc-lnk-ext tooltip" id="id_pndiag_device_' + pnDevice.localNodeId + '_tree_node_button" onclick="OnViewTreeNode(\'' + pnDevice.cTreeNodeId + '\')" align="center">'
                            +           '<span class="tooltip-text-right c_pndiag_goto_treenode_text"></span>'
                            +       '</button>'
                            +  '</td>';

            pnDeviceRowHtml += '</tr>';
            deviceListTableRowsHtml += pnDeviceRowHtml;
        });
    }
    // Reload Modules List table
    $("#id_pndiag_device_list_table tr:not('.exclude')").remove();
    deviceListTableRowsHtml = ($("#id_pndiag_device_list_table > tbody").html() + deviceListTableRowsHtml);
    $("#id_pndiag_device_list_table > tbody").html(deviceListTableRowsHtml);
}

/// 
/// Expand the desired node only if it's currently closed
/// @param {htmlButton} btn : Tree View node that has a expand/collape button
/// @returns {none}
/// 
function ExpandTreeNode(btn)
{
    if (btn.attr("class") == 'ctree_toggleNode ctree_nodeClose') {
        btn.click();
    }
}

/// 
/// Collapse the desired node only if it's currently open
/// @param {htmlButton} btn : Tree View node that has a expand/collape button
/// @returns {none}
/// 
function CollapseTreeNode(btn)
{
    if (btn.attr("class") == 'ctree_toggleNode ctree_nodeOpen') {
        btn.click();
    }
}

/// 
/// Collapse all device Tree View nodes
/// @param {ctreeNode} rootNode : Root node of the Tree View
/// @returns {none}
/// 
function CollapseAllDeviceTreeNodes(rootNode)
{
    var devices = rootNode.parent().children('.ctree_children');
    devices.children().each(function(index, listItem) {
        var btn = $(listItem).children('.ctree_toggleNode'); // Get the button of each device and collapse if open
        CollapseTreeNode(btn);
     });
}

/// 
/// Collapse all other device Tree View nodes
/// @param {ctreeNode} rootNode : Root node of the Tree View
/// @returns {none}
/// 
function CollapseAllOtherDeviceTreeNodes(rootNode, nodeToExclude)
{
    var devices = rootNode.parent().children('.ctree_children');
    devices.children().each(function(index, listItem) {
        var node = $(listItem).children('a');
        if (node.attr('id') != nodeToExclude.attr('id')) {
            var btn = $(listItem).children('.ctree_toggleNode'); // Get the button of each device and collapse if open
            CollapseTreeNode(btn);
        }
     });
}

/// 
/// Unselects all selected Tree View nodes except for nodeToExclude, currently needs a currentNode to function
/// @param {ctreeNode} currentNode   : The current Tree View node
/// @param {ctreeNode} nodeToExclude : The Tree View Node to exclude
/// @param {bool} exclude : The current Tree View node
/// @returns {none}
/// 
function UnselectAllOtherTreeViewNodes(currentNode, nodeToExclude)
{
    var lastSelectedNodes = currentNode.closest('.ctree_root').find('.ctree_selected');
    lastSelectedNodes.each(function(index, listItem) {
        var node = $(listItem).children('a');
        if (node.attr('id') != nodeToExclude.attr('id')) {
            $(listItem).removeClass('ctree_selected');
        }
     });
}

/// 
/// Click event for Device List items, to highlight the desired Tree View node
/// @param {String} nodeId : CTree node id
/// @returns {none}
/// 
function OnViewTreeNode(nodeId)
{
    // Change the tab to the Tree View
    $('#id_pndiag_tree_view_tab').click();

    // Get the correct Tree View nodes
    var rootNode = $("#id_cTreeNode__PnController_");
    var node = $("#id" + nodeId);

    CollapseAllOtherDeviceTreeNodes(rootNode, node);

    // Expand the root and the desired device node -- Expand (+/-) Button is the .prev() element
    ExpandTreeNode(rootNode.prev());
    ExpandTreeNode(node.prev());

    UnselectAllOtherTreeViewNodes(rootNode, node);
    node.addClass("ctree_selected"); // Select the desired node

    window.location.hash = '#id' + nodeId;

    window.event.preventDefault();
}

/// 
/// Updates the diagnostics data in the devices list
/// @param {jsonObject} diagnosisInformation : JSON object containing the tree structure and activation/diagnosis states of all devices and modules/submodules
/// @returns {none}
/// 
function UpdateDeviceListDiagnostics(diagnosisInformation)
{
    if(pndiag_selectedStoreTabID != PNDIAG_DEVICE_LIST_TAB_ID) {
        if(ConnectionStatusOk == true) {
            OnDiagStatusOk();
        }
        return;
    }
    //console.log("Updating Diagnostics Data..");
    ProfinetService.GetPnDevicesDataReady()
    .then(function(response) {
        if(CheckPnDevicesDataReady(response) == false) {
            OnDiagStatusReloadingTable();
            return;
        }
        //console.log("Updating Device List Diagnostics...");
        $.each(diagnosisInformation.deviceDiagnoses, function(i, deviceDiagnosis) {
            // if device has WBM but link has not been added yet (if not connected when loading project)
            var linkExists = $('#id_pndiag_device_' + deviceDiagnosis.arUserId + '_name_td').has('a').length != 0;
            if(deviceDiagnosis.hasWbm && !linkExists) {
                AddWbmLink(deviceDiagnosis.arUserId);
            }

            var hasDifference = HasDifference(deviceDiagnosis);
            var diagResult = ParseDiagCode(deviceDiagnosis.diagnosisCode, hasDifference); 
            SetDeviceListStatus(deviceDiagnosis, diagResult);

            // Update the modal
            if (PnDiag_DeviceInfoModalVisible && (deviceDiagnosis.arUserId == PnDiag_ModalArUserId)) {
                SetDeviceInfoStatus(deviceDiagnosis.severity, diagResult, hasDifference);
                RequestAndUpdateDeviceDiagnosis(deviceDiagnosis.arUserId);
            }

        });
    })
    .catch(function(errorObj) {
        console.log(errorObj)
    })

    if(ConnectionStatusOk == true) {
        OnDiagStatusOk();
    }
}

function AddWbmLink(arUserId)
{
   // get dns name and ip address
   let dnsName = $('#id_pndiag_device_' + arUserId + '_name_td').text();
   let ipAddress = $('#id_pndiag_device_' + arUserId + '_ipaddr_td').text();
   // overwrite entry
   let newContent = '<a target="_blank" rel="noopener noreferrer" href="http://' + ipAddress + '">' + dnsName + '* </a>';
   $('#id_pndiag_device_' + arUserId + '_name_td').html(newContent);
}

/// 
/// Checks if the devices list changes (e.g. new Engineer Project)
/// @returns {bool} true when the devices list has been changed. Otherwise false
/// 
function CheckDevicesListChanged(response)
{
    var result = false;

    if(response != false && typeof response != undefined) {
        try {
            var responseEntries  = response.split(';');  
            if(responseEntries.length == 2) {
                var randomNumberEntry = responseEntries[0];
                var devicesStringEntry = responseEntries[1];
                var randomNumberElements = randomNumberEntry.split('=');
                var devicesStringElements = devicesStringEntry.split('=');
                if(randomNumberElements.length == 2 && devicesStringElements.length == 2 && randomNumberElements[0] == 'Rondom' && devicesStringElements[0] == 'DevicesString') {
                    var CurrentDevicesListStringValue = devicesStringElements[1];
                    if(Pndiag_LastDevicesChangesRandomNumber != parseInt(randomNumberElements[1]) || JSON.stringify(Pndiag_LastDevicesListStringValue) !== JSON.stringify(CurrentDevicesListStringValue)) {
                        result = true;
                        console.log("Devices List changed!");
                        OnReloadingProjectConfiguration();
                        Pndiag_LastDevicesChangesRandomNumber = parseInt(randomNumberElements[1]);
                        Pndiag_LastDevicesListStringValue     = CurrentDevicesListStringValue;
                    }
                }
            }
        } catch(e) {
            console.log("Error on checking device list changes occurres, Error: ", CheckDevicesListChanged);
        }
    }

    return result;
}

/// 
/// Checks if the devices data are ready
/// @returns {bool} true when the data are ready. Otherwise false
/// 
function CheckPnDevicesDataReady(response)
{
    var result = false;

    if(response != "" && typeof response != undefined) {
        try {
            //console.log("Response = " + response);
            var responseEntries  = response.split('=');
            if(responseEntries.length == 2 && responseEntries[0] == 'DataReady') {
                result = (responseEntries[1] == '1');
            }
        } catch(e) {
            console.log("Exception occurred on checking Pn devices data ready, Error: ",e);
        }
    }

    return result;
}

function ProcessDiagnosisAtChange()
{
    var requestData = JSON.stringify( { "diagnosisCounter" : Number(DiagnosisCounter)});

    // Request Devices Diagnostics Data from Controller    
    ProfinetService.GetDiagnosisInformation(requestData)
    .then(function(response) {
        if(typeof response != undefined) { 
            if(response.diagnosisCounter != DiagnosisCounter) {
                DiagnosisCounter = response.diagnosisCounter;
                ProcessDiagnosticsDataUpdate(response);
            }                
        } else {
            console.error("Failed to get diagnosis counter!");
        }
    })
    .catch(function(errorObj) {
        console.log(errorObj)
    })
}

function SetDeviceListStatus(deviceDiagnosis, diagResult)
{
    var diagnosisTdId   = ('id_pndiag_device_' + deviceDiagnosis.arUserId + '_disgnosis_td');
    var diagnosisSpanID = ('id_pndiag_device_' + deviceDiagnosis.arUserId + '_diagnosis_span');
    var diagnosisCodeID = ('id_pndiag_device_' + deviceDiagnosis.arUserId + '_diagnosis_code');

    //console.log('SetDeviceListStatus', deviceDiagnosis);
    
    $('#' + diagnosisSpanID).removeClass();

    var isConnected = IsDeviceConnected(deviceDiagnosis.diagnosisCode)
    if(diagResult.TextClass == DiagResultTextClasses.ArDeactivated) {
        SetFieldBackgrounColor(diagnosisTdId, diagResult.DiagColor);
        $('#' + diagnosisSpanID).text($('#id_pndiag_device_status_ar_deactivated').text());
        $('#' + diagnosisSpanID).addClass("c_pndiag_device_status_ar_deactivated");
    } else if (!isConnected) {
        SetFieldBackgrounColor(diagnosisTdId, PNDIAG_DIAG_STATUS_ERROR_COLOR);
        $('#' + diagnosisSpanID).text($('#id_pndiag_device_status_no_connection').text());
        $('#' + diagnosisSpanID).addClass("c_pndiag_diag_status_no_connection");
    } else {
        switch(deviceDiagnosis.severity) {
            case "MaintenanceRequired":
            case "MaintenanceDemanded":
                SetFieldBackgrounColor(diagnosisTdId, PNDIAG_DIAG_STATUS_WARNING_COLOR);
                $('#' + diagnosisSpanID).text($('#id_pndiag_device_status_warning').text());
                $('#' + diagnosisSpanID).addClass("c_pndiag_device_status_warning");
                break;
            case "Fault":
                SetFieldBackgrounColor(diagnosisTdId, PNDIAG_DIAG_STATUS_ERROR_COLOR);
                $('#' + diagnosisSpanID).text($('#id_pndiag_device_status_error').text());
                $('#' + diagnosisSpanID).addClass("c_pndiag_device_status_error");
                break;
            default:
                SetFieldBackgrounColor(diagnosisTdId, diagResult.DiagColor);
                $('#' + diagnosisSpanID).text(diagResult.Status);
                break;
        }
    }

    $('#' + diagnosisCodeID).text(" (" + NumStringToHexString(diagResult.Code) + ")");
}

function SetDeviceInfoStatus(severity, diagResult, hasDifference)
{
    SetDeviceInfoModalStatusField(severity, diagResult);

    SetDeviceInfoModalDiagFields(diagResult, hasDifference);
}

function SetDeviceInfoModalStatusField(severity, diagResult)
{
    var diagnosisTdId   = ('id_pndiag_device_status_id');
    var diagnosisSpanID = ('id_pndiag_device_status_span');

    if(diagResult.Status == DiagStatusResult.ArDeactivated) {
        SetFieldBackgrounColor(diagnosisTdId, diagResult.DiagColor);
        $('#' + diagnosisSpanID).text(diagResult.Status + " (" + NumStringToHexString(diagResult.Code) + ")");
    } else {
        switch(severity) {
            case "MaintenanceRequired":
            case "MaintenanceDemanded":
                SetFieldBackgrounColor(diagnosisTdId, PNDIAG_DIAG_STATUS_WARNING_COLOR);
                $('#' + diagnosisSpanID).text($("#id_pndiag_device_status_warning").text() + " (" + NumStringToHexString(diagResult.Code) + ")");
                break;
            case "Fault":
                SetFieldBackgrounColor(diagnosisTdId, PNDIAG_DIAG_STATUS_ERROR_COLOR);
                $('#' + diagnosisSpanID).text($("#id_pndiag_device_status_error").text() + " (" + NumStringToHexString(diagResult.Code) + ")");
                break;
            default:
                SetFieldBackgrounColor(diagnosisTdId, diagResult.DiagColor);
                $('#' + diagnosisSpanID).text(diagResult.Status + " (" + NumStringToHexString(diagResult.Code) + ")");
                break;
        }
    }
}

/// 
/// Sets the value and color for diagnosis field of the corresponsing Profinet device in the devices table 
/// 
/// @param {int} userId                      : The deive Ar Id
/// @param {diagResultObj} diagnosisResult   : Object of the converted DiagCode
/// @returns {none}
/// 
function SetDeviceInfoModalDiagFields(diagnosisResult, hasDifference)
{
    $("#id_pndiag_device_Info_table .DiagText").each(function(){
        $(this).find('td').each(function(){
            $(this).attr('style','background-color:' + diagnosisResult.DiagColor + ';');
        });
    });
    SetPnDeviceDetailsDiagText(diagnosisResult.Code, hasDifference); 
}

/// 
/// Updates the Devices Tree Diagnosrics Data
/// @param {jsonObject} diagnosisInformation : JSON object containing the tree structure and activation/diagnosis states of all devices and modules/submodules
/// @returns {none}
/// 
function UpdateDevicesTreeDiagnostics(diagnosisInformation)
{
    //if(pndiag_selectedStoreTabID != PNDIAG_DEVICE_TREE_TAB_ID)
    //{
    //    return;
    //}
  
    // Check Session is Valid
    ProfinetService.GetPnDevicesDataReady()
    .then(function(response) {
        if(CheckPnDevicesDataReady(response) == false) {
            OnDiagStatusReloadingDevicesTree();
            return;
        }
        console.log("Updating Device Tree Diagnostics...");
        // get tree configs
        var treeconfigs = $("#id_pndiag_devices_tree").getCtreeConfigs();
        if(diagnosisInformation.deviceDiagnoses.length != treeconfigs.json_data.children.length) {
            console.log("Error - Count of pn devices in the device list and the tree view mismatch");
            return;
        }

        var highestSeverity = UpdateDeviceDiagnostics(diagnosisInformation, treeconfigs);

        // Update Controller severity based on highest device/module/submodule severity
        var pnTreeControllerNodeImgId = treeconfigs.json_data.cTreeNodeId + "_img";
        if(diagnosisInformation.severity == "Normal") {
            switch(highestSeverity) {
                case 1:
                    $("#" + pnTreeControllerNodeImgId).attr("src", GetIconName("Normal"));
                    break;
                case 2:
                    $("#" + pnTreeControllerNodeImgId).attr("src", GetIconName("MaintenanceRequired"));
                    break;
                case 3:
                    $("#" + pnTreeControllerNodeImgId).attr("src", GetIconName("Fault"));
                    break;
                default:
                    $("#" + pnTreeControllerNodeImgId).attr("src", GetIconName(""));
                    break;
            }
        } else {
            $("#" + pnTreeControllerNodeImgId).attr("src", GetIconName(diagnosisInformation.severity));
        }
    })
    .catch(function(error) {
        console.log(error)
    })
    
    if(ConnectionStatusOk == true) {
        OnDiagStatusOk();
    }
}

function IsDeviceConnected(diagnosisCode)
{
    var isConnected = true;

    if(  CheckDiagBitIsSet(diagnosisCode, PNDIAG_DIAG_CODE_BIT00_MASK) == true
    || CheckDiagBitIsSet(diagnosisCode, PNDIAG_DIAG_CODE_BIT01_MASK) == true
    || CheckDiagBitIsSet(diagnosisCode, PNDIAG_DIAG_CODE_BIT04_MASK) == true) {
        isConnected = false;
    }

    return isConnected;
}

function HasDifference(deviceDiagnosis)
{
    var result = false;

    $.each(deviceDiagnosis.moduleDiagnoses, function(i, moduleDiagnosis){
        if(typeof(moduleDiagnosis.difference) != 'undefined') {
            result = true;
            // return false to leave loop
            return false;
        }
    });

    return result;
}

/// 
/// Updates the Device Tree Diagnostics Data
/// @param {jsonObject} diagnosisInformation : JSON object containing the tree structure and activation/diagnosis states of all devices and modules/submodules
/// @param {jsonObject} treeconfigs : JSON object containing the controller tree structure
/// @returns {int} highestSeverity : Returns the highest device/module/submodule severity
/// 
function UpdateDeviceDiagnostics(diagnosisInformation, treeconfigs)
{
    var highestSeverity = 0;

    $.each(treeconfigs.json_data.children, function(i, v) {
        // Update Devices Nodes Colors
        var PnTreeDeviceNodeImgId = v.cTreeNodeId + "_img";
        var deviceDiagnosis = diagnosisInformation.deviceDiagnoses[i];
        var hasDifference = HasDifference(deviceDiagnosis);
        var diagResult = ParseDiagCode(deviceDiagnosis.diagnosisCode, hasDifference); 
        
        var deviceError = false;

        var isConnected = IsDeviceConnected(deviceDiagnosis.diagnosisCode); // ToDo: Double check if this is suitable for 'No connection'
          
        if(deviceDiagnosis.severity == "Normal") {
            switch(diagResult.DiagColor) {
                case PNDIAG_DIAG_STATUS_OK_COLOR:
                case PNDIAG_DIAG_STATUS_NONE_COLOR:
                    $("#" + PnTreeDeviceNodeImgId).attr("src",treeconfigs.types["PnDevice"].icon);
                    if(highestSeverity < 1) {
                        highestSeverity = 1;
                    }
                break;
                
                case PNDIAG_DIAG_STATUS_WARNING_COLOR:
                    $("#" + PnTreeDeviceNodeImgId).attr("src",treeconfigs.types["PnDeviceWarning"].icon);
                    deviceError = true;
                    if(highestSeverity < 2) {
                        highestSeverity = 2;
                    }
                break;
                
                case PNDIAG_DIAG_STATUS_ERROR_COLOR:
                    if (!isConnected) {
                        $("#" + PnTreeDeviceNodeImgId).attr("src",GetIconName('NoConnection'));
                    } else {
                        $("#" + PnTreeDeviceNodeImgId).attr("src",treeconfigs.types["PnDeviceError"].icon);
                    }
                    deviceError = true;
                    if(highestSeverity < 3) {
                        highestSeverity = 3;
                    }
                break; 

                case PNDIAG_DIAG_STATUS_DEACTIVATED_COLOR:
                    $("#" + PnTreeDeviceNodeImgId).attr("src",treeconfigs.types["PnArDeactivated"].icon);
                    deviceError = true;
                break;
            }
        } else {
            $("#" + PnTreeDeviceNodeImgId).attr("src",GetIconName(deviceDiagnosis.severity)); // ToDo: Set not connected icon if diagnosis is not connected
        }

        SetDeviceListStatus(deviceDiagnosis, diagResult);

        // Update the modal
        if (PnDiag_DeviceInfoModalVisible && (v.arUserId == PnDiag_ModalArUserId)) {
            SetDeviceInfoStatus(deviceDiagnosis.severity, diagResult, hasDifference);
            RequestAndUpdateDeviceDiagnosis(v.arUserId);
        }

        UpdateModuleDiagnostics(v.arUserId, v.children, deviceDiagnosis.moduleDiagnoses, isConnected);
    });

    return highestSeverity;
}

/// 
/// Updates the Modules Tree Diagnostics Data
/// @param {jsonObject} modules : JSON object containing the tree structure of all modules
/// @param {jsonObject} moduleDiagnoses : JSON object containing the tree structure of all modules with diagnosis information
/// @returns {none}
/// 
function UpdateModuleDiagnostics(arUserId, modules, moduleDiagnoses, isConnected)
{
    var diagnosesIndex = 0;

    $.each(modules, function(index, module){        
        var moduleNodeImgId = module.cTreeNodeId + "_img";

        // Update the modal
        if (PnDiag_ModuleInfoModalVisible && (arUserId == PnDiag_ModalArUserId) && (module.slot == PnDiag_ModalSlotId)) {
            RequestAndUpdateModuleDiagnosis(arUserId, module.slot);
        }

        if(!isConnected) {
            $("#" + moduleNodeImgId).attr("src", GetIconName('NoInfo'));
            UpdateSubmoduleDiagnostics(arUserId, module.slot, module.children, [], isConnected);
        } else if(moduleDiagnoses.length > diagnosesIndex && moduleDiagnoses[diagnosesIndex].slot == module.slot) {
            var submodulesAvailable = true;
            UpdateModuleInfoModalDiagnosticFields(arUserId, module.slot, moduleDiagnoses[diagnosesIndex]);
            if(typeof(moduleDiagnoses[diagnosesIndex].difference) != 'undefined') {
                if(moduleDiagnoses[diagnosesIndex].severity != 'Fault') {
                    $("#" + moduleNodeImgId).attr("src", GetIconName('Difference'));
                } else {
                    $("#" + moduleNodeImgId).attr("src", GetIconName(moduleDiagnoses[diagnosesIndex].severity));
                }

                if(moduleDiagnoses[diagnosesIndex].difference == 0) {
                    submodulesAvailable = false;
                }
            } else {
                $("#" + moduleNodeImgId).attr("src", GetIconName(moduleDiagnoses[diagnosesIndex].severity));
            }
            UpdateSubmoduleDiagnostics(arUserId, module.slot, module.children, moduleDiagnoses[diagnosesIndex].submoduleDiagnoses, submodulesAvailable);
            diagnosesIndex++;
        } else {
            UpdateModuleInfoModalDiagnosticFields(arUserId, module.slot, {});
            $("#" + moduleNodeImgId).attr("src", GetIconName("Normal"));
            UpdateSubmoduleDiagnostics(arUserId, module.slot, module.children, [], isConnected);
        }
    });
}

/// 
/// Updates the Modules Tree Diagnostics Data
/// @param {jsonObject} modules : JSON object containing the tree structure of all modules
/// @param {jsonObject} moduleDiagnoses : JSON object containing the tree structure of all modules with diagnosis information
/// @returns {none}
/// 
function UpdateSubmoduleDiagnostics(arUserId, slot, submodules, submoduleDiagnoses, isConnected)
{
    var diagnosesIndex = 0;
    $.each(submodules, function(index, submodule){
        var submoduleNodeImgId = submodule.cTreeNodeId + "_img";

        // Update the modal
        if (PnDiag_SubmoduleInfoModalVisible && (arUserId == PnDiag_ModalArUserId) && (slot == PnDiag_ModalSlotId) && (submodule.subslot == PnDiag_ModalSubslotId)) {
            RequestAndUpdateSubmoduleDiagnosis(arUserId, slot, submodule.subslot);
        }

        if(!isConnected) {
            $("#" + submoduleNodeImgId).attr("src", GetIconName('NoInfo'));
            UpdateSubmoduleInfoModalDiagnosticFields(arUserId, slot, submodule.subslot, {});
        } else if(submoduleDiagnoses.length > diagnosesIndex && submoduleDiagnoses[diagnosesIndex].subslot == submodule.subslot) {
            UpdateSubmoduleInfoModalDiagnosticFields(arUserId, slot, submodule.subslot, submoduleDiagnoses[diagnosesIndex]);
            if(typeof(submoduleDiagnoses[diagnosesIndex].difference) != 'undefined' && submoduleDiagnoses[diagnosesIndex].severity != 'Fault') {
                $("#" + submoduleNodeImgId).attr("src", GetIconName('Difference'));
            } else {
                $("#" + submoduleNodeImgId).attr("src", GetIconName(submoduleDiagnoses[diagnosesIndex].severity));
            }

            diagnosesIndex++;
        } else {
            UpdateSubmoduleInfoModalDiagnosticFields(arUserId, slot, submodule.subslot, {});
            $("#" + submoduleNodeImgId).attr("src", GetIconName('Normal'));
        }
    });
}

function UpdateModuleInfoModalDiagnosticFields(arUserId, slot, moduleDiagnosis)
{
    if(PnDiag_ModuleInfoModalVisible && (arUserId == PnDiag_ModalArUserId) && (slot == PnDiag_ModalSlotId)) {
        HideAllModuleDifferenceStates();
        if(typeof(moduleDiagnosis.difference) != 'undefined') {
            const moduleDifference = parseInt(moduleDiagnosis.difference);

            if(!isNaN(moduleDifference)) {
                ShowModuleDifferenceState(moduleDifference, moduleDiagnosis.differenceIdentNumber);
            }
        }
    }
}

function HideAllModuleDifferenceStates()
{
    $("#id_pndiag_module_diff_table_header_container").hide();
    $("#id_pndiag_module_diff_table_container").hide();
    $("#id_pndiag_module_diff_no_module").hide();
    $("#id_pndiag_module_diff_wrong_module").hide();
    $("#id_pndiag_module_diff_wrong_module_type").hide();
    $("#id_pndiag_module_diff_proper_module").hide();
    $("#id_pndiag_module_diff_substituted_module").hide();
    $("#id_pndiag_module_diff_default").hide();
    $("#id_pndiag_module_diff_code").hide();
}

function ShowModuleDifferenceState(moduleDifference, differenceIdentNumber)
{
    $("#id_pndiag_module_diff_table_header_container").show();
    $("#id_pndiag_module_diff_table_container").show();
    switch(moduleDifference) {
        case 0:
            $("#id_pndiag_module_diff_no_module").show();
            break;
        case 1:
            $("#id_pndiag_module_diff_wrong_module").show();
            $("#id_pndiag_module_diff_wrong_module_type").text(' (' + $("#id_pndiag_submodule_difference_type").text() + ': ' + NumStringToHexString(differenceIdentNumber) + ')');
            $("#id_pndiag_module_diff_wrong_module_type").show();
            break;
        case 2:
            $("#id_pndiag_module_diff_proper_module").show();
            break;
        case 3:
            $("#id_pndiag_module_diff_substituted_module").show();
            break;
        default:
            $("#id_pndiag_module_diff_default").show();
            $("#id_pndiag_module_diff_code").text(' (' + NumStringToHexString(moduleDiagnosis.difference) +')');
            $("#id_pndiag_module_diff_code").show();
            break;
    }
}

function UpdateSubmoduleInfoModalDiagnosticFields(arUserId, slot, subslot, submoduleDiagnosis)
{
    if(PnDiag_SubmoduleInfoModalVisible && (arUserId == PnDiag_ModalArUserId) && (slot == PnDiag_ModalSlotId) && (subslot == PnDiag_ModalSubslotId)) {
        HideAllSubmoduleDifferenceStates();
        if(typeof(submoduleDiagnosis.difference) != 'undefined') {           
            const submoduleDifference = parseInt(submoduleDiagnosis.difference);

            if(!isNaN(submoduleDifference)) {
                ShowSubmoduleDifferenceState(submoduleDifference);
            }
        }
    }
}

function HideAllSubmoduleDifferenceStates()
{
    $("#id_pndiag_submodule_diff_table_header_container").hide();
    $("#id_pndiag_submodule_diff_table_container").hide();
    $("#id_pndiag_submodule_diff_no_submodule").hide();
    $("#id_pndiag_submodule_diff_wrong_submodule").hide();
    $("#id_pndiag_submodule_diff_locked_submodule").hide();
    $("#id_pndiag_submodule_diff_ar_pending").hide();
    $("#id_pndiag_submodule_diff_substituted_submodule").hide();
    $("#id_pndiag_submodule_diff_take_over").hide();
    $("#id_pndiag_submodule_diff_superordination_locked").hide();
    $("#id_pndiag_submodule_diff_locked_by_controller").hide();
    $("#id_pndiag_submodule_diff_locked_by_supervisor").hide();
    $("#id_pndiag_submodule_diff_default").hide();
    $("#id_pndiag_submodule_diff_code").hide();
}

function ShowSubmoduleDifferenceState(submoduleDifference)
{
    $("#id_pndiag_submodule_diff_table_header_container").show();
    $("#id_pndiag_submodule_diff_table_container").show();

    if((submoduleDifference & 0x8000) == 0x8000) {
        if((submoduleDifference & 0x0001) == 0x0001) {
            $("#id_pndiag_submodule_diff_take_over").show();
        }

        switch(submoduleDifference & 0x0780) {
            case 0x0080:
                $("#id_pndiag_submodule_diff_ar_pending").show();
                break;
            case 0x0100:
                $("#id_pndiag_submodule_diff_superordination_locked").show();
                break;
            case 0x0180:
                $("#id_pndiag_submodule_diff_locked_by_controller").show();
                break;
            case 0x0200:
                $("#id_pndiag_submodule_diff_locked_by_supervisor").show();
                break;
            default:
                break;
        }

        switch(submoduleDifference & 0x7800) {
            case 0x0800:
                $("#id_pndiag_submodule_diff_substituted_submodule").show();
                break;
            case 0x1000:
                $("#id_pndiag_submodule_diff_wrong_submodule").show();
                break;
            case 0x1800:
                $("#id_pndiag_submodule_diff_no_submodule").show();
                break;
            default:
                break;
        }
    } else {
        switch(submoduleDifference) {
            case 0x0000:
                $("#id_pndiag_submodule_diff_no_submodule").show();
                break;
            case 0x0001:
                $("#id_pndiag_submodule_diff_wrong_submodule").show();
                break;
            case 0x0002:
                $("#id_pndiag_submodule_diff_locked_submodule").show();
                break;
            case 0x0004:
                $("#id_pndiag_submodule_diff_ar_pending").show();
                break;
            case 0x0007:
                $("#id_pndiag_submodule_diff_substituted_submodule").show();
                break;
            default:
                $("#id_pndiag_submodule_diff_default").show();
                $("#id_pndiag_submodule_diff_code").text(' (' + FormatHexNum(submoduleDifference) +')');
                $("#id_pndiag_submodule_diff_code").show();
                break;
        }
    }
}

function GetIconName(id)
{
    var iconString;
    switch(id) {
        case 'NoInfo':
            iconString = './images/status_icon_no_info.svg';
            break;
        case 'NoConnection':
            iconString = './images/status_icon_no_connection.svg';
            break;
        case 'Normal':
        case 'Advice':
            iconString = './images/status_icon_severity_normal.svg';
            break;
        case 'MaintenanceRequired':
            iconString = './images/status_icon_severity_warning.svg';
            break;
        case 'MaintenanceDemanded':
            iconString = './images/status_icon_severity_urgent_warning.svg';
            break;
        case 'Fault':
            iconString = './images/status_icon_severity_fault.svg';
            break;
        case 'Difference':
            iconString = './images/status_icon_unequal.svg';
            break;
        default:
            iconString = './images/status_icon_severity_undef.svg';
            break;
    }

    return iconString;
}

/// 
/// Sets the Diagnostics Status - Text field in the Profinet (Device) Detail View 
/// 
/// @param {string} diagnosisText : Diagnosis Text ID
/// @returns {none}
///     
function SetPnDeviceDetailsDiagText(diagCode, hasDifference)
{
    $("#id_pndiag_device_Info_table .DiagText").each(function(){
        $(this).hide();
    });
    
    if(diagCode == 0x0000 && !hasDifference) {
        $("#id_pndiag_device_diag_text_dev_ok_tr").show();
    }
    if(diagCode & 0x0001) {   // Bit 0: set if not connected
        $("#id_pndiag_device_diag_text_dev_disconnected_tr").show();
    }
    if(diagCode & 0x0002) {   // Bit 1: set if data invalid
        $("#id_pndiag_device_diag_text_data_invalid_tr").show();
    }
    if(diagCode & 0x0004) {   // Bit 2: set if diagnosis is available
        $("#id_pndiag_device_diag_text_diag_available_tr").show();
    }
    if(diagCode & 0x0008 || hasDifference) {   // Bit 3: set if module difference is available in case of configuration difference
        $("#id_pndiag_device_diag_text_mod_difference_tr").show();
    }
    if(diagCode & 0x0010) {   // Bit 4: set  if AR is deactivated
        $("#id_pndiag_device_diag_text_ar_deactivated_tr").show();
    }
    if(diagCode & 0x0020) {   // Bit 5: set if neighborhood information is not available
        $("#id_pndiag_device_diag_text_neig_not_available_tr").show();
    }
    if(diagCode & 0x0040) {   // Bit 6: neighborhood information not unique
        $("#id_pndiag_device_diag_text_neig_not_unique_tr").show();
    }
    if(diagCode & 0x0080) {   // Bit 7 - Identify.cnf on alias received, but name of the device is already configured in another AR
        $("#id_pndiag_device_diag_text_dev_already_config_tr").show();
    }
    if(diagCode & 0x0100) {   // Bit 8: Maintenance Required Information is available
        $("#id_pndiag_device_diag_text_maint_required_tr").show();
    }
    if(diagCode & 0x0200) {   // Bit 9: Maintenance Demanded Information is available
        $("#id_pndiag_device_diag_text_maint_demanded_tr").show();
    }
    if(diagCode & 0x0400) {   // Bit 10: Channel or Manufacturer Specific Diagnosis Information are available
        $("#id_pndiag_device_diag_text_man_diag_available_tr").show();
    }
}

/// 
/// Sets the Diagnostics Status field in the Profinet (Device) Detail View 
/// 
/// @param {string} diagnosisStatus : Diagnosis Status
/// @returns {none}
///   
function SetPnDeviceDetailsDiagStatus(diagnosisStatus)
{
    if(diagnosisStatus == DiagStatusResult.Ok) {
        $("#id_pndiag_diag_status_ok_span").show();
        $("#id_pndiag_diag_status_warning_span").hide();
        $("#id_pndiag_diag_status_error_span").hide();
        $("#id_pndiag_diag_status_ardeactivated_span").hide();
    } else if(diagnosisStatus == DiagStatusResult.Warning) {
        $("#id_pndiag_diag_status_ok_span").hide();
        $("#id_pndiag_diag_status_warning_span").show();
        $("#id_pndiag_diag_status_error_span").hide();
        $("#id_pndiag_diag_status_ardeactivated_span").hide();
    } else if(diagnosisStatus == DiagStatusResult.Error) {
        $("#id_pndiag_diag_status_ok_span").hide();
        $("#id_pndiag_diag_status_warning_span").hide();
        $("#id_pndiag_diag_status_error_span").show();
        $("#id_pndiag_diag_status_ardeactivated_span").hide();
    } else if(diagnosisStatus == DiagStatusResult.ArDeactivated) {
        $("#id_pndiag_diag_status_ok_span").hide();
        $("#id_pndiag_diag_status_warning_span").hide();
        $("#id_pndiag_diag_status_error_span").hide();
        $("#id_pndiag_diag_status_ardeactivated_span").show();
    }
}

/// 
/// Sets the background color with a specific element 
/// 
/// @param {string} fieldId : HTML field id
/// @param {string} color   : desired color
/// @returns {none}
/// 
function SetFieldBackgrounColor(fieldId, color)
{
    $('#' + fieldId).attr('style',  'background-color:' + color + '; text-align:center;');
}

/// 
/// Parses the Diagnostics code to get diagnostic status and text 
/// 
/// @param {string} diagCode : read diagnostics code
/// @returns {none}
/// 
function ParseDiagCode(diagCode, hasDifference)
{
    var diagnosisResult = {};
    diagnosisResult.Code = diagCode;
    if(diagCode == 0x00 && !hasDifference) {
        // 1- Ok
        diagnosisResult.Status    = $("#id_pndiag_device_status_ok").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Ok;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_OK_COLOR   
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT04_MASK)) {
        // 2 - Ar deactivated
        diagnosisResult.Status    = $("#id_pndiag_device_status_ar_deactivated").text();
        diagnosisResult.TextClass = DiagResultTextClasses.ArDeactivated;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_DEACTIVATED_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT00_MASK)) {
        // 3 - No connection
        diagnosisResult.Status    = $("#id_pndiag_device_status_error").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Error;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_ERROR_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT01_MASK)) {
        // 4 - Invalid data
        diagnosisResult.Status    = $("#id_pndiag_device_status_error").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Error;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_ERROR_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT05_MASK)) {
        // 5 - Neighborhood information is not available
        diagnosisResult.Status    = $("#id_pndiag_device_status_warning").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Warning;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_WARNING_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT06_MASK)) {
        // 6 - Neighborhood information not unique
        diagnosisResult.Status    = $("#id_pndiag_device_status_warning").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Warning;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_WARNING_COLOR;        
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT08_MASK)) {
        // 7 - Maintenance is Required
        diagnosisResult.Status    = $("#id_pndiag_device_status_warning").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Warning;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_WARNING_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT09_MASK)) {
        // 8 - Maintenance is Demanded
        diagnosisResult.Status    = $("#id_pndiag_device_status_warning").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Warning;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_WARNING_COLOR;
    } else if(CheckDiagBitIsSet(PNDIAG_DIAG_CODE_BIT07_MASK)) {
        // 9 - Device already configured
        diagnosisResult.Status    = $("#id_pndiag_device_status_error").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Error;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_ERROR_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT03_MASK) || hasDifference) {
        // 10 - Module difference
        diagnosisResult.Status    = $("#id_pndiag_device_status_error").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Error;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_ERROR_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT02_MASK)) {
        // 11 - Diagnosis is available
        diagnosisResult.Status    = $("#id_pndiag_device_status_warning").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Warning;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_WARNING_COLOR;
    } else if(CheckDiagBitIsSet(diagCode, PNDIAG_DIAG_CODE_BIT10_MASK)) {
        // 12 - Channel diagnosis / Manufacturer specific diagnosis available
        diagnosisResult.Status    = $("#id_pndiag_device_status_warning").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Warning;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_WARNING_COLOR;
    } else {
        // 13 - for all other cases: Warning status
        diagnosisResult.Status    = $("#id_pndiag_device_status_warning").text();
        diagnosisResult.TextClass = DiagResultTextClasses.Warning;
        diagnosisResult.DiagColor = PNDIAG_DIAG_STATUS_WARNING_COLOR;
    }
    
    return diagnosisResult;   
}

/// 
/// Sets the PN Device Details View fields 
/// 
/// @param {string} deviceNumber : Profinet Device user id
/// @param {string} userId       : Profinet Device user id
/// @param {string} vendorId     : Vendor-ID in Hex
/// @param {string} deviceId     : Device-ID in Hex
/// @param {string} dnsName      : Dns-Name of the Profinet Device
/// @param {string} moduleCount  : Amount of modules of the Profinet Device
/// @param {string} stationName  : Station name of the Profinet Device
/// @param {string} ipAddr       : IP Address of the Profinet Device
/// @param {string} stdGateway   : Default Gateway of the Profinet Device
/// @param {string} subnetMask   : Subnet mask of the Profinet Device
/// @returns {none}
/// 
function SetDeviceInfoModalFields(userId, vendorName, deviceName, moduleCount, dnsName, stationName, ipAddr, stdGateway, subnetMask)
{
    // Profinet Device Section
    $("#id_pndiag_device_module_number_value").text(userId);
    $("#id_pndiag_device_infos_vendor_id_value").text(vendorName);
    $("#id_pndiag_device_infos_device_id_value").text(deviceName);
    $("#id_pndiag_device_infos_module_count_value").text(moduleCount);
    // Ethernet Section
    $("#id_pndiag_device_infos_ipaddr_value").text(ipAddr);
    $("#id_pndiag_device_infos_subnet_mask_value").text(subnetMask);
    $("#id_pndiag_device_infos_std_gateway_value").text(stdGateway);
    $("#id_pndiag_device_infos_station_value").text(stationName);
    $("#id_pndiag_device_infos_dns_value").text(dnsName);
}

/// 
/// Sets the PN Module Details View fields 
/// 
/// @param {string} deviceName      : Name of the parent Profinet Device
/// @param {string} apiNr           : Api Number
/// @param {string} slotNr          : Module Slot Number
/// @param {string} moduleTypeName  : Module Type Name
/// @param {string} submoduleCount  : Amount of Submodules
/// @returns {none}
/// 
function SetModuleInfoModalFields(stationName, api, slot, moduleName, submodulesCount)
{
     // Information Section
     $("#id_pndiag_module_device_value").text(stationName);
     $("#id_pndiag_module_api_value").text(NumStringToHexString(api));
     $("#id_pndiag_module_slot_value").text(NumStringToHexString(slot));
     $("#id_pndiag_module_type_value").text(moduleName);
     $("#id_pndiag_module_submodule_count_value").text(submodulesCount);
}

/// 
/// Sets the PN Submodule Details View fields 
/// 
/// @param {string} deviceName          : Name of the parent Profinet Device
/// @param {string} apiNr               : Api Number
/// @param {string} subslotNr           : Subslot Number
/// @param {string} submoduleTypeName   : Submodule Type Name
/// @returns {none}
/// 
function SetSubmoduleInfoModalFields(deviceName, apiNr, subslotNr, submoduleTypeName)
{
    // Information Section
    $("#id_pndiag_submodule_device_value").text(deviceName);
    $("#id_pndiag_submodule_api_value").text(NumStringToHexString(apiNr));
    $("#id_pndiag_submodule_subslot_value").text(NumStringToHexString(subslotNr));
    $("#id_pndiag_submodule_type_value").text(submoduleTypeName);
}

/// 
/// Opens the PN Device Details View 
/// 
/// @param {json} jsonResponse : JSON response struct
/// @returns {none}
/// 
function OnShowDeviceInfosModal(jsonResponse)
{
    let vendorName = jsonResponse.vendorName + ' (' + FormatHexNum(jsonResponse.vendorId) + ')' ;
    let deviceName = jsonResponse.deviceName + ' (' + FormatHexNum(jsonResponse.deviceId) + ')' ;

    SetDeviceInfoModalFields(jsonResponse.arUserId
        , vendorName
        , deviceName
        , jsonResponse.modulesCount
        , jsonResponse.dnsName
        , jsonResponse.stationName
        , jsonResponse.ipAddress
        , jsonResponse.gateway
        , jsonResponse.netmask);

    //console.log('OnShowDeviceInfosModal', jsonResponse);
    var diagResult = ParseDiagCode(jsonResponse.diagnosisCode, jsonResponse.hasDifference);
    SetDeviceInfoStatus(jsonResponse.severity, diagResult, jsonResponse.hasDifference);

    UpdateChannelDiagField('device', jsonResponse);

    $("#id_div_pndiag_device_infos_modal").show();
    PnDiag_DeviceInfoModalVisible = true;
    
    // Clear update timer 
    window.clearTimeout(Pndiag_DiagUpdateTimer);
    // Update diagnosis data and restart timer 
    OnPnUpdateDiagnosticsData();
} 

/// 
/// Opens the PN Device Module Details View 
/// 
/// @param {jsonObject} jsonResponse : JSON response object
/// @returns {none}
/// 
function OnShowModuleInfosModal(jsonResponse)
{
    let moduleName =  jsonResponse.moduleName + " (" + NumStringToHexString(jsonResponse.moduleIdentNumber) + ")";
    SetModuleInfoModalFields(jsonResponse.stationName, jsonResponse.api, jsonResponse.slot, moduleName, jsonResponse.submodulesCount);

    HideAllModuleDifferenceStates();
    if(typeof(jsonResponse.difference) != 'undefined') {
        const moduleDifference = parseInt(jsonResponse.difference);

        if(!isNaN(moduleDifference)) {
            ShowModuleDifferenceState(moduleDifference, jsonResponse.differenceIdentNumber);
        }
    }

    UpdateChannelDiagField('module', jsonResponse);

    $("#id_div_pndiag_module_infos_modal").show();
    PnDiag_ModuleInfoModalVisible = true; // ToDo: implement this elsewhere, where PnDiag_DeviceInfoModalVisible has been used
    
    // Clear update timer 
    window.clearTimeout(Pndiag_DiagUpdateTimer); // ToDo: New unique var for Module?
    // Update diagnosis data and restart timer 
    OnPnUpdateDiagnosticsData(); // ToDo: Can we use this, or do we need to use one specific for Modules?
} 

/// 
/// Opens the PN Device Subodule Details View 
/// 
/// @param {jsonObject} jsonResponse : JSON response object
/// @returns {none}
/// 
function OnShowSubmoduleInfosModal(jsonResponse)
{
    let moduleName =  jsonResponse.moduleName + " (" + NumStringToHexString(jsonResponse.moduleIdentNumber) + ")";
    let submoduleName =  jsonResponse.submoduleName + " (" + NumStringToHexString(jsonResponse.submoduleIdentNumber) + ")";

    SetSubmoduleInfoModalFields(jsonResponse.stationName + ' / ' + jsonResponse.slot + ' : ' + moduleName, 
                                 jsonResponse.api, jsonResponse.subslot, submoduleName);
    
    HideAllSubmoduleDifferenceStates();
    if(typeof(jsonResponse.difference) != 'undefined') {
        const submoduleDifference = parseInt(jsonResponse.difference);

        if(!isNaN(submoduleDifference)) {
            ShowSubmoduleDifferenceState(submoduleDifference);
        }
    }

    UpdateChannelDiagField('submodule', jsonResponse);
    
    $("#id_div_pndiag_submodule_infos_modal").show();
    PnDiag_SubmoduleInfoModalVisible = true; // ToDo: implement this elsewhere, where PnDiag_DeviceInfoModalVisible has been used
    
    // Clear update timer 
    window.clearTimeout(Pndiag_DiagUpdateTimer); // ToDo: New unique var for Submodule?
    // Update diagnosis data and restart timer 
    OnPnUpdateDiagnosticsData();  // ToDo: Can we use this, or do we need to use one specific for Submodules?
} 

function OnHideDeviceInfoModal()
{
     // SetDeviceInfoModalFields("", "", "", "", "", "", "", "", "", ""); // Probably unnecessary due to the .reset()

     $('#id_div_pndiag_device_infos_modal').hide(); 
     PnDiag_DeviceInfoModalVisible = false;
     PnDiag_ModalArUserId = 0;

     var detailsForm = document.getElementById('id_pndiag_show_device_infos_form');
     detailsForm.reset();
}

function OnHideModuleInfoModal()
{
    // SetModuleInfoModalFields("", "", "", "", ""); // Probably unnecessary due to the .reset()

    $('#id_div_pndiag_module_infos_modal').hide();
    PnDiag_ModuleInfoModalVisible = false;
    PnDiag_ModalArUserId = 0;
    PnDiag_ModalSlotId = 0;
    
    var detailsForm = document.getElementById('id_pndiag_show_module_infos_form');
    detailsForm.reset();
}

function OnHideSubmoduleInfoModal()
{
    // SetSubmoduleInfoModalFields("", "", "", ""); // Probably unnecessary due to the .reset()

    $('#id_div_pndiag_submodule_infos_modal').hide();
    PnDiag_SubmoduleInfoModalVisible = false;
    PnDiag_ModalArUserId = 0;
    PnDiag_ModalSlotId = 0;
    PnDiag_ModalSubslotId = 0;
    
    var detailsForm = document.getElementById('id_pndiag_show_submodule_infos_form');
    detailsForm.reset();
}

/// 
/// Checks if a specific bit is set in the diagnosis code
/// 
/// @param {string} diagCode : Diagnosis Code
/// @param {string} bitmask  : Bit Mask
/// @returns {bool} True if the Bit is set, otherwise false
/// 
function CheckDiagBitIsSet(diagCode, bitmask)
{
    return ((diagCode & bitmask) != 0);
}

/// 
/// Format hex number to the correct 4 digit format - 0xXXXX
/// 
/// @param {integer} value : hex digit string
/// @returns {string} formated hex number as string
/// 
function FormatHexNum(value) // ToDo: See if this can be correctly formated inside the arp
{
    value = parseInt(value, 16); // Hacky to ensure we get a 4 Digit 0xXXXX back and not shorter or longer
    return NumToHexString(value);
}

/// 
/// Converts an integer number to hex string format with 4 digits - 0xXXXX
/// 
/// @param {integer} value : integer number
/// @returns {string} converted hex number
/// 
function NumToHexString(value)
{
    var padding;
    if(value < 0x10) {
        padding = '0x000';
    } else if(value < 0x100) {
        padding = '0x00';
    } else if(value < 0x1000) {
        padding = '0x0';
    } else {
        padding =  '0x';
    }

    return padding + value.toString(16).toUpperCase();
}

/// 
/// Converts an integer number string to hex string format with 4 digits - 0xXXXX
/// 
/// @param {string} value : integer number
/// @returns {string} converted hex number
/// 
function NumStringToHexString(value)
{
    return NumToHexString(parseInt(value));
}


///
/// Profinet Devices Tree Functions 
///

/// 
/// Requests the profinet devices tree json object from the controller and builds it 
/// 
/// @param {bool} reload : deletes/unloades the current devices tree when true. Otherwise it builds the tree for the first time
/// @returns {none} 
/// 
function OnLoadPnDevicesTree(jsonDevicesTree, reload)
{
    //console.log("Devices Tree Object", jsonDevicesTree);
    if(reload == true) {
        $("#id_pndiag_devices_tree").unloadCtree();
    }
    jsonDevicesTree = jsonDevicesTree.result; 
    // Build Profinet Devices Tree
    BuildProfinetDevicesTree('id_pndiag_devices_tree', jsonDevicesTree);
    // Update the tree nodes names, specially because of language change
    UpdateTreeNodesNames('id_pndiag_devices_tree');
    Pndiag_DeviceTreeLoaded = true;
}

/// 
/// Creates and formats the root tree node
/// 
/// @param {childCount} Count of subnodes
/// @returns {string} Formatted string
/// 
function CreateTreeRootNodeName(childCount)
{
    return " " + $("#id_pndiag_device_name_input").val() + ' / ' + $("#id_pndiag_ip_address_input").val() + ' [' + childCount + ']';
}

/// 
/// Builds a Profinet Devices Tree
/// 
/// @param {string} pnTreeElemetId : The First Number
/// @param {json}   pnTreeJsonObject The Second Number
/// @returns {none}
/// 
function BuildProfinetDevicesTree(pnTreeElemetId, pnTreeJsonObject)
{
    // overwrite device name
    pnTreeJsonObject.cTreeNodeName = CreateTreeRootNodeName(pnTreeJsonObject.children.length);

    $("#" + pnTreeElemetId).ctree({
    	"json_data" : pnTreeJsonObject,
        "cTreeImgs" : "ctree/cTreeNodeIcons.png",
        "types" : {
            "PnController"             : {"icon" : "./images/status_icon_severity_normal.svg",     "clickable" : true,     "imgtooltip" : false},
            "PnDevice"                 : {"icon" : "./images/status_icon_severity_normal.svg",     "clickable" : true,     "imgtooltip" : false},
            "PnDeviceWarning"          : {"icon" : "./images/status_icon_severity_warning.svg",    "clickable" : true,     "imgtooltip" : false},
            "PnDeviceError"            : {"icon" : "./images/status_icon_severity_fault.svg",      "clickable" : true,     "imgtooltip" : false},
            "PnArDeactivated"          : {"icon" : "./images/status_icon_severity_undef.svg",      "clickable" : true,     "imgtooltip" : false},
            "PnDeviceModule"           : {"icon" : "./images/status_icon_severity_normal.svg",     "clickable" : true,     "imgtooltip" : false}, 
            "PnDeviceModuleWarning"    : {"icon" : "./images/status_icon_severity_warning.svg",    "clickable" : true,     "imgtooltip" : false},
            "PnDeviceModuleError"      : {"icon" : "./images/status_icon_severity_fault.svg",      "clickable" : true,     "imgtooltip" : false},
            "PnDeviceSubModule"        : {"icon" : "./images/status_icon_severity_normal.svg",     "clickable" : true,     "imgtooltip" : false},
            "PnDeviceSubModuleWarning" : {"icon" : "./images/status_icon_severity_warning.svg",    "clickable" : true,     "imgtooltip" : false},
            "PnDeviceSubModuleError"   : {"icon" : "./images/status_icon_severity_fault.svg",      "clickable" : true,     "imgtooltip" : false}
        },
        "select_mode" : true,
        "singleSelect_mode" : true
    }).bind('CTREE_EVENT_SELECT', function(e, obj){
        //HandleDevicesTreeEventSelect(obj.selectNodeId, obj.selectNodeType, obj.selectLocalNodeId, obj.lastSelectedNodes);  
    }).bind('CTREE_EVENT_DESELECT', function(e, obj){
        //HandleDevicesTreeEventDeselect(obj.lastSelectedNodes); 
    });
}

/// 
/// Handles EVENT_SELECT event of the tree nodes
/// 
/// @param {string} selectNodeId          : Element Node ID
/// @param {string} selectNodeDeviceType  : Selected node device type
/// @param {string} selectNodeDeviceNumber: Selected node device number (if profinet device node)
/// @param {string} lastSelectedNodes     : Unselected nodes after selecting this one
/// @returns {none} 
/// 
function HandleDevicesTreeEventSelect(selectNodeId, selectNodeDeviceType, selectNodeDeviceNumber, lastSelectedNodes) 
{  
    // $.each(lastSelectedNodes, function(index, value) { 
    //     if(    (value.attributes.cnodetype.nodeValue != "PnController") 
    //         && (value.attributes.cnodetype.nodeValue != "PnDevice") 
    //         && (value.attributes.cnodetype.nodeValue != "PnDeviceWarning")
    //         && (value.attributes.cnodetype.nodeValue != "PnDeviceError")
    //         && (value.attributes.cnodetype.nodeValue != "PnArDeactivated"))
    //     {
    //         // Unused now
    //     }
    // });
}

/// 
/// Handles EVENT_DESELECT event of the tree nodes
/// 
/// @param {string} lastSelectedNodes     : Unselected nodes after selecting this one
/// @returns {none} 
/// 
function HandleDevicesTreeEventDeselect(lastSelectedNodes)
{
    // $.each(lastSelectedNodes, function(index, value) {
    //     if(   (value.attributes.cnodetype.nodeValue != "PnController") 
    //         &&(value.attributes.cnodetype.nodeValue != "PnDevice")
    //         &&(value.attributes.cnodetype.nodeValue != "PnDeviceWarning") 
    //         &&(value.attributes.cnodetype.nodeValue != "PnDeviceError")
    //         &&(value.attributes.cnodetype.nodeValue != "PnArDeactivated"))
    //     {
    //         // Unused now
    //     } 
    // });
}

/// 
/// Updates all Profinet devices tree nodes names when loading the tree or changing language
/// 
/// @param {string} treeId : Tree Html element ID
/// @returns {none}
/// 
function UpdateTreeNodesNames(treeId)
{
    var cTreeId = "cTree_" + treeId; 
    // get tree configs
    var treeconfigs = $("#id_pndiag_devices_tree").getCtreeConfigs();

    var controllerNodeId = "id" + treeconfigs.json_data.cTreeNodeId;
    var controllerNodeHtml = $('#' + cTreeId).find('#' + controllerNodeId).html();
    treeconfigs.json_data.cTreeNodeName = CreateTreeRootNodeName(treeconfigs.json_data.children.length);
    
    var controllerNode = $('#' + cTreeId).find('#' + controllerNodeId);
    controllerNode.html(controllerNodeHtml.split("</div>")[0] + "</div>" + treeconfigs.json_data.cTreeNodeName);
    $('#'+ controllerNodeId).css("cursor", "default");

    // Expand the root controller node and hide the button to prevent users closing it
    var controllerNodeBtn = controllerNode.prev();
    ExpandTreeNode(controllerNodeBtn);
    controllerNodeBtn.hide();

    var unknownDeviceText = $("#id_pndiag_device_unknown_name").text();
    var unknownModuleText = $("#id_pndiag_module_unknown_name").text();
    var unknownSubmoduleText = $("#id_pndiag_submodule_unknown_name").text();

    const maxDeviceNodeNameLength = 70;
    // Update all devices
    $.each(treeconfigs.json_data.children, function( deviceIndex, device ) {
        var tempNodeName = GetNodeName(cTreeId, device, unknownDeviceText);
        if(tempNodeName.length > maxDeviceNodeNameLength){
            var maxStationNameLength = maxDeviceNodeNameLength - (tempNodeName.length - device.stationName.length);
            device.cTreeNodeNamePrefix = GetDeviceNodeNamePrefix(device, maxStationNameLength);
        }
        CreateNodeName(cTreeId, device, unknownDeviceText);
        $('#' + cTreeId).find('#id' + device.cTreeNodeId).click(function(){
            ShowDeviceDiagnosis(device.arUserId); 
        });
        
        // Update all modules
        $.each(device.children, function( moduleIndex, module ) {
            CreateNodeName(cTreeId, module, unknownModuleText);
            $('#' + cTreeId).find('#id' + module.cTreeNodeId).click(function(){
                ShowModuleDiagnosis(device.arUserId, module.slot); 
            });

            // Update all submodules
            $.each(module.children, function( submoduleIndex, submodule ) {
                CreateNodeName(cTreeId, submodule, unknownSubmoduleText);
                $('#' + cTreeId).find('#id' + submodule.cTreeNodeId).click(function(){
                    ShowSubmoduleDiagnosis(device.arUserId, module.slot, submodule.subslot); 
                });
            });
        });
    });
}

function GetDeviceNodeNamePrefix(device, maxStationNameLength)
{
    // Reduce max length by 3 because of 3 dots between the two parts
    maxStationNameLength -= 3;
    var stationNameBeginLength = Math.floor(maxStationNameLength / 2);
    var stationNameEndLength = maxStationNameLength - stationNameBeginLength;

    var shortenedStationName = device.stationName.substring(0, stationNameBeginLength) + "..." + device.stationName.substring(device.stationName.length - stationNameEndLength);
    return " " + shortenedStationName + " / " + device.ipAddress + " / ";
}

function GetNodeName(cTreeId, node, unknownNodeTypeText)
{
    var nodeId = "id" + node.cTreeNodeId;
    var name = $('#' + cTreeId).find('#' + nodeId).attr('ctreenodename');
    var cTreeNodeName;

    if (name == 'Unknown') {
        cTreeNodeName = node.cTreeNodeNamePrefix + unknownNodeTypeText + node.cTreeNodeNameSuffix;
    } else {
        cTreeNodeName = node.cTreeNodeNamePrefix + name + node.cTreeNodeNameSuffix;
    }

    return cTreeNodeName;
}

function CreateNodeName(cTreeId, node, unknownNodeTypeText)
{
    var nodeId = "id" + node.cTreeNodeId;
    var name = $('#' + cTreeId).find('#' + nodeId).attr('ctreenodename');

    if (name == 'Unknown') {
        node.cTreeNodeName = node.cTreeNodeNamePrefix + unknownNodeTypeText + node.cTreeNodeNameSuffix;
    } else {
        node.cTreeNodeName = node.cTreeNodeNamePrefix + name + node.cTreeNodeNameSuffix;
    }

    return SetNodeName(cTreeId, nodeId, node);
}

function SetNodeName(cTreeId, nodeId, node)
{
    var nodeHtml = $('#' + cTreeId).find('#' + nodeId).html();
    $('#' + cTreeId).find('#' + nodeId).html(nodeHtml.split("</div>")[0] + "</div>" + node.cTreeNodeName);
    return nodeId;
}

function ShowDeviceDiagnosis(arUserId)
{
    ProfinetService.GetDeviceDiagnosis(arUserId)
    .then(function(response) {
        PnDiag_ModalArUserId = arUserId;
        OnShowDeviceInfosModal(response);
    })
    .catch(function(error) {
        console.log(error);
    });

    window.event.preventDefault();
}

function ShowModuleDiagnosis(arUserId, slot)
{
    ProfinetService.GetModuleDiagnosis(arUserId, slot)
    .then(function(response) {
        PnDiag_ModalArUserId = arUserId;
        PnDiag_ModalSlotId = slot;
        OnShowModuleInfosModal(response);
    })
    .catch(function(error) {
        console.log(error)
    })

    window.event.preventDefault();
}

function ShowSubmoduleDiagnosis(arUserId, slot, subslot)
{
    ProfinetService.GetSubmoduleDiagnosis(arUserId, slot, subslot)
    .then(function(response) {
        PnDiag_ModalArUserId = arUserId;
        PnDiag_ModalSlotId = slot;
        PnDiag_ModalSubslotId = subslot;
        OnShowSubmoduleInfosModal(response);
    })
    .catch(function(error) {
        console.log(error)
    })

    window.event.preventDefault();
}

function RequestAndUpdateDeviceDiagnosis(arUserId)
{
    ProfinetService.GetDeviceDiagnosis(arUserId)
    .then(function(response) {
        UpdateChannelDiagField('device', response);
    })
    .catch(function(error) {
        console.log(error);
    });
}

function RequestAndUpdateModuleDiagnosis(arUserId, slot)
{
    ProfinetService.GetModuleDiagnosis(arUserId, slot)
    .then(function(response) {
        UpdateChannelDiagField('module', response);
    })
    .catch(function(error) {
        console.log(error)
    })
}

function RequestAndUpdateSubmoduleDiagnosis(arUserId, slot, subslot)
{
    ProfinetService.GetSubmoduleDiagnosis(arUserId, slot, subslot)
    .then(function(response) {
        UpdateChannelDiagField('submodule', response);
    })
    .catch(function(error) {
        console.log(error)
    })
}


/// 
/// Creates a Diagnosis table row
/// 
/// @param {bool} drawTopBorder : If true, draws a border at the top of the row
/// @param {jsonObject} diagnosisItem   : Json object containing the diagnosis info
/// @returns {string} Html string of the entire table row
/// 
function CreateChannelDiagFieldRow(drawTopBorder, channelDiagnosis, diagnosisSource)
{
    var rowHeader = '<tr'
    if (drawTopBorder) {
        rowHeader += ' style="border-top: 2px solid black;">'
    } else {
        rowHeader += '>'
    }

    var channelError = channelDiagnosis.channelErrorTypeName + " (" + FormatHexNum(channelDiagnosis.channelErrorType) + ")";
    var extChannelError = channelDiagnosis.extChannelErrorTypeName + " (" + FormatHexNum(channelDiagnosis.extChannelErrorType) + ")";

    var rowspan = (channelDiagnosis.extChannelErrorTypeName == '' ? 2 : 4);

    var iconName = GetIconName(channelDiagnosis.severity);

    var tooltipBgColor = "";
    if((channelDiagnosis.severity == 'MaintenanceRequired') || ((channelDiagnosis.severity == 'MaintenanceDemanded'))) {
        tooltipBgColor = ' background-color: ' + PNDIAG_DIAG_STATUS_WARNING_COLOR;
    } else if(channelDiagnosis.severity == 'Fault') {
        tooltipBgColor = ' background-color: ' + PNDIAG_DIAG_STATUS_ERROR_COLOR;
    }

    var rowIcon = '<td rowspan="' + rowspan + '" style="vertical-align : middle;text-align:center; width:100px"><div class="tooltip"><span class="tooltip-text-right" style="white-space:nowrap;' + tooltipBgColor + '">' + channelDiagnosis.severity + '</span><img src="' + iconName +'" style="width:24px; height:24px"></td></div>';
    
    var channelErrorHelpIcon  = '';
    if((channelDiagnosis.channelErrorTypeHelp != '') && (channelDiagnosis.channelErrorTypeHelp != channelDiagnosis.channelErrorTypeName)) {
        channelErrorHelpIcon = '<div class="tooltip"><div class="tooltip-text-container"><span class="tooltip-text-right" style="max-width:100%; overflow-wrap:break-word; top:initial; left:initial; bottom:initial; margin-left:initial; position:relative; display:inline-block;">' + channelDiagnosis.channelErrorTypeHelp + '</span></div><img src="./images/nflog_severity_information.png" style="width:12px; height:12px; vertical-align: -1.75px;"></div>';
    }

    var extChannelErrorHelpIcon  = '';
    if((channelDiagnosis.extChannelErrorTypeHelp != '') && (channelDiagnosis.extChannelErrorTypeHelp != channelDiagnosis.channelErrorTypeName)) {
        extChannelErrorHelpIcon = '<div class="tooltip"><div class="tooltip-text-container"><span class="tooltip-text-right" style="max-width:100%; overflow-wrap:break-word; top:initial; left:initial; bottom:initial; margin-left:initial; position:relative; display:inline-block;">' + channelDiagnosis.extChannelErrorTypeHelp + '</span></div><img src="./images/nflog_severity_information.png" style="width:12px; height:12px; vertical-align: -1.75px;"></div>';
    }
    
    if(rowspan == 2) {
        var rowHtml = rowHeader
        +  rowIcon 
        +       '<td style="width:435px;">' + diagnosisSource + '</td>' // ToDo: See how one can combine localization with api variables in a single string?
        +       '<tr><td><span style="width:18px; display:inline-block;">' + channelErrorHelpIcon + "</span> " + channelError + '</td></tr>'
        +  '</tr>';
    } else {
        var rowHtml = rowHeader
        +  rowIcon 
        +       '<td style="width:435px">' + diagnosisSource + '</td>'
        +       '<tr><td><span style="width:18px; display:inline-block;">' + channelErrorHelpIcon + '</span> ' + channelError + '</td></tr>'
        +       '<tr><td><span style="width:18px; display:inline-block;">' + extChannelErrorHelpIcon + '</span> ' + extChannelError + '</td></tr>'  // ToDo: Do this section different potentially
        +       '<tr><td><span style="width:18px; display:inline-block;"></span> Additional value: ' + NumStringToHexString(channelDiagnosis.extChannelAddValue) + '</td></tr>'
        +  '</tr>';
    }
    
    return rowHtml;
}

/// 
/// Creates a Diagnosis table row
/// 
/// @param {bool} drawTopBorder : If true, draws a border at the top of the row
/// @param {jsonObject} diagnosisItem   : Json object containing the diagnosis info
/// @returns {string} Html string of the entire table row
/// 
function CreateUsiDiagFieldRow(drawTopBorder, usiDiagnosis, diagnosisSource)
{
    var rowHeader = '<tr'
    if (drawTopBorder) {
        rowHeader += ' style="border-top: 2px solid black;">'
    } else {
        rowHeader += '>'
    }

    var tooltipBgColor = "";
    if((usiDiagnosis.severity == 'MaintenanceRequired') || ((usiDiagnosis.severity == 'MaintenanceDemanded'))) {
        tooltipBgColor = ' background-color: ' + PNDIAG_DIAG_STATUS_WARNING_COLOR;
    } else if(usiDiagnosis.severity == 'Fault') {
        tooltipBgColor = ' background-color: ' + PNDIAG_DIAG_STATUS_ERROR_COLOR;
    }

    var rowspan = 3;
    if(usiDiagnosis.attributes.length > 0) {
        rowspan = usiDiagnosis.attributes.length + 2;
    }
    
    var iconName = GetIconName(usiDiagnosis.severity);
    var rowIcon = '<td rowspan="' + rowspan + '" style="vertical-align : middle;text-align:center; width:100px"><div class="tooltip"><span class="tooltip-text-right" style="white-space:nowrap;' + tooltipBgColor + '">' + usiDiagnosis.severity + '</span><img src="' + iconName +'" style="width:24px; height:24px"></td></div>';

    var usiHelpIcon  = '';
    if((usiDiagnosis.help != '') && (usiDiagnosis.help != usiDiagnosis.name)) {
        usiHelpIcon = '<div class="tooltip"><div class="tooltip-text-container"><span class="tooltip-text-right" style="max-width:100%; overflow-wrap:break-word; top:initial; left:initial; bottom:initial; margin-left:initial; position:relative; display:inline-block;">' + usiDiagnosis.help + '</span></div><img src="./images/nflog_severity_information.png" style="width:12px; height:12px; vertical-align: -1.75px;"></div>';
    }

    var usiCode = Number(usiDiagnosis.usi);
    var usiLabel = "";
    if(usiCode > 0x9000 && usiCode < 0x9FFF) {
        usiLabel = "Profile specific";
    } else {
        usiLabel = "Manufacturer specific";
    }

    var rowHtml = rowHeader
    +  rowIcon 
    +       '<td style="width:435px;">' + diagnosisSource + '</td>' // ToDo: See how one can combine localization with api variables in a single string?;
    +       '<tr><td><span style="width:18px; display:inline-block;">' + usiHelpIcon + '</span> ' + usiLabel + ' (USI: ' + NumStringToHexString(usiDiagnosis.usi) + '): ' + usiDiagnosis.name + '</td></tr>';
    
    if(usiDiagnosis.attributes.length > 0) {
        $.each(usiDiagnosis.attributes, function(i, attribute){
            rowHtml += '<tr><td><span style="width:36px; display:inline-block;"></span>' + attribute.name + ' (Value: ' + attribute.value + ')</td></tr>';
        });
    } else {
        rowHtml += '<tr><td><span style="width:36px; display:inline-block;"></span>Data: ' + usiDiagnosis.data + '</td></tr>';
    }

    rowHtml += '</tr>';

    return rowHtml;
}

/// 
/// Checks if a specific bit is set in the diagnosis code
/// 
/// @param {string} tableTypeName : Modal table type name: device / module / submodule
/// @param {string} diagnosisItems   : Array of Json objects containing diagnosis items
/// @returns {None} 
/// 
function UpdateChannelDiagField(tableTypeName, data)
{
    // clear content before loading new diagnosis data
    $("#id_pndiag_" + tableTypeName + "_diag_table_body").html("");

    // Hide Channel Diag section if the device isn't activated, not connected or has invalid data
    if (!data.activation || !data.connection || !data.validData) {   
        $("#id_pndiag_" + tableTypeName + "_diag_table_header_container").hide();
        $("#id_pndiag_" + tableTypeName + "_diag_table_container").hide();
        return;
    }

    var htmlRows = '';
    let drawTopBorder = false;
    if (data.diagnosisItems.length > 0) {
        var channelDiagSourceText = $("#id_pndiag_submodule_channel_diag_source").text();

        //console.log('UpdateChannelDiagField - Contains ' + data.diagnosisItems.length + ' diagnosisItem(s)');
        $.each(data.diagnosisItems, function(itemIndex, diagnosisItem){
            // iterate over all channel diagnoses
            var diagnosisSource = "API: " + diagnosisItem.api + ' / Slot: ' + diagnosisItem.slot + ' / Subslot: ' + diagnosisItem.subslot + ' / ' + channelDiagSourceText + ': ' + diagnosisItem.channel;
            $.each(diagnosisItem.channelDiagnoses, function(diagnosisIndex, channelDiagnosis){
                htmlRows += CreateChannelDiagFieldRow(drawTopBorder, channelDiagnosis, diagnosisSource);
                if(!drawTopBorder) {
                    drawTopBorder = true;
                }
            });

            $.each(diagnosisItem.usiDiagnoses, function(diagnosisIndex, usiDiagnosis){
                htmlRows += CreateUsiDiagFieldRow(drawTopBorder, usiDiagnosis, diagnosisSource);
                if(!drawTopBorder) {
                    drawTopBorder = true;
                }
            });
        });

        $("#id_pndiag_" + tableTypeName + "_no_diag_table").hide();
        $("#id_pndiag_" + tableTypeName + "_diag_table_body").html(htmlRows);
        $("#id_pndiag_" + tableTypeName + "_diag_table").show();
    } else {
        $("#id_pndiag_" + tableTypeName + "_no_diag_table").show();
        $("#id_pndiag_" + tableTypeName + "_diag_table").hide();
    }

    $("#id_pndiag_" + tableTypeName + "_diag_table_header_container").show();
    $("#id_pndiag_" + tableTypeName + "_diag_table_container").show();
}

///
/// Functions for showing Pn Profinet diagnostics 
///

function OnDiagStatusOk()
{
    $("#id_pndiag_status_ok_span").show();
    $("#id_pndiag_status_reloading_table_span").hide();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_new_configs_detected_span").hide();
    $("#id_pndiag_status_disconnected_span").hide();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_wait_project_load_span").hide();
    
    $("#id_pndiag_offline_circle_span").hide();
    $("#id_pndiag_offline_status_span").hide();
    $("#id_pndiag_online_circle_span").show();
    $("#id_pndiag_online_status_span").show();
}

function OnDiagStatusReloadingTable()
{
    $("#id_pndiag_status_ok_span").hide();
    $("#id_pndiag_status_reloading_table_span").show();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_new_configs_detected_span").hide();
    $("#id_pndiag_status_disconnected_span").hide();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_wait_project_load_span").hide();
}

function OnDiagStatusReloadingDevicesTree()
{
    $("#id_pndiag_status_ok_span").hide();
    $("#id_pndiag_status_reloading_table_span").hide();
    $("#id_pndiag_status_reloading_tree_span").show();
    $("#id_pndiag_status_new_configs_detected_span").hide();
    $("#id_pndiag_status_disconnected_span").hide();
    $("#id_pndiag_status_wait_project_load_span").hide();
}

function OnReloadingProjectConfiguration()
{
    $("#id_pndiag_status_ok_span").hide();
    $("#id_pndiag_status_reloading_table_span").hide();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_new_configs_detected_span").hide();
    $("#id_pndiag_status_disconnected_span").hide();
    $("#id_pndiag_status_wait_project_load_span").show();
}

function OnDiagStatusNewConfigs()
{
    $("#id_pndiag_status_ok_span").hide();
    $("#id_pndiag_status_reloading_table_span").hide();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_new_configs_detected_span").show();
    $("#id_pndiag_status_disconnected_span").hide();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_wait_project_load_span").hide();
}

function OnConnectionError(xhr, status, error)
{
    $("#id_pndiag_online_circle_span").hide();
    $("#id_pndiag_online_status_span").hide();
    $("#id_pndiag_status_ok_span").hide();
    $("#id_pndiag_status_reloading_table_span").hide();
    $("#id_pndiag_status_reloading_tree_span").hide();
    $("#id_pndiag_status_new_configs_detected_span").hide();
    $("#id_pndiag_status_wait_project_load_span").hide();
    
    $("#id_pndiag_offline_circle_span").show();
    $("#id_pndiag_offline_status_span").show();
    $("#id_pndiag_status_disconnected_span").show();
    $("#id_pndiag_offline_circle_span").css("display","inline-block"); 
    if(ConnectionStatusOk == true) {
        ConnectionStatusOk = false;
    }
    console.log("Connection Error. Status: " + status + ", Error: " + error);
}

///
/// Functions for handling Profinet Diagnostics Tab Menu 
///
function SwitchPnDiagnosticsTab(currentObjectId)
 {
    var currObject = document.getElementById(currentObjectId);
    var old_tab_id = $(currObject).parent().parent().find('a.pxc-tab-on').attr("data-tab-id");
    $('#' + old_tab_id).hide();
    var oldChildrens = $('#' + old_tab_id).find('.pxc-pd-tabsrow').children();
    for(i = 0; i < oldChildrens.length; i++) {
        var child = oldChildrens[i].getElementsByTagName('a');
        if(child.length == 1) {
           if(child[0].getAttribute('class') == 'pxc-tab-on') {
               var elementToHide = child[0].getAttribute("data-tab-id");
               $('#' + elementToHide).hide();
           }
        }
    }
    var new_tab_id = $(currObject).attr("data-tab-id");
    $('#' + new_tab_id).show();
    $(currObject).parent().parent().find('a.pxc-tab-on').removeClass('pxc-tab-on');
    $(currObject).addClass('pxc-tab-on');
    var newChildrens = $('#' + new_tab_id).find('.pxc-pd-tabsrow').children();
    for(i = 0; i < newChildrens.length; i++) {
        var child = newChildrens[i].getElementsByTagName('a');
        if(child.length == 1) {
           if(child[0].getAttribute('class') == 'pxc-tab-on') {
               var elementToshow = child[0].getAttribute("data-tab-id");
               $('#' + elementToshow).show();
           }
        }
    }
 }


// Dummy functions for test use

// This function simulates a submoduleDiagnosisObject which could be received by cgi call GetSubmoduleDiagnosis
function CreateDummySubmoduleDiagnosisJsonObject()
{
    const channelDiagnosis1 = {"severity":"Advice", "channelErrorType":"ErrorType A", "extChannelErrorType":"ExtErrorType B", "extChannelAddValue":"AddValue C"}; 
    const channelDiagnosis2 = {"severity":"Fault", "channelErrorType":"ErrorType X", "extChannelErrorType":"ExtErrorType Y", "extChannelAddValue":"AddValue Z"}; 
    
    const diagnosisItem1 = {"arUserId":"1", "nodeId":"9", "api":"0", "slot":"1", "subslot":"4", "channel":"32000", "accumulative":true, "direction":"Out", "channelDiagnoses":[channelDiagnosis1, channelDiagnosis2]};

    const submoduleDiagnosis1 = {"deviceName":"axl-bk-1", "api":"0","slot":"1", "moduleTypeName":"DI16", "moduleIdentNumber":"92", "subslot":"4", "submoduleTypeName":"DI16-1", "submoduleIdentNumber":"87", "diagnosisItems":[diagnosisItem1]};
 
    return submoduleDiagnosis1;
}

// This function simulates a moduleDiagnosisObject which could be received by cgi call GetModuleDiagnosis
function CreateDummyModuleDiagnosisJsonObject()
{
    const channelDiagnosis1 = {"severity":"Advice", "channelErrorType":"ErrorType A", "extChannelErrorType":"ExtErrorType B", "extChannelAddValue":"AddValue C"}; 
    const channelDiagnosis2 = {"severity":"Fault", "channelErrorType":"ErrorType X", "extChannelErrorType":"ExtErrorType Y", "extChannelAddValue":"AddValue Z"}; 
    
    const diagnosisItem1 = {"arUserId":"1", "nodeId":"9", "api":"0", "slot":"1", "subslot":"4", "channel":"32000", "accumulative":true, "direction":"Out", "channelDiagnoses":[channelDiagnosis1, channelDiagnosis2]};

    const moduleDiagnosis1 = {"deviceName":"axl-bk-1", "api":"0","slot":"1", "moduleTypeName":"DI16", "moduleIdentNumber":"92", "submodulesCount":"4", "diagnosisItems":[diagnosisItem1]};
 
    return moduleDiagnosis1;
}

// This function simulates a deviceDiagnosisObject which could be received by cgi call GetDeviceDiagnosis
function CreateDummyDeviceDiagnosisJsonObject()
{
    const channelDiagnosis1 = {"severity":"Advice", "channelErrorType":"ErrorType A", "extChannelErrorType":"ExtErrorType B", "extChannelAddValue":"AddValue C"}; 
    const channelDiagnosis2 = {"severity":"Fault", "channelErrorType":"ErrorType X", "extChannelErrorType":"ExtErrorType Y", "extChannelAddValue":"AddValue Z"}; 
    
    const diagnosisItem1 = {"arUserId":"1", "nodeId":"9", "api":"0", "slot":"1", "subslot":"4", "channel":"32000", "accumulative":true, "direction":"Out", "channelDiagnoses":[channelDiagnosis1, channelDiagnosis2]};

    const dummyDiagnosis1 = {"arUserId":"1", "vendorId":"0xB000", "deviceId":"0x1000", "hasWbm":true, "ipAddress":"192.168.1.11", "gateway":"192.168.1.1", "netmask":"255.255.255.0", "dnsName":"axl-bk-1", "stationName":"axl-bk-1", "modulesCount":"3", "diagnosisItems":[diagnosisItem1]};
 
    return dummyDiagnosis1;
}

// This function simulates a device diagnosis object with usi diagnosis information which could received by cgi call GetDeviceDiagnosis
function CreateDummyDevcieUsiDiagnosisItem()
{
    const dummyUsiAttribute1 = { "name":"USI diagnosis attribute 1",
                                 "value":"3000" };
    const dummyUsiAttribute2 = { "name":"USI diagnosis attribute 2",
                                 "value":"Target Item 2" };
    const dummyUsiDiagnosis = {"severity":"Fault", 
                               "usi":"1",
                               "data":"0x02 0x03 0x99 0xA7", 
                               "name":"Usi diagnosis 1", 
                               "help":"Help text for USI diagnosis 1", 
                               "attributes":[dummyUsiAttribute1, dummyUsiAttribute2]};   
    const diagnosisItem1 = {"arUserId":"1", 
                            "nodeId":"9", 
                            "api":"0", 
                            "slot":"1", 
                            "subslot":"4", 
                            "channel":"32000", 
                            "accumulative":true, 
                            "direction":"Out", 
                            "usiDiagnoses":[dummyUsiDiagnosis]};
    const dummyDiagnosis1 = {"arUserId":"1",
                             "vendorId":"0xB000",
                             "deviceId":"0x1000", 
                             "hasWbm":true, 
                             "ipAddress":"192.168.1.11", 
                             "gateway":"192.168.1.1", 
                             "netmask":"255.255.255.0", 
                             "dnsName":"axl-bk-1", 
                             "stationName":"axl-bk-1", 
                             "modulesCount":"3", 
                             "diagnosisItems":[diagnosisItem1], 
                             "activation":true, 
                             "connection":true, 
                             "validData":true};
    return dummyDiagnosis1;
}

// This function simulates diagnosis information for the whole tree which could be received by cgi call GetDiagnosisInformation.
// This object contains all nodes that have a different severity than 'Normal'
// This information shall be used to set diagnosis states in the tree
function CreateDiagnosisInfo()
{
    const submodule1 = {"subslot":"1", "severity":"Fault"};
    const submodule2 = {"subslot":"2", "severity":"Advice"};

    const module1 = {"slot":"0", "severity":"Fault", "children":[submodule1, submodule2]};

    const device1 = {"arUserId":"1", "severity":"Fault", "children":[module1]};
    const diagnosisInfo = {"children":[device1]};

    return diagnosisInfo;
}

ProfinetService = (function () {

    let Public = {

        GetPnDeviceControllerStatus: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "GetPnDeviceControllerStatus",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetControllerConfig: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "GetControllerConfig",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetControllerTree: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetControllerTree",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                ajaxCallbackFunctions,
                null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
        },

        GetDevicesChangesRandomNum: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetDevicesChangesRandomNum",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                ajaxCallbackFunctions,
                null);

            // Check Session is Valid
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetPnDevicesDataReady: function ()
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetPnDevicesDataReady",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                ajaxCallbackFunctions,
                null);

            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetDiagnosisInformation: function (requestData)
        {
            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetDiagnosisInformation",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData,
                ajaxCallbackFunctions,
                null);

            // Request Devices Diagnostics Data from Controller    
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetDeviceDiagnosis: function (arUserId)
        {
            let requestData = JSON.stringify({ "arUserId": Number(arUserId) });

            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetDeviceDiagnosis",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData, ajaxCallbackFunctions, null);

            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetModuleDiagnosis: function (arUserId, slot)
        {
            let requestData = JSON.stringify({
                "arUserId": Number(arUserId),
                "slot": Number(slot)
            });

            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetModuleDiagnosis",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData,
                ajaxCallbackFunctions,
                null);

            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetSubmoduleDiagnosis: function (arUserId, slot, subslot)
        {
            let requestData = JSON.stringify({
                "arUserId": Number(arUserId),
                "slot": Number(slot),
                "subslot": Number(subslot),
            });

            let ajaxCallbackFunctions = AjaxInterface.AjaxCallBackFunctions;
            ajaxCallbackFunctions.OnErrorCallback = OnConnectionError;

            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetSubmoduleDiagnosis",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData,
                ajaxCallbackFunctions,
                null);

            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        }

    }
  
    let Private = {
        dataProviderScriptName: "module/Profinet/ProfinetDiagnosticsDp/"
    }

    return Public;

})();
