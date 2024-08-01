SubPageActive = true;


LdapConfig_ServerConfiguration = {
    Order: 0,
    HostName: "",
    Port: 0,
    Timeout: 10,
    TimeoutUnit: "s",
    TlsEnabled: false,
    UseStartTls: false,
    CipherList: "",
    TrustStore: "",
    BaseDN: "",
    SearchFilter: "",
    BindDN: "",
    BindPassword: "",
    GroupAttributes: [],
    GroupMappings: [],
    Comment: "",
    Uuid: ""
}

LdapConfig_GroupMapping = {
    Group: "",
    LocalUser: ""
}

LdapConfig_ServersConfiguration = [];

LdapConfig_LocalUserRoles = [];

LdapConfig_TotalServesConfigsCtr = 0;
LdapConfig_SelectedServersTableIndex = 0;

USER_MANAGEMENT_DP_SCRIPT_NAME = "module/Um/UserManagementDp/",

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete SubPageActive;
    
    delete LdapConfig_ServerConfiguration;
    delete LdapConfig_GroupMapping;
    
    delete LdapConfig_ServersConfiguration;
    
    delete LdapConfig_LocalUserRoles;
    
    delete LdapConfig_TotalServesConfigsCtr;
    delete LdapConfig_SelectedServersTableIndex;

    delete USER_MANAGEMENT_DP_SCRIPT_NAME;

    $("#id_ldapconfig_addedit_ldapserver_form").removeData('validator');
    $(document).off("LanguageChanged");
}  

