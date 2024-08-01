
SubPageActive = true;

fw_User_Input_Rules_Table_index = undefined;
fw_User_Output_Rules_Table_index = undefined;
fw_selectedMainConfigsTabID = localStorage.getItem("mainConfiTabKey");
fw_selectedUserConfigsTabID = localStorage.getItem("userConfiTabKey");

fw_ethernetInterfacesOptions = "";

USER_RULES_TABLES_MAX_ENTRIES = 30;

fw_CheckConnectionTimoutCtr = 0;
FW_MAX_TIMEOUT_CYCLES = 8;

PAGE_LOCATION_REFERENCE = "#extensions/Fwm/Firewall.html"
  
  
function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete SubPageActive;
    
    delete fw_User_Input_Rules_Table_index;
    delete fw_User_Output_Rules_Table_index;
    delete fw_selectedMainConfigsTabID;
    delete fw_selectedUserConfigsTabID;
    
    delete fw_ethernetInterfacesOptions;
    
    delete USER_RULES_TABLES_MAX_ENTRIES;

    delete fw_CheckConnectionTimoutCtr;
    delete FW_MAX_TIMEOUT_CYCLES;

    delete PAGE_LOCATION_REFERENCE;
    delete FirewallManagerService;

    ClearRulesValidations();
    $(document).off("LanguageChanged");
}


