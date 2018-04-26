
var isTesting = false;
var surl = "";
if (isTesting == true){
    surl = "js/main/main-init.js";
} else {
    surl = "https://drive.google.com/uc?export=download&id=1re3_74fbDteTI_D3Eg54qlde3X2k-dOJ"
}

/*
https://s3.amazonaws.com/gmmonlinecourse2017/gmm_app/main-init.js -- amazon s3
https://rawgit.com/redeleon/growmymusic/master/main-init.js -- rawgit CDN
*/

function loadApp(){
    $.getScript( surl, function( data, textStatus, jqxhr ) {
      console.log( data ); // Data returned
      console.log( textStatus ); // Success
      console.log( jqxhr.status ); // 200
      console.log( "main scrit loaded" );
      initApp();
    });
}

function initPage() {
    $.getJSON("https://s3.amazonaws.com/gmmonlinecourse2017/gmm_app/templates.json", function(data) {
        var templates = data.data;
        var texts = data.texts;
        var templateHtml = "";
        templates.forEach(function(obj) { 
            templateHtml = templateHtml + obj.html
        });
        texts.forEach(function(obj) { 
            $(obj.element).html(obj.text);
        });

        $('#handlebar-templates').html(templateHtml);

        // TEMPLATES LOADED CONTINUE WITH PAGE LOAD
        console.log( "templates loaded" );
        loadApp();

    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        alert( "Request Failed: ( " + err + " ) please try again later");
    });

    
}

document.addEventListener('deviceready', initPage, false);