$(document).ready(function(){
    
    BuildTrustStoreList();

    UpdateLocalRolesListOptions();

    
    MsDelay(100)
    .then(function()
    {
        BuildLdapServerConfigTable();

        UpdateLdapConfigEnabled();

        Language.UpdateActivePageMessages();

        Validation("#id_ldapconfig_addedit_ldapserver_form");
        $("#id_ldapconfig_addedit_ldapserver_form").validate().settings.ignore = [];
        UpdatePlaceHolders();
        
        // Show page content after page elements are loaded
        $("#id_ldapconfig_page_global_div").show();
    })
    $("#id_div_loader").hide();
    
    $(".pxc-pd-tabs h2 a").click(function(event){
        SwitchLdapServerConfigTab($(this).attr('id'));
        event.preventDefault();
    });
    
    $("#id_ldapconfig_add_ldapserver_btn").click(function(event)
    {
        $("#id_ldapconfig_form_add_server_title").show();
        $("#id_ldapconfig_form_edit_server_title").hide();
        $('#id_ldapconfig_div_modal_addedit_server').show();
        
        // Set sequence
        if(LdapConfig_SelectedServersTableIndex != 0)
        {
            $("#id_ldapconfig_server_config_order_input").val((LdapConfig_SelectedServersTableIndex + 1));
        }
        else
        {
            $("#id_ldapconfig_server_config_order_input").val(LdapConfig_ServersConfiguration.length + 1);
        }
        
        // set ok button attribute "used-option"
        $("#id_ldapconfig_addconfig_ldapserver_ok_button").attr("used-option", "add-server");
        
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_delete_ldapserver_btn").click(function(event)
    {
        if(LdapConfig_SelectedServersTableIndex != 0)
        {
            $("#id_ldapconfig_div_modal_remove_server_confirm").show();
        } 
        
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_moveup_ldapserver_btn").click(function(event)
    {
        MoveServersTableEntryUpDown("up", "id_ldapconfig_servers_table");
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_movedown_ldapserver_btn").click(function(event)
    {
        MoveServersTableEntryUpDown("down", "id_ldapconfig_servers_table");
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_servers_table").on("click", "button.edit-server", function(event){
        
        $("#id_ldapconfig_form_add_server_title").hide();
        $("#id_ldapconfig_form_edit_server_title").show();
        $('#id_ldapconfig_div_modal_addedit_server').show();
        
        $("#id_ldapconfig_addconfig_ldapserver_ok_button").attr("used-option", "edit-server"); 
        if(LdapConfig_ServersConfiguration.length >= $(this).closest("tr").index())
        {
            HandleTableTrSelected('id_ldapconfig_servers_table', $(this).closest("tr").index());
            LdapConfig_SelectedServersTableIndex = $(this).closest("tr").index();
            SetModalLdapServerOptions(LdapConfig_ServersConfiguration[($(this).closest("tr").index() - 1)]);
            Language.UpdateActivePageMessages();
        }
        else
        {
            console.error("Ldap Configuration - Internal Error occured");
        }
        event.stopPropagation();
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_server_config_bindpasswd_confirm_input").on('input',function(e){
        $("#id_ldapconfig_server_config_bindpasswd_input").data("previousValue", null).valid();
    });
    
    $("#id_ldapconfig_server_config_bindpasswd_input").on('input',function(e){
        $("#id_ldapconfig_server_config_bindpasswd_confirm_input").data("previousValue", null).valid();
    });
        
    $("#id_ldapconfig_remove_ldapserver_ok_btn").click(function(event){
        
        let serverConfigsRowsLength = $("#id_ldapconfig_servers_table").find('tbody>tr:not(".exclude")').length - 1;
        let arrayElementIndex = LdapConfig_SelectedServersTableIndex - 1;
        if(    (typeof LdapConfig_SelectedServersTableIndex == 'undefined') 
            || (LdapConfig_SelectedServersTableIndex == 0) 
            || (LdapConfig_SelectedServersTableIndex == (serverConfigsRowsLength + 1)))
        {   
            return;
        }
        $("#id_ldapconfig_servers_table").find('tbody>tr:not(".exclude")').eq(LdapConfig_SelectedServersTableIndex).remove();
        
        LdapConfig_ServersConfiguration = LdapConfig_ServersConfiguration.slice(0, arrayElementIndex).concat(LdapConfig_ServersConfiguration.slice(arrayElementIndex + 1, LdapConfig_ServersConfiguration.length));
        LdapConfig_SelectedServersTableIndex = serverConfigsRowsLength - 1;
        UpdateTableAfterChange('id_ldapconfig_servers_table');
        $("#id_ldapconfig_div_modal_remove_server_confirm").hide();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_remove_ldapserver_cancellation_btn").click(function(event){
        
        $("#id_ldapconfig_div_modal_remove_server_confirm").hide();
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_servers_table button.remove-server").click(function(event){
        
        $("#id_ldapconfig_remove_ldapserver_cancel_btn").hide();
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_server_config_add_groupattr_btn").click(function(event){
        
        AddNewGroupAttributeValue("");
        
        Language.UpdateActivePageMessages();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_server_config_attributes_table").on("click", "button.rm-group-attr", function(event){
        
        $(this).closest("tr").remove();
    
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_server_config_add_group_btn").click(function(event){
        AddNewGroupMappingValue("", "");
        
        Language.UpdateActivePageMessages();
        
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_server_config_groupmapping_table").on("click", "button.rm-group-mapping", function(event){
        
        $(this).closest("tr").remove();
    
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_addconfig_ldapserver_ok_button").click(function(event){
        
        $("#id_ldapconfig_remove_ldapserver_cancel_btn").hide();

        if($("#id_ldapconfig_addedit_ldapserver_form").valid() == true)
        {
            let serverConfig = {};
            serverConfig = GetModalLdapServerOptions();
            
            if($("#id_ldapconfig_addconfig_ldapserver_ok_button").attr("used-option") == "add-server")
            {
                serverConfig.Uuid = "";
                if(LdapConfig_SelectedServersTableIndex == 0)
                {
                    LdapConfig_ServersConfiguration.push(Object.assign({},serverConfig));
                }
                else
                {
                    LdapConfig_ServersConfiguration.splice(LdapConfig_SelectedServersTableIndex, 0, Object.assign({},serverConfig));
                }
                AddNewServersTableEntry(serverConfig);
            }
            else if($("#id_ldapconfig_addconfig_ldapserver_ok_button").attr("used-option") == "edit-server")
            {
                serverConfig.Uuid = LdapConfig_ServersConfiguration[(serverConfig.Order - 1)].Uuid;
                LdapConfig_ServersConfiguration[(serverConfig.Order - 1)] = Object.assign({},serverConfig);
                OverwriteServerTableEntry(serverConfig);
            }
            
            Language.UpdateActivePageMessages();
            
            UpdateTableAfterChange('id_ldapconfig_servers_table');
                    
            $('#id_ldapconfig_div_modal_addedit_server').hide();
            ClearTableConfigModal();
            SwitchLdapServerConfigTab('id_ldapconfig_basic_config_tab_a');
        }
        else
        {
            LdapConfigPageUtilities.AddLdapConfigInvalidInputError();
        }
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_addconfig_ldapserver_cancel_button").click(function(event)
    {
        event.preventDefault();
        
        $('#id_ldapconfig_div_modal_addedit_server').hide();
        
        ClearTableConfigModal();
        LdapConfigPageUtilities.ClearLdapConfigErrorMessages();
        SwitchLdapServerConfigTab('id_ldapconfig_basic_config_tab_a');
        return false;
    });
    
    $(document).on("click", "#id_ldapconfig_servers_table tr:not(.exclude)", function(event) {
        HandleTableTrSelected('id_ldapconfig_servers_table', this.rowIndex);
        LdapConfig_SelectedServersTableIndex = this.rowIndex;
        
        event.preventDefault();
    });
    
    $("#id_ldapconfig_apply_config_button").click(function(event)
    {
        $("#id_div_loader").hide();
        let result = true;
        event.preventDefault();
        $("#id_div_loader").show();
        //let ldapConfigJsonString = JSON.stringify(LdapConfig_ServersConfiguration);
        let ldapConfigXmlString = ConvertServersConfigsToXml();

        let response = LdapService.SetLdapConfiguration(ldapConfigXmlString);
        if(response == null || response.error == true)
        {
            $("#id_div_loader").hide();
            console.error("Failed to set LDAP configuration with error ", response.errorText);
            OnLdapConfigError("id_ldapconfig_sm_config_set_error_span", response.result, response.errorText);
            result = false;
        }
        if(result == true)
        {
            let requestData = "EnableLdap=" + $("#id_ldapconfig_activation_status_checkbox").is(":checked");
            response = LdapService.SetLdapConfigurationEnabled(requestData);
            if(response == null || response.error == true)
            {
                $("#id_div_loader").hide();
                OnLdapConfigError("id_ldapconfig_sm_config_set_error_span", response.result, response.errorText);
                console.error("Failed to set LDAP configuration enabled with error ", response.errorText);
                result = false;
            }
        }

        if(result == true)
        {
            window.location.href = "#extensions/Um/LdapConfiguration.html";
            location.reload();
        }
        else
        {
            $("#id_div_loader").hide();
        }
        
        return false;
    });

    
    $("#id_ldapconfig_discard_config_button").click(function(event)
    {
        $("#id_ldapconfig_discard_modal").show();
        event.preventDefault();
        return false;
    });
    
    $("#id_ldapconfig_discard_ok_btn").click(function(event)
    {
        $("#id_ldapconfig_discard_modal").hide();
        $("#id_div_loader").show();
        event.preventDefault();
        window.location.href = "#extensions/Um/LdapConfiguration.html";
        location.reload();
        return false;
    });
    $("#id_ldapconfig_discard_cancle_btn").click(function(event)
    {
        $("#id_ldapconfig_discard_modal").hide();
        event.preventDefault();
        return false;
    });
    
}); 

document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        // keyCode '27': Esc
        if($("#id_ldapconfig_div_modal_addedit_server").is(":visible"))
        {
            $("#id_ldapconfig_addconfig_ldapserver_cancel_button").click();
        }
        else if($("#id_ldapconfig_div_modal_remove_server_confirm").is(":visible"))
        {
            $("#id_ldapconfig_remove_ldapserver_cancellation_btn").click();
        }
        else if($("#id_ldapconfig_discard_modal").is(":visible"))
        {
            $("#id_ldapconfig_discard_cancle_btn").click();
        }
    }
}

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("Ldap Configuration: Event subscriber on LanguageChanged - Selected language: "+ e.message);
    // Update placeholders
    MsDelay(100)
    .then(function()
    {
        UpdatePlaceHolders();
    });
    
    // Reset validator and reinit validation to change language
    try
    {
        ReloadValidation("#id_ldapconfig_addedit_ldapserver_form");
        $("#id_ldapconfig_addedit_ldapserver_form").validate().settings.ignore = [];
    }catch(e){}
}

function BuildLdapServerConfigTable()
{
    let response = LdapService.GetLdapConfiguration();
    if(response != null)
    {
        try
        {
            LdapConfig_ServersConfiguration = [];
            LdapConfig_ServersConfiguration = ParseServersConfigsFromXml(response);

            $(LdapConfig_ServersConfiguration).each(function(idx, serverConfig) {
                AddNewServersTableEntry(serverConfig)
            });
                    
            UpdateTableAfterChange('id_ldapconfig_servers_table');
            
            console.log("LDAP Configutation - Successfully requested LDAP configuration");
        }
        catch (e) {
            OnLdapConfigError("id_ldapconfig_sm_config_read_error_span", e.Code, e.Text);
        }
    }
    else
    {
        console.log("LDAP Configuration - No Ldap configuration available");
    }
}

function UpdateLdapConfigEnabled()
{
    let response = LdapService.IsLdapConfigurationEnabled();
    if(response.result !== 'undefined')
    {
        $("#id_ldapconfig_activation_status_checkbox" ).prop( "checked", response.result);
        console.log("LDAP configuration - LDAP config enabled", response.result);
    }
}

function UpdatePlaceHolders()
{
    $("#id_ldapconfig_server_config_port_input").attr("placeholder", $("#id_ldapconfig_server_default_port_placeholder").text());
    $("#id_ldapconfig_server_config_truststore_input").attr("placeholder", $("#id_ldapconfig_server_config_truststore_placeholder").text());
}

function AddNewServersTableEntry(serverConfig)
{
    let convServerConfig = {};
    convServerConfig = ConvertToHtmlTags(serverConfig);
    let evenOdd = "odd";
    let currentTableSize = $('#id_ldapconfig_servers_table').find('tbody>tr:not(".exclude")').length;
    let currentRowInputPosition = (LdapConfig_SelectedServersTableIndex == 0)?(currentTableSize - 1):(LdapConfig_SelectedServersTableIndex);

    if(convServerConfig.Order % 2 == 0)
    {
        evenOdd = "odd";
    }
    let portValue = (convServerConfig.Port == 0)?("auto"):convServerConfig.Port;
    let newTableEntryHtml = '<tr class= "' + evenOdd       + ' highlighted">'
                          +     '<td><span style="display: inline-block;               word-wrap:break-word;">' + convServerConfig.Order    + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 300px; word-wrap:break-word;">' + convServerConfig.HostName + '</span></td>'
                          +     '<td><span style="display: inline-block;               word-wrap:break-word;">' + portValue                 + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 200px; word-wrap:break-word;">' + convServerConfig.BaseDN   + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 200px; word-wrap:break-word;">' + convServerConfig.BindDN   + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 300px; word-wrap:break-word;">' + convServerConfig.Comment  + '</span></td>'
                          +     '<td><div class="centered">'
                          +         '<button class="pxc-btn-edit tooltip edit-server" id="id_ldapconfig_edit_server_' + LdapConfig_TotalServesConfigsCtr + '_btn">'
                          +             '<span class="tooltip-text-top c_ldapconfig_edit_server_config"></span>'
                          +         '</button>'
                          +     '</div></td>'
                          + '</tr>';
    $("#id_ldapconfig_servers_table > tbody > tr").eq(currentRowInputPosition).after(newTableEntryHtml);                    
    LdapConfig_TotalServesConfigsCtr++;
}

function OverwriteServerTableEntry(serverConfig)
{
    let convServerConfig = {};
    convServerConfig = ConvertToHtmlTags(serverConfig);
    let evenOdd = "even";
    if(convServerConfig.Order % 2 == 0)
    {
        evenOdd = "odd";
    }
    let newTableEntryHtml = '<tr class= "' + evenOdd       + ' highlighted">'
                          +     '<td><span style="display: inline-block;               word-wrap:break-word;">' + convServerConfig.Order    + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 300px; word-wrap:break-word;">' + convServerConfig.HostName + '</span></td>'
                          +     '<td><span style="display: inline-block;               word-wrap:break-word;">' + convServerConfig.Port     + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 200px; word-wrap:break-word;">' + convServerConfig.BaseDN   + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 200px; word-wrap:break-word;">' + convServerConfig.BindDN   + '</span></td>'
                          +     '<td><span style="display: inline-block; width: 300px; word-wrap:break-word;">' + convServerConfig.Comment  + '</span></td>'
                          +     '<td><div class="centered">'
                          +         '<button class="pxc-btn-edit tooltip edit-server" id="id_ldapconfig_edit_server_' + LdapConfig_TotalServesConfigsCtr + '_btn">'
                          +             '<span class="tooltip-text-top c_ldapconfig_edit_server_config"></span>'
                          +         '</button>'
                          +     '</div></td>'
                          + '</tr>';
    $("#id_ldapconfig_servers_table").find('tbody>tr:not(".exclude")').eq(convServerConfig.Order).replaceWith(newTableEntryHtml);                    
    LdapConfig_TotalServesConfigsCtr++;
}

function MoveServersTableEntryUpDown(direction, tableId)
{
    if((typeof LdapConfig_SelectedServersTableIndex == 'undefined') || (LdapConfig_SelectedServersTableIndex == 0))
    {   
        return;
    }
    //var table = document.getElementById(tableId);
    var rows = document.getElementById(tableId).rows;
    if(direction == 'up')
    {
        if(LdapConfig_SelectedServersTableIndex > 1)
        {
            rows[LdapConfig_SelectedServersTableIndex].parentNode.insertBefore(rows[LdapConfig_SelectedServersTableIndex],rows[LdapConfig_SelectedServersTableIndex - 1]);
            let serverConfigIndex = LdapConfig_SelectedServersTableIndex - 1;
            let temp = LdapConfig_ServersConfiguration[serverConfigIndex];
            LdapConfig_ServersConfiguration[serverConfigIndex]     = Object.assign({},LdapConfig_ServersConfiguration[serverConfigIndex - 1]); 
            LdapConfig_ServersConfiguration[serverConfigIndex - 1] = Object.assign({},temp);
            LdapConfig_SelectedServersTableIndex--;
        }
    }
    
    if(direction == 'down')
    {
        if(LdapConfig_SelectedServersTableIndex + 1 < (rows.length -1))
        {
            rows[LdapConfig_SelectedServersTableIndex].parentNode.insertBefore(rows[LdapConfig_SelectedServersTableIndex + 1],rows[LdapConfig_SelectedServersTableIndex]);
            let serverConfigIndex = LdapConfig_SelectedServersTableIndex - 1;
            let temp = LdapConfig_ServersConfiguration[serverConfigIndex];
            LdapConfig_ServersConfiguration[serverConfigIndex]     = Object.assign({},LdapConfig_ServersConfiguration[serverConfigIndex + 1]); 
            LdapConfig_ServersConfiguration[serverConfigIndex + 1] = Object.assign({},temp);
            LdapConfig_SelectedServersTableIndex++;
        }
    }
    UpdateTableAfterChange(tableId);
}

function AddNewGroupAttributeValue(groupAttribute)
{
    let attributeRowHtml = "";
    let currentAttributesSize = $('#id_ldapconfig_server_config_attributes_table').find('tbody>tr:not(".exclude")').length;
    let attributesNumber = 1;
    
    $('#id_ldapconfig_server_config_attributes_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
        if(parseInt($(row).attr("attr-number")) >= attributesNumber)
        {
            attributesNumber = (parseInt($(row).attr("attr-number")) + 1);
        }
    });
    let attrRowId = 'id_ldapconfig_server_config_groupattr_' + attributesNumber + '_tr';
    attributeRowHtml += '<tr id="' + attrRowId + '" attr-number="' + attributesNumber + '" >'
                     +      '<td attr-number="' + attributesNumber + '" id="id_ldapconfig_server_config_groupattrs_' + attributesNumber + '_val_td">'
                     +           '<input type="text" class="ldap-group-attribute" name="groups_attribute_' + attributesNumber + '" value="' + groupAttribute + '" id="id_ldapconfig_server_config_groupattr_' + attributesNumber + '_input"></input>'
                     +       '</td>'
                     +      '<td attr-number="' + attributesNumber + '" id="id_ldapconfig_server_config_groupattr_' + attributesNumber + '_butts_td">'
                     +          '<div class="centered">'
                     +              '<button class="pxc-btn-remove tooltip rm-group-attr" id="id_ldapconfig_server_config_groupattr_' + attributesNumber + '_rm_btn"><span class="tooltip-text-top c_ldapconfig_remove_attribute"></span></button>'
                     +          '</div>'
                     +      '</td>'
                     +  '</tr>';
    
    $("#id_ldapconfig_server_config_attributes_table > tbody > tr").eq(currentAttributesSize).after(attributeRowHtml);

}

