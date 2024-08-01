$(document).ready(function()
{
    $("#id_div_loader").show();
    
    setTimeout(LoadLicensesFile, 50);

});

function LoadLicensesFile()
{
    $.get('Licenses.txt', function(data) {
        console.log("File Licenses.txt has been loaded...");
        var lines = data.split(/(?!\n)/g);
        var str = "";
        $.each(lines, function(n, elem) {
            
            str += elem;
            if((n % 70 == 0) || (n == (lines.length - 1)))
            {
                $('#id_Licenses_txt_pre').append(str);
                str = "";
            }
        });
        // Load WbmLicenses.txt file
        setTimeout(LoadWbmLicensesFile, 200);
    }, "text");
    
}

function LoadWbmLicensesFile()
{
    $.get('WbmLicenses.txt', function(data) {
        console.log("File WbmLicenses.txt has been loaded...");
        var lines = data.split(/(?!\n)/g);
        var str = "";
        $.each(lines, function(n, elem) {
            
            str += elem;
            if((n % 70 == 0) || (n == (lines.length - 1)))
            {
                $('#id_WbmLicenses_txt_pre').append(str);
                str = "";
            }
        });
        // Load WelcomeLicenses.txt file
        setTimeout(TryLoadSplcLicensesFile, 200);
    }, "text");
}

function TryLoadSplcLicensesFile()
{
    $.get('SplcLicenses.txt', function(data) {
        console.log("File SplcLicenses.txt has been loaded...");
        var lines = data.split(/(?!\n)/g);
        var str = "";
        $.each(lines, function(n, elem) {
            
            str += elem;
            if((n % 70 == 0) || (n == (lines.length - 1)))
            {
                $('#id_SplcLicenses_txt_pre').append(str);
                str = "";
            }
        });
        // Load WelcomeLicenses.txt file
        setTimeout(LoadWelcomeLicensesFile, 200);
    }, "text")
    .fail(function() {
        console.log( "Splc licenses file not found amd will be skipped");
        setTimeout(LoadWelcomeLicensesFile, 200);
    });
}

function LoadWelcomeLicensesFile()
{
    $.get('WelcomeLicenses.txt', function(data) {
        console.log("File WelcomeLicenses.txt has been loaded...");
        var lines = data.split(/(?!\n)/g);
        var str = "";
        $.each(lines, function(n, elem) {
            
            str += elem;
            if((n % 70 == 0) || (n == (lines.length - 1)))
            {
                $('#id_WelcomeLicenses_txt_pre').append(str);
                str = "";
            }
        });        
        $("#id_div_loader").hide();
    }, "text");
}