$(document).ready(function () {

    RestoreSelectedConfigTabs();

    // Init Validations
    InitRulesValidations();

    UpdateEthernetInterfaces();

    UpdateFirewallStatusTable();
    UpdateBasicPortRulesTable();
    UpdateIcmpConfigsTable();
    UpdateUserInputRulesTable();
    UpdateUserOutputRulesTable();

    var result = CheckUndefActiveFwTables();
    if(result = false)
    {
        alert('Failed to check Active FW tables');
    }

    UpdateSystemMessages();
    Language.UpdateActivePageMessages();
    
    $("#id_fw_page_div").show();
    $("#id_pagetitle_security").show();
    $("#id_div_loader").hide();
    $("#id_div_loader").css("display", "none");
    
    // Show page content after page elements are loaded
    $("#id_fw_page_global_div").show();
        
    $("#id_fw_apply_config_button").click( function(event) {
        if(ValidateFwRulesTables() == true)
        {
            $("#id_div_loader").show();
            setTimeout(ApplyFirewallStatus, 50);
        }
   
        event.preventDefault(); 
    });
    
    $("#id_fw_discard_config_button").click( function(event) {
        $("#id_fw_discard_modal").show();
        event.preventDefault();
        return false;
    });
    $("#id_fw_discard_ok_btn").click(function(event)
    {
        $("#id_fw_discard_modal").hide();
        
        var result = false;
        // delete error messages
        result = ResetSystemMessages();
        
        if(result == true)
        {
            result = ResetFaultyConfigs();
        }
        else
        {
            alert('Failed to reset System Messsages');
        }
        
        if(result == false)
        {
            alert('Failed to drop faulty firewall configs');
        }
        // reload website and drop changes
        window.location.href = PAGE_LOCATION_REFERENCE;
        location.reload();
        return false
    });
    $("#id_fw_discard_cancle_btn").click(function(event)
    {
        $("#id_fw_discard_modal").hide();
        event.preventDefault();
        return false;
    });
    
    $(".pxc-pd-tabs h2 a").click(function(event) {
        
        var currentObjectId = $(this).attr('id');
        
        SwitchFwConfigTab(currentObjectId); 
        
        // check main tabs
        if(currentObjectId == 'id_main_basic_configs_tab')
        {
            fw_selectedMainConfigsTabID = 'id_main_basic_configs_tab';
        }
        else if(currentObjectId == 'id_main_user_configs_tab')
        {
            fw_selectedMainConfigsTabID = 'id_main_user_configs_tab';
        }
        else if(currentObjectId == 'id_main_user_input_configs_tab')
        {
            fw_selectedUserConfigsTabID = 'id_main_user_input_configs_tab';
        }
        else if(currentObjectId == 'id_main_user_output_configs_tab')
        {
            fw_selectedUserConfigsTabID = 'id_main_user_output_configs_tab';
        }
        
        localStorage.setItem("mainConfiTabKey", fw_selectedMainConfigsTabID);
        localStorage.setItem("userConfiTabKey", fw_selectedUserConfigsTabID);

        event.preventDefault();
    });
     /*
      * User Table handling functions
      */
    /* User Input table handling */

    $(document).on("click", "#id_fw_user_input_rules_table tr:not(:last-child)", function(event) {
        fw_User_Input_Rules_Table_index = this.rowIndex;
        if(fw_User_Input_Rules_Table_index == 0)
        {
            fw_User_Input_Rules_Table_index = undefined;
        }
        handleTableTrSelected('id_fw_user_input_rules_table', fw_User_Input_Rules_Table_index);
        event.preventDefault();
    });
    
    /* User Output table handling */
    $(document).on("click", "#id_fw_user_output_rules_table tr:not(:last-child)", function(event) {
        fw_User_Output_Rules_Table_index = this.rowIndex;
        if(fw_User_Output_Rules_Table_index == 0)
        {
            fw_User_Output_Rules_Table_index = undefined;
        }
        handleTableTrSelected('id_fw_user_output_rules_table', fw_User_Output_Rules_Table_index);
        event.preventDefault();
    });
    
    $('#id_fw_status_assign').change(function() {
        //alert('selected = ' + $(this).value());
    });
    
    $('#id_fw_active_fw_rules_save_button').click(function(event) {
        event.preventDefault();
        var textContent = "";
        var table = document.getElementById('id_fw_active_rules_table');
        for(var i = 1; i < table.rows.length; i++)
        {
            var rowCells = table.rows[i].cells;
            textContent += rowCells[2].getElementsByTagName("span")[0].innerHTML;
            textContent += "\n";
        }
        var filename ="active-fw-rules.txt";
        var file = new Blob([textContent], {type: "text/plain"});
        
        var iExplorer        = navigator.userAgent.match(/MSIE\s([\d.]+)/);
        var iExplorer11      = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/);
        var iExplorerEDGE    = navigator.userAgent.match(/Edge/g);
        
        if(((iExplorer) && (iExplorer[1] >= 0)) || iExplorer11 || iExplorerEDGE)
        {
            window.navigator.msSaveBlob(file, filename);
        }
        else
        {
            dLink = document.createElement("a");
            dLink.href = window.URL.createObjectURL(file);
            dLink.style.display = "none";
            dLink.download = filename;
            document.body.appendChild(dLink);
            dLink.click();
        }
    });
        
    $('#id_fw_active_fw_rules_button').click(function(event) {
        event.preventDefault();
        $("#id_div_loader").show();

        let result = FirewallManagerService.ListActiveFwTables();
    
        $('#id_fw_active_rules_table tr:not(:first)').remove();
        $('#id_fw_active_rules_table > tbody').append(result);
        // Show active FW rules
        $("#id_fw_modal_show_fw_active_rules").show();
        if($('#id_fw_active_rules_table tr').length < 2)
        {
            $("#id_fw_active_fw_rules_save_button").hide();
        }
        else
        {
            $("#id_fw_active_fw_rules_save_button").show();
        }
        
        $("#id_div_loader").hide();
    });
    
    $('#id_fw_input_rules_add_button').click(function(event) {
        
        var newRuleRowHtml = FwTableBuildNewInputRowHtml();
        FwTableInsertNewRow('id_fw_user_input_rules_table', newRuleRowHtml);
        Language.UpdateActivePageMessages();
        event.preventDefault();
    });
    
    $('#id_fw_input_rules_remove_button').click(function(event) {
        FwTableDeleteSelectedRow('id_fw_user_input_rules_table');
        event.preventDefault();
    });
    
    $('#id_fw_input_rules_move_up_button').click(function(event) {
        FwTableModeUpDown('up', 'id_fw_user_input_rules_table');
        event.preventDefault();
    });
    
    $('#id_fw_input_rules_move_down_button').click(function(event) {
        FwTableModeUpDown('down', 'id_fw_user_input_rules_table');
        event.preventDefault();
    });
    
    $('#id_fw_output_rules_add_button').click(function(event) {
        var newRowHtml = FwTableBuildNewOutputRowHtml();
        FwTableInsertNewRow('id_fw_user_output_rules_table', newRowHtml);
        Language.UpdateActivePageMessages();
        event.preventDefault();
    });
    
    $('#id_fw_output_rules_remove_button').click(function(event) {
        FwTableDeleteSelectedRow('id_fw_user_output_rules_table');
        event.preventDefault();
    });
    
    $('#id_fw_input_output_move_up_button').click(function(event) {
        FwTableModeUpDown('up', 'id_fw_user_output_rules_table');
        event.preventDefault();
    });
    
    $('#id_fw_output_rules_move_down_button').click(function(event) {
        FwTableModeUpDown('down', 'id_fw_user_output_rules_table');
        event.preventDefault();
    });
    
    $("#id_fw_active_fw_rules_close_button").click(function(event)
    {
        $("#id_fw_modal_show_fw_active_rules").hide();
        event.preventDefault();
    });
});

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        $(".modal").hide();
    }
}

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
	console.log("Event subscriber on LanguageChanged - Selected language: "+ e.message);
    
    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_fw_user_input_config_form");
        ReloadValidation("#id_fw_user_ouput_config_form");
    }
    catch(e){}

}