function AddNewGroupMappingValue(ldapGroup, userRole)
{
    var groupMappingRowHtml = "";
    var currentGroupMappingsSize = $('#id_ldapconfig_server_config_groupmapping_table').find('tbody>tr:not(".exclude")').length;
    var mappingNumber = 1;
    
    $('#id_ldapconfig_server_config_groupmapping_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
        if(parseInt($(row).attr("mapping-number")) >= mappingNumber)
        {
            mappingNumber = (parseInt($(row).attr("mapping-number")) + 1);
        }
    });
    var mappingRowId = 'id_ldapconfig_server_config_groumapping_' + mappingNumber + '_group_tr';
    groupMappingRowHtml += '<tr id="' + mappingRowId + '" + mapping-number="' + mappingNumber + '">'
                        +       '<td group-number="' + mappingNumber + '" id="id_ldapconfig_server_config_groupmapping_group_' + mappingNumber + '_td">'
                        +           '<textarea name="groupsmapping_' + mappingNumber + '_group"  class="distinguished-name" value="' + ldapGroup + '" id="id_ldapconfig_server_config_groupmapping_' + mappingNumber + '_group_input" style="resize:vertical; display:inline-block; text-align:left; vertical-align:middle; height: 30px; max-height:75px; width:98%;">' + ldapGroup + '</textarea>'
                        +       '</td>'
                        +       '<td group-number="' + mappingNumber + '" id="id_ldapconfig_server_config_groupmapping_role_' + mappingNumber + '_td">'
                        +           '<select class="pxc-dropdown" name="groupmapping_' + mappingNumber + '_role" style="width:100%;" id="id_ldapconfig_server_config_groupmapping_' + mappingNumber + '_role_select">';
                                        $(LdapConfig_LocalUserRoles).each(function(idx, localUser) {
                                            let selected = (userRole == localUser)?("selected"):("");
                                           
                                            groupMappingRowHtml += '<option value="' + localUser + '"' + selected + '>' + localUser + '</option>';
                                        });
    groupMappingRowHtml +=          '</select>'
                        +       '</td>'
                        +       '<td group-number="' + mappingNumber + '" id="id_ldapconfig_server_config_groupmapping_' + mappingNumber + '_btns_td">'
                        +           '<div class="centered">'
                        +                '<button class="pxc-btn-remove tooltip rm-group-mapping" id="id_ldapconfig_server_config_groupmapping_' + mappingNumber  + '_rm_btn"><span class="tooltip-text-top c_ldapconfig_remove_groupmapping"></span></button>'
                        +            '</div>'
                        +        '</td>'
                        +    '</tr>'
    $("#id_ldapconfig_server_config_groupmapping_table > tbody > tr").eq((currentGroupMappingsSize)).after(groupMappingRowHtml);
}


