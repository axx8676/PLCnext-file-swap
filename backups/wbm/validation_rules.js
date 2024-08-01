currentValidationLanguage = "not selected";

function Validation(a)
{
    jQuery.validator.setDefaults({
        errorClass: "pxc-msg-txt",
        errorPlacement: function(a, b) {
            b.parent().append(a).find("label.pxc-msg-txt").before('<div class="pxc-exclamation"><div>!</div></div>');
            a.addClass("pxc-error-msg")
        },
        wrapper: "div",
        debug: true/*,
        ignore: []*/
    });
    // General: Numeric input field
    $.validator.addMethod("NumericInputChecker", function(a) {
        return a.match(/^[-]?\d+$/);
    });
    $.validator.addMethod("PositiveNumericInputChecker", function(a) {
        return a.match(/^\d+$/);
    });
    // General: Numeric input field with max sum
    $.validator.addMethod("CheckMaxInputSum", function(value, element, params) {        
    let inputfields = $(':input.summed-numeric-input');
    let numericValue = 0;
    $.each( inputfields , function(idx, inputfield) {
        numericValue += parseInt($(inputfield).val());
        });
    return (numericValue <= params);
    });

    // General: Empty table checker
    $.validator.addMethod("EmptyTableChecker", function(a, b) {
        let tableID = $(b).closest('table').attr('id');
        let elementsSize = $('#' + tableID).find('tbody>tr:not(".exclude")').length;
        return (elementsSize > 0);
    });
    // General -IP: Simple IP-Address: <0-254>.<0-254>.<0-254>.<0-254>
    $.validator.addMethod("IpV4Checker", function(a) {
        return a.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
    });
    // General -IP: Optional Simple IP-Address: <0-254>.<0-254>.<0-254>.<0-254>
    $.validator.addMethod("OptIpV4Checker", function(a) {
        if(a.length > 0)
        {
            return a.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
        }
        else
        {
            return true;
        }
    });
	
    // General - IP: DNS - Domain name 
    $.validator.addMethod("DnsNameChecker", function(a) {
        return a.match(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/);
    });
    // General - IP: Subnet 
    $.validator.addMethod("SubnetChecker", function(a) {
        return a.match(/^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/);
    });
    // General - IP: Gateway 
    $.validator.addMethod("GatewayChecker", function(a) {
        return a.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
    });
    // General -IP: Hostname - Valid IP-Address or valid Domain name 
    $.validator.addMethod("HostNameChecker", function(a) {
        if(CheckIfIpAddress(a))
        {
            return a.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
        }
        else
        {
            return a.match(/^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/);
        }
    });
    
    // General: Port 
    $.validator.addMethod("PortChecker", function(a) {
        return a.match(/^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/);
    });
    $.validator.addMethod("CheckMaxBytesLength", function(value, element, params) {
        return (new Blob([value]).size <= params);
    });

    // General: Check if minimum one checkbox of a given class is checked
    $.validator.addMethod("MinCheckboxChecker", function(value, element, params) {
        let elementsGroup = $(element).attr("elements-group");
        let boxes = $(':checkbox.' + elementsGroup);
        if (boxes.filter(':checked').length < params) {
          return false;
        }
        return true;
    });
    // General: Check if an element for a given class has already the given value (e.g. to detect duplicated items)
    $.validator.addMethod("DuplicatedValuesChecker", function(value, element, params) {
        let isValid = true;
        let elementsGroup = $(element).attr("elements-group");
        let elementType = $(element).attr("element-type");
        let skipElement = ($(element).attr("skip-on-value") == value);
        if(skipElement == false && elementType == "input")
        {
            let inputElements = $(':input.' + elementsGroup);
            $.each( inputElements, function( idx, inputElement) {
                if($(inputElement).val() == value)
                {
                    isValid = true;
                    return false;
                }
            });
        }
        if(skipElement == false && elementType == "span")
        {
            let spanElements = $('span.' + elementsGroup);
            $.each( spanElements, function( idx, spanElement) {
                if($(spanElement).text().trim() == value.trim())
                {
                    isValid = false;
                    return false;
                }
            });
        }
        return isValid;
    });
    
    // Notification Log: Date Format
    $.validator.addMethod("DateFormatChecker", function(a) {
        
        if(a.length > 0)
        {
            return (a.length == 10 && a.match(/^(?:(?:31(\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/));
        }
        return true;
    });
    // Notification Log: Date Field is required when timefield is not empty
    $.validator.addMethod("NflogDateFieldRequired", function(value, element, params) {
        var timeField = $(element).parent().find(".nflog-date");
        if(typeof timeField != undefined && value.length > 0)
        {
            timeField.trigger("keyup");
            return timeField.val().length > 0;
        }
        return true;
    });
    // Notification Log: Time Format hh:mm:ss
    $.validator.addMethod("TimeFormatChecker", function(a) { 
        if(a.length > 0)
        {
            return (a.length == 8 && a.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9])$/));
        }
        return true;
    });
    // Notification Log: Sender Name
    $.validator.addMethod("NflogSenderNameChecker", function(a) {
        var Nflog_SenderInputInvalidCharacters = '&/\\\'",';
        for(var i = 0; i < Nflog_SenderInputInvalidCharacters.length ; i++)
        {
            if((index = a.indexOf(Nflog_SenderInputInvalidCharacters[i])) >= 0)
            {
                return false;
            }
        }
        return true;
    });
    // Firewall Management: IPv4 Addresses 
    //                      1. Simple IP-Address: <0-254>.<0-254>.<0-254>.<0-254>
    //                      2. IP-Address Range: <From IP-Address> - <To IP-Address>, <To IP-Address> must be greater than <From IP-Address>
    $.validator.addMethod("FwIpV4Checker", function(a) {
        let isValid = true;
        let ipAddresses = a.replace(/\ /g, '').split("-");

        if(ipAddresses.length < 1 || ipAddresses.length > 2)
        {
            isValid = false;
        }
        $.each( ipAddresses, function( idx, ipAddress) {
            if(!ipAddress.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/))
            {
                isValid = false;
                return false;
            }
        });
        
        if(isValid == true && ipAddresses.length == 2)
        {
            let ipAddr1 = parseInt(ipAddresses[0].replace(/[.]/g, ""));
            let ipAddr2 = parseInt(ipAddresses[1].replace(/[.]/g, ""));
            
            if(isNaN(ipAddr1) || isNaN(ipAddr2) || ipAddr1 >= ipAddr2)
            {
                isValid = false;
            }
        }
        return isValid;
    });
    // Firewall Management: Ports
    $.validator.addMethod("FwPortChecker", function(a) {
        var isValid = true;
        if(a != "")
        {
            let ports = a.replace(/[ ]/g, "").split("-");
            if(ports.length < 1 || ports.length > 2)
            {
                isValid = false;
            }
            $.each( ports, function( idx, port) {
                if(!port.match(/^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/))
                {
                    isValid = false;
                    return false;
                }
            });
            
            if(ports.length == 2)
            {
                var port1 = parseInt(ports[0]);
                var port2 = parseInt(ports[1]);
                if(isNaN(port1) || isNaN(port2) || port1 >= port2)
                {
                    isValid = false;
                }
            }
        }
        return isValid;
    });
    // Firewall Management: Comments
    $.validator.addMethod("FwCommentChecker", function(a) {
        var Fw_CommentsInvalidCharacters = '&/\\\'"=#,';
        for(var i = 0; i < Fw_CommentsInvalidCharacters.length ; i++)
        {
            if((index = a.indexOf(Fw_CommentsInvalidCharacters[i])) >= 0)
            {
                return false;
            }
        }
        return true;
    });
    // Certificate Authentication: InvalidChars
    $.validator.addMethod("CertInvalidCharChecker", function(a) {
        var Cert_IvalidCharacters = '/\\';
        for(var i = 0; i < Cert_IvalidCharacters.length ; i++)
        {
            if((index = a.indexOf(Cert_IvalidCharacters[i])) >= 0)
            {
                return false;
            }
        }
        return true;
    });
    // Certificate Authentication: InvalidChars
    $.validator.addMethod("CertStoreBeginCharChecker", function(a) {
        if(a.length > 0 && a[0] == '.')
        {
            return false;
        }
        return true;
    });
    // Certificate Authentication: PEM content with Base64 encoded string(RFC 4648)
    $.validator.addMethod("Base64PemChecker", function(a) {
        var pemString = a.replace(/\r?\n|\r/g, ''); // Remove all new Lines
        // Validate PEM content format: -----BEGIN <[A-Z ]*>-----<Base 64 String>-----END <[A-Z]*>-----
        var pemRegexMatches = pemString.match(/^-{5}(?:BEGIN)( [a-zA-Z0-9 ]+?)-{5}(?:(.*?))-{5}(?:END)( [a-zA-Z0-9 ]+?)-{5}$/);
        if(pemRegexMatches != null && typeof pemRegexMatches.length != undefined && pemRegexMatches.length == 4)
        {
            var base64String = pemRegexMatches[2].replace(/\ /g, ''); // Get Base64 String and remove all spaces 
            if(base64String.match(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/))
            {
                return true;    
            }
        }    
        return false;
    });
    // User Management: Check invalid characters in user name;
    $.validator.addMethod("UmInvalidUsernameCharsChecker", function(a) {
        var Username_InvalidCharacters = '/\\$()';
        for(var i = 0; i < Username_InvalidCharacters.length ; i++)
        {
            if((index = a.indexOf(Username_InvalidCharacters[i])) >= 0)
            {
                return false;
            }
        }
        return true;
    });
    // License Management: Check invalid characters in username;
    $.validator.addMethod("LmInvalidUsernameCharsChecker", function(a) {
        if(a.length > 0)
        {
            return a.match(/^[a-zA-Z0-9_\-\s]+$/);
        }
        else
        {
            return true;    
        }
    });
    // User Management - Ldap Configs: Distinguished Name
    $.validator.addMethod("DistinguishedNameChecker", function(a) {
        if(a.length > 0)
        {
            return a.match(/^(?:(CN|cn)=[^,]*,)?(?:(?:(?:CN|cn|OU|ou)=[^,]+,?)+,)?(?:(DC|dc)=[^,]+,?)+$/);
        }
        else
        {
            return true;    
        }
    });
    // User Management - Ldap Configs: CipherList
    $.validator.addMethod("CipherListChecker", function(a) {
        if(a.length > 0)
        {
            return a.match(/^(@KEYWORD|PERFORMANCE|NORMAL|LEGACY|PFS|SECURE128|SECURE192|SECURE256|SUITEB128|SUITEB192|NONE)(?::+(?:[+!-]?[A-Z.0-9])*)*$/);
        }
        else
        {
            return true;    
        }
    });
    // User Management - Ldap Configs: Password confirmation
    $.validator.addMethod("ConfirmPasswordChecker", function(value, element, params) {
        let valid = false;
        if(typeof $(element).attr("mainpasswd") !== "undefined")
        {
            valid = (value == $("#" + $(element).attr("mainpasswd")).val());
        }
        else if(typeof $(element).attr("confirmpasswd") !== "undefined")
        {
            valid = (value == $("#" + $(element).attr("confirmpasswd")).val());
        }
        else
        {
            valid = true;
        }
        return valid;
    });
    // LDAP: Trust Store name
    $.validator.addClassRules({
        "ldap-cert-store": {
            CertInvalidCharChecker: true,
            CertStoreBeginCharChecker: true,
            CheckMaxBytesLength: 63
        }
    }),
    // WebConfigs: IP Address checker => IP Address will be checked if correspondig SAN type is IpAddress
    $.validator.addMethod("SanIpAddressChecker", function(value, element, params) {
        let sanNumber = $(element).parent().attr("san-number");
        let sanType = $("#id_webconfig_cert_san_" + sanNumber + "_type_select option:selected").val();
        if(sanType == "IpAddress")
        {
            return value.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
        }
        return true;
    });
    // WebConfigs: DnsName checker => Dns Name will be checked if correspondig SAN type is DnsName
    $.validator.addMethod("SanDnsNameChecker", function(value, element, params) {
        let sanNumber = $(element).parent().attr("san-number");
        let sanType = $("#id_webconfig_cert_san_" + sanNumber + "_type_select option:selected").val();
        if(sanType == "DnsName")
        {
            return value.match(/^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/);
        }
        return true;
    });
    // WebConfigs: Certificate validity Date Checker
    $.validator.addMethod("CertValidityDateRequired", function(value, element, params) {
        if(value.length == 0)
        {
            if($(element).attr("id") == "id_webconfig_cert_validity_notbefore_date_input")
            {
                return ($("#id_webconfig_cert_validity_notbefore_time_input").val().length == 0); 
            }
            if($(element).attr("id") == "id_webconfig_cert_validity_notafter_date_input")
            {
                return ($("#id_webconfig_cert_validity_notafter_time_input").val().length == 0); 
            }
        }
        
        return true;
    });
    // WebConfigs: Certificate validity uhr/time Checker
    $.validator.addMethod("CertValidityTimeRequired", function(value, element, params) {
        if(value.length == 0)
        {
            if($(element).attr("id") == "id_webconfig_cert_validity_notbefore_time_input")
            {
                return ($("#id_webconfig_cert_validity_notbefore_date_input").val().length == 0); 
            }
            if($(element).attr("id") == "id_webconfig_cert_validity_notafter_time_input")
            {
                return ($("#id_webconfig_cert_validity_notafter_date_input").val().length == 0); 
            }
        }
        
        return true;
    });
    // WebConfigs: WLAN SSID and Passwort
    $.validator.addMethod("InvalidWlanConfigCharsChecker", function(value, element, params) {
        var InvalidWlanConfigChars = '"';
        for(var i = 0; i < InvalidWlanConfigChars.length ; i++)
        {
            if((index = value.indexOf(InvalidWlanConfigChars[i])) >= 0)
            {
                return false;
            }
        }
        
        for(var x = 0; x < value.length; x++)
        {
            if(value.charCodeAt(x) < 32 || value.charCodeAt(x) == 127)
            {
                return false;
            }
        }
        
        return true;
    });
    $.validator.addMethod("IsValidAsciiString", function(value, element, params) {
        return value.match(/^[\x21-\x7E]+$/);
    });
    function CheckIfIpAddress(hostName)
    {
        let result = true;
        if(typeof hostName !== "undefined")
        {
            let hostNameElements = hostName.split(".");
            $.each(hostNameElements, function( index, hostNameElement ){
                if(isNaN(hostNameElement))
                {
                    result = false;
                }
            });
        }
        else
        {
            result = false;
        }
        return result;
    };
    (currentValidationLanguage != Language.GetSelectedLanguage() && $.getScript("language/validation_messages_" + Language.GetSelectedLanguage() + ".js").done(function() {}), $(a).validate({}), 
        currentValidationLanguage = Language.GetSelectedLanguage(),
        // General: nummeric input
        $.validator.addClassRules({
            "numeric-input": {
                NumericInputChecker: true
            }
        }),
        $.validator.addClassRules({
            "positive-numeric-input": {
                PositiveNumericInputChecker: true
            }
        }),
        // General: summed up nummeric input
        $.validator.addClassRules({
            "summed-numeric-input": {
                digits: true,
                NumericInputChecker: true,
                CheckMaxInputSum: 127
            }
        }),

        // General - IP: Ip Address
        $.validator.addClassRules({
            "ipv4": {
                IpV4Checker: true,
            }
        }),
        // General - IP: Ip Address (optional)
        $.validator.addClassRules({
            "opt-ipv4": {
                OptIpV4Checker: true,
                required: false
            }
        }),
        // General - IP: Subnet
        $.validator.addClassRules({
            "subnet": {
                SubnetChecker: true
            }
        }),
        // General - IP: Dns Name
        $.validator.addClassRules({
            "dns-name": {
                DnsNameChecker: true,
            }
        }),
        // General - IP: Gateway
        $.validator.addClassRules({
            "gateway": {
                GatewayChecker: true,
            }
        }),
        // General: Host
        $.validator.addClassRules({
            "hostname": {
                required: true,
                maxlength: 255,
                HostNameChecker: true
            }
        }),
        // General: Port
        $.validator.addClassRules({
            "port": {
                required: false,
                number: true,
                range: [0, 65535]
            }
        }),
        // General: WLAN SSID
        $.validator.addClassRules({
            "wlan-ssid": {
                required: false,
                maxlength: 32,
                InvalidWlanConfigCharsChecker: true
            }
        }),
        // General: WLAN Password
        $.validator.addClassRules({
            "wlan-password": {
                required: false,
                maxlength: 63,
                InvalidWlanConfigCharsChecker: true
            }
        }),
        // General: Checkbox
        $.validator.addClassRules({
            "min-checkbox-checked": {
                MinCheckboxChecker: 1
            }
        }),
        // General: unique value
        $.validator.addClassRules({
            "unique-value": {
                DuplicatedValuesChecker: 1
            }
        }),
        // SPLC Notification Configutation: FAddress Ranges
        $.validator.addClassRules({
            "faddress-range": {
                required: true,
                number: true,
                range: [1, 65534]
            }
        }),
        // Notification Log: Date Format
        $.validator.addClassRules({
            "nflog-date": {
                DateFormatChecker : true
            }
        }),
        // Notification Log: Time Format
        $.validator.addClassRules({
            "nflog-time": {
                TimeFormatChecker : true,
                NflogDateFieldRequired: true
            }
        }),
        // Notification Log: Max Notifications Count
        $.validator.addClassRules({
            "max-notifications": {
                required: true,
                number: true,
                min: 1,
                max: function() {
                    return Nflog_MaxNotificationsCount;
                }
            }
        }),
        // Notification Log: Sender Name (invalid characters)
        $.validator.addClassRules({
            "nflog-sendername": {
                NflogSenderNameChecker: true,
                CheckMaxBytesLength: 511
            }
        }),
        // Firewall Management: IPv4 Addresses
        $.validator.addClassRules({
            "fw-ipv4": {
                FwIpV4Checker: true
            }
        }),
        // Firewall Management: Ports
        $.validator.addClassRules({
            "fw-port": {
                FwPortChecker: true
            }
        }),
        // Firewall Management: Comments
        $.validator.addClassRules({
            "fw-comment": {
                FwCommentChecker: true,
                CheckMaxBytesLength: 127
            }
        }),
        // Certificate Authentication: Trust/Identity Store name
        $.validator.addClassRules({
            "cert-store": {
                CertInvalidCharChecker: true,
                CertStoreBeginCharChecker: true,
                required: true,
                CheckMaxBytesLength: 63
            }
        }),
        // Certificate Authentication: PEM Certificats/Keys
        $.validator.addClassRules({
            "pem-base64": {
                required: true,
                Base64PemChecker: true
            }
        }),
        // User Authentication: User Name
        $.validator.addClassRules({
            "um-username": {
                required: true,
                maxlength: 63,
                CheckMaxBytesLength: 63,
                UmInvalidUsernameCharsChecker: true
            }
        }),
        // License Manager Client: Username
        $.validator.addClassRules({
            "lm-username": {
                required: true,
                maxlength: 32,
                CheckMaxBytesLength: 32,
                LmInvalidUsernameCharsChecker: true
            }
        }),        
        // User Authentication: User Password
        $.validator.addClassRules({
            "um-userpass": {
                required: true,
                maxlength: 127,
                CheckMaxBytesLength: 127,
                ConfirmPasswordChecker: true                
            }
        }),
        // User Authentication: Block Password
        $.validator.addClassRules({
            "um-block-passwd": {
                required: true,
                maxlength: 127,
                CheckMaxBytesLength: 127,
            }
        }),
        // User Authentication - Ldap: User Password Confirm
        $.validator.addClassRules({
            "um-userpass-confirm": {
                required: true,
                ConfirmPasswordChecker: true
            }
        }),
        // User Authentication - Ldap: User Password
        $.validator.addClassRules({
            "ldap-userpass": {
                required: false,
                ConfirmPasswordChecker: true
            }
        }),
        // User Authentication - Ldap: User Password Confirm
        $.validator.addClassRules({
            "ldap-userpass-confirm": {
                required: false,
                ConfirmPasswordChecker: true
            }
        }),
        // Ldap: Group attributes
        $.validator.addClassRules({
            "group-attributes": {
                EmptyTableChecker: true
            }
        }),
        // Ldap Configs: Distinguished Name
        $.validator.addClassRules({
            "distinguished-name": {
                //DistinguishedNameChecker: true,
                required: true
            }
        }),
        // Ldap Configs: Search filter
        $.validator.addClassRules({
            "ldap-search-filter": {
                required: true
            }
        }),
        // Ldap Configs: Search filter
        $.validator.addClassRules({
            "ldap-group-attribute": {
                required: true
            }
        }),
        // Ldap Configs: Cipher List
        $.validator.addClassRules({
            "cipher-list": {
                //CipherListChecker: true,
            }
        }),
        // Certificate generation - Subject Alternative Names
        $.validator.addClassRules({
            "subject-alternative-name": {
                required: true,
                SanIpAddressChecker: true,
                SanDnsNameChecker: true,
                maxlength: 255
            }
        }),
        // Certificate generation - Validity Date
        $.validator.addClassRules({
            "cert-validity-date": {
                DateFormatChecker: true,
                CertValidityDateRequired: true
            }
        }),
        // Certificate generation - Validity Date
        $.validator.addClassRules({
            "cert-validity-time": {
                TimeFormatChecker: true,
                CertValidityTimeRequired: true
            }
        }),
        // optional number
        $.validator.addClassRules({
            "number": {
                required: false,
                number: true
            }
        }),
        
        // NTP Client Configuration
        $.validator.addClassRules({
            "ntp-server-comment": {
                required: false,
                CheckMaxBytesLength: 63,
            }
        }),
        
        // country code
        $.validator.addClassRules({
            "country-code": {
                required: false,
                maxlength: 2
            }
        }),

        // License manager client: renewal interval
        $.validator.addClassRules({
            "lm-renewal-interval-range": {
                required: true,
                number: true,
                range: [1, 30]
            }
        }),
        
        // License manager client: renewal interval
        $.validator.addClassRules({
            "lm-release-time-range": {
                required: true,
                number: true,
                min: function() {
                        var value =  2 * $("#id_input_lmconfig_client_renewal_interval").val(); 
                        return Math.min(60, value);},
                max: 60
            }
        }),
        
        // SD-Card min secret length
        $.validator.addClassRules({
            "sdcard-secret": {
                required: true,
                IsValidAsciiString: true,
                minlength:8,
                maxlength:63,
                CheckMaxBytesLength: 63,
                ConfirmPasswordChecker: true
            }
        }),
        $.validator.addClassRules({
            "recovery-secret": {
                required: true,
                maxlength:63,
                CheckMaxBytesLength: 63,
                ConfirmPasswordChecker: true
            }
        }),
        $.validator.addClassRules({
            "ascii-string": {
                IsValidAsciiString: true
            }
        })
        
        
    )
}

function ReloadValidation(a)
{
    try
    {
       $(a).removeData('validator');
       MsDelay(20)
       .then(function()
       {
           Validation(a);
           //$(a).submit();
           return MsDelay(40)
       })
       .then(function()
       {
           console.log("### Reload validation 2")
           $(a).valid()
       });
    }catch(e){}
}
