
SubPageActive = true;

LIST_FILE_FORMAT_FILTER     = /(\.crt|\.pem)$/i;
KEY_PAIR_FILE_FORMAT_FILTER = /(\.pem)$/i;
LIST_FILE_VALID_FORMATS = ".crt / .pem";
KEY_PAIR_FILE_VALID_FORMATS = ".pem";

listFileTextVal     = "";
keypairFileTextVal  = "";

cer_selectedStoreTabID = localStorage.getItem("StoreConfiTabKey");

textInputInvalidCharsString = ' & / \\ \' "';
textInputInvalidCharacters = '&/\\\'"';

IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME = "module/CertificateAuthentication/IdentityStoreManager/";
TRUST_STORE_DATA_PROVIDER_SCRIPT_NAME    = "module/CertificateAuthentication/TrustStoreManager/";
CERTIFICATES_PAGE_LOCATION_REFERENCE     = "#extensions/CertificateAuthentication/Certificates.html";

function CleanUpPageData()
{
    document.removeEventListener('keyup', CloseModalWithEsc);

    delete SubPageActive;

    delete LIST_FILE_FORMAT_FILTER;
    delete KEY_PAIR_FILE_FORMAT_FILTER;
    delete LIST_FILE_VALID_FORMATS;
    delete KEY_PAIR_FILE_VALID_FORMATS;

    delete listFileTextVal;
    delete keypairFileTextVal;

    delete cer_selectedStoreTabID;

    delete textInputInvalidCharsString;
    delete textInputInvalidCharacters;
    
    // Clear Validators
    CleanUpValidations();
    $(document).off("LanguageChanged");
}  