function GetModalLdapServerOptions()
{
    let ldapServerConfig = {};
    ldapServerConfig = LdapConfig_ServerConfiguration;
    ldapServerConfig.GroupAttributes = [];
    ldapServerConfig.GroupMappings = [];
    
    ldapServerConfig.Order         = parseInt($("#id_ldapconfig_server_config_order_input").val());
    ldapServerConfig.HostName      = $("#id_ldapconfig_server_config_hostname_input").val();
    ldapServerConfig.Port          = $("#id_ldapconfig_server_config_port_input").val();
    ldapServerConfig.Timeout       = $("#id_ldapconfig_server_config_timeout_input").val();
    ldapServerConfig.TimeoutUnit   = $("#id_ldapconfig_server_config_timeout_unit option:selected").text();

    ldapServerConfig.TlsEnabled    = ($("#id_ldapconfig_server_config_tlsmode_select option:selected").val() == "Tls" || $("#id_ldapconfig_server_config_tlsmode_select option:selected").val() == "StartTls")
    ldapServerConfig.UseStartTls   = ($("#id_ldapconfig_server_config_tlsmode_select option:selected").val() == "StartTls");
    
    ldapServerConfig.CipherList    = $("#id_ldapconfig_server_config_cipherlist_input").val();
    ldapServerConfig.TrustStore    = $("#id_ldapconfig_server_config_truststore_input").val();
    ldapServerConfig.BaseDN        = $("#id_ldapconfig_server_config_basedn_input").val();
    ldapServerConfig.SearchFilter  = $("#id_ldapconfig_server_config_searchfilter_input").val();
    ldapServerConfig.BindDN        = $("#id_ldapconfig_server_config_binddn_input").val();
    ldapServerConfig.BindPassword  = $("#id_ldapconfig_server_config_bindpasswd_input").val();
    
    ldapServerConfig.Comment  = $("#id_ldapconfig_server_config_comment_input").val();
    
    $('#id_ldapconfig_server_config_attributes_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
        let attributeNumber = $(row).attr("attr-number");
        ldapServerConfig.GroupAttributes.push($("#id_ldapconfig_server_config_groupattr_" + attributeNumber + "_input").val());
    });
    $('#id_ldapconfig_server_config_groupmapping_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
        let mappingNumber = $(row).attr("mapping-number");
        let groupMapping = LdapConfig_GroupMapping;
        groupMapping.Group     = $("#id_ldapconfig_server_config_groupmapping_" + mappingNumber + "_group_input").val();
        groupMapping.LocalUser = $("#id_ldapconfig_server_config_groupmapping_" + mappingNumber + "_role_select option:selected").text();
        ldapServerConfig.GroupMappings.push(Object.assign({},groupMapping));
    });    
    return ldapServerConfig;
}

