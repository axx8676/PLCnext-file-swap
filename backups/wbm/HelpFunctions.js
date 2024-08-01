LastSelectedLocationHref = "";

window.onload = function()
{
    LastSelectedLocationHref = window.location.href;
    //Check if this dialog was called manually
    if (window.location.pathname.indexOf("Main.html") == -1)
    {
        var sCompleteURL = window.location.href;
        var sPage = sCompleteURL.substring(sCompleteURL.lastIndexOf('/') + 1);
        var sPath = sCompleteURL.substring(0, sCompleteURL.lastIndexOf('/') + 1);
        window.location.href = sPath + "Main.html#" + sPage;
    }
};

$(document).ready( function()
{
    //Set the title of this html page as document title. This is not done by default because of the ajax load of this page.
    setTitle(document.getElementById('id_div_maincontentpanel').innerHTML);
});

function setTitle(HTMLAsText)
{
    if(HTMLAsText.toString().indexOf("<title>") == -1 || HTMLAsText.toString().indexOf("</title>") == -1)
        return;
    document.getElementsByTagName('title')[0].innerHTML = HTMLAsText.substring(HTMLAsText.toString().indexOf("<title>") + 7, HTMLAsText.toString().indexOf("</title>"));
}

$(document).ajaxComplete(function() {
    //$("#id_main_div_loader").hide();
});

// Catch event when leaving the page and clean up data
$(document).on('DOMNodeRemoved', "#id_div_maincontentpanel", function(e) {
    
    event.stopImmediatePropagation();
    if(LastSelectedLocationHref == event.target.baseURI)
        {
            event.preventDefault();
            return false;
        }
        
    if((typeof SubPageActive !== 'undefined') && (SubPageActive != null) && $(e.target).is('title') && (document.title == $(e.target).text()))
    {
        if(typeof CleanUpPageData !== 'undefined')
        {
            console.log("Cleaning up data for page " + $(e.target).text());
            LastSelectedLocationHref = event.target.baseURI;
            try
            {   
                CleanUpPageData();
            }
            catch(e)
            {
                console.warn("An error occurred cleaning up date for page " + $(e.target).text(), e);
            }
        }
        
        console.log('Page ' + $(e.target).text() + ' left');
    }
    e.preventDefault();
});

jQuery.cachedScript = function( url, options ) {
    options = $.extend( options || {}, {
        dataType: "script",
        cache: true,
        url: url
    });
    return jQuery.ajax( options );
};

function MsDelay(t, v)
{
    return new Promise(function(resolve) { 
       setTimeout(resolve.bind(null, v), t)
   });
}