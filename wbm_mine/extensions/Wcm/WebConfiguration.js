SubPageActive = true;

Webconfig_identityStoreConfig = {};

function CleanUpPageData() {
    
    document.removeEventListener('keyup', CloseModalWithEsc);
    
    delete SubPageActive;

    delete Webconfig_identityStoreConfig;

    $("#id_webconfig_nginx_config_table_form").removeData('validator');
    $(document).off("LanguageChanged");
}


$(document).ready(function () {
    $("#id_div_loader").show();
    let result = WebConfiguration.BuildHttpsTlsConfigContent();

    result &= WebConfiguration.BuildIdentityStoresList();

    result &= WebConfiguration.BuildIdentityStoreConfig();

    result &= WebConfiguration.BuildSelfSignedCertificateInfo();

    if (!result) {
        WebConfiguration.DisableHttpsConfigElements();
    }
    MsDelay(100)
        .then(function () {
            Validation("#id_webconfig_nginx_config_table_form");
            $("#id_webconfig_nginx_config_table_form").validate().settings.ignore = [];

            UpdatePlaceHolders();

            // Show page content after page elements are loaded
            $("#id_webconfig_page_global_div").show();
            $("#id_div_loader").hide();
        })

    $("#id_webconfig_main_div").show();
    $("#id_div_loader").hide();

    $(document).keypress(function (event) {
        if (event.which == '13') {
            event.preventDefault();
        }
    });
    $('#id_webconfig_cipher_suite_select').on('change', function (event) {
        WebConfiguration.SetSelectedHttpsTlsCipherSuiteSet(this.value);
        event.preventDefault();
        return false;
    });
    $("#id_webconfig_nginx_config_table").on("change", "input.tls-version-cb", function (event) {
        let selectedTlsVersions = [];
        $('#id_webconfig_nginx_config_table .tls-version-cb:checkbox:checked').each(function () {
            selectedTlsVersions.push($(this).attr('name'));
        });
        WebConfiguration.UpdateSelectedHttpsTlsVersionsList(selectedTlsVersions);
        event.preventDefault();
        return false;
    });

    $('#id_webconfig_identity_store_select').on('change', function (event) {
        console.log("Web Services Configuration Log: changed selected Identity Store to", this.value);
        WebConfiguration.HandleSelectedIdentityStore(this.value);

        event.preventDefault();
        return false;
    });

    $("#id_webconfig_generate_certificate_button").click(function (event) {
        event.preventDefault();
        if ($("#id_webconfig_nginx_config_table_form").valid() == true) {
            $('#id_webconfig_div_modal_generate_cert_confirm').show();
        }

        return false;
    });

    $("#id_webconfig_generate_cert_cancellation_btn").click(function (event) {
        event.preventDefault();

        $('#id_webconfig_div_modal_generate_cert_confirm').hide();

        return false;
    });

    $("#id_webconfig_generate_cert_ok_btn").click(function (event) {
        $("#id_webconfig_generate_certificate_status_ok").hide();
        $("#id_webconfig_generate_certificate_status_error").hide();

        $("#id_div_loader").show();
        event.preventDefault();

        setTimeout(WebConfiguration.RegenerateSelfSignedCertificate, 30);

        return false;
    });

    $("#id_webconfig_add_san_btn").click(function (event) {
        event.preventDefault();

        let emptySan = {};
        emptySan.type = "IpAddress";
        emptySan.value = "";
        WebConfiguration.AddSubjectAlternativeName(emptySan, true);

        return false;
    });

    $("#id_webconfig_nginx_san_config_table").on("click", "button.rm-san", function (event) {

        $(this).closest("tr").remove();

        event.preventDefault();
        return false;
    });

    $("#id_webconfig_apply_config_button").click(function (event) {
        event.preventDefault();
        $("#id_div_loader").show();
        WebConfiguration.ClearComponentMessages();
        if ($("#id_webconfig_nginx_config_table_form").valid() == true) {
            setTimeout(function () { WebConfiguration.ApplyNginxConfiguration(); }, 30);
        }
        else {
            $("#id_div_loader").hide();
        }
        return false;
    });

    $("#id_webconfig_discard_config_button").click(function (event) {
        $("#id_webconfig_discard_modal").show();
        event.preventDefault();
        return false;
    });

    $("#id_webconfig_discard_ok_btn").click(function (event) {
        $("#id_webconfig_discard_modal").hide();
        $("#id_div_loader").show();
        ReloadPage();
        event.preventDefault();
        return false;
    });
    $("#id_webconfig_discard_cancle_btn").click(function (event) {
        $("#id_webconfig_discard_modal").hide();
        event.preventDefault();
        return false;
    });

    $(document).on("change", "#id_webconfig_nginx_config_table select", function (event) {
        let saElementNumber = $(this).parent().parent().attr("sa-number");

        let selectedSaTypeValue = $(this).val();

        if (selectedSaTypeValue == "IpAddress") {
            $("#" + "id_webconfig_cert_subject_" + saElementNumber + "_name_input").prop("disabled", false);
        }
        else if (selectedSaTypeValue == "DnsName") {
            $("#" + "id_webconfig_cert_subject_" + saElementNumber + "_name_input").prop("disabled", false);
        }
        else {
            $("#" + "id_webconfig_cert_subject_" + saElementNumber + "_name_input").prop("disabled", true);
        }

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

    console.log("WEB configuration: Event subscriber on LanguageChanged - Selected language: " + e.message);
    setTimeout(UpdatePlaceHolders, 100);
    // Reset validator and reinit validation to change language
    try {
        ReloadValidation("#id_webconfig_nginx_config_table_form");
        $("#id_webconfig_nginx_config_table_form").validate().settings.ignore = [];
    } catch (e) { }
}

///
/// User Manager Configuration Object
///
WebConfiguration = (function () {
    // Public Part
    let Public = {
        ApplyNginxConfiguration: function () {
            // Apply HTTPS TLS Config
            let result = this.ApplySetHttpsTlsConfig();
            if (!result) {
                $("#id_div_loader").hide();
                return false;
            }
            // Apply HTTPS Certificate Config
            $("#id_webconfig_certificate_key_missmatch_div").hide();
            let identityStoreName = $("#id_webconfig_identity_store_select option:selected").val();
            result = this.ApplySetHttpsCertificateIdentityStore(identityStoreName);
            if (result) {
                Private.AddWebconfigInfoMessage(Private.messagesTags.WebconfigSuccessfullApplyInfo);
            }
        },
        HandleSelectedIdentityStore: function (identityStore) {
            if (identityStore == Webconfig_identityStoreConfig.selfsignedIdentityStoreName) {
                $("#id_webconfig_https_certificate_tr").show();
                $("#id_webconfig_certificate_key_missmatch_div").hide()
            }
            else {
                $("#id_webconfig_https_certificate_tr").hide();
            }
        },
        ApplySetHttpsCertificateIdentityStore: function (identityStoreName) {
            let requestData = ("IdentityStoreName=" + encodeURIComponent(identityStoreName));
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "SetHttpsCertificateIdentityStore?" + requestData,
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                null,
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            // Prevent browser alert
            let tempWindowsAlert = window.alert;
            window.alert = function () { };
            if (response != null && response["error"] == false) {
                console.log("Identity Store for HTTPS certificate has been set successfully");
                setTimeout(ReloadPage, 2000);
            }
            else {
                if (response.result == "CertificateAndKeyMissmatch") {
                    $("#id_webconfig_certificate_key_missmatch_div").show();
                    setTimeout(ReloadPage, 2000);
                }
                else {
                    window.alert = tempWindowsAlert;
                    Private.AddWebconfigErrorMessage(Private.messagesTags.HttpsCertRegenerateError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                    console.error("Failed to request Identity Stores list with error " + response.errorText);
                    $("#id_div_loader").hide();
                }
            }
            return (response["error"] == false);
        },
        BuildIdentityStoresList: function () {
            let result = false;
            // request trust stores:
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "ListNonTpmIdentityStores",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if (response != null && response.error == false) {
                $(response.result).each(function (idx, identityStore) {
                    $("#id_webconfig_identity_store_select").append('<option value="' + identityStore + '">' + identityStore + '</option>');
                });
                result = true;
            }
            else {
                Private.AddWebconfigErrorMessage(Private.messagesTags.ListIdentityStoresError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                console.log("Failed to request Identity Stores list with error " + response.errorText);
            }
            return result;
        },
        BuildIdentityStoreConfig: function () {
            let result = false;
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetHttpsCertificateIdentityStoreConfigs",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if (response.error == false) {
                Webconfig_identityStoreConfig = Object.assign({}, response.result.identityStoreConfig)
                $("#id_webconfig_identity_store_select").val(Webconfig_identityStoreConfig.givenHttpsCertIdentityStoreName);

                WebConfiguration.HandleSelectedIdentityStore(Webconfig_identityStoreConfig.givenHttpsCertIdentityStoreName);

                if (Webconfig_identityStoreConfig.httpsCertIdentityStoreName != Webconfig_identityStoreConfig.givenHttpsCertIdentityStoreName
                    && Webconfig_identityStoreConfig.givenHttpsCertIdentityStoreName != Webconfig_identityStoreConfig.selfsignedIdentityStoreName) {
                    $("#id_webconfig_certificate_key_missmatch_div").show();
                }
                else {
                    $("#id_webconfig_certificate_key_missmatch_div").hide();
                }

                result = true;
            }
            else {
                Private.AddWebconfigErrorMessage(Private.messagesTags.NginxHttpsCertQueryError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                console.log("Failed to request HTTPS certificate Identity Store config error " + response.errorText);
            }
            return result;
        },
        RegenerateSelfSignedCertificate: function () {

            let certificateInfo = Private.GetConfiguredCertificateInfo();
            let certificateInfoString = JSON.stringify(certificateInfo);
            console.log("Regenerating self-signed HTTPS certificate ");
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "RegenerateSelfSignedCertificate",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                certificateInfoString,
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            WebConfiguration.ClearComponentMessages();
            if (response.error == false) {
                console.log("Successfully regenerated self-signed HTTPS certificate");
                Private.AddWebconfigInfoMessage(Private.messagesTags.HttpsCertRegeneratedInfo);
                $("#id_webconfig_generate_certificate_status_ok").show();
                $("#id_webconfig_generate_certificate_status_error").hide();
            }
            else {
                console.error("Failed to regenerate self-signed HTTPS certificate! Error text: " + response.errorText);
                Private.AddWebconfigErrorMessage(Private.messagesTags.HttpsCertRegenerateError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                $("#id_webconfig_generate_certificate_status_ok").hide();
                $("#id_webconfig_generate_certificate_status_error").show();
            }
            $('#id_webconfig_div_modal_generate_cert_confirm').hide();
            $("#id_div_loader").hide();
        },
        BuildSelfSignedCertificateInfo: function () {
            let result = false;
            // request trust stores:
            let orderNumberAjaxReqConfig = AjaxInterface.CreateSyncRequestConfig("InfoValues.cgi?ordernum", AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.HTML, "", null);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetSelfSignedCertificateConfig",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);

            if (response != null && typeof response.result !== "undefined") {
                if (response.error == false) {
                    let certificateInfo = response.result;
                    // Set Distinguished Name
                    $("#id_webconfig_cert_info_cn_input").val(certificateInfo.distinguishedName.commonName);
                    $("#id_webconfig_cert_info_o_input").val(certificateInfo.distinguishedName.organizationName);
                    $("#id_webconfig_cert_info_ou_input").val(certificateInfo.distinguishedName.organizationalUnit);
                    $("#id_webconfig_cert_info_l_input").val(certificateInfo.distinguishedName.location);
                    $("#id_webconfig_cert_info_st_input").val(certificateInfo.distinguishedName.stateOrProvinceName);
                    $("#id_webconfig_cert_info_c_input").val(certificateInfo.distinguishedName.countryName);

                    // Set Validity Period
                    let timeStamp = "";
                    if (certificateInfo.validityPeriod.ValidNotBefore.length > 0) {
                        timeStamp = Private.GetTimestampFromRfc5280Format(certificateInfo.validityPeriod.ValidNotBefore);
                    }
                    if (timeStamp != null) {
                        $("#id_webconfig_cert_validity_notbefore_date_input").val(timeStamp.date);
                        $("#id_webconfig_cert_validity_notbefore_time_input").val(timeStamp.time);
                    }
                    else {
                        $("#id_webconfig_cert_validity_notbefore_date_input").val("N/A");
                        $("#id_webconfig_cert_validity_notbefore_time_input").val("N/A");
                    }

                    if (certificateInfo.validityPeriod.ValidNotAfter.length > 0) {
                        timeStamp = Private.GetTimestampFromRfc5280Format(certificateInfo.validityPeriod.ValidNotAfter);
                    }
                    else {
                        timeStamp = "";
                    }

                    if (timeStamp != null) {
                        $("#id_webconfig_cert_validity_notafter_date_input").val(timeStamp.date);
                        $("#id_webconfig_cert_validity_notafter_time_input").val(timeStamp.time);
                    }
                    else {
                        $("#id_webconfig_cert_validity_notafter_date_input").val("N/A");
                        $("#id_webconfig_cert_validity_notafter_time_input").val("N/A");
                    }
                    // Set Subject Alternative Name
                    $(certificateInfo.subjectAlternativeNames).each(function (idx, subjectAlternativeName) {
                        WebConfiguration.AddSubjectAlternativeName(subjectAlternativeName, false);
                    });
                    Language.UpdateActivePageMessages();
                    result = true;
                }
                else {
                    Private.AddWebconfigErrorMessage(Private.messagesTags.NginxHttpsCertQueryError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                }
            }
            return result;
        },
        AddSubjectAlternativeName: function (subjectAlternativeName, reloadLanguage) {
            let sanRowHtml = "";
            let currentSansSize = $('#id_webconfig_nginx_san_config_table').find('tbody>tr:not(".exclude")').length;
            let sanNumber = 1;
            $('#id_webconfig_nginx_san_config_table').find('tbody>tr:not(".exclude")').each(function (idx, row) {
                if (parseInt($(row).attr("san-number")) >= sanNumber) {
                    sanNumber = (parseInt($(row).attr("san-number")) + 1);
                }
            });
            let sanRowId = 'id_webconfig_cert_san_' + sanNumber + '_tr';
            let ipAddressSelect = (subjectAlternativeName.type == "IpAddress") ? ('selected') : ('');
            let dnsNameSelect = (subjectAlternativeName.type == "DnsName") ? ('selected') : ('');
            sanRowHtml = '<tr class="odd" san-number="' + sanNumber + '" id="' + sanRowId + '">'
                + '<td san-number="' + sanNumber + '" id="id_webconfig_cert_san_' + sanNumber + '_value">'
                + '<input type="text" id="id_webconfig_cert_san_' + sanNumber + '_input" class="subject-alternative-name" name="san' + sanNumber + '" value="' + subjectAlternativeName.value + '">'
                + '</td>'
                + '<td>'
                + '<select id="id_webconfig_cert_san_' + sanNumber + '_type_select" name="san_' + sanNumber + '_type_select" style="width:100%;">'
                + '<option ' + ipAddressSelect + ' value="IpAddress" class="c_webconfig_san_ipaddress">IP Address</option>'
                + '<option ' + dnsNameSelect + ' value="DnsName" class="c_webconfig_san_dnsname">DNS Name</option>'
                + '</select>'
                + '</td>'
                + '<td>'
                + '<div class="centered">'
                + '<button class="pxc-btn-remove tooltip rm-san" id="id_webconfig_san_' + sanNumber + '_rm_btn">'
                + '<span class="tooltip-text-topleft c_webconfig_remove_san">Remove Subject Alternative Name</span>'
                + '</button>'
                + '</div>'
                + '</td>'
                + '</tr>';
            $("#id_webconfig_nginx_san_config_table > tbody > tr").eq((currentSansSize)).before(sanRowHtml);
            if (reloadLanguage) {
                Language.UpdateActivePageMessages();
            }
        },
        BuildHttpsTlsConfigContent: function () {
            // Pre-defined HTTPS TLS config
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetNginxPredefinedHttpsTlsConfig",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if (response != null && response["error"] == false) {
                let predefinedConfig = response["result"];
                Private.BuildHttpsTlsVersionsTableContent(predefinedConfig["tlsVersions"]);
                Private.BuildHttpsTlsCipherSuitesTableContent(predefinedConfig["cipherSuitesSets"]);
                Private.PredefinedHttpsTlsConfig = predefinedConfig;
            }
            else {
                Private.AddWebconfigErrorMessage(Private.messagesTags.NginxHttpsTlsQueryError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                console.log("Failed to request NGINX pre-defined HTTPS TLS Config with error: " + response.errorText);
                return false;
            }

            // Selected HTTPS TLS config
            ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "GetNginxHttpsTlsConfig",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                "",
                null);
            response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if (response != null && response["error"] == false) {
                let selectedConfig = response["result"];
                setTimeout(function () { Private.UpdateSelectedHttpsTlsVersions(selectedConfig["tlsVersions"]); }, 20);
                setTimeout(function () { Private.UpdateSelectedHttpsTlsCipherSuiteSet(selectedConfig["cipherSuitesSetId"]); }, 20);
                Private.SelectedHttpsTlsConfig = selectedConfig;
            }
            else {
                Private.AddWebconfigErrorMessage(Private.messagesTags.NginxHttpsTlsQueryError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                console.log("Failed to request NGINX HTTPS TLS Config with error: " + response.errorText);
                return false;
            }
            return true;
        },
        SetSelectedHttpsTlsCipherSuiteSet: function (cipherSuitesSetId) {
            Private.UpdateSelectedHttpsTlsCipherSuiteSet(cipherSuitesSetId);
        },
        UpdateSelectedHttpsTlsVersionsList: function (selectedTlsVersions) {
            Private.SelectedHttpsTlsConfig["tlsVersions"] = selectedTlsVersions;
        },
        ApplySetHttpsTlsConfig: function () {
            let requestData = JSON.stringify(Private.SelectedHttpsTlsConfig);
            let ajaxReqConfig = AjaxInterface.CreateSyncRequestConfig(
                Private.dpScriptName + "SetNginxHttpsTlsConfig",
                AjaxInterface.AjaxRequestType.POST,
                AjaxInterface.AjaxRequestDataType.JSON,
                requestData, null);
            let response = AjaxInterface.PerformSyncRequest(ajaxReqConfig);
            if (response["error"] == false) {
                return true;
            }
            else {
                Private.AddWebconfigErrorMessage(Private.messagesTags.NginxHttpsTlsConfigError, WebConfiguration.FormatErrorValues(response["result"], response["errorText"]));
                return false;
            }
        },
        ClearComponentMessages: function () {
            Private.ClearWebconfigErrorMessages(Private.globalMessagesContainerId);
            Private.ClearWebconfigInfoMessages(Private.globalMessagesContainerId);
        },
        DisableHttpsConfigElements: function () {
            Private.DisableHttpsConfigElements();
        },
        FormatErrorValues: function (errorCode, errorMessage) {
            let formattedError = ($("#id_webconfig_sm_opt_msg_error_code_info").text() + " " + errorCode + " | "
                + $("#id_webconfig_sm_opt_msg_error_msg_info").text() + ": " + errorMessage);
            return formattedError;
        }
    }

    // Private Part
    let Private = {
        dpScriptName: "module/Wcm/WcmDp/",
        globalMessagesContainerId: "id_webconfig_global_messages_div",
        messagesTags: {
            NginxHttpsTlsConfigError: "c_webconfig_error_set_tls_configs",
            NginxHttpsTlsQueryError: "c_webconfig_error_query_https_tls_config",
            NginxHttpsCertConfigError: "c_webconfig_error_set_httpscert_configs",
            NginxHttpsCertQueryError: "c_webconfig_error_query_https_cert_config",
            ListIdentityStoresError: "c_webconfig_error_list_identitystores",
            HttpsCertRegenerateError: "c_webconfig_generate_certificate_status_error",
            HttpsCertRegeneratedInfo: "c_webconfig_generate_certificate_status_ok",
            WebconfigSuccessfullApplyInfo: "c_webconfig_info_successfull_apply"
        },
        PredefinedHttpsTlsConfig: null,
        SelectedHttpsTlsConfig: [],
        GetConfiguredCertificateInfo: function () {
            let certificateInfo = {};
            let distinguishedName = {};
            let validityPeriod = {};
            let subjectAlternativeNames = [];

            distinguishedName.commonName = $("#id_webconfig_cert_info_cn_input").val();
            distinguishedName.organizationName = $("#id_webconfig_cert_info_o_input").val();
            distinguishedName.organizationalUnit = $("#id_webconfig_cert_info_ou_input").val();
            distinguishedName.location = $("#id_webconfig_cert_info_l_input").val();
            distinguishedName.stateOrProvinceName = $("#id_webconfig_cert_info_st_input").val();
            distinguishedName.countryName = $("#id_webconfig_cert_info_c_input").val();
            certificateInfo.distinguishedName = distinguishedName;

            let dateValue = $("#id_webconfig_cert_validity_notbefore_date_input").val();
            let timeValue = $("#id_webconfig_cert_validity_notbefore_time_input").val();
            let timeStampStr = this.ConvTimestampToRfc5280Format(dateValue, timeValue);
            validityPeriod.ValidNotBefore = timeStampStr;

            dateValue = $("#id_webconfig_cert_validity_notafter_date_input").val();
            timeValue = $("#id_webconfig_cert_validity_notafter_time_input").val();
            timeStampStr = this.ConvTimestampToRfc5280Format(dateValue, timeValue);
            validityPeriod.ValidNotAfter = timeStampStr;

            certificateInfo.validityPeriod = validityPeriod;
            $('#id_webconfig_nginx_san_config_table').find('tbody>tr:not(".exclude")').each(function (idx, row) {
                let subjectAlternativeName = {};
                let sanNumber = $(row).attr("san-number");
                subjectAlternativeName.type = $("#id_webconfig_cert_san_" + sanNumber + "_type_select option:selected").val();
                subjectAlternativeName.value = $("#id_webconfig_cert_san_" + sanNumber + "_input").val();
                subjectAlternativeNames.push(subjectAlternativeName);
            });
            certificateInfo.subjectAlternativeNames = subjectAlternativeNames;

            return certificateInfo;
        },
        GetTimestampFromRfc5280Format: function (rfcTimeStamp) {
            let timestamp = {};
            let formatRegex = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(Z)/;
            var dateArray = formatRegex.exec(rfcTimeStamp);
            if (dateArray.length == 8) {
                timestamp.date = dateArray[3] + "." + dateArray[2] + "." + dateArray[1];
                timestamp.time = dateArray[4] + ":" + dateArray[5] + ":" + dateArray[6];
            }
            else {
                console.error("Undefined RFC time stamp for ", rfcTimeStamp);
                timestamp = null;
            }
            return timestamp;
        },
        ConvTimestampToRfc5280Format: function (dateFieldVal, timeFieldVal) {
            let timeStamp = moment(dateFieldVal + ' ' + timeFieldVal, "DD.MM.YYYY h:mm:ss").toDate();
            let timeStampStr = "";
            if (timeStamp != "Invalid Date") {
                timeStampStr = ("00" + timeStamp.getFullYear()).slice(-4)
                    + ("0" + (timeStamp.getMonth() + 1)).slice(-2)
                    + ("0" + timeStamp.getDate()).slice(-2)
                    + ("0" + timeStamp.getHours()).slice(-2)
                    + ("0" + timeStamp.getMinutes()).slice(-2)
                    + ("0" + timeStamp.getSeconds()).slice(-2)
                    + "Z";
            }
            else {
                console.log("Invalid Date Format!");
            }
            return timeStampStr;
        },
        BuildHttpsTlsVersionsTableContent: function (tlsVersions) {
            let contentRowSpan = (tlsVersions.length + 1);
            $("#id_webconfig_tls_versions_config_td").attr("rowspan", contentRowSpan);
            let tlsVersionsRowsHtml = "";
            $(tlsVersions).each(function (idx, tlsVersion) {
                let formattedVersion = tlsVersion.replace(".", "");
                tlsVersionsRowsHtml += '<tr><td><div>'
                    + '<input class="tls-version-cb"id="id_webconfig_tls_version_' + formattedVersion + '_cb" type="checkbox" name="' + tlsVersion + '"style="display: inline-block; width:30px;"/>'
                    + '<span  id="id_webconfig_tls_version_' + formattedVersion + '_use_span" class="c_webconfig_config_use">Use </span>'
                    + '<span  id="id_webconfig_tls_version_' + formattedVersion + '_value_span" style="font-weight:bold;">' + tlsVersion + '</span>'
                    + '</div></td></tr>';
            });
            $("#id_webconfig_tls_config_version_tr").after(tlsVersionsRowsHtml);
        },
        UpdateSelectedHttpsTlsVersions: function (tlsVersions) {
            $(tlsVersions).each(function (idx, tlsVersion) {
                let formattedVersion = tlsVersion.replace(".", "");
                $("#id_webconfig_tls_version_" + formattedVersion + "_cb").prop("checked", true);
            });
        },
        BuildHttpsTlsCipherSuitesTableContent: function (cipherSuitesSets) {
            let cipherSuitesSetOptionsHtml = "";
            $(cipherSuitesSets).each(function (idx, cipherSuitesSet) {
                cipherSuitesSetOptionsHtml += '<option value="' + cipherSuitesSet.identifier + '" class="c_webconfig_ciphers_set_' + cipherSuitesSet.identifier + '_name">'
                                           +   cipherSuitesSet.name + '</option>';
            });

            $("#id_webconfig_cipher_suite_select").html(cipherSuitesSetOptionsHtml);
        },
        UpdateSelectedHttpsTlsCipherSuiteSet: function (cipherSuitesSetId) {
            $("#id_webconfig_cipher_suite_select").val(cipherSuitesSetId);
            let cipherSuitesSet = Private.ArrayLookup(this.PredefinedHttpsTlsConfig.cipherSuitesSets, "identifier", cipherSuitesSetId);
            if (cipherSuitesSet != null) {
                $("#id_webconfig_cipher_suites_textarea").text(cipherSuitesSet["value"]);
                this.SelectedHttpsTlsConfig["cipherSuitesSetId"] = cipherSuitesSetId;
            }
        },
        ArrayLookup(array, prop, value) {
            let result = null;
            $(array).each(function (idx, arrayElement) {
                if (arrayElement && arrayElement[prop] === value) {
                    result = arrayElement;
                    return false;
                }
            });
            return result;
        },
        AddWebconfigErrorMessage: function (errorLanTag, errorText) {
            if($("#id_webconfig_error_" + errorLanTag + "_span").length)
            {
                return;
            }
            let messageHtml = '<div class="c_webconfig_error_message_box" style="margin: 3px 0;">'
                + '<div class="pxc-error-general-msg-wrp"><div class="pxc-error-msg">'
                + '<div class="pxc-exclamation"><div>!</div></div>'
                + '<span class="pxc-msg-txt ' + errorLanTag + '" id="id_webconfig_error_' + errorLanTag + '_span"></span>'
                + '<span class="c_webconfig_error_message" style="display: inline-block; margin: 0 24px;"></span>'
                + '<span style="display: inline-block; margin: 0 -20px;">' + errorText + '</span>'
                + '</div>'
                + '</div></div>';
            let errorMessage = $(messageHtml).hide();
            $("#" + Private.globalMessagesContainerId).prepend(errorMessage);
            $("#" + Private.globalMessagesContainerId).find("div.c_webconfig_error_message_box").fadeIn("slow");

            Language.UpdateActivePageMessages();
        },
        AddWebconfigInfoMessage: function (messageLanTag) {
            let messageHtml = '<div class="c_webconfig_info_message_box" style="margin: 3px 0;">'
                + '<div class="pxc-info-general-msg-wrp"><div class="pxc-info-msg">'
                + '<div class="pxc-information"><div>!</div></div>'
                + '<span class="pxc-msg-txt ' + messageLanTag + '"></span>'
                + '</div>'
                + '</div></div>';
            let infoMessage = $(messageHtml).hide();
            $("#" + Private.globalMessagesContainerId).prepend(infoMessage);
            $("#" + Private.globalMessagesContainerId).find("div.c_webconfig_info_message_box").fadeIn("slow");

            Language.UpdateActivePageMessages();
        },
        ClearWebconfigInfoMessages: function (containerId) {
            $("#" + containerId).find("div.c_webconfig_info_message_box").remove();
        },
        ClearWebconfigErrorMessages: function (containerId) {
            $("#" + containerId).find("div.c_webconfig_error_message_box").remove();
        },
        DisableHttpsConfigElements: function () {
            $("#id_webconfig_nginx_config_table :input").attr("disabled", true);
            $("#id_webconfig_nginx_san_config_table :input").attr("disabled", true);
            $("#id_webconfig_apply_config_button").attr("disabled", true);
        },
    }

    return Public;
})();

function ReloadPage() {
    location.reload();
    window.location.href = "#extensions/Wcm/WebConfiguration.html";
}


function UpdatePlaceHolders() {
    $("#id_webconfig_cert_validity_notbefore_date_input").attr("placeholder", $("#id_webconfig_date_placeholder_span").text());
    $("#id_webconfig_cert_validity_notbefore_time_input").attr("placeholder", $("#id_webconfig_time_placeholder_span").text());

    $("#id_webconfig_cert_validity_notafter_date_input").attr("placeholder", $("#id_webconfig_date_placeholder_span").text());
    $("#id_webconfig_cert_validity_notafter_time_input").attr("placeholder", $("#id_webconfig_time_placeholder_span").text());
}

function OnConnectionError(error) {
    $("#id_webconfig_sm_messages_div span:not('.exclude')").each(function () {
        $(this).hide();
    });
    alert($("#id_webconfig_sm_connection_error_span").text + " " + error);
}

function EncodeURIComponent(data) {
    let encodedData = data.replace(/ /g, "%20");
    return encodeURIComponent(encodedData);
}