function SetModalLdapServerOptions(ldapServerConfig)
{   
    $("#id_ldapconfig_server_config_order_input").val(ldapServerConfig.Order);
    $("#id_ldapconfig_server_config_hostname_input").val(ldapServerConfig.HostName);
    let portValue = (ldapServerConfig.Port == 0)?(""):ldapServerConfig.Port;
    $("#id_ldapconfig_server_config_port_input").val(portValue);
    $("#id_ldapconfig_server_config_timeout_input").val(ldapServerConfig.Timeout);
    
    
    $("#id_ldapconfig_server_config_timeout_unit").val(ldapServerConfig.TimeoutUnit);
    if(ldapServerConfig.TlsEnabled == true && ldapServerConfig.UseStartTls == false)
    {
        $("#id_ldapconfig_server_config_tlsmode_select").val("Tls");
    }
    else if(ldapServerConfig.TlsEnabled == true && ldapServerConfig.UseStartTls == true)
    {
        $("#id_ldapconfig_server_config_tlsmode_select").val("StartTls");
    }
    else
    {
        $("#id_ldapconfig_server_config_tlsmode_select").val("Deactivated");
    }
    
    $("#id_ldapconfig_server_config_cipherlist_input").val(ldapServerConfig.CipherList);

    $("#id_ldapconfig_server_config_truststore_input").val(ldapServerConfig.TrustStore);
    $("#id_ldapconfig_server_config_basedn_input").val(ldapServerConfig.BaseDN);
    $("#id_ldapconfig_server_config_searchfilter_input").val(ldapServerConfig.SearchFilter);
    $("#id_ldapconfig_server_config_binddn_input").val(ldapServerConfig.BindDN);
    $("#id_ldapconfig_server_config_bindpasswd_input").val(ldapServerConfig.BindPassword);
    $("#id_ldapconfig_server_config_bindpasswd_confirm_input").val(ldapServerConfig.BindPassword);
    
    $("#id_ldapconfig_server_config_comment_input").val(ldapServerConfig.Comment);
    
    $(ldapServerConfig.GroupAttributes).each(function(idx, groupAttribute) {
        AddNewGroupAttributeValue(groupAttribute);
    });
    $(ldapServerConfig.GroupMappings).each(function(idx, groupMapping) {
        AddNewGroupMappingValue(groupMapping.Group, groupMapping.LocalUser);
    });

}