$(document).ready(function(){
    $("#id_div_loader").show();
    
    RestoreSelectedConfigTabs();
    
    InitInputValidations();
    
    $("#id_cer_identitystores_table").show();
    $("#id_cer_truststores_table").show();
    
    $("#id_cer_page_div").show();
    
    // Show page content after page elements are loaded
    $("#id_certificates_page_global_div").show();
    
    setTimeout(BuildCertificateStoresTables, 20);

    
    $(".pxc-pd-tabs h2 a").click(function(event){
        
        let currentObjectId = $(this).attr('id');
        
        SwitchCerStoresConfigTab(currentObjectId); 
        
        // check Stores tabs
        if(currentObjectId == 'id_cer_trust_stores_tab')
        {
            cer_selectedStoreTabID = 'id_cer_trust_stores_tab';
        }
        else if(currentObjectId == 'id_cer_identity_stores_tab')
        {
            cer_selectedStoreTabID = 'id_cer_identity_stores_tab';
        }
        
        localStorage.setItem("StoreConfiTabKey", cer_selectedStoreTabID);
        event.preventDefault();
    });

    $("#id_cer_add_truststore_form").submit(function(event)
    {
        event.preventDefault();
        let result = $("#id_cer_add_truststore_form").valid();
        if(result == false)
        {
            return false;
        }
        $("#id_div_loader").show();
        let query =   $("#id_cer_add_truststore_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_add_truststore_input").val());

        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(TRUST_STORE_DATA_PROVIDER_SCRIPT_NAME + "AddStore?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        result = response.result;
        if(result == true)
        {
            location.reload();
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $('#id_cer_div_modal_add_truststore').hide();
            let inputForm = document.getElementById('id_cer_add_truststore_form');
            inputForm.reset();
        }
    });
    
    $("#id_cer_remove_truststore_form").submit(function(event)
    {
        
        let query =   $("#id_cer_remove_truststore_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_remove_truststore_input").val());

        $("#id_div_loader").show();
        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(TRUST_STORE_DATA_PROVIDER_SCRIPT_NAME + "DeleteStore?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        result = response.result;
        if(result == true)
        {
            location.reload();
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;            
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $("#id_div_modal_remove_trust_store").hide();
            let inputForm = document.getElementById('id_cer_remove_truststore_form');
            inputForm.reset();
        }
        event.preventDefault();
        
    });
    
    $("#id_cer_rename_truststore_form").submit(function(event)
    {
        event.preventDefault();
        var result = $("#id_cer_rename_truststore_form").valid();
        if(result == false)
        {
            return 0;
        }
        var query =   $("#id_cer_rename_truststore_current_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_rename_truststore_current_input").val()) + "&"
                       + $("#id_cer_rename_truststore_new_textinput").attr('name') + "="
                       + encodeURIComponent($("#id_cer_rename_truststore_new_textinput").val());
        $("#id_div_loader").show();

        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(TRUST_STORE_DATA_PROVIDER_SCRIPT_NAME + "RenameStore?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        result = response.result;
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $("#id_div_modal_rename_trust_store").hide();
            var inputForm = document.getElementById('id_cer_rename_truststore_form');
            inputForm.reset();
        }
    });
    
    $("#id_cer_add_list_form").submit(function(event)
    {
        event.preventDefault();
        
        var result = $("#id_cer_add_list_form").valid();
        if(result == false)
        {
            return false;
        }
        if($(event.target).find("button:focus").attr('id') == "id_cer_cert_file_browse_button")
        {
            return;
        }
        var postData = "";
        var queryString = "";
        var inputMethod = $('#id_cer_add_input_method_select').val();
        $("#id_div_loader").show();
        if(inputMethod == 'FILE')
        {            
            queryString =   $("#id_cer_add_list_store_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_add_list_store_input").val()) + "&"
                       + $("#id_cer_add_list_type_select").attr('name') + "="
                       + encodeURIComponent($("#id_cer_add_list_type_select").val());

            postData = listFileTextVal;
        }
        else if(inputMethod == 'TEXT')
        {
            if($("#id_cer_add_list_textarea").val().length == 0)
            {
                alert($("#id_cer_requesterror_empty_cert_text_field").text());
                result = false;
            }
            else
            {
                queryString =   $("#id_cer_add_list_store_input").attr('name') + "="
                           + encodeURIComponent($("#id_cer_add_list_store_input").val()) + "&"
                           + $("#id_cer_add_list_type_select").attr('name') + "="
                           + encodeURIComponent($("#id_cer_add_list_type_select").val());

                postData = $("#id_cer_add_list_textarea").val();
            }
        }
        
        if(result == true)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(TRUST_STORE_DATA_PROVIDER_SCRIPT_NAME + "AddList?" + queryString,
                                                                AjaxInterface.AjaxRequestType.POST,
                                                                AjaxInterface.AjaxRequestDataType.JSON,
                                                                postData,
                                                                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        
            result = response.result;
        }
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $('#id_cer_div_modal_add_list').hide();
            $("#id_cer_cert_file_browse_button").show();
            $("#id_cer_cert_file_text").show();
            
            $("#id_cer_add_list_textarea_div").hide();
            $("#id_cer_form_add_list_add_button").hide();
            let addListForm = document.getElementById('id_cer_add_list_form');
            addListForm.reset();
        }
    });
    
    $("#id_cer_remove_list_form").submit(function(event)
    {
        let result = false;
        let query =  $("#id_cer_remove_list_truststore_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_remove_list_truststore_input").val()) + "&"
                       + $("#id_cer_remove_list_type_select").attr('name') + "="
                       + encodeURIComponent($("#id_cer_remove_list_type_select").val()) + "&"
                       + $("#id_cer_remove_list_id_textinput").attr('name') + "="
                       + encodeURIComponent($("#id_cer_remove_list_id_textinput").val());

        $("#id_div_loader").show();
        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(TRUST_STORE_DATA_PROVIDER_SCRIPT_NAME + "DeleteList?" + query, 
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        result = response.result;
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $('#id_div_modal_remove_list').hide();
            $("#id_div_loader").hide();
            let deleteCertForm = document.getElementById('id_cer_remove_list_form');
            deleteCertForm.reset();
        }
        event.preventDefault();
    });

    $("#id_cer_add_identitystore_form").submit(function(event)
    {
        event.preventDefault();
        if($(event.target).find("button:focus").attr('id') == "id_cer_keypair_file_browse_button")
        {
            return;
        }
        if($("#id_cer_add_identitystore_form").valid() == false)
        {
            return;
        }
        let result = true;
        let createStore = $("#id_cer_form_add_identitystore_title").is(":visible");
        keySource = $('#id_cer_add_identitystore_key_source_select').val();
        $("#id_div_loader").show();
        // Create Identity Store if Add Store Modal Form is not used for editing KeyPair
        if(createStore == true)
        {
            result = addIdentityStore();
        }
        // Check Key Pair Source 
        if(keySource == 'GENERATE')
        {
            // Generate Key Pair
            if(result == true)
            {
                setTimeout(function() { generateKeyPair(createStore); }, 30);
            }
            else
            {
                keySource = 'None';
            }
            
        }
        else if(keySource == 'ENTER')
        {
            result = setKeyPair();
            if(result == false && createStore == true)
            {
                deleteIdentityStore();
            }
        }
        if(keySource != 'GENERATE')
        {
            if(result == true)
            {
                location.reload(); 
                window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
            }
            else
            {
                $("#id_div_loader").hide();
                $('#id_cer_div_modal_add_identitystore').hide();
                var addIdentityStoreForm = document.getElementById('id_cer_add_identitystore_form');
                addIdentityStoreForm.reset();
            }
        }
        event.preventDefault();
    });
    
    $("#id_cer_remove_identitystore_form").submit(function(event)
    {
        
        let query =   $("#id_cer_remove_identitystore_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_remove_identitystore_input").val());

        $("#id_div_loader").show();
        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "DeleteStore?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        result = response.result;
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $("#id_div_modal_remove_identity_store").hide();
            let inputForm = document.getElementById('id_cer_remove_identitystore_form');
            inputForm.reset();
        }
        
        event.preventDefault();
    });
    
    $("#id_cer_rename_identitystore_form").submit(function(event)
    {
        event.preventDefault();
        
        let result = $("#id_cer_rename_identitystore_form").valid();
        if(result == false)
        {
            return;
        }
        let query =   $("#id_cer_rename_identitystore_current_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_rename_identitystore_current_input").val()) + "&"
                       + $("#id_cer_rename_identitystore_new_textinput").attr('name') + "="
                       + encodeURIComponent($("#id_cer_rename_identitystore_new_textinput").val());
        $("#id_div_loader").show();

        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "RenameStore?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        result = response.result;
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $("#id_div_modal_rename_identity_store").hide();
            let renameStoreForm = document.getElementById('id_cer_rename_identitystore_form');
            renameStoreForm.reset();
        }
    });
    
    $("#id_cer_add_idstore_key_cert_form").submit(function(event)
    {
        event.preventDefault();
        if($(event.target).find("button:focus").attr('id') == "id_cer_idstore_key_cert_file_browse_button")
        {
            return;
        }
        if($("#id_cer_add_idstore_key_cert_form").valid() == false)
        {
            return;
        }
        let result = true;
        let postData = "";
        let query = "";
        let keyCertInputMethode = $('#id_cer_idstore_key_cert_input_method_select').val();
        if(keyCertInputMethode == 'FILE')
        {
            query =   $("#id_cer_add_idstore_key_cert_store_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_add_idstore_key_cert_store_input").val());

            postData = listFileTextVal;
        }
        else if (keyCertInputMethode == 'TEXT')
        {
            if($("#id_cer_idstore_add_key_cert_textarea").val().length > 0)
            {
                query =   $("#id_cer_add_idstore_key_cert_store_input").attr('name') + "="
                           + encodeURIComponent($("#id_cer_add_idstore_key_cert_store_input").val());

                postData = $("#id_cer_idstore_add_key_cert_textarea").val();
            }
            else
            {
                alert($("#id_cer_requesterror_empty_cert_text_field").text());
                result = false;
            }
        }
        let response = null;
        if(result == true)
        {
            $("#id_div_loader").show();
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "SetCertificate?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            postData, null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            result = response.result;
        }
        
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $("#id_cer_div_modal_set_idstore_key_cert").hide();
            var setCertForm = document.getElementById('id_cer_add_idstore_key_cert_form');
            setCertForm.reset();
        }
        
    });
    
    $("#id_cer_idstore_remove_list_form").submit(function(event)
    {
        let result = false;
        let query =  $("#id_cer_remove_list_idstore_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_remove_list_idstore_input").val()) + "&"
                       + $("#id_cer_idstore_remove_list_type_select").attr('name') + "="
                       + encodeURIComponent($("#id_cer_idstore_remove_list_type_select").val()) + "&"
                       + $("#id_cer_idstore_remove_list_id_textinput").attr('name') + "="
                       + encodeURIComponent($("#id_cer_idstore_remove_list_id_textinput").val());
        $("#id_div_loader").show();

        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "DeleteFromList?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        result = response.result;
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $("#id_div_loader").hide();
            $("#id_div_modal_idstore_remove_list").hide();
            let deleteCertForm = document.getElementById('id_cer_idstore_remove_list_form');
            deleteCertForm.reset();
        }
        
        event.preventDefault();
    });
    
    $("#id_cer_add_idstore_issuerlist_form").submit(function(event)
    {
        event.preventDefault();
        if($(event.target).find("button:focus").attr('id') == "id_cer_idstore_issuerlist_file_browse_button")
        {
            return false;
        }
        if($("#id_cer_add_idstore_issuerlist_form").valid() == false)
        {
            return false;
        }
        
        $("#id_div_loader").show();
        let result = true;
        let postData = "";
        let query = $("#id_cer_issuerlist_idstore_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_issuerlist_idstore_input").val());

        let inputMethod = $('#id_cer_isstore_add_input_method_select').val();
        
        if(inputMethod == 'FILE')
        {
            postData = listFileTextVal;
        }
        else if(inputMethod == 'TEXT')
        {
            if($("#id_cer_idstore_add_issuerlist_textarea").val().length == 0)
            {
                alert($("#id_cer_requesterror_empty_cert_text_field").text());
                result = false;
            }
            else
            {
                postData = $("#id_cer_idstore_add_issuerlist_textarea").val();
            }
            
        }
        let response = null;
        if(result == true)
        {
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "AddIssuerList?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            postData,
                                                            null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            result = response.result;
        }
        
        if(result == true)
        {
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
        else
        {
            alert(CheckControlResponseError(response.errorText));
            $('#id_cer_div_modal_add_list').hide();
            $("#id_cer_cert_file_browse_button").show();
            $("#id_cer_cert_file_text").show();
            $("#id_cer_add_list_textarea_div").hide();
            $("#id_cer_form_add_list_add_button").hide();
            $("#id_cer_div_modal_add_idstore_issuer_cert").hide();
            let addListForm = document.getElementById('id_cer_add_idstore_issuerlist_form');
            addListForm.reset();
            $("#id_div_loader").hide();
        }
    });
    
    $("#id_cer_form_add_truststore_cancel_button").click(function(event)
    {
        $('#id_cer_div_modal_add_truststore').hide();
        let inputForm = document.getElementById('id_cer_add_truststore_form');
        inputForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_rename_truststore_cancel_button").click(function(event)
    {
        $('#id_div_modal_rename_trust_store').hide();
        let inputForm = document.getElementById('id_cer_rename_truststore_form');
        inputForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_remove_truststore_cancel_button").click(function(event)
    {
        $('#id_div_modal_remove_trust_store').hide();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_add_list_cancel_button").click(function(event)
    {
        $('#id_cer_div_modal_add_list').hide();
        $("#id_cer_cert_file_browse_button").show();
        $("#id_cer_cert_file_text").show();
        $("#id_cer_add_list_textarea_div").hide();
        $("#id_cer_form_add_list_add_button").hide();
        listFileTextVal = "";
        let inputForm = document.getElementById('id_cer_add_list_form');
        inputForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_remove_list_cancel_button").click(function(event)
    {
        $('#id_div_modal_remove_list').hide();
        let inputForm = document.getElementById('id_cer_remove_list_form');
        inputForm.reset();
        
        event.preventDefault();
    });
    
    
    $("#id_cer_form_details_ok_button").click(function(event)
    {
        $('#id_cer_div_modal_list_details').hide();
        let inputForm = document.getElementById('id_cer_show_list_details_form');
        inputForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_add_identitystore_cancel_button").click(function(event)
    {
        $("#id_cer_keypair_file_browse_button").show();
        $("#id_cer_keypair_file_text").show();
        
        $('#id_cer_add_keypair_textarea_div').hide();
        
        $('#id_cer_div_modal_add_identitystore').hide();
        //$('#id_cer_form_edit_keypair_save_button').hide();
        $('#id_cer_form_identitystore_add_button').hide();
        let inputForm = document.getElementById('id_cer_add_identitystore_form');
        inputForm.reset();
        
        event.preventDefault();
    });
   
    $("#id_cer_form_remove_identitystore_cancel_button").click(function(event)
    {
        
        $('#id_div_modal_remove_identity_store').hide();
        let removeStoreForm = document.getElementById('id_cer_remove_identitystore_form');
        removeStoreForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_rename_identitystore_cancel_button").click(function(event)
    {
        $('#id_div_modal_rename_identity_store').hide();
        let renameStoreForm = document.getElementById('id_cer_rename_identitystore_form');
        renameStoreForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_key_pair_details_ok_button").click(function(event)
    {
        $('#id_div_modal_key_pair_Details').hide();
        let keypairForm = document.getElementById('id_cer_key_pair_details_form');
        keypairForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_add_issuerlist_cancel_button").click(function(event)
    {
        $('#id_cer_div_modal_add_idstore_issuer_cert').hide();
        $("#id_cer_idstore_issuerlist_file_browse_button").show();
        $("#id_cer_idstore_issuerlist_file_text").show();
        $("#id_cer_idstore_add_issuerlist_textarea_div").hide();
        $("#id_cer_idstore_add_issuerlist_add_button").hide();
        listFileTextVal = "";
        let addIssuerListForm = document.getElementById('id_cer_add_idstore_issuerlist_form');
        addIssuerListForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_form_add_key_cert_cancel_button").click(function(event)
    {
        $('#id_cer_div_modal_set_idstore_key_cert').hide();
        let addStoreForm = document.getElementById('id_cer_add_idstore_key_cert_form');
        addStoreForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_idstore_form_remove_list_cancel_button").click(function(event)
    {
        $('#id_div_modal_idstore_remove_list').hide();
        let deleteCertForm = document.getElementById('id_cer_idstore_remove_list_form');
        deleteCertForm.reset();
        
        event.preventDefault();
    });
    
    $("#id_cer_idstore_add_key_cert_gen_button").click(function(event)
    {
        $("#id_div_loader").show();
        let query =   $("#id_cer_add_identitystore_input").attr('name') + "="
                       + encodeURIComponent($("#id_cer_add_idstore_key_cert_store_input").val());
        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "GenerateCSR?" + query, 
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.HTML,
                                                            null, null);
        let csrValue = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
        let filename = 'request.csr';
        $("#id_div_loader").hide();
        saveToFile(filename, 'mime_type', csrValue);
        
        event.preventDefault();
    });
    
}); 


document.addEventListener('keyup', CloseModalWithEsc);

function CloseModalWithEsc(event)
{
    if(event.keyCode == 27) {
        console.log("### visible", $("#id_cer_div_modal_add_truststore").is(":visible"))
        if($("#id_cer_div_modal_add_truststore").is(":visible"))
        {
            $("#id_cer_form_add_truststore_cancel_button").click();
        }
        else if($("#id_div_modal_remove_trust_store").is(":visible"))
        {
            $("#id_cer_form_remove_truststore_cancel_button").click();
        }
        else if($("#id_div_modal_rename_trust_store").is(":visible"))
        {
            $("#id_cer_form_rename_truststore_cancel_button").click();
        }
        else if($("#id_cer_div_modal_add_list").is(":visible"))
        {
            $("#id_cer_form_add_list_cancel_button").click();
        }
        else if($("#id_div_modal_remove_list").is(":visible"))
        {
            $("#id_cer_form_remove_list_cancel_button").click();
        }
        else if($("#id_cer_div_modal_list_details").is(":visible"))
        {
            $("#id_cer_form_details_ok_button").click();
        }
        else if($("#id_cer_div_modal_add_identitystore").is(":visible"))
        {
            $("#id_cer_form_add_identitystore_cancel_button").click();
        }
        else if($("#id_div_modal_remove_identity_store").is(":visible"))
        {
            $("#id_cer_form_remove_identitystore_cancel_button").click();
        }
        else if($("#id_div_modal_rename_identity_store").is(":visible"))
        {
            $("#id_cer_form_rename_identitystore_cancel_button").click();
        }
        else if($("#id_div_modal_key_pair_Details").is(":visible"))
        {
            $("#id_cer_form_key_pair_details_ok_button").click();
        }
        else if($("#id_cer_div_modal_add_idstore_issuer_cert").is(":visible"))
        {
            $("#id_cer_form_add_issuerlist_cancel_button").click();
        }
        else if($("#id_cer_div_modal_set_idstore_key_cert").is(":visible"))
        {
            $("#id_cer_form_add_key_cert_cancel_button").click();
        }
        else if($("#id_div_modal_idstore_remove_list").is(":visible"))
        {
            $("#id_cer_idstore_form_remove_list_cancel_button").click();
        }
    }
}

function BuildCertificateStoresTables()
{
    // Trust Stores table
    BuildTrustStoresTable();
    
    // Identity Stores table
    BuildIdentityStoresTable();
    
    $("#id_div_loader").hide();
}

function BuildTrustStoresTable()
{

    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(TRUST_STORE_DATA_PROVIDER_SCRIPT_NAME + "ListStoresTableContent",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.HTML,
                                                            null, null);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    
    $('#id_cer_truststores_table tr:last').before(response);
    
    Language.UpdateActivePageMessages();
}

function BuildIdentityStoresTable()
{
    
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "ListStoresTableContent",
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.HTML,
                                                            null, null);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    
    $('#id_cer_identitystores_table tr:last').before(response);
    
    Language.UpdateActivePageMessages();
}


function DecodeHtmlEntities(data)
{
    let decodedData = data.replace(/\\</g, "<");
    decodedData = decodedData.replace(/\\>/g, ">");
    decodedData = decodedData.replace(/\\;/g, ";");
    decodedData = decodedData.replace(/\\"/g, '\"');
    decodedData = decodedData.replace(/\\'/g, "\'");
    decodedData = decodedData.replace(/\\&/g, '&');
    return decodedData;
}

$(document).on("LanguageChanged", LanguageChangedHandler);

// LanguageChanged event handler
function LanguageChangedHandler(e) {
    
    console.log("Certificates: Event subscriber on LanguageChanged - Selected language: "+ e.message);
    
    ReloadInputValidations();
}

function InitInputValidations()
{
    // Init Validations
    Validation("#id_cer_add_identitystore_form");
    Validation("#id_cer_add_idstore_key_cert_form");
    Validation("#id_cer_rename_identitystore_form");
    Validation("#id_cer_add_idstore_issuerlist_form");
    
    Validation("#id_cer_add_truststore_form");
    Validation("#id_cer_rename_truststore_form");
    Validation("#id_cer_add_list_form");
}

function ReloadInputValidations()
{
    try
    {
        // Reset validator and reinit validation to change language
        ReloadValidation("#id_cer_add_identitystore_form");
        ReloadValidation("#id_cer_add_idstore_key_cert_form");
        ReloadValidation("#id_cer_rename_identitystore_form");
        ReloadValidation("#id_cer_add_idstore_issuerlist_form");
        
        ReloadValidation("#id_cer_add_truststore_form");
        ReloadValidation("#id_cer_rename_truststore_form");
        ReloadValidation("#id_cer_add_list_form");
    }catch(e){}
    
}

function CleanUpValidations()
{
    $("#id_cer_add_identitystore_form").removeData('validator');
    $("#id_cer_add_idstore_key_cert_form").removeData('validator');
    $("#id_cer_rename_identitystore_form").removeData('validator');
    $("#id_cer_add_idstore_issuerlist_form").removeData('validator');
    
    $("#id_cer_add_truststore_form").removeData('validator');
    $("#id_cer_rename_truststore_form").removeData('validator');
    $("#id_cer_add_list_form").removeData('validator');
}

function ShowModalAddTrustStore()
{
    $("#id_cer_div_modal_add_truststore").show();
    $("#id_cer_add_truststore_input").focus();
    event.preventDefault();
}

function ShowModalRemoveTrustStore(elementObject)
{
    $("#id_cer_remove_truststore_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_div_modal_remove_trust_store").show();
    event.preventDefault();
}

function ShowModalRenameTrustStore(elementObject)
{
    $("#id_cer_rename_truststore_current_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_div_modal_rename_trust_store").show();
    $("#id_cer_rename_truststore_new_textinput").focus();
    event.preventDefault();
}

function ShowModalAddCertificate(elementObject)
{
    $("#id_cer_form_add_certificate_title").show();
    $("#id_cer_add_cert_content_lable").show();
    $("#id_cer_add_crl_content_lable").hide();
    $("#id_cer_form_add_truststore_crl_title").hide();
    $("#id_cer_form_add_crl_title").hide();
        
    $("#id_cer_add_list_type_select option[value='TrustList']").show()
    $("#id_cer_add_list_type_select option[value='TrustList']").prop('selected', true);
    $("#id_cer_add_list_type_select option[value='IssuerList']").show()
    $("#id_cer_add_list_type_select option[value='TrustCrlList']").hide()
    $("#id_cer_add_list_type_select option[value='TrustCrlList']").prop('selected', false);
    $("#id_cer_add_list_type_select option[value='IssuerCrlList']").hide()
    $("#id_cer_add_cert_type_l").show();
    $("#id_cer_add_crl_type_l").hide();
    $("#id_cer_add_list_type_select").show();
    
    $("#id_cer_add_list_store_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_div_modal_add_list").show();
    $("#id_cer_add_list_textarea").focus();
    event.preventDefault();
}

function ShowModalDeleteCertificate(elementObject)
{
    $("#id_cer_form_remove_truststore_crl_title").hide();
    $("#id_cer_rem_crl_header").hide();
    $("#id_cer_rem_list_list_type").hide();
    $("#id_cer_form_remove_truststore_cer_title").show();
    $("#id_cer_rem_cert_header").show();
    $("#id_cer_rem_list_cert_type").show();
    
    $("#id_cer_remove_list_truststore_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_remove_list_type_select").val($(elementObject).attr("ListType"));
    $("#id_cer_remove_list_textinput").val(DecodeHtmlEntities($(elementObject).attr("CertificateName")));
    $("#id_cer_remove_list_id_textinput").val($(elementObject).attr("Identifier"));
    
    $("#id_div_modal_remove_list").show();
    event.preventDefault();
}

function ShowModalViewCertificateDetails(elementObject)
{

    $("#id_cer_form_show_cert_details_title").show();
    $("#id_cer_certificate_serial_number").show();
    $("#id_cer_subject_text_h").show();
    $("#id_cer_subject_common_name").show();
    $("#id_cer_list_details_subject_common_name_input").show();
    $("#id_cer_subject_rfc2253").show();
    $("#id_cer_list_details_subject_rfc2253_textarea").show();
    $("#id_cer_cert_valid_not_before").show();
    $("#id_cer_cert_valid_not_after").show();
    $("#id_cer_subject_hr").show();
    
    $("#id_cer_form_show_crl_details_title").hide();
    $("#id_cer_crl_number").hide();
    $("#id_cer_crl_this_update").hide();
    $("#id_cer_crl_next_update").hide();
    
    // Certificate Number
    $("#id_cer_list_details_number_input").val($(elementObject).attr("CertSerialNumber"));
    
    // Certificate Issuer
    let IssuerCommonName = $(elementObject).attr("IssuerCommonName");
    let IssuerRfc2253 = $(elementObject).attr("IssuerRfc2253");
    
    $("#id_cer_list_details_issuer_common_name_input").val(DecodeHtmlEntities($(elementObject).attr("IssuerCommonName")));
    $("#id_cer_list_details_issuer_rfc2253_textarea").text(DecodeHtmlEntities($(elementObject).attr("IssuerRfc2253")));
    
    // Certificate Subject
    $("#id_cer_list_details_subject_common_name_input").val(DecodeHtmlEntities($(elementObject).attr("SubjectCommonName")));
    $("#id_cer_list_details_subject_rfc2253_textarea").text(DecodeHtmlEntities($(elementObject).attr("SubjectRfc2253")));
    
    // Validity
    $("#id_cer_list_details_valid_start_input").val($(elementObject).attr("CertValidNotBefore"));
    $("#id_cer_list_details_valid_end_input").val($(elementObject).attr("CertValidNotAfter"));
    
    $("#id_cer_div_modal_list_details").show();

    event.preventDefault();
}

function ShowModalAddCrlList(elementObject)
{
    
    $("#id_cer_add_crl_content_lable").show();
    $("#id_cer_form_add_certificate_title").hide();
    $("#id_cer_add_cert_content_lable").hide();
    $("#id_cer_form_add_truststore_crl_title").show();
    $("#id_cer_form_add_crl_title").show();
    
    $("#id_cer_add_list_type_select option[value='TrustList']").hide()
    $("#id_cer_add_list_type_select option[value='TrustList']").prop('selected', false);
    $("#id_cer_add_list_type_select option[value='IssuerList']").hide()
    $("#id_cer_add_list_type_select option[value='TrustCrlList']").show()
    $("#id_cer_add_list_type_select option[value='TrustCrlList']").prop('selected', true);
    $("#id_cer_add_list_type_select option[value='IssuerCrlList']").show()
    $("#id_cer_add_list_type_select").show();
    $("#id_cer_add_cert_type_l").hide();
    $("#id_cer_add_crl_type_l").show();
    $("#id_cer_add_list_store_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_div_modal_add_list").show();
    $("#id_cer_add_list_textarea").focus();
    
    event.preventDefault();
}

function ShowModalDeleteCrlList(elementObject)
{
    $("#id_cer_form_remove_truststore_crl_title").show();
    $("#id_cer_rem_crl_header").show();
    $("#id_cer_rem_list_list_type").show();
    $("#id_cer_form_remove_truststore_cer_title").hide();
    $("#id_cer_rem_cert_header").hide();
    $("#id_cer_rem_list_cert_type").hide();
    
    $("#id_cer_remove_list_type_select").val($(elementObject).attr("ListType"));
    
    
    $("#id_cer_remove_list_truststore_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_remove_list_textinput").val(DecodeHtmlEntities($(elementObject).attr("CrlName")));
    $("#id_cer_remove_list_id_textinput").val($(elementObject).attr("Identifier"));
    
    $("#id_div_modal_remove_list").show();
    
    event.preventDefault();
}

function ShowModalViewCrlDetails(elementObject)
{
    $("#id_cer_form_show_cert_details_title").hide();
    $("#id_cer_certificate_serial_number").hide();
    $("#id_cer_subject_text_h").hide();
    $("#id_cer_subject_common_name").hide();
    $("#id_cer_list_details_subject_common_name_input").hide();
    $("#id_cer_subject_rfc2253").hide();
    $("#id_cer_list_details_subject_rfc2253_textarea").hide();
    $("#id_cer_cert_valid_not_before").hide();
    $("#id_cer_cert_valid_not_after").hide();
    $("#id_cer_subject_hr").hide();
    
    $("#id_cer_form_show_crl_details_title").show();
    $("#id_cer_crl_number").show();
    $("#id_cer_crl_this_update").show();
    $("#id_cer_crl_next_update").show();
    
    // Crl Number
    $("#id_cer_list_details_number_input").val($(elementObject).attr("CertSerialNumber"));
    
    // Crl Issuer
    $("#id_cer_list_details_issuer_common_name_input").val(DecodeHtmlEntities($(elementObject).attr("IssuerCommonName")));
    $("#id_cer_list_details_issuer_rfc2253_textarea").text(DecodeHtmlEntities($(elementObject).attr("IssuerRfc2253")));
    
    // Validity
    $("#id_cer_list_details_valid_start_input").val($(elementObject).attr("ThisUpdate"));
    $("#id_cer_list_details_valid_end_input").val($(elementObject).attr("NextUpdate"));
    
    $("#id_cer_div_modal_list_details").show();
    
    event.preventDefault();
}


function addIdentityStore()
{
    let result = false;
    let query =   $("#id_cer_add_identitystore_input").attr('name') + "="
                   + encodeURIComponent($("#id_cer_add_identitystore_input").val());
                   
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "AddStore?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    result = response.result;
    if(result != true)
    {
        alert(CheckControlResponseError(response.errorText));
    }
    return result;
}

function deleteIdentityStore()
{
    let result = false;
    let query =   $("#id_cer_add_identitystore_input").attr('name') + "="
                   + encodeURIComponent($("#id_cer_add_identitystore_input").val());

    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "DeleteStore?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            null, null);
    let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    result = response.result;
    if(result != true)
    {
        alert(CheckControlResponseError(response.errorText));
    }
    return result;
}


function generateKeyPair(createStore)
{
    let result = false;
    let opResult = 'GENERATE_SUCCESS';
    let query =   $("#id_cer_add_identitystore_input").attr('name') + "="
                   + encodeURIComponent($("#id_cer_add_identitystore_input").val()) + "&"
                   + $("#id_cer_add_identitystore_key_type_select").attr('name') + "="
                   + encodeURIComponent($("#id_cer_add_identitystore_key_type_select").val());

    
    let ajaxReqConfig = AjaxInterface.CreateAsyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "GenerateKeyPair?" + query,
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.JSON,
                                                        null, null, 60000);
    AjaxInterface.PerformAsyncPromiseRequest(ajaxReqConfig)
    .then(function(data) {
        if(!data.result)
        {
            if(createStore == true)
            {
                result = deleteIdentityStore();
            }
            $('#id_cer_div_modal_add_identitystore').hide();
            let addIdentityStoreForm = document.getElementById('id_cer_add_identitystore_form');
            addIdentityStoreForm.reset();
            console.error("Failed to generate key pair for identity store " + $("#id_cer_add_identitystore_input").val());
            $("#id_div_loader").hide();
        }
        else
        {
            console.log("Successfully generated keypair for identity store " + $("#id_cer_add_identitystore_input").val());
            location.reload(); 
            window.location.href = CERTIFICATES_PAGE_LOCATION_REFERENCE;
        }
    })
    .catch(function(errorObj) {
        console.log( "General error occured: ", errorObj.status, errorObj.error );
        alert("General error occured - Status: " + errorObj.status + " , Error: " + errorObj.error);
        if(createStore == true)
        {
            result = deleteIdentityStore();
        }
        $('#id_cer_div_modal_add_identitystore').hide();
        let addIdentityStoreForm = document.getElementById('id_cer_add_identitystore_form');
        addIdentityStoreForm.reset();
        console.error("Failed to generate key pair for identity store " + $("#id_cer_add_identitystore_input").val() + " with error " + errorObj.error);
        $("#id_div_loader").hide();
    });
    return result;
}

function setKeyPair()
{
    let result = true;
    let postData = "";
    let query = "";
    let keyPairInputMethode = $('#id_cer_keypair_add_input_method_select').val();
    if(keyPairInputMethode == 'FILE')
    {
        query =   $("#id_cer_add_identitystore_input").attr('name') + "="
                   + encodeURIComponent($("#id_cer_add_identitystore_input").val());
        postData = keypairFileTextVal;
    }
    else if(keyPairInputMethode == 'TEXT')
    {
        if($("#id_cer_add_keypair_textarea").val().length > 0)
        {
            query =   $("#id_cer_add_identitystore_input").attr('name') + "="
                       + $("#id_cer_add_identitystore_input").val();
            postData = $("#id_cer_add_keypair_textarea").val();
        }
        else
        {
            alert($("#id_cer_requesterror_empty_key_text_field").text());
            result = false;
        }
        
    }
    if(result == true)
    {
        let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "SetKeyPair?" + query,
                                                            AjaxInterface.AjaxRequestType.POST,
                                                            AjaxInterface.AjaxRequestDataType.JSON,
                                                            postData,
                                                            null);
        let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    
        result = response.result;
        if(result != true)
        {
            alert(CheckControlResponseError(response.errorText));
        }
    }
    
    return result;
}
function ShowModalAddIdentityStore()
{
    $("#id_cer_form_set_identitystore_keypair_title").hide();
    $("#id_cer_add_identitystore_key_type_select").hide();
    $("#id_cer_warning_generate_keypair").hide();
    $("#id_cer_add_keypair_textarea_div").hide();
    $("#id_cer_form_edit_keypair_save_button").hide();
    $("#id_cer_form_identitystore_add_button").hide();
    
    $("#id_cer_add_keypair_type_lable").hide();
    
    $("#id_cer_add_keypair_content_lable").show();
    $("#id_cer_identitystore_keypair_input_method").show();
    $("#id_cer_keypair_add_input_method_select").show();
    $("#id_cer_keypair_file_browse_button").show();
        $("#id_cer_keypair_file_text").show();
    $("#id_cer_form_add_identitystore_title").show();
    $("#id_cer_add_identitystore_input").attr('readonly', false);
    $("#id_cer_add_identitystore_input").focus();
    
    $("#id_cer_div_modal_add_identitystore").show();
    
    event.preventDefault();
}

function ShowModalRenameIdentityStore(elementObject)
{
    $("#id_cer_rename_identitystore_current_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_rename_identitystore_new_textinput").focus();
    $("#id_div_modal_rename_identity_store").show();
    
    event.preventDefault();
}

function ShowModalRemoveIdentityStore(elementObject)
{
    $("#id_cer_remove_identitystore_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_div_modal_remove_identity_store").show();
    
    event.preventDefault();
}

function ShowModalViewKeyPairDetails(elementObject)
{
    $("#id_div_loader").show();
    let identityStoreName = DecodeHtmlEntities($(elementObject).attr("StoreName"));
    let query = ('IdentityStoreName=' + encodeURIComponent(identityStoreName));
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "ReadPublicKey?" + query,
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.HTML,
                                                        null, null);
    let publicKeyText = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    
    $("textarea[name='PublicKey']").val(publicKeyText);
    $("#id_cer_key_pair_type_select").val($(elementObject).attr("KeyPairType"));
    $("#id_div_loader").hide();
    $("#id_div_modal_key_pair_Details").show();
    
    event.preventDefault();
}

function ShowModalSetKeyPair(elementObject)
{
    $("#id_cer_add_identitystore_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));

    $("#id_cer_form_set_identitystore_keypair_title").show();
    $("#id_cer_add_identitystore_key_source_select").show();
    $("#id_cer_keypair_file_browse_button").show();
    $("#id_cer_keypair_file_text").show();
    
    $("#id_cer_add_keypair_type_lable").hide();
    $("#id_cer_add_keypair_textarea_div").hide();
    $("#id_cer_form_add_identitystore_title").hide();
    $("#id_cer_add_identitystore_key_type_select").hide();
    $("#id_cer_warning_generate_keypair").hide();
    $("#id_cer_form_edit_keypair_save_button").hide();
    
    $("#id_cer_div_modal_add_identitystore").show();
    $("#id_cer_add_identitystore_input").attr('readonly', true);
    
    event.preventDefault();
}

function ShowModalSetKeyCertificate(elementObject)
{
    $("#id_cer_add_idstore_key_cert_store_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_div_modal_set_idstore_key_cert").show();
    $("#id_cer_idstore_key_cert_file_browse_button").show();
    $("#id_cer_idstore_key_cert_file_file_text").show();
    $("#id_cer_idstore_add_key_cert_content_lable").show();
    $("#id_cer_idstore_add_key_cert_button").hide();
    $("#id_cer_idstore_add_key_cert_textarea_div").hide();
    $("#id_cer_idstore_add_key_cert_gen_button").hide();
    
    event.preventDefault();    
}

function ShowModalAddIdstoreIssuerCert(elementObject)
{
    $("#id_cer_issuerlist_idstore_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_div_modal_add_idstore_issuer_cert").show();
    
    event.preventDefault();
}

function ShowModalDeleteIdStoreCertificate(elementObject)
{
    $("#id_cer_remove_list_idstore_input").val(DecodeHtmlEntities($(elementObject).attr("StoreName")));
    $("#id_cer_idstore_remove_list_type_select").val($(elementObject).attr("ListType"));
    $("#id_cer_idstore_remove_list_textinput").val(DecodeHtmlEntities($(elementObject).attr("CertificateName")));
    $("#id_cer_idstore_remove_list_id_textinput").val($(elementObject).attr("Identifier"));
    
    $("#id_div_modal_idstore_remove_list").show();
    
    event.preventDefault();
}

function OnIssuerListInputMethodChange()
{
    let inputMethod = $('#id_cer_isstore_add_input_method_select').val();
    if(inputMethod == 'FILE')
    {
        $("#id_cer_idstore_issuerlist_file_browse_button").show();
        $("#id_cer_idstore_issuerlist_file_text").show();
        $("#id_cer_idstore_add_issuerlist_textarea_div").hide();
        let listFile = document.getElementById('id_cer_idstore_issuerlist_file_input').files[0];
        if(typeof listFile !== 'undefined')
        {
            let formatFilter = LIST_FILE_FORMAT_FILTER;
            if (formatFilter.test(listFile.name) == true) {
               $("#id_cer_idstore_add_issuerlist_add_button").show();
            }
            else
            {
                $("#id_cer_idstore_add_issuerlist_add_button").hide();
            }
            
        }
        else
        {
            $("#id_cer_idstore_add_issuerlist_add_button").hide();
        }
    }
    else if(inputMethod == 'TEXT')
    {
        $("#id_cer_idstore_issuerlist_file_browse_button").hide();
        $("#id_cer_idstore_issuerlist_file_text").hide();
        $("#id_cer_idstore_add_issuerlist_textarea_div").show();
        $("#id_cer_idstore_add_issuerlist_add_button").show();
    }
    
}

function OnListInputMethodChange()
{
    let inputMethod = $('#id_cer_add_input_method_select').val();
    if(inputMethod == 'FILE')
    {
        $("#id_cer_cert_file_browse_button").show();
        $("#id_cer_cert_file_text").show();
        $("#id_cer_add_list_textarea_div").hide();
        let listFile = document.getElementById('id_cer_cert_file_input').files[0];
        if(typeof listFile !== 'undefined')
        {
            let formatFilter = LIST_FILE_FORMAT_FILTER;
            if (formatFilter.test(listFile.name) == true) {
               $("#id_cer_form_add_list_add_button").show();
            }
            else
            {
                $("#id_cer_form_add_list_add_button").hide();
            }
            
        }
        else
        {
            $("#id_cer_form_add_list_add_button").hide();
        }
    }
    else if(inputMethod == 'TEXT')
    {
        $("#id_cer_cert_file_browse_button").hide();
        $("#id_cer_cert_file_text").hide();
        $("#id_cer_add_list_textarea_div").show();
        $("#id_cer_form_add_list_add_button").show();
    }
}

function OnKeyPairSourceSelectChange()
{
    let keySource = $('#id_cer_add_identitystore_key_source_select').val();
    if(keySource == 'GENERATE')
    {
        if($("#id_cer_form_add_identitystore_title").is(":visible") == true)
        {
            $("#id_cer_form_identitystore_add_button").show();
        }
        else
        {
            $("#id_cer_form_edit_keypair_save_button").show();
        }
        $('#id_cer_add_keypair_type_lable').show();
        $('#id_cer_add_identitystore_key_type_select').show();
        $('#id_cer_warning_generate_keypair').show();
        
        $("#id_cer_add_keypair_content_lable").hide();
        $("#id_cer_add_keypair_textarea_div").hide();
        $("#id_cer_keypair_file_browse_button").hide();
        $("#id_cer_keypair_file_text").hide();
        $("#id_cer_identitystore_keypair_input_method").hide();
        $("#id_cer_keypair_add_input_method_select").hide();
        
    }
    else if(keySource == 'ENTER')
    {
        $("#id_cer_identitystore_keypair_input_method").show();
        $("#id_cer_keypair_add_input_method_select").show();
        $("#id_cer_add_keypair_content_lable").show();
        $("#id_cer_add_keypair_type_lable").hide();
        $("#id_cer_add_identitystore_key_type_select").hide();
        $("#id_cer_warning_generate_keypair").hide();
        OnKeyPairInputMethodChange();
    }
}

function OnKeyCertGenOptChange()
{
    
    var genOption = $('#id_cer_isstore_key_cert_opt_select').val();
    if(genOption == 'GENERATECSR')
    {
        $("#id_cer_idstore_add_key_cert_gen_button").show();
        
        $("#id_cer_idstore_add_key_cert_content_lable").hide();
        $("#id_cer_idstore_add_key_cert_input_method").hide();
        $("#id_cer_idstore_key_cert_input_method_select").hide();
        $("#id_cer_idstore_key_cert_file_browse_button").hide();
        $("#id_cer_idstore_key_cert_file_file_text").hide();
        $("#id_cer_idstore_add_key_cert_textarea_div").hide();
        $("#id_cer_idstore_add_key_cert_button").hide();
    }
    else if(genOption == 'ENTER')
    {
        $("#id_cer_idstore_add_key_cert_button").show();
        $("#id_cer_idstore_add_key_cert_content_lable").show();
        $("#id_cer_idstore_add_key_cert_input_method").show();
        $("#id_cer_idstore_key_cert_input_method_select").show();
        onKeyCertInputMethodChange();
        
        $("#id_cer_idstore_add_key_cert_gen_button").hide();
    }
}
function OnKeypairFileSelected()
{
    keypairFileTextVal = "";
    // get selected file element
    let keypairFile = document.getElementById('id_cer_keypair_file_input').files[0];
    let formatFilter = KEY_PAIR_FILE_FORMAT_FILTER;
    $("#id_cer_keypair_file_text").val(keypairFile.name);
    
    if (! formatFilter.test(keypairFile.name)) {
        $("#id_cer_form_identitystore_add_button").hide();
        $("#id_cer_form_edit_keypair_save_button").hide();
        alert($("#id_cer_requesterror_valid_files_format").text() + KEY_PAIR_FILE_VALID_FORMATS);
        return;
    }
    let keypairFileReader = new FileReader();
    keypairFileReader.onload = function(e){
        // read selected file as Binary String
        keypairFileTextVal = e.target.result;
        if($("#id_cer_form_add_identitystore_title").is(":visible") == true)
        {
            $("#id_cer_form_identitystore_add_button").show();
        }
        else
        {
            $("#id_cer_form_edit_keypair_save_button").show();
        }
    };
    
    keypairFileReader.readAsText(keypairFile);
    
}

function OnKeyPairInputMethodChange()
{
    let keyPairInputMethode = $('#id_cer_keypair_add_input_method_select').val();
    if(keyPairInputMethode == 'FILE')
    {
        $("#id_cer_keypair_file_browse_button").show();
        $("#id_cer_keypair_file_text").show();
        
        $("#id_cer_add_keypair_textarea_div").hide();
        $("#id_cer_form_edit_keypair_save_button").hide();
        let keyPairFile = document.getElementById('id_cer_keypair_file_input').files[0];
        if(typeof keyPairFile !== 'undefined')
        {
            let formatFilter = KEY_PAIR_FILE_FORMAT_FILTER;
            if (formatFilter.test(keyPairFile.name) == true) {
               $("#id_cer_form_identitystore_add_button").show();
            }
            else
            {
                $("#id_cer_form_identitystore_add_button").hide();
            }
        }
        else
        {
            $("#id_cer_form_identitystore_add_button").hide();
        }
        
    }
    else if(keyPairInputMethode == 'TEXT')
    {
        $("#id_cer_add_keypair_textarea_div").show();
        if($("#id_cer_form_add_identitystore_title").is(":visible") == true)
        {
            $("#id_cer_form_identitystore_add_button").show();
        }
        else
        {
            $("#id_cer_form_edit_keypair_save_button").show();
        }
        
        $("#id_cer_keypair_file_browse_button").hide();
        $("#id_cer_keypair_file_text").hide();
    }
}

function onKeyCertInputMethodChange()
{
    let keyCertInputMethode = $('#id_cer_idstore_key_cert_input_method_select').val();
    if(keyCertInputMethode == 'FILE')
    {
        $("#id_cer_idstore_key_cert_file_browse_button").show();
        $("#id_cer_idstore_key_cert_file_file_text").show();
        
        $('#id_cer_idstore_add_key_cert_textarea_div').hide();
        let listFile = document.getElementById('id_cer_idstore_key_cert_file_input').files[0];
        if(typeof listFile !== 'undefined')
        {
            let formatFilter = LIST_FILE_FORMAT_FILTER;
            if (formatFilter.test(listFile.name) == true) {
               $("#id_cer_idstore_add_key_cert_button").show();
            }
            else
            {
                $("#id_cer_idstore_add_key_cert_button").hide();
            }
            
        }
        else
        {
            $("#id_cer_idstore_add_key_cert_button").hide();
        }
    }
    else if (keyCertInputMethode == 'TEXT')
    {
        $('#id_cer_idstore_add_key_cert_textarea_div').show();
        $('#id_cer_idstore_add_key_cert_button').show();
        
        $("#id_cer_idstore_key_cert_file_browse_button").hide();
        $("#id_cer_idstore_key_cert_file_file_text").hide();
    }
}

function onDownloadPublicKey(elementObject)
{
    $("#id_div_loader").show();
    let identityStoreName = DecodeHtmlEntities($(elementObject).attr("StoreName"));
    let query = ('IdentityStoreName=' + identityStoreName);
    var filename = identityStoreName + "_publickey.pem";
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "ReadPublicKey?" + query,
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.HTML,
                                                        null, null);
    let publicKeyText = AjaxInterface.PerformSyncRequest(ajaxReqConfig);

    $("#id_div_loader").hide();
    saveToFile(filename, 'text/csv', publicKeyText);
    
    event.preventDefault();
}

function onDownloadKeyCertificate(elementObject)
{
    let identityStoreName = DecodeHtmlEntities($(elementObject).attr("StoreName"));
    $("#id_div_loader").show();
    let filename = identityStoreName + "_certificate.crt";
    let query = ('IdentityStoreName=' + identityStoreName);
    let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(IDENTITY_STORE_DATA_PROVIDER_SCRIPT_NAME + "ReadCertificate?" + query,
                                                        AjaxInterface.AjaxRequestType.POST,
                                                        AjaxInterface.AjaxRequestDataType.HTML,
                                                        null, null);
    let publicKeyText = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
    $("#id_div_loader").hide();
    saveToFile(filename, 'text/csv', publicKeyText);
    
    event.preventDefault();
}

function listFileSelected()
{
    listFileTextVal = "";
    // get selected file element
    let listFile = document.getElementById('id_cer_cert_file_input').files[0];
    let formatFilter = LIST_FILE_FORMAT_FILTER;
    $("#id_cer_cert_file_text").val(listFile.name);
    if (! formatFilter.test(listFile.name)) {
        $("#id_cer_form_add_list_add_button").hide();
        alert($("#id_cer_requesterror_valid_files_format").text() + LIST_FILE_VALID_FORMATS);
        return;
    }
    let listFileReader = new FileReader();
    listFileReader.onload = function(e){
        // read selected file as Binary String
        listFileTextVal = e.target.result;
        $("#id_cer_form_add_list_add_button").show();
    };
    
    listFileReader.readAsText(listFile);
}

function issuerListFileSelected()
{
    listFileTextVal = "";
    // get selected file element
    let listFile = document.getElementById('id_cer_idstore_issuerlist_file_input').files[0];
    let formatFilter = LIST_FILE_FORMAT_FILTER;
    $("#id_cer_idstore_issuerlist_file_text").val(listFile.name);
    if (! formatFilter.test(listFile.name)) {
        $("#id_cer_idstore_add_issuerlist_add_button").hide();
        alert($("#id_cer_requesterror_valid_files_format").text() + LIST_FILE_VALID_FORMATS);
        return;
    }
    let listFileReader = new FileReader();
    listFileReader.onload = function(e){
        // read selected file as Binary String
        listFileTextVal = e.target.result;
        $("#id_cer_idstore_add_issuerlist_add_button").show();
    };
    
    listFileReader.readAsText(listFile);
}

function keyCertFileSelected()
{
    listFileTextVal = "";
    // get selected file element
    let certFile = document.getElementById('id_cer_idstore_key_cert_file_input').files[0];
    let formatFilter = LIST_FILE_FORMAT_FILTER;
    $("#id_cer_idstore_key_cert_file_file_text").val(certFile.name);
    if (! formatFilter.test(certFile.name)) {
        $("#id_cer_idstore_add_key_cert_button").hide();
        alert($("#id_cer_requesterror_valid_files_format").text() + LIST_FILE_VALID_FORMATS);
        return;
    }
    let certFileReader = new FileReader();
    certFileReader.onload = function(e){
        // read selected file as Binary String
        listFileTextVal = e.target.result;
        $("#id_cer_idstore_add_key_cert_button").show();
    };
    
    certFileReader.readAsText(certFile);
}

function SwitchCerStoresConfigTab(currentObjectId)
 {
    let currObject = document.getElementById(currentObjectId);
    let old_tab_id = $(currObject).parent().parent().find('a.pxc-tab-on').attr("data-tab-id");
    $('#' + old_tab_id).hide();
    let oldChildrens = $('#' + old_tab_id).find('.pxc-pd-tabsrow').children();
    for(i = 0; i < oldChildrens.length; i++)
    {
        let child = oldChildrens[i].getElementsByTagName('a');
        if(child.length == 1)
        {
           if(child[0].getAttribute('class') == 'pxc-tab-on')
           {
               let elementToHide = child[0].getAttribute("data-tab-id");
               $('#' + elementToHide).hide();
           }
        }
    }

    let new_tab_id = $(currObject).attr("data-tab-id");
    $('#' + new_tab_id).show();
    $(currObject).parent().parent().find('a.pxc-tab-on').removeClass('pxc-tab-on');
    $(currObject).addClass('pxc-tab-on');
    let newChildrens = $('#' + new_tab_id).find('.pxc-pd-tabsrow').children();
    for(i = 0; i < newChildrens.length; i++)
    {
        let child = newChildrens[i].getElementsByTagName('a');
        if(child.length == 1)
        {
           if(child[0].getAttribute('class') == 'pxc-tab-on')
           {
               let elementToshow = child[0].getAttribute("data-tab-id");
               $('#' + elementToshow).show();
           }
        }
    }
 }


function CheckControlResponseError(errorText)
{
    let errorTextElements = errorText.split(":");
    let errorAlertMessage = $("#id_cer_requesterror_unknown").text();
    if(errorTextElements.length == 2)
    {
        let errorSourceElement = errorTextElements[0];
        let errorCodeElement   = errorTextElements[1];
        let sourceElements = errorSourceElement.split("@");
        if(sourceElements.length == 1)
        {   
            let sourceFunction = sourceElements[0];
            if(sourceFunction == "addStore")
            {
                errorAlertMessage = $("#id_cer_error_desc_add_store").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "deleteStore")
            {
                errorAlertMessage = $("#id_cer_error_desc_delete_store").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "renameStore")
            {
                errorAlertMessage = $("#id_cer_error_desc_rename_store").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "setKeyPair")
            {
                errorAlertMessage = $("#id_cer_error_desc_set_keypair").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "generateKeyPair")
            {
                errorAlertMessage = $("#c_cer_error_desc_gen_keypair").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "generateCSR")
            {
                errorAlertMessage = $("#id_cer_error_desc_gen_csr").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "setCertificate")
            {
                errorAlertMessage = $("#id_cer_error_desc_set_keycert").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "addIssuerList")
            {
                errorAlertMessage = $("#id_cer_error_desc_add_cert").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
            else if(sourceFunction == "deleteFromList")
            {
                errorAlertMessage = $("#id_cer_error_desc_delete_cert").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
            }
        }
        else if(sourceElements.length == 2)
        {
            let sourceFunction = sourceElements[0];
            let listType = sourceElements[1];
            if((sourceFunction == "addList") || (sourceFunction == "addIssuerList"))
            {
                if((listType == "TrustList") || (listType == "IssuerList"))
                {
                    errorAlertMessage = $("#id_cer_error_desc_add_cert").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
                }
                else if((listType == "TrustCrlList") || (listType == "IssuerCrlList"))
                {
                    errorAlertMessage = $("#id_cer_error_desc_add_crl").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
                }
            }
            else if((sourceFunction == "deleteList") || (sourceFunction == "deleteFromList"))
            {
                if((listType == "TrustList") || (listType == "IssuerList"))
                {
                    errorAlertMessage = $("#id_cer_error_desc_delete_cert").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
                }
                else if((listType == "TrustCrlList") || (listType == "IssuerCrlList"))
                {
                    errorAlertMessage = $("#id_cer_error_desc_delete_crl").text() + ", " + $("#id_cer_requesterror").text() + ": " + GetResponseErrorMessage(errorCodeElement);
                }
            }
            
        }

    }
    
    return errorAlertMessage;
}

function GetResponseErrorMessage(errorCode)
{   
    if(errorCode == "StoreNotFound")
    {
        return $("#id_cer_securityerror_store_not_found").text();
    }
    else if(errorCode == "ItemNotFound")
    {
        return $("#id_cer_securityerror_item_not_found").text();
    }
    else if(errorCode == "IOError")
    {
        return $("#id_cer_securityerror_io_error").text();
    }
    else if(errorCode == "ListTypeNotSupported")
    {
        return $("#id_cer_securityerror_listtype_not_supported").text();
    }
    else if (errorCode == "DecodeError")
    {
        return $("#id_cer_securityerror_decode_error").text();
    }
    else if(errorCode == "NotImplemented")
    {
        return $("#id_cer_securityerror_not_implemented").text();
    }
    else if(errorCode == "KeyTypeNotSupported")
    {
        return $("#id_cer_securityerror_keytype_not_supported").text();
    }
    else if(errorCode == "ReadOnly")
    {
        return $("#id_cer_securityerror_read_only").text();
    }
    else if(errorCode == "Invalid Request")
    {
        return $("#id_cer_requesterror_invalid_request").text();
    }
    else if(errorCode == "StoreExists")
    {
        return $("#id_cer_securityerror_store_exists").text();
    }
    else if(errorCode == "InvalidInput")
    {
        return $("#id_cer_securityerror_invalid_input").text();
    }
     else if(errorCode == "NotEditable")
    {
        return $("#id_cer_error_desc_not_editable").text();
    }
    else
    {
        return $("#id_cer_securityerror_unknown_error").text();
    }
}
function saveToFile(filename, filetype, filedata)
{
    let file = new Blob([filedata], {type: filetype});
    let iExplorer        = navigator.userAgent.match(/MSIE\s([\d.]+)/);
    let iExplorer11      = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/);
    let iExplorerEDGE    = navigator.userAgent.match(/Edge/g);
        
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
        window.URL.revokeObjectURL(dLink.href);
        dLink.remove();
    }
}

function RestoreSelectedConfigTabs()
{
    if(cer_selectedStoreTabID == 'id_cer_identity_stores_tab')
    {
        SwitchCerStoresConfigTab('id_cer_identity_stores_tab');
    }
}

function handleFileInputClick(destInputId)
{
    document.getElementById(destInputId).click();
    event.preventDefault();
}