function ClearRulesValidations()
{
    $("#id_fw_user_input_config_form").removeData('validator');
    $("#id_fw_user_ouput_config_form").removeData('validator');
}

function InitRulesValidations()
{
    MsDelay(20).then(function()
    {
        Validation("#id_fw_user_input_config_form");
        Validation("#id_fw_user_ouput_config_form");
    });
}

function MsDelay(t, v)
{
    return new Promise(function(resolve) { 
       setTimeout(resolve.bind(null, v), t)
   });
}

function ValidateFwRulesTables()
{
    if(!$("#id_fw_user_input_config_form").valid())
    {
        return false;
    }
    if(!$("#id_fw_user_ouput_config_form").valid())
    {
        return false;
    }
    return true;
}

function ApplyFirewallStatus()
{
    var result = true;
    // reset System Messages
    if(result == true)
    {
        result = ResetSystemMessages();
    }
    else
    {
        return;
    }
    // set Firewall Status Config
    if(result == true)
    {
        result = SetFirewallStatus();
    }
    else
    {
        alert('System Error: Failed to reset system messages');
    }
} 
function ApplyFirewallConfigs()
{
  var result = true;
  
  // set FW basic configuration
  if(result == true)
  {
      result = SetIcmpFwConfigs();
  }
  else
  {
      alert('System Error: Failed set Firewall General Status');
      result = true;
  }
  // set basic port rules
  if(result == true)
  {
      result = SetBasicPortRules();
  }
  else
  {
      alert('System Error: Failed set ICMP configurations');
      result = true;
  }
  // set user input rules
  if(result == true)
  {
      result = SetUserInputRules();
  }
  else
  {
      alert('System Error: Failed set Basic Firewall Rules');
      result = true;
  }
  // set user output rules
  if(result == true)
  {
      result = SetUserOutputRules();
  }
  else
  {
      alert('System Error: Failed set User Input Rules');
      result = true;
  }
  // sync fw configs
  if(result == true)
  {
      result = SyncFirewallConfigs();
  }
  else
  {
      alert('System Error: Failed set User Output Rules');
  }
  if(result == true)
  {
      window.location.href = PAGE_LOCATION_REFERENCE;
  }
  else
  {
      alert('System Error: Failed to sync Firewall status');
  }
  location.reload();
}

function RestoreSelectedConfigTabs()
{
   if(fw_selectedMainConfigsTabID == 'id_main_user_configs_tab')
   {
       SwitchFwConfigTab('id_main_user_configs_tab');
       if(fw_selectedUserConfigsTabID != undefined && fw_selectedUserConfigsTabID != null)
       {
           SwitchFwConfigTab(fw_selectedUserConfigsTabID);
       }
       else
       {
           SwitchFwConfigTab('id_main_user_input_configs_tab');
       }
   }

}