function ConvertToHtmlTags(ldapServerConfig)
{
    // Serialize object
    let serverConfigJsonString = JSON.stringify(ldapServerConfig);
    // Remove Html Tags
    serverConfigJsonString = serverConfigJsonString.replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '\\"');
    serverConfigJsonString = serverConfigJsonString.replace(/&/g, "&amp;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let convertedServerConfigs = JSON.parse(serverConfigJsonString);
    
    return convertedServerConfigs;
}

function ConvertFromHtmlTags(ldapServerConfig)
{
    // Serialize object
    let serverConfigJsonString = JSON.stringify(ldapServerConfig);
    // Remove Html Tags
    serverConfigJsonString = serverConfigJsonString.replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '\\"');
    
    let convertedServerConfigs = JSON.parse(serverConfigJsonString);
    
    return convertedServerConfigs;
}

function ConvertServersConfigsToXml()
{
    let serversConfigsXmlString = '<?xml version="1.0" encoding="UTF-8"?>'
                                + '<LdapConfigurationDocument \n'
                                +   'xmlns="http://www.phoenixcontact.com/schema/ldapconfiguration"\n'
                                +   'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
                                +   'xsi:schemaLocation="http://www.phoenixcontact.com/schema/ldapconfiguration"\n'
                                +   'schemaVersion="1.0">';
    $(LdapConfig_ServersConfiguration).each(function(idx, serverConfig) {
        let serverOrder = idx + 1;
        let convServerConfig = Object.assign({},ConvertToHtmlTags(serverConfig));
        if(convServerConfig.Port != 0)
        {
            serversConfigsXmlString += '<LdapServer hostname="' + convServerConfig.HostName + '" port="' + convServerConfig.Port + '" timeout="' + convServerConfig.Timeout + convServerConfig.TimeoutUnit + '" order="' + serverOrder + '" >';
        }
        else
        {
            serversConfigsXmlString += '<LdapServer hostname="' + convServerConfig.HostName + '" timeout="' + convServerConfig.Timeout + convServerConfig.TimeoutUnit + '" order="' + serverOrder + '" >';  
        }
        
        // Security options
        serversConfigsXmlString +=     '<LdapSecurityOptions tlsEnabled="' + convServerConfig.TlsEnabled + '" useStartTls="' + convServerConfig.UseStartTls + '" trustStore="' + convServerConfig.TrustStore + '" cipherList="' + convServerConfig.CipherList + '"/>';
        // Search options
        serversConfigsXmlString +=     '<LdapSearchOptions baseDN="' + convServerConfig.BaseDN + '" searchFilter="' + convServerConfig.SearchFilter + '"/>';
        // Login options
        serversConfigsXmlString +=     '<LdapLoginOptions bindDN="' + convServerConfig.BindDN + '" bindPassword="' + convServerConfig.BindPassword + '"/>';
        // Group attributes
        serversConfigsXmlString += '<GroupAttributes>';
        $(convServerConfig.GroupAttributes).each(function(attr_idx, attribute) {
            serversConfigsXmlString += '<GroupAttribute name="' + attribute + '"/>';
        });
        serversConfigsXmlString += '</GroupAttributes>';
        // Group Mappings
        serversConfigsXmlString += '<GroupMappings>';
        $(convServerConfig.GroupMappings).each(function(mapping_idx, groupMapping) {
            serversConfigsXmlString += '<GroupMapping ldapGroup="' + groupMapping.Group + '" localRole="' + groupMapping.LocalUser + '"/>';
        });
        serversConfigsXmlString += '</GroupMappings>';
        // Internal values
        serversConfigsXmlString += '<InternalValues comment="' + convServerConfig.Comment + '" uuid="' + convServerConfig.Uuid + '"/>'; 
        // End Ldap server config element
        serversConfigsXmlString += '</LdapServer>';
    });
    
    serversConfigsXmlString += '</LdapConfigurationDocument>'

    return serversConfigsXmlString;
}

function ParseServersConfigsFromXml(xmlConfig)
{
    let ldapServerConfigList = [];
    let serverOrder = 1;

    if($(xmlConfig).find("Error").length > 0)
    {
        throw new LdapConfigErrorException($(xmlConfig).find("Error").attr("code"), $(xmlConfig).find("Error").attr("text"), 'id_ldapconfig_sm_config_read_error_span');
    }
    $(xmlConfig).find("LdapServer").each(function(){
        let ldapServerConfig = {};
        ldapServerConfig = LdapConfig_ServerConfiguration;
        ldapServerConfig.Order    = serverOrder;
        ldapServerConfig.HostName = $(this).attr("hostname");
        if(typeof $(this).attr("port") !== 'undefined')
        {
            ldapServerConfig.Port     = $(this).attr("port");
        }
        else
        {
            ldapServerConfig.Port = 0;
        }

        let timeoutAttrMatches = $(this).attr("timeout").match(/(\d+?)(s|m|h)/);
        if(timeoutAttrMatches.length == 3)
        {
            ldapServerConfig.Timeout      = timeoutAttrMatches[1];
            ldapServerConfig.TimeoutUnit  = timeoutAttrMatches[2];
        }
        let securityOptions = $(this).find("LdapSecurityOptions");
        if(typeof securityOptions !== 'undefined')
        {
            if(typeof $(securityOptions).attr("tlsEnabled") !== 'undefined')
            {
                ldapServerConfig.TlsEnabled = ($(securityOptions).attr("tlsEnabled") == "true");
            }
            if(typeof $(securityOptions).attr("useStartTls") !== 'undefined')
            {
                ldapServerConfig.UseStartTls = ($(securityOptions).attr("useStartTls") == "true");
            }
            if(typeof $(securityOptions).attr("trustStore") !== 'undefined')
            {
                ldapServerConfig.TrustStore = $(securityOptions).attr("trustStore");
            }
            if(typeof $(securityOptions).attr("cipherList") !== 'undefined')
            {
                ldapServerConfig.CipherList = $(securityOptions).attr("cipherList");
            }
        }
        let searchOptions = $(this).find("LdapSearchOptions");
        if(typeof searchOptions !== 'undefined')
        {
            if(typeof $(searchOptions).attr("baseDN") !== 'undefined')
            {
                ldapServerConfig.BaseDN = $(searchOptions).attr("baseDN");
            }
            if(typeof $(searchOptions).attr("searchFilter") !== 'undefined')
            {
                ldapServerConfig.SearchFilter = $(searchOptions).attr("searchFilter");
            }
        }
        let loginOptions = $(this).find("LdapLoginOptions");
        if(typeof loginOptions !== 'undefined')
        {
            if(typeof $(loginOptions).attr("bindDN") !== 'undefined')
            {
                ldapServerConfig.BindDN = $(loginOptions).attr("bindDN");
            }
            if(typeof $(loginOptions).attr("bindPassword") !== 'undefined')
            {
                ldapServerConfig.BindPassword = $(loginOptions).attr("bindPassword");
            }
        }
        let internalValues = $(this).find("InternalValues");
        if(typeof internalValues !== 'undefined')
        {
            if(typeof $(internalValues).attr("comment") !== 'undefined')
            {
                ldapServerConfig.Comment = $(internalValues).attr("comment");
            }
            if(typeof $(internalValues).attr("uuid") !== 'undefined')
            {
                ldapServerConfig.Uuid = $(internalValues).attr("uuid");
            }
        }
        let groupAttributes = $(this).find("GroupAttributes");
        if(typeof groupAttributes !== 'undefined')
        {
            ldapServerConfig.GroupAttributes = [];
            $(groupAttributes).find("GroupAttribute").each(function(idx, attributeItem){
                let attributeName = $(attributeItem).attr("name");
                ldapServerConfig.GroupAttributes.push(attributeName);
            });
        }
        let groupMappings = $(this).find("GroupMappings");
        if(typeof groupMappings !== 'undefined')
        {
            ldapServerConfig.GroupMappings = [];
            $(groupMappings).find("GroupMapping").each(function(idx, mappingItem){
                let groupMapping = {};
                groupMapping.Group     = $(mappingItem).attr("ldapGroup");
                groupMapping.LocalUser = $(mappingItem).attr("localRole");
                ldapServerConfig.GroupMappings.push(Object.assign({},groupMapping));
            });
        }
        ldapServerConfigList.push(Object.assign({},ldapServerConfig));
        delete(ldapServerConfig);
        serverOrder++;
    });

    return ldapServerConfigList;
}

function ClearTableConfigModal()
{
    var addeditServerForm = document.getElementById('id_ldapconfig_addedit_ldapserver_form');
    addeditServerForm.reset();
        
    $("#id_ldapconfig_server_config_order_input").val("4");
    $("#id_ldapconfig_server_config_hostname_input").val("");
    $("#id_ldapconfig_server_config_port_input").val("");
    $("#id_ldapconfig_server_config_timeout_input").val("10");
    $("#id_ldapconfig_server_config_tlsmode_select").val("StartTls").change();
    $("#id_ldapconfig_server_config_cipherlist_input").val("");
    $("#id_ldapconfig_server_config_truststore_input").val("ldap");
    $("#id_ldapconfig_server_config_basedn_input").val("");
    $("#id_ldapconfig_server_config_searchfilter_input").val("");
    $("#id_ldapconfig_server_config_binddn_input").val("");
    $("#id_ldapconfig_server_config_bindpasswd_input").val("");
    
    $('#id_ldapconfig_server_config_attributes_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
        $(row).remove();
    });
    $('#id_ldapconfig_server_config_groupmapping_table').find('tbody>tr:not(".exclude")').each(function(idx, row) {
        $(row).remove();
    });
    UpdatePlaceHolders();
    
    $('#id_ldapconfig_addedit_ldapserver_form').validate().resetForm();
    $("#id_ldapconfig_addedit_ldapserver_form").validate().settings.ignore = [];
}