function SwitchFwConfigTab(currentObjectId)
{
   var currObject = document.getElementById(currentObjectId);
   var old_tab_id = $(currObject).parent().parent().find('a.pxc-tab-on').attr("data-tab-id");
   $('#' + old_tab_id).hide();
   var oldChildrens = $('#' + old_tab_id).find('.pxc-pd-tabsrow').children();
   for(i = 0; i < oldChildrens.length; i++)
   {
       var child = oldChildrens[i].getElementsByTagName('a');
       if(child.length == 1)
       {
          if(child[0].getAttribute('class') == 'pxc-tab-on')
          {
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
   for(i = 0; i < newChildrens.length; i++)
   {
       var child = newChildrens[i].getElementsByTagName('a');
       if(child.length == 1)
       {
          if(child[0].getAttribute('class') == 'pxc-tab-on')
          {
              var elementToshow = child[0].getAttribute("data-tab-id");
              $('#' + elementToshow).show();
          }
       }
   }
}


function CheckUndefActiveFwTables()
{
    let response = FirewallManagerService.CheckUndefActiveFwTables();
    if(response.result == true)
    {
        result = true;
    }
    else
    {
        alert(data.errorText);
    }
    return result;
}

function UpdateEthernetInterfaces()
{
    let response = FirewallManagerService.ListEthernetInterfaces();
    fw_ethernetInterfacesOptions = response;
}

function UpdateSystemMessages()
{
    let sysMsgsBox = document.getElementById('id_fw_system_messages_box_td');
    $("#id_div_loader").show();
    sysMsgsBox.innerHTML = '<span style="color:blue;    white-space: pre;">Loading ... </span>' 

    let response = FirewallManagerService.GetSystemMessages();
    sysMsgsBox.innerHTML = response;
    $("#id_div_loader").hide();
}

function ResetSystemMessages()
{
    let result = true;

    let response = FirewallManagerService.ResetSystemMessages();
    if(!response.result)
    {
        alert(response.errorText);
        result = false;
    }

    return result;
}

function ResetFaultyConfigs()
{
    var result = true;

    let response = FirewallManagerService.ResetFaultyConfigs();
    if(!response.result)
    {
        alert(data.errorText);
        result = false;
    }
   
   return result;
}

function CheckSelectedInputProt(value)
{
    var table = document.getElementById('id_fw_user_input_rules_table');
    var rowCells = table.rows[fw_User_Input_Rules_Table_index].cells;
    if(value == "All")
    {
        
        rowCells[4].children[0].disabled = true;
        rowCells[6].children[0].disabled = true;
    }
    else
    {
        rowCells[4].children[0].disabled = false;
        rowCells[6].children[0].disabled = false;
    }
}

function CheckSelectedOutputProt(value)
{
    var table = document.getElementById('id_fw_user_output_rules_table');
    var rowCells = table.rows[fw_User_Output_Rules_Table_index].cells;
    if(value == "All")
    {
        rowCells[3].children[0].disabled = true;
        rowCells[5].children[0].disabled = true;
    }
    else
    {
        rowCells[3].children[0].disabled = false;
        rowCells[5].children[0].disabled = false;
    }
}

function SyncFirewallConfigs()
{
    let result = true;

    let response = FirewallManagerService.SyncFirewallConfigs();
    if(!response.result)
    {
        alert(response.errorText);
        result = false;
    }
   
   return result;
}


function SetIcmpFwConfigs()
{
    let result = true;

    let response = FirewallManagerService.SetIcmpFwConfigs();    
    if(!response.result)
    {
        alert(response.errorText);
        result = false;
    }
   
   return result;
}
function SetFirewallStatus()
{
    var postData = $("#id_fw_firewall_status_config_form").serializeArray();

    FirewallManagerService.SetFirewallStatus(postData)
    .then(function(data) {
        if(!data.result)
        {
            console.log(data.errorText);
            alert(data.errorText);
            $("#id_div_loader").hide();
        }
        else
        {
            // Apply Firewall configurations
            console.log("Applying firewall configurations");
            setTimeout(ApplyFirewallConfigs, 200);
        }
    })
    .catch(function(errorObj) {
        console.log("Communication Error in SetFirewallStatus: " + errorObj.error + "  Status: " + errorObj.status);
        if(errorObj.error == 'timeout')
        {
            fw_CheckConnectionTimoutCtr = 1;
            checkConnectionAfterTimeout();
        }
    });
}

function checkConnectionAfterTimeout()
{
    console.log("Checking communication error after timeout...");

    FirewallManagerService.GetSystemMessagesPromise()
    .then(function(data) {
        console.log("Applying firewall configurations (after timeout)");
        setTimeout(ApplyFirewallConfigs, 200);
    })
    .catch(function(errorObj) {
        console.log("Communication Error in checkConnectionAfterTimeout: " + err + "  Status: " + status);
        if(fw_CheckConnectionTimoutCtr > FW_MAX_TIMEOUT_CYCLES)
        {
            alert("Communication Error: " + errorObj.error + "  Status: " + errorObj.status);
        }
        else
        {
            fw_CheckConnectionTimoutCtr++;
            checkConnectionAfterTimeout();
        }
    });
}

function SetBasicPortRules()
{
    var result = true;

    var postData = $("#id_fw_basic_port_rules_table_form").serializeArray();

    let response = FirewallManagerService.SetBasicPortRules(postData);    
    if(!response.result)
    {
        alert(data.errorText);
        result = false;
    }
    return result;
}

function SetUserInputRules()
{
    let result = false;
    let postData = "";
    let table = document.getElementById('id_fw_user_input_rules_table');
    if(table.rows.length > 2)
    {
        for(var i = 1; i < table.rows.length -1 ; i++)
        {
            // iface            
            postData = postData + "iface=" + table.rows[i].cells[1].children[0].value + "#";
            
            // protocol
            postData = postData + "prot="  + table.rows[i].cells[2].children[0].value + "#";
            // source ip
            if(table.rows[i].cells[3].children[0].value != "0.0.0.0")
            {
                postData = postData + "sip="  + table.rows[i].cells[3].children[0].value + "#";
            }
            // Source Port
            if(table.rows[i].cells[2].children[0].value != "All")
            {
                if(table.rows[i].cells[4].children[0].value != "")
                {
                    postData = postData + "sport="  + table.rows[i].cells[4].children[0].value + "#";
                }
            }
            // destination ip
            if(table.rows[i].cells[5].children[0].value != "0.0.0.0")
            {
                postData = postData + "dip="  + table.rows[i].cells[5].children[0].value + "#";
            }
            
            // Destination Port
            if(table.rows[i].cells[2].children[0].value != "All")
            {
                if(table.rows[i].cells[6].children[0].value != "")
                {
                    postData = postData + "dport=" + table.rows[i].cells[6].children[0].value + "#";
                }
            }
    
            //comment
            if(table.rows[i].cells[7].children[0].value != " " && table.rows[i].cells[7].children[0].value != "")
            {
                postData = postData + "comment=" + table.rows[i].cells[7].children[0].value + "#";
            }
            
            // terminal action
            postData = postData + "taction=" + table.rows[i].cells[8].children[0].value;
            
            postData = postData + "&";
        }
    }
    let response = FirewallManagerService.SetUserInputRules(postData);
    if(response.result)
    {
        result = true;
    }
    else
    {
        alert(response.errorText);
    }
    return result;
}

function SetUserOutputRules()
{
    var result = false;
    var postData = "";
    
    var table = document.getElementById('id_fw_user_output_rules_table');
    if(table.rows.length >= 2)
    {
        for(var i = 1; i < table.rows.length -1 ; i++)
        {
            // protocol
            postData = postData + "prot="  + table.rows[i].cells[1].children[0].value + "#";
            // source ip
            if(table.rows[i].cells[2].children[0].value != "0.0.0.0")
            {
                postData = postData + "sip="  + table.rows[i].cells[2].children[0].value + "#";
            }
            
            // Source Port
            if(table.rows[i].cells[1].children[0].value != "All")
            {
                if(table.rows[i].cells[3].children[0].value != "")
                {
                    postData = postData + "sport="  + table.rows[i].cells[3].children[0].value + "#";
                }
            }
            // destination ip
            if(table.rows[i].cells[4].children[0].value != "0.0.0.0")
            {
                postData = postData + "dip="  + table.rows[i].cells[4].children[0].value + "#";
            }
            
            // Destination Port
            if(table.rows[i].cells[1].children[0].value != "All")
            {
                if(table.rows[i].cells[5].children[0].value != "")
                {
                    postData = postData + "dport=" + table.rows[i].cells[5].children[0].value + "#";
                }
            }
            
            //comment
            postData = postData + "comment=" + table.rows[i].cells[6].children[0].value + "#";
            // terminal action
            postData = postData + "taction=" + table.rows[i].cells[7].children[0].value;
            
            postData = postData + "&";
            
        }
    }

    let response = FirewallManagerService.SetUserOutputRules(postData);
    if(response.result)
    {
        result = true;
    }
    else
    {
        alert(response.errorText);
    }
    return result
}

function handleTableTrSelected(tableId, rowIndex)
{
   var table = document.getElementById(tableId);
   for(var i = 1; i < table.rows.length -1 ; i++)
   {
       if(i == rowIndex)
       {
           if(table.rows[i].classList.contains("even") == true)
           {
              table.rows[i].classList.remove("even");
           }
           table.rows[i].classList.toggle("selected", "true");
       }
       else
       {
           table.rows[i].classList.remove("selected");
           if((i % 2) == 0)
           {
               if(table.rows[i].classList.contains("even") == false)
               {
                   if(table.rows[i].classList.contains("odd") == true)
                   {
                       table.rows[i].classList.remove("odd");
                   }
                   table.rows[i].classList.add("even");
               }
           }
       }
       
   }
}

function fw_table_resortRows(tableId, selectedIndex)
{
    var table = document.getElementById(tableId);
    for(var i = 1; i < table.rows.length -1 ; i++)
    {
        var rowCells = table.rows[i].cells;
        var orderCell = rowCells[0].getElementsByTagName("p") ;
        orderCell[0].innerHTML = i;
        
        if(i != selectedIndex)
        {
            if((i % 2) == 0)
            {
               if(table.rows[i].classList.contains("odd") == true)
               {
                   table.rows[i].classList.remove("odd");
               }
               if(table.rows[i].classList.contains("even") == false)
               {
                   table.rows[i].classList.add("even");
               }
            }
            else
            {
               if(table.rows[i].classList.contains("even") == true)
               {
                   table.rows[i].classList.remove("even");
               }
               if(table.rows[i].classList.contains("odd") == false)
               {
                   table.rows[i].classList.add("odd");
               }
            }
        }
        else
        {
            
        }
    }
}

function FwTableModeUpDown(direction, tableId)
{
    var currentIndex = getTableCurrentIndexValue(tableId);
    if((typeof currentIndex == 'undefined') || (currentIndex == 0))
    {   
        return;
    }
    
    //var table = document.getElementById(tableId);
    var rows = document.getElementById(tableId).rows;
    if(direction == 'up')
    {
        if(currentIndex > 1)
        {
            rows[currentIndex].parentNode.insertBefore(rows[currentIndex],rows[currentIndex - 1]);
            currentIndex--;
        }
    }
    
    if(direction == 'down')
    {
        if(currentIndex + 1 < (rows.length -1))
        {
            rows[currentIndex].parentNode.insertBefore(rows[currentIndex + 1],rows[currentIndex]);
            currentIndex++;
        }
    }
    setTableCurrentIndex(tableId, currentIndex);
    fw_table_resortRows(tableId, currentIndex);
}

function setTableCurrentIndex(tableId, currentIndex)
{
    if(tableId == 'id_fw_user_input_rules_table')
    {
        fw_User_Input_Rules_Table_index = currentIndex;
    }
    if(tableId == 'id_fw_user_output_rules_table')
    {
        fw_User_Output_Rules_Table_index = currentIndex;
    }
}

function getTableCurrentIndexValue(tableId)
{
    if(tableId == 'id_fw_user_input_rules_table')
    {
        return fw_User_Input_Rules_Table_index;
    }
    if(tableId == 'id_fw_user_output_rules_table')
    {
        return fw_User_Output_Rules_Table_index;
    }
}

/* table elements on change functions */
function fw_checkRowProtocolPort(o)
{
    if(o.disabled)
    {
        return;
    }
    alert(o.id);
}

function FwTableInsertNewRow(tableId, rowHtml)
{
    var table = document.getElementById(tableId);
    var currentIndex = getTableCurrentIndexValue(tableId);
    //alert('curr = ' + table.rows.length + 'Max = ' + USER_RULES_TABLES_MAX_ENTRIES);
    if(table.rows.length > (USER_RULES_TABLES_MAX_ENTRIES + 1))
    {
        alert("ERROR - Max rules per table is " + USER_RULES_TABLES_MAX_ENTRIES);
        return;
    }
    if((typeof currentIndex == 'undefined') || (currentIndex == (table.rows.length - 1)))
    {   
        currentIndex = table.rows.length - 2;
    }
    var newRow = table.insertRow(currentIndex + 1);
    newRow.innerHTML = rowHtml;
    if(currentIndex == (table.rows.length - 2))
    {
        setTableCurrentIndex(tableId, (table.rows.length - 1));
    }
    fw_table_resortRows(tableId, currentIndex);
}

function FwTableBuildNewInputRowHtml()
{
    let newRowIndex = $("#id_fw_user_input_rules_table > tbody tr:not('.exclude')").length;
    let rowHtml = "<td><p></p></td>"; // Sequence Row
    // Interface Select
    rowHtml +=  '<td><select class="pxc-dropdown" id="id_fw_user_input_rule_' + newRowIndex + '_interface_select" name="fw_input_' + newRowIndex + '_interface_select" style="width: 90%">';
    rowHtml +=      fw_ethernetInterfacesOptions;    
    rowHtml +=      '<option class="c_fw_rules_config_opt_all" selected="true" value="All">All</option>'
    rowHtml +=  '</select></td>';       
    
    // Protocol Select
    rowHtml += '<td><select class="pxc-dropdown" style="width: 90%"  id="id_fw_user_input_rule_' + newRowIndex + '_prot_select" name="fw_input_' + newRowIndex + '_prot_select" onchange="CheckSelectedInputProt(this.value)">';
    rowHtml +=     '<option selected="true" value="Tcp">TCP</option>';
    rowHtml +=     '<option value="Udp">UDP</option>';
    rowHtml +=     '<option value="UdpLite">UDPLITE</option>';
    rowHtml +=     '<option class="c_fw_rules_config_opt_all" value="All">All</option>';
    rowHtml += '</select></td>';
            
    // Source Ip Address
    rowHtml += '<td><input type="text" value="0.0.0.0" style="text-align:center;" id="id_fw_user_input_rule_' + newRowIndex + '_src_ip" name="user_input_rule_' + newRowIndex + '_src_ip" class="fw-ipv4"></td>';
    
    // Source Port
    rowHtml += '<td><input type="text" value="" style="text-align:center;" id="id_fw_user_input_rule_' + newRowIndex + '_src_port" name="user_input_rule_' + newRowIndex + '_src_port" placeholder="any"  class="fw-port"></td>';
    
    // Destination Ip
    rowHtml += '<td><input type="text" value="0.0.0.0" style="text-align:center;" id="id_fw_user_input_rule_' + newRowIndex + '_dest_ip" name="user_input_rule_' + newRowIndex + '_dest_ip" class="fw-ipv4"></td>';
    
    // Destination Port
    rowHtml += '<td><input type="text" value="" style="text-align:center;" id="id_fw_user_input_rule_' + newRowIndex + '_dest_port" name="user_input_rule_' + newRowIndex + '_dest_port" placeholder="any"  class="fw-port"></td>';
    
    // Comment
    rowHtml += '<td><input id="id_fw_user_input_rule_' + newRowIndex + '_comment" name="user_input_rule_' + newRowIndex + '_comment" type="text" value="" style="text-align:center;" class="fw-comment"></td>';
    
    // Action
    rowHtml += '<td><select class="pxc-dropdown" id="id_fw_user_input_rule_' + newRowIndex + '_action_select" name=user_input_rule_"' + newRowIndex + '_action_select" style="width: 90%">';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_accept" selected="true" value="Accept">Accept</option>';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_drop"     value="Drop">Drop</option>';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_reject"   value="Reject">Reject</option>';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_continue" value="Continue">Continue</option>';
    rowHtml += '</select></td>';
    
    return rowHtml;
}

function FwTableBuildNewOutputRowHtml()
{
    var newRowIndex = $("#id_fw_user_output_rules_table > tbody tr:not('.exclude')").length + 1;
    var rowHtml = "<td><p></p></td>"; // Sequence Row      
    
    // Protocol Select
    rowHtml += '<td><select class="pxc-dropdown" style="width: 90%"  id="id_fw_user_output_rule_' + newRowIndex + '_prot_select" name="fw_output_' + newRowIndex + '_prot_select" onchange="CheckSelectedOutputProt(this.value)">';
    rowHtml +=     '<option selected="true" value="Tcp">TCP</option>';
    rowHtml +=     '<option value="Udp">UDP</option>';
    rowHtml +=     '<option value="UdpLite">UDPLITE</option>';
    rowHtml +=     '<option class="c_fw_rules_config_opt_all" value="All">All</option>';
    rowHtml += '</select></td>';
            
    // Source Ip Address
    rowHtml += '<td><input type="text" value="0.0.0.0" style="text-align:center;" id="id_fw_user_output_rule_' + newRowIndex + '_src_ip" name="user_output_rule_' + newRowIndex + '_src_ip" class="fw-ipv4"></td>';
    
    // Source Port
    rowHtml += '<td><input type="text" value="" placeholder="any" style="text-align:center;" name="user_output_rule_' + newRowIndex + '_src_port" id="id_fw_user_output_rule_' + newRowIndex + '_src_port" class="fw-port"></td>';
    
    // Destination Ip
    rowHtml += '<td><input type="text" value="0.0.0.0" style="text-align:center;" name="user_output_rule_' + newRowIndex + '_dest_ip" id="id_fw_user_output_rule_' + newRowIndex + '_dest_ip" class="fw-ipv4"></td>';
    
    // Destination Port
    rowHtml += '<td><input id="id_fw_user_output_rule_' + newRowIndex + '_dest_port" type="text" value="" placeholder="any" style="text-align:center;" name="user_output_rule_' + newRowIndex + '_dest_port" id="id_fw_user_output_rule_' + newRowIndex + '_dest_port" class="fw-port"></td>';
    
    // Comment
    rowHtml += '<td><input id="id_fw_user_output_rule_' + newRowIndex + '_comment" name="user_output_rule_' + newRowIndex + '_comment" type="text" value="" style="text-align:center;" class="fw-comment"></td>';
    
    // Action
    rowHtml += '<td><select class="pxc-dropdown" id="id_fw_user_output_rule_' + newRowIndex + '_action_select" name=user_output_rule_"' + newRowIndex + '_action_select" style="width: 90%">';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_accept" selected="true" value="Accept">Accept</option>';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_drop"     value="Drop">Drop</option>';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_reject"   value="Reject">Reject</option>';
    rowHtml +=     '<option class="c_fw_opt_rule_taction_continue" value="Continue">Continue</option>';
    rowHtml += '</select></td>';
    
    return rowHtml;
}


function FwTableDeleteSelectedRow(tableId)
{
    var table = document.getElementById(tableId);
    var currentIndex = getTableCurrentIndexValue(tableId);
    if((typeof currentIndex == 'undefined') || (currentIndex == 0) || (currentIndex == (table.rows.length - 1)))
    {   
        return;
    }
    table.deleteRow(currentIndex);
    setTableCurrentIndex(tableId, (table.rows.length - 1));
    fw_table_resortRows(tableId, 0);

}

function UpdateFirewallStatusTable()
{
    let response = FirewallManagerService.GetFirewallStatus();

    $("#id_fw_firewall_status_config_table > tbody").append(response);
    $("#id_fw_firewall_status_config_table").show();
}

function UpdateBasicPortRulesTable()
{
    let response = FirewallManagerService.ListBasicPortRules();
    $("#id_fw_basic_port_rules_table_table").append(response);
    $("#id_fw_basic_port_rules_table_table").show();
}

function UpdateIcmpConfigsTable()
{
    let response = FirewallManagerService.GetIcmpFwConfigs();

    $("#id_fw_icmpconfig_table > tbody").append(response);
    $("#id_fw_icmpconfig_table").show();
}

function UpdateUserInputRulesTable()
{
    let response = FirewallManagerService.ListUserInputRules();

    $('#id_fw_user_input_rules_table > tbody:eq(1) tr:last').before(response);
}

function UpdateUserOutputRulesTable()
{
    let response = FirewallManagerService.ListUserOutputRules();

    $("#id_fw_user_output_rules_table > tbody:eq(1) tr:last").before(response);
}

FirewallManagerService = (function ()
{

    let Public = {

        ListActiveFwTables: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ListActiveFwTables",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);

            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        CheckUndefActiveFwTables: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "CheckUndefActiveFwTables",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ListEthernetInterfaces: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ListEthernetInterfaces",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetSystemMessages: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "GetSystemMessages",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ResetSystemMessages: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ResetSystemMessages",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ResetFaultyConfigs: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ResetFaultyConfigs",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SyncFirewallConfigs: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "SyncFirewallConfigs",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetIcmpFwConfigs: function ()
        {
            let query = $("#id_fw_icmpinput_assign").attr("name") + "=" + encodeURIComponent($("#id_fw_icmpinput_assign").prop("checked"));
            query = query + "&" + $("#id_fw_icmpoutput_assign").attr("name") + "=" + encodeURIComponent($("#id_fw_icmpoutput_assign").prop("checked"));

            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "SetIcmpFwConfigs?" + query,
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetFirewallStatus: function (postData)
        {
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "SetFirewallStatus",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                postData,
                null,
                null);
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        GetSystemMessagesPromise: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(
                Private.dataProviderScriptName + "GetSystemMessages",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null,
                null);
            return AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig);
        },

        SetBasicPortRules: function (postData)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "SetBasicPortRules",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                postData,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetUserInputRules: function (postData)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "SetUserInputRules",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                postData,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetUserOutputRules: function (postData)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "SetUserOutputRules",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                postData,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetFirewallStatus: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "GetFirewallStatus",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ListBasicPortRules: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ListBasicPortRules",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetIcmpFwConfigs: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "GetIcmpFwConfigs",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ListUserInputRules: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ListUserInputRules",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ListUserOutputRules: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dataProviderScriptName + "ListUserOutputRules",
                AjaxInterface.AjaxRequestType.GET,
                AjaxInterface.AjaxRequestDataType.HTML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }

    }

    let Private = {
        dataProviderScriptName: "module/Fwm/FwmDp/"
    }

    return Public;

})();