function BuildTrustStoreList()
{
    // request trust stores:
    let response = LdapService.ListTrustStoresNames();
    if(response.error == false)
    {
        $(response.result).each(function(idx, trustStore) {
            $("#id_ldapconfig_truststore_list").append("<option>" + trustStore + "</option>"); 
        });
    }
    else
    {
        console.log("Failed to request Trust Stores list with error " + response.errorText);
    }
}

function UpdateLocalRolesListOptions()
{
    // request trust stores:
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                                                            USER_MANAGEMENT_DP_SCRIPT_NAME + "GetUserManagementConfig",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            "",
                                                            null);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    LdapConfig_LocalUserRoles = [];
    
    if(response.error == false)
    {
        LdapConfig_LocalUserRoles = response.result.allUserRoles;
    }
    else
    {
        console.log("Failed to request local user list");
    }
}


function OnConnectionError(error)
{
    $("#id_ldapconfig_sm_messages_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    alert($("#id_ldapconfig_sm_connection_error_span").text + " " + error);
}

function OnLdapConfigError(SpanId, Code, Text)
{
    $("#id_ldapconfig_sm_messages_div span:not('.exclude')").each(function(){
        $(this).hide();
    });
    alert($("#" + SpanId).text() + "\n" + $("#id_ldapconfig_sm_error_code_span").text() + Code + "\n" + $("#id_ldapconfig_sm_error_message_span").text() + Text);
}


function SwitchLdapServerConfigTab(currentObjectId)
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

function HandleTableTrSelected(tableId, rowIndex)
{
   var table = document.getElementById(tableId);
   for(var i = 1; i < table.rows.length - 1 ; i++)
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

function UpdateTableAfterChange(tableId)
{
    let table = $('#' + tableId);
    $('#' + tableId + ' > tbody  > tr:not(.exclude)').each(function(index, tr) { 
        if(index != 0)
        {
            tr.cells[0].innerHTML = (index);
        }
        if($(tr).hasClass("selected") == false)
        {
            if((index % 2) == 0 )
            {
               if($(tr).hasClass("odd") == true)
               {
                   $(tr).removeClass("odd");
               }
               if($(tr).hasClass("even") == false)
               {
                   $(tr).addClass("even");
               }
            }
            else
            {
               if($(tr).hasClass("even") == true)
               {
                   $(tr).removeClass("even");
               }
               if($(tr).hasClass == false)
               {
                   $(tr).addClass("odd");
               }
            }
        }
    });
    
    $(LdapConfig_ServersConfiguration).each(function(index, serverConfiguration) {
         serverConfiguration.Order = (index + 1);
    });
}

LdapConfigPageUtilities = (function () {
    // Public Part
    var Public = {
        AddLdapConfigErrorMessage: function(containerId, errorLanTag, errorText, showAlert)
        {
            let messageHtml = '<div class="c_ldapconfig_error_message_box" style="margin: 3px 0;">'
                            +      '<div class="pxc-error-general-msg-wrp"><div class="pxc-error-msg">'
                            +         '<div class="pxc-exclamation"><div>!</div></div>'
                            +         '<span class="pxc-msg-txt ' + errorLanTag + '" id="id_ldapconfig_error_' + errorLanTag + '_span"></span>'
                            +         '<span class="c_config_error_message" style="display: inline-block; margin: 0 24px;"></span>'
                            +      '</div>'
                            + '</div></div>';
            let errorMessage = $(messageHtml).hide();
            $("#" + containerId).prepend(errorMessage);
            $("#" + containerId).find("div.c_ldapconfig_error_message_box").fadeIn("slow");

            
            Language.UpdateActivePageMessages();
            
            if(showAlert == true)
            {             
                alert($("#" + containerId + "_span").text() + ": " + errorText);
            }
        },
        AddLdapConfigInvalidInputError: function()
        {
            LdapConfigPageUtilities.ClearLdapConfigErrorMessages();
            LdapConfigPageUtilities.AddLdapConfigErrorMessage(Private.basicConfigMessagesContainerId, Private.ldapConfigInvalidInput, "-", false);
            LdapConfigPageUtilities.AddLdapConfigErrorMessage(Private.enhancedConfigMessagesContainerId, Private.ldapConfigInvalidInput, "-", false);
        },
        ClearLdapConfigErrorMessages: function()
        {
            $("#" + Private.basicConfigMessagesContainerId).find("div.c_ldapconfig_error_message_box").remove();
            $("#" + Private.enhancedConfigMessagesContainerId).find("div.c_ldapconfig_error_message_box").remove();
        }
        
    }
    
    // Private Part
    var Private = {
        basicConfigMessagesContainerId: "id_ldapconfig_basic_messages_div",
        enhancedConfigMessagesContainerId: "id_ldapconfig_enhanced_messages_div",
        ldapConfigInvalidInput: "c_ldapconfig_config_invalid_message"
    }
    
return Public;
})();


function LdapConfigErrorException(errorCode, errorText, errorSpanId)
{
    this.SpanId = errorSpanId;
    this.Code = errorCode;
    this.Text = errorText;
}

LdapService = (function () {

    let Public = {

        SetLdapConfiguration: function (ldapConfigXmlString)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "SetLdapConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                ldapConfigXmlString,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        SetLdapConfigurationEnabled: function (requestData)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "SetLdapConfigurationEnabled",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData,
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        GetLdapConfiguration: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetLdapConfiguration",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.XML,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        IsLdapConfigurationEnabled: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "IsLdapConfigurationEnabled",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        },

        ListTrustStoresNames: function ()
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "ListTrustStoresNames",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            return AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        }

    }

    let Private = {
        dpScriptName: "module/Um/LdapDp/"
    }

    return Public;

})();
