var os = '';
var apiLink = "https://growmymusic.com";
var allCouponsLoaded = 0;
var inAppBrowserRef;
var iapList = [];
var iapPurchased = [];
var scriptPath = "";
var testMode = false;
var activeMC = 0;
var scriptVersion = 2.14;
var maintenanceMode = false;

window.onerror = function(msg, url, line, col, error){
   var extra = !col ? '' : '\ncolumn: ' + col;
   extra += !error ? '' : '\nerror: ' + error;
   // You can view the information in an alert to see things working like this:
   console.log("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);
   var errormsg = "Error: " + msg + "\nurl: " + url + "\nline: " + line + extra;

   // TODO: Report this error via ajax so you can keep track
   //       of what pages have JS issues
   var url = "https://script.google.com/macros/s/AKfycbyVzHfMvstCBWqxvyrkl7rTGdHHmLB1K2_7wI95OJNoyDL-NOg/exec"
    var parseUrl = url + "?Error=" + errormsg +"&ScriptVersion=" + scriptVersion;
    var jqxhr = $.ajax({
        url: parseUrl,
        method: "GET",
        dataType: "json"
    }).success(function() {
        console.log('errors logged');
    });

   // var suppressErrorAlert = true;
   // // If you return true, then error alerts (like in older versions of 
   // // Internet Explorer) will be suppressed.
   // return suppressErrorAlert;
}

function initApp() {
    lockAllTiles();

    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://growmymusic.com/wp-content/themes/growmymusic_new/gmmapp/gmm-overrides.css';
    document.body.appendChild(style);

    $.getScript( "https://growmymusic.com/wp-content/themes/growmymusic_new/gmmapp/gmmfs.js" )
      .done(function( script, textStatus ) {
        console.log( "fastclick downloaded" );
        $(function() {
            FastClick.attach(document.body);
        });
      })
      .fail(function( jqxhr, settings, exception ) {
        console.log( "fastclick download failed" );
    });

    $('.coupon-tab[data-loc="mb-dc-items"] p').text("One Time");

    console.log("Script version: " + scriptVersion);

    function showLoader(text) {
        $('.loader').fadeIn();
        $('.loader .loader-message').text(text);
    }

    function resetMC() {
        localStorage.removeItem("submittedspotify");
        localStorage.removeItem("submittedwritingholidays");
        localStorage.removeItem("submittedbookingagent");
        localStorage.removeItem("submittedbmg");
        localStorage.removeItem("submittedmusicsync");
        localStorage.removeItem("activemc");
    }

    function checkLocalStorageIfHasValue(storage) {
        if (typeof(storage) != "undefined") {
            return true;
        } else {
            return false;
        }
    }

    function getMobileOperatingSystem() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/windows phone/i.test(userAgent)) {
            return "windowsphone";
        }
        if (/android/i.test(userAgent)) {
            return "android";
        }
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return "ios";
        }
    }

    $('body').addClass(getMobileOperatingSystem());
    os = getMobileOperatingSystem();

    function checkIfIphoneX(){
        if (os == "ios" && screen.width == 1125 && screen.height === 2436) {
            $('body').addClass("iphonex");
        }
    }


    if (cordova) {
        screen.orientation.lock('portrait');
    }

    var shareoptions = {
        message: 'Being a muso, you should check out Grow My Music\'s Virtual Artist Manager App. It\'s amazing! http://hyperurl.co/growmymusicapp',
        subject: 'Check out Grow My Music!',
        chooserTitle: 'Share via'
    };
    var shareonSuccess = function(result) {
        console.log("Share completed? " + result.completed);
        console.log("Shared to app: " + result.app);
    };
    var shareonError = function(msg) {
        console.log("Sharing failed with message: " + msg);
    };

    function unlockTrialPeriod() {
        $('#facebookgroup').removeClass('locked');
        $('#memberscalendar').removeClass('locked');
        $('#membersdiscount').removeClass('locked');
    }

    function lockAllTiles() {
        $('body').addClass('locked');
        $('#modules').addClass('locked');
        $('#masterclass').addClass('locked');
        $('#facebookgroup').addClass('locked');
        $('#resources').addClass('locked');
        $('#memberscalendar').addClass('locked');
        $('#membersdiscount').addClass('locked');

        $('#vam-tile-main').hide();
    }

    function unlockVam() {
        console.log('Virtual Artist Manager');
        $('#facebookgroup').removeClass('locked');
        $('#memberscalendar').removeClass('locked');
        $('#membersdiscount').removeClass('locked');

        $('body').addClass('vam');
        $('body').removeClass('trial-period');
        logErrors(localStorage.user, "VAM in Account");
    }

    function unlockDm() {
        console.log('Digital Marketing in account');
        $('#digitalmarketing').removeClass('locked');
        $('#vam-tile-main').hide();
        $('body').addClass('dm');
        logErrors(localStorage.user, "Digital Marketing in Account");
    }

    function unlockCourses() {
        console.log('Full Access');
        $('#vam-tile-main').hide();
        $('body').removeClass('locked');
        $('#modules').removeClass('locked');
        $('#masterclass').removeClass('locked');
        $('#facebookgroup').removeClass('locked');
        $('#resources').removeClass('locked');
        $('body').addClass('fa');
        logErrors(localStorage.user, "Full Online Course Access Account");
        //unlockVam();
    }


    function sendWPEmail(action, data) {
        var url = "https://growmymusic.com/wp-admin/admin-ajax.php";
        var action = action;
        var httpData = data;

        performHttp(url, "post", httpData, function(response) {
            console.log(response);
        }, function(response) {
            console.log(response.status);
            console.log(response.error);
        });
    }

    function logTrial(id) {
        showLoader("Registering Trial Account");

        localStorage.setItem("firstuse", "true");

        getServerTime(function(response) {
            var time = response.data.split(' ')[0];
            var url = "https://script.google.com/macros/s/AKfycbzZ0epCX8nP24RfcdkhB7AcegKPEat_JA9DvuAYfDe8SHeJ67xU/exec";
            var jqxhr = $.ajax({
                url: url,
                method: "GET",
                dataType: "json",
                data: {
                    "Id": localStorage.id,
                    "Date": time,
                    "Email": localStorage.user
                }
            }).success(function(result) {
                $('.loader').hide();
                checkTrial(localStorage.id);
                removeAllVideos();
                localStorage.setItem("firstuse", "true");
                $('#firstuse-video-mp4').attr('src', '');
                $('#first-use').fadeOut(200);
                $('#success-trial').fadeIn();

                var fullnamewp = localStorage.firstname + " " + localStorage.lastname;
                var wpdata = {
                    "action": "logtrial",
                    "LTName": fullnamewp,
                    "LTEmail": localStorage.user
                };

                sendWPEmail('logtrial', wpdata);
            });
        }, function() {
            $('.loader').hide();
            checkTrial(localStorage.id);
            removeAllVideos();
            localStorage.setItem("firstuse", "true");
            $('#firstuse-video-mp4').attr('src', '');
            $('#first-use').fadeOut(200);
        });
    }

    function dataURItoBlob(dataURI, callback) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        var bb = new Blob([ab]);
        return bb;
    }

    function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    }

    query_to_hash = function(queryString) {
        var j, q;
        q = queryString.replace(/\?/, "").split("&");
        j = {};
        $.each(q, function(i, arr) {
            arr = arr.split('=');
            return j[arr[0]] = arr[1];
        });
        return j;
    }


    function beginSaveProfile(){
            var imageData = $('#image-data').val();

            var x = 'data:image/jpeg;base64,' + imageData;
            var y = dataURItoBlob(x);

            var randomnum = generateSerial();
            var randomjpg = randomnum + ".jpg";
            //showLoader("uploading image");

            var form = new FormData();
            form.append("file", y, randomjpg);
            form.append("action", "imagesave");

            var settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://growmymusic.com/wp-admin/admin-ajax.php",
                "method": "POST",
                "headers": {
                    "authorization": "Basic YnVubnlmaXNoY3JlYXRpdmVzOmJTRm5uQmVWb2IwU3A0Um9kUkhPeVFZYw==",
                    "cache-control": "no-cache"
                },
                "processData": false,
                "contentType": false,
                "mimeType": "multipart/form-data",
                "data": form
            }

            $.ajax(settings).done(function(response) {
                console.log(response);
                var jsonresponse = JSON.parse(response);
                localStorage.setItem('profileimg', jsonresponse.url);
                $('input#image-data').val(jsonresponse.url);
                $('.loader').hide();
                saveProfileDetailsToLocal();
            }).fail(function(response) {
                var errorResponse = JSON.stringify(response);
                var id = localStorage.user;
                logErrors(id, errorResponse);
                saveProfileDetailsToLocal();
                errorHandler("error uploading profile image to server, please try again later.");
            });
    }

    function saveProfile(type) {

        if (type == "auto") {
            console.log("autosaving profile");
            var lpi;
            var imageData = $('#image-data').val();
            if (typeof(localStorage.profile_image) != "undefined") {
                lpi = decodeURIComponent(localStorage.profile_image);
                if ( lpi == imageData ) {
                    saveProfileDetailsToLocal("auto");
                } else {
                    beginSaveProfile("auto");
                }
            } else {
                beginSaveProfile("auto");
            }
        } else {
            $('#profile-builder').fadeOut();
            var lpi;
            var imageData = $('#image-data').val();
            if (typeof(localStorage.profile_image) != "undefined") {
                lpi = decodeURIComponent(localStorage.profile_image);
                if ( lpi == imageData ) {
                    saveProfileDetailsToLocal();
                } else {
                    beginSaveProfile();
                }
            } else {
                beginSaveProfile();
            }
        }
        
        
    }

    function saveProfileDetailsToLocal(type){
        $('#image-data').removeAttr('disabled');
        var id = localStorage.id;
        var email = localStorage.user;
        var serializedForm = $('form#profile-form').serializeArray();
        var stringifiedForm = JSON.stringify(serializedForm);
        
        for ( a=0;a<serializedForm.length;a++){
            var name = serializedForm[a].name;
            var value = serializedForm[a].value;
            localStorage.setItem(name.replace(/-/g,"_"),value);
        }

        logErrors(localStorage.user,stringifiedForm);

        setProfile();
        logProfileDetails(id, serializedForm);
    }

    function logProfileDetails(id, serializedForm) {
        showLoader('profile saved. syncing profile data to server');

        var url = "https://script.google.com/macros/s/AKfycbyZrPDYs_NZ1P2K6eurv3usDQ6h8ePDx2Nd8eoITWt1vauTjb4u/exec?";
        var object = {
            "action": "create",
            "id": localStorage.id,
            "image": localStorage.profile_image,
            "name": localStorage.profile_name,
            "bio": localStorage.profile_bio,
            "website": localStorage.profile_website,
            "email": localStorage.profile_email,
            "country": localStorage.profile_country,
            "state": localStorage.profile_state,
            "city": localStorage.profile_city,
            "number": localStorage.profile_number,
            "facebook": localStorage.profile_facebook,
            "instagram": localStorage.profile_instagram,
            "twitter": localStorage.profile_twitter,
            "soundcloud": localStorage.profile_soundcloud,
            "youtube": localStorage.profile_youtube,
            "mp3": localStorage.profile_mp3,
            "genre": localStorage.profile_genre,
            "othergenre": localStorage.profile_other_genre,
            "spotify": localStorage.profile_spotify,
            "spotifycw": localStorage.profile_spotify_cowriters,
            "spotifycon": localStorage.profile_spotify_contribution,
            "apple": localStorage.profile_apple,
            "applecw": localStorage.profile_apple_cowriters,
            "applecon": localStorage.profile_apple_contribution,
            "pitch": localStorage.profile_pitch
        };

        var parameters = $.param(object);
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": url + parameters,
            "method": "GET"
        }

        $.ajax(settings).done(function(response) {
            $('.loader').hide();
            console.log(response);
        }).fail(function(response) {
            console.log(response);
            $('.loader').hide();
            // logErrors(localStorage.user, response);
            // errorHandler("error saving profile to server, please try again later.");
        });
            
        // var encodedUrl = encodeURIComponent(stringifiedForm);
        // var url = "https://script.google.com/macros/s/AKfycbxpQpj3Y9kYo98EfgDz9iDuqTxurRol-gNfwmnGktutsAGkreWP/exec";

        // var jqxhr = $.ajax({
        //     url: url + "?Id=" + id + "&Data=" + encodedUrl,
        //     method: "GET",
        //     dataType: "json",
        // }).done(function(result) {
        //     $('.loader').hide();
        //     console.log(result);
        //     logErrors(localStorage.user, 'sucessfully saved profile data');
        // }).fail(function(response) {
        //     console.log(response);
        //     $('.loader').hide();
        //     var errorResponse = JSON.stringify(response);
        //     logErrors(localStorage.user, errorResponse);
        //     errorHandler("error saving profile to server, please try again later.");
        // });
    }

    function logProfileSubmissions(type) {
        // var profile = JSON.parse(localStorage.profile);
        // var qString = "";

        // for (x = 0; x < profile.length; x++) {
        //     qString = qString + '&' + profile[x].name + "=" + profile[x].value;
        // }

        // var completeQuery = "?id=" + localStorage.id + "&type=" + type + "&submissionnumber=" + localStorage.submissionnumber + qString;
        // console.log(completeQuery);

        // var data = query_to_hash(completeQuery);
        showLoader('syncing submission data to database');
        var parsedType;

        if ( type == "bmg" ){
            parsedType = "publishers-record-labels";
        } else {
            parsedType = type;
        }
        var url = "https://script.google.com/macros/s/AKfycbz_AFWtWCC0nnoDd_DE2zzYsqg4V6Q7dQSxXwUnfWUwjJzi3rL-/exec?";
        var object = {
            "submissionnumber": localStorage.submissionnumber,
            "type":parsedType,
            "id": localStorage.id,
            "profile-image": localStorage.profile_image,
            "profile-name": localStorage.profile_name,
            "profile-bio": localStorage.profile_bio,
            "profile-website": localStorage.profile_website,
            "profile-email": localStorage.profile_email,
            "profile-country": localStorage.profile_country,
            "profile-state": localStorage.profile_state,
            "profile-city": localStorage.profile_city,
            "profile-number": localStorage.profile_number,
            "profile-facebook": localStorage.profile_facebook,
            "profile-instagram": localStorage.profile_instagram,
            "profile-twitter": localStorage.profile_twitter,
            "profile-soundcloud": localStorage.profile_soundcloud,
            "profile-youtube": localStorage.profile_youtube,
            "profile-mp3": localStorage.profile_mp3,
            "profile-genre": localStorage.profile_genre,
            "profile-other-genre": localStorage.profile_other_genre,
            "profile-spotify": localStorage.profile_spotify,
            "profile-spotify-cowriters": localStorage.profile_spotify_cowriters,
            "profile-spotify-contribution": localStorage.profile_spotify_contribution,
            "profile-apple": localStorage.profile_apple,
            "profile-apple-cowriters": localStorage.profile_apple_cowriters,
            "profile-apple-contribution": localStorage.profile_apple_contribution,
            "profile-pitch": localStorage.profile_pitch
        };

        var parameters = $.param(object);
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": url + parameters,
            "method": "GET"
        }

        $.ajax(settings).done(function(response) {
            $('.loader').hide();
            errorHandler("submission successfully saved to server, thank you for your submission");
            console.log('profile submission logged ' + response);
            logErrors(localStorage.user, response);
        }).fail(function(response) {
            console.log('profile submission log error ' + response);
            var id = localStorage.user;
            logErrors(localStorage.user, response);
        });
            
        // var jqxhr = $.ajax({
        //     url: url + parameters,
        //     method: "GET",
        //     dataType: "json",
        //     data: data
        // }).success(function(result) {
        //     $('.loader').hide();
        //     errorHandler("submission successfully saved to server, thank you for your submission");
        //     console.log('profile submission logged ' + result);
        //     var errorResponse = JSON.stringify(result);
        //     var id = localStorage.user;
        //     logErrors(id, errorResponse);
        // }).error(function(response){
        //     console.log('profile submission log error ' + response);
        //     var errorResponse = JSON.stringify(response);
        //     var id = localStorage.user;
        //     logErrors(id, errorResponse);
        // });
    }

    function getProfile() {
        showLoader('pulling profile data from server..');
        $.getJSON('https://script.google.com/macros/s/AKfycbyZrPDYs_NZ1P2K6eurv3usDQ6h8ePDx2Nd8eoITWt1vauTjb4u/exec?action=read', function(data, xhr) {
            if (xhr == 200 || xhr == "success") {
                var entries = data.records;
                console.log(entries);
                if (entries != undefined) {
                    if (entries.length > 0) {
                        for( var x = 0; x < entries.length; x++){
                            var entry = entries[x];
                            var entryId = entry.id;
                            var localId = parseInt(localStorage.id);
                            if(entryId == localId){
                                console.log("profile found from db:");
                                localStorage.setItem("hasprofile", "true");
                                $.each(entry, function(key,value){
                                    //console.log(key.replace(/_/g, "-")+" : "+ decodeURIComponent(value));
                                    localStorage.setItem(key, value);
                                });
                                setProfile();
                            }
                        }
                    }
                }
                $('.loader').fadeOut(200);
            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while syncing your profile data, please try again.");
                logErrors(localStorage.user,"getProfile failed to performed");
            }
        });


        // $.getJSON('https://spreadsheets.google.com/feeds/list/19gj2n8Q1P_s59dUjhiAg8ud03j50xrMxtNhSqmD34BU/1/public/values?alt=json', function(data, xhr) {
        //     console.log('getting profiles');
        //     console.log('profiles : ' + xhr);
        //     showLoader('pulling profile data from server..');

        //     if (xhr == 200 || xhr == "success") {
        //         var entries = data.feed.entry;
                
        //         if (entries != undefined) {
        //             if (entries.length > 0) {
        //                 for (var i = 0; i < entries.length; i++) {
        //                     var entry = entries[i];
        //                     var dbId = parseInt(entry.gsx$id.$t);
        //                     var localId = parseInt(localStorage.id);
        //                     if (dbId == localId) {
        //                         console.log("profile found from db:");
        //                         console.log(entry);
        //                         var decodedProfile = decodeURIComponent(entry.gsx$data.$t);
        //                         localStorage.setItem("hasprofile", "true");
        //                         localStorage.setItem("profile", decodedProfile);
        //                         logErrors(localStorage.user,"getProfile successfully performed");
        //                         setProfile();
        //                     }
        //                 }
        //             }
        //         }
        //         $('.loader').fadeOut(200);
        //     } else {
        //         $('.loader').fadeOut(200);
        //         errorHandler("An error has occured while syncing your profile data, please try again.");
        //         logErrors(localStorage.user,"getProfile failed to performed");
        //     }
        // });
    }

    function setProfile() {
        // var profile = "";
        // logErrors(localStorage.user, localStorage.profile);

        try {
            if ( typeof(localStorage.profile_image) != "undefined" ){
                var value = localStorage.profile_image;
                $('input#image-data').val(value);
                $('#ma-pimg').attr('src', value);
                $('#my-profile img[data-details="profile-image"]').attr('src', value);
                $('#profile-photo-img').attr('src', value);
            }
            if ( typeof(localStorage.profile_name) != "undefined" ){
                var value = localStorage.profile_name;
                $('input[name="profile-name"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-name"]').text(value);
            }
            if ( typeof(localStorage.profile_website) != "undefined" ){
                var value = localStorage.profile_website;
                $('input[name="profile-website"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-website"]').text(value);
            }
            if ( typeof(localStorage.profile_bio) != "undefined" ){
                var value = localStorage.profile_bio;
                $('textarea[name="profile-bio"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-bio"]').text(value);
            }
            if ( typeof(localStorage.profile_email) != "undefined" ){
                var value = localStorage.profile_email;
                $('input[name="profile-email"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-email"]').text(value);
            }
            if ( typeof(localStorage.profile_city) != "undefined" ){
                var value = localStorage.profile_city;
                $('input[name="profile-city"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-city"]').text(value);
            }
            if ( typeof(localStorage.profile_country) != "undefined" ){
                var value = localStorage.profile_country;
                $('input[name="profile-country"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-country"]').text(value);
            }
            if ( typeof(localStorage.profile_state) != "undefined" ){
                var value = localStorage.profile_state;
                $('input[name="profile-state"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-state"]').text(value);
            }
            if ( typeof(localStorage.profile_number) != "undefined" ){
                var value = localStorage.profile_number;
                $('input[name="profile-number"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-number"]').text(value);
            }
            if ( typeof(localStorage.profile_facebook) != "undefined" ){
                var value = localStorage.profile_facebook;
                $('input[name="profile-facebook"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-facebook"]').text(value);
            }
            if ( typeof(localStorage.profile_instagram) != "undefined" ){
                var value = localStorage.profile_instagram;
                $('input[name="profile-instagram"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-instagram"]').text(value);
            }
            if ( typeof(localStorage.profile_twitter) != "undefined" ){
                var value = localStorage.profile_twitter;
                $('input[name="profile-twitter"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-twitter"]').text(value);
            }
            if ( typeof(localStorage.profile_soundcloud) != "undefined" ){
                var value =localStorage.profile_soundcloud;
                $('input[name="profile-soundcloud"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-soundcloud"]').text(value);
            }
            if ( typeof(localStorage.profile_youtube) != "undefined" ){
                var value = localStorage.profile_youtube;
                $('input[name="profile-youtube"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-youtube"]').text(value);
            }            
            if ( typeof(localStorage.profile_mp3) != "undefined" ){
                var value = localStorage.profile_mp3;
                $('input[name="profile-mp3"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-mp3"]').text(value);
            }
            if ( typeof(localStorage.profile_genre) != "undefined" ){
                var value = localStorage.profile_genre;
                $('input[name="profile-genre"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-genre"]').text(value);
            }
            if ( typeof(localStorage.profile_other_genre) != "undefined" ){
                var value = localStorage.profile_other_genre;
                $('input[name="profile-other-genre"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-other-genre"]').text(value);
            }
            if ( typeof(localStorage.profile_spotify) != "undefined" ){
                var value = localStorage.profile_spotify;
                $('input[name="profile-spotify"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-spotify"]').text(value);
            }
            if ( typeof(localStorage.profile_spotify_cowriters) != "undefined" ){
                var value = localStorage.profile_spotify_cowriters;
                $('input[name="profile-spotify-cowriters"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-spotify-cowriters"]').text(value);
            }
            if ( typeof(localStorage.profile_spotify_contribution) != "undefined" ){
                var value = localStorage.profile_spotify_contribution;
                $('input[name="profile-spotify-contribution"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-spotify-contribution"]').text(value);
            }
            if ( typeof(localStorage.profile_apple) != "undefined" ){
                var value = localStorage.profile_apple;
                $('input[name="profile-apple"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-apple"]').text(value);
            }
            if ( typeof(localStorage.profile_apple_cowriters) != "undefined" ){
                var value = localStorage.profile_apple_cowriters;
                $('input[name="profile-apple-cowriters"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-apple-cowriters"]').text(value);
            }
            if ( typeof(localStorage.profile_apple_contribution) != "undefined" ){
                var value = localStorage.profile_apple_contribution;
                $('input[name="profile-apple-contribution"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-apple-contribution"]').text(value);
            }
            if ( typeof(localStorage.profile_pitch) != "undefined" ){
                var value = localStorage.profile_pitch;
                $('textarea[name="profile-pitch"]').val(value);
                $('#my-account-page p[data-artistvalue="profile-pitch"]').text(value);
            }

            logErrors(localStorage.user,"profiles successfully set");
        } catch(e) {
            console.log(e);
            logErrors(localStorage.user,"Error setting profiles: " + e);
        }
        
        
        // if (typeof(localStorage.profileimg) != "undefined") {
        //     $('input#image-data').val(localStorage.profileimg);
        //     $('#ma-pimg').attr('src', localStorage.profileimg);
        //     $('#my-profile img[data-details="profile-image"]').attr('src', localStorage.profileimg);
        //     $('#profile-photo-img').attr('src', localStorage.profileimg);
        // }


        // for (x = 0; x < profile.length; x++) {
        //     if (profile[x].name == 'profile-image') {
        //         localStorage.setItem('profileimg', profile[x].value);
        //         $('input#image-data').val(localStorage.profileimg);
        //         $('#ma-pimg').attr('src', localStorage.profileimg);
        //         $('#my-profile img[data-details="profile-image"]').attr('src', localStorage.profileimg);
        //         $('#profile-photo-img').attr('src', localStorage.profileimg);
        //     }


        //     $('input[name="' + profile[x].name + '"]').val(profile[x].value);
        //     $('#my-account-page p[data-artistvalue="' + profile[x].name + '"]').text(profile[x].value);
        //     localStorage.setItem(profile[x].name, profile[x].value);

        //     if (profile[x].name == 'profile-bio') {
        //         $('textarea[name="profile-bio"]').val(profile[x].value);
        //         $('#my-account-page p[data-artistvalue="profile-bio"]').text(profile[x].value);
        //         localStorage.setItem(profile[x].name, profile[x].value);
        //     }

        //     if (profile[x].name == 'profile-pitch') {
        //         $('textarea[name="profile-pitch"]').val(profile[x].value);
        //         $('#my-account-page p[data-artistvalue="profile-pitch"]').text(profile[x].value);
        //         localStorage.setItem(profile[x].name, profile[x].value);
        //     }

        //     if (profile[x].name == 'profile-email') {
        //       if ( typeof(profile[x].value) == "undefined" || typeof(profile[x].value) == undefined || profile[x].value == ""){
        //         profile[x].value = localStorage.user;
        //       }
        //     }
        // }
    }

    function sendProfileDetails(fn, ln, em, subj, type) {
        var image,
            name,
            email,
            bio,
            website,
            email,
            country,
            state,
            city,
            phone,
            facebook,
            twitter,
            instagram,
            soundcloud,
            youtube,
            mp3,
            genre,
            othergenre,
            spotify,
            spotifycowriters,
            spotifycontribution,
            apple,
            applecowriters,
            applecontribution,
            pitch;

        try {
            if ( typeof(localStorage.profile_image) != "undefined" ){
                image = localStorage.profile_image
            }
            if ( typeof(localStorage.profile_name) != "undefined" ){
                name = localStorage.profile_name
            }
            if ( typeof(localStorage.profile_bio) != "undefined" ){
                bio = localStorage.profile_bio
            }
            if ( typeof(localStorage.profile_website) != "undefined" ){
                website = localStorage.profile_website
            }
            if ( typeof(localStorage.profile_email) != "undefined" ){
                email = localStorage.profile_email
            }
            if ( typeof(localStorage.profile_country) != "undefined" ){
                country = localStorage.profile_country
            }
            if ( typeof(localStorage.profile_state) != "undefined" ){
                state = localStorage.profile_state
            }
            if ( typeof(localStorage.profile_city) != "undefined" ){
                city = localStorage.profile_city
            }
            if ( typeof(localStorage.profile_number) != "undefined" ){
                phone = localStorage.profile_number
            }
            if ( typeof(localStorage.profile_facebook) != "undefined" ){
                facebook = localStorage.profile_facebook
            }
            if ( typeof(localStorage.profile_instagram) != "undefined" ){
                instagram = localStorage.profile_instagram
            }
            if ( typeof(localStorage.profile_twitter) != "undefined" ){
                twitter = localStorage.profile_twitter
            }
            if ( typeof(localStorage.profile_soundcloud) != "undefined" ){
                soundcloud = localStorage.profile_soundcloud
            }
            if ( typeof(localStorage.profile_youtube) != "undefined" ){
                youtube = localStorage.profile_youtube
            }
            if ( typeof(localStorage.profile_mp3) != "undefined" ){
                mp3 = localStorage.profile_mp3
            }
            if ( typeof(localStorage.profile_genre) != "undefined" ){
                genre = localStorage.profile_genre
            }
            if ( typeof(localStorage.profile_other_genre) != "undefined" ){
                othergenre = localStorage.profile_other_genre
            }
            if ( typeof(localStorage.profile_spotify) != "undefined" ){
                spotify = localStorage.profile_spotify
            }
            if ( typeof(localStorage.profile_spotify_cowriters) != "undefined" ){
                spotifycowriters = localStorage.profile_spotify_cowriters
            }
            if ( typeof(localStorage.profile_spotify_contribution) != "undefined" ){
                spotifycontribution = localStorage.profile_spotify_contribution
            }
            if ( typeof(localStorage.profile_apple) != "undefined" ){
                apple = localStorage.profile_apple
            }
            if ( typeof(localStorage.profile_apple_cowriters) != "undefined" ){
                applecowriters = localStorage.profile_apple_cowriters
            }
            if ( typeof(localStorage.profile_apple_contribution) != "undefined" ){
                applecontribution = localStorage.profile_apple_contribution
            }
            if ( typeof(localStorage.profile_pitch) != "undefined" ){
                pitch = localStorage.profile_pitch
            }
        } catch(e) {
            console.log(e);
            logErrors(localStorage.user,"Error logging profiles: " + e);
        }

        // for (x = 0; x < profile.length; x++) {
        //     switch (profile[x].name) {
        //         case "profile-image":
        //             image = profile[x].value;
        //         case "profile-name":
        //             name = profile[x].value;
        //             break;
        //         case "profile-bio":
        //             bio = profile[x].value;
        //             break;
        //         case "profile-website":
        //             website = profile[x].value;
        //             break;
        //         case "profile-email":
        //             email = profile[x].value;
        //             break;
        //         case "profile-country":
        //             country = profile[x].value;
        //             break;
        //         case "profile-city":
        //             city = profile[x].value;
        //             break;
        //         case "profile-state":
        //             state = profile[x].value;
        //             break;
        //         case "profile-number":
        //             phone = profile[x].value;
        //             break;
        //         case "profile-facebok":
        //             facebok = "http://www.facebook.com/" + profile[x].value;
        //             break;
        //         case "profile-twitter":
        //             twitter = "http://www.twitter.com/" + profile[x].value;
        //             break;
        //         case "profile-instagram":
        //             instagram = "http://www.instagram.com/" + profile[x].value;
        //             break;
        //         case "profile-youtube":
        //             youtube = "http://www.youtube.com/" + profile[x].value;
        //             break;
        //         case "profile-soundcloud":
        //             soundcloud = "http://www.soundcloud.com/" + profile[x].value;
        //             break;
        //         case "profile-mp3":
        //             mp3 = profile[x].value;
        //             break;
        //         case "profile-genre":
        //             genre = profile[x].value;
        //             break;
        //         case "profile-other-genre":
        //             othergenre = profile[x].value;
        //             break;
        //         case "profile-spotify":
        //             spotify = profile[x].value;
        //             break;
        //         case "profile-spotify-cowriters":
        //             spotifycowriters = profile[x].value;
        //             break;
        //         case "profile-spotify-contribution":
        //             spotifycontribution = profile[x].value;
        //             break;
        //         case "profile-apple-cowriters":
        //             apple = profile[x].value;
        //             break;
        //         case "profile-apple-cowriters-cowriters":
        //             applecowriters = profile[x].value;
        //             break;
        //         case "profile-apple-cowriters-contribution":
        //             applecontribution = profile[x].value;
        //             break;
        //         case "profile-pitch" :
        //             pitch = profile[x].value;
        //     }
        // }

        var content = "Artist Photo" + image + "\n" +
            "Artist Name: " + name + "\n" +
            "Email address: " + email + "\n" +
            "Phone number: " + phone + "\n" +
            "Website: " + website + "\n" +
            "Country: " + country + "\n" +
            "State: " + state + "\n" +
            "City: " + city + "\n" +
            "Facebook: " + facebook + "\n" +
            "Instagram: " + instagram + "\n" +
            "Soundcloud: " + soundcloud + "\n" +
            "Youtube: " + youtube + "\n" +
            "Mp3 Download Link: " + mp3 + "\n" +
            "Genre: " + genre + "\n" +
            "Other Genre: " + othergenre + "\n" +
            "Spotify Best Track: " + spotify + "\n" +
            "What did you write in this song? (Spotify): " + spotifycontribution + "\n" +
            "Number of Co-writers (Spotify): " + spotifycowriters + "\n" +
            "Apple Music Best Track: " + apple + "\n" +
            "What did you write in this song? (Apple Music): " + applecontribution + "\n" +
            "Number of Co-writers (Apple Music): " + applecowriters + "\n" +
            "Song or Artist Pitch: " + pitch + "\n";


        sendMembershipCalendarMail(fn, ln, em, subj, content, type)

    }

    function initProfileBtns() {
        $('#profile-form input').each(function(){
            $(this).change(function(){
                saveProfile("auto");
            });
        });

        $('#profile-form select').each(function(){
            $(this).change(function(){
                saveProfile("auto");
            });
        });

        $('#profile-form textarea').each(function(){
            $(this).change(function(){
                saveProfile("auto");
            });
        });

        $('button#save-profile').click(function() {
            saveProfile("button");
        });

        $('button#edit-profile-btn').click(function() {
            $('#my-profile').fadeOut();
            $('#edit-profile').fadeIn();
            $('input[name="profile-email"]').val(localStorage.user);
        });

        $('#close-profile').click(function() {
            $('#profile-builder').fadeOut();
        });
    }

    function checkTrial(id) {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1lMry_8Cm_mFlTRQ-af05o31Ud0Dpv41KHgqHDV7emCM/1/public/values?alt=json', function(data, xhr) {
            console.log('check trial');
            console.log('gdoc : ' + xhr);
            if (xhr == 200 || xhr == "success") {
                var entries = data.feed.entry;
                console.log(entries);
                if (entries.length > 0) {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];
                        var entryDate = entries[i].gsx$date.$t;

                        if (entry.gsx$id.$t == localStorage.id) {
                            console.log('trial period in account');
                            console.log(entryDate);
                            

                            var parseEntryDate = Date.parse(entryDate);
                            var thirtydays = 2592000000;
                            var trialend = parseEntryDate + thirtydays;

                            matchTrialTime(function(data) {

                                var currentDate = data.data.split(' ')[0];
                                var parseDate = Date.parse(currentDate);

                                if (parseDate >= trialend) {
                                    console.log("trial has ended checking subscriptions");
                                    $('.start-trial').hide();
                                    $('body').removeClass('trial-period');
                                    $('#facebookgroup').addClass('locked');
                                    $('#memberscalendar').addClass('locked');
                                    $('#membersdiscount').addClass('locked');
                                    $('#trial').hide();
                                    logErrors(localStorage.user, "trial has ended checking subscriptions");
                                    checkSubscription(localStorage.id);
                                } else {
                                    var x = trialend - parseDate;
                                    var seconds = Math.floor(x / 1000);
                                    var minute = Math.floor(seconds / 60);
                                    var seconds = seconds % 60;
                                    var hour = Math.floor(minute / 60);
                                    var minute = minute % 60;
                                    var day = Math.floor(hour / 24);
                                    console.log(day + ' days left');
                                    $('.trial-days').text(day + "days left");

                                    $('body').addClass('trial-period');
                                    $('#trial').show();
                                    $('#facebookgroup').removeClass('locked');
                                    $('#memberscalendar').removeClass('locked');
                                    $('#membersdiscount').removeClass('locked');
                            
                                    logErrors(localStorage.user, "trial days left: "+day);
                                }
                            });
                        }

                    }
                }

            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured, please try again.");
            }
        });
    }


    function matchTrialTime(successcallback, failcallback) {
        var url = "https://growmymusic.com/wp-admin/admin-ajax.php";
        var httpData = {
            "action": "getwptime",
            "type": "mysql",
        };
        performHttp(url, "post", httpData, function(response) {
            console.log("server time : " + response);
            successcallback(response);
        }, function(response) {
            console.log(response.status);
            console.log(response.error);
            $('.loader').fadeOut(200);
            errorHandler("An error has occured, please try again.");
        });
    }

    function getServerTime(callback, failcallback) {
        var url = "https://growmymusic.com/wp-admin/admin-ajax.php";
        var httpData = {
            "action": "getwptime",
            "type": "mysql",
        };
        performHttp(url, "post", httpData, function(response) {
            console.log("server time : " + response);
            callback(response);
        }, function(response) {
            console.log(response.status);
            console.log(response.error);
            failcallback(response);
            $('.loader').fadeOut(200);
            errorHandler("An error has occured, please try again.");
        });
    }

    function checkFirstUse() {
        if (typeof(localStorage.firstuse) == "undefined" || localStorage.firstuse !== "true") {
            openFirstUse();
        } else {
            $('#first-use').hide();
        }
    }

    function removeAllVideos() {
        var vid1 = $('#writing-holidays-video-mp4')[0];
        var vid2 = $('#firstuse-video-mp4')[0];
        var vid3 = $('#locked-mp4')[0];

        $("video").each(function() {
            $(this).get(0).pause();
        });

        $('#writing-holidays-video-mp4').attr('src', '');
        $('#firstuse-video-mp4').attr('src', '');
        $('#locked-mp4').attr('src', '');
    }

    function setFirstUseVideo(url) {
        $('#firstuse-video-mp4').attr('src', url);
        var vid = $('#firstuse-video')[0];
        vid.load();
        $('video#firstuse-video').click(function() {
            playPauseFirstUse();
        });
    }

    function playPauseFirstUse() {
        var vid = $('#firstuse-video')[0];
        if (vid.paused)
            vid.play();
        else
            vid.pause();
    }

    function openFirstUse() {
        var vurl = "https://s3.amazonaws.com/gmmonlinecourse2017/ads/vampromolongupdated.mp4";
        removeAllVideos();
        setFirstUseVideo(vurl);
        localStorage.setItem("firstuse", "true");

        setTimeout(function() {
            $('#first-use').fadeIn(200);
        }, 1500);

        $('#first-use button.get-started').click(function(e) {
            removeAllVideos();
            $('#firstuse-video-mp4').attr('src', '');
            $('#first-use').fadeOut(200);
            localStorage.setItem("firstuse", "false");
        });
        $('#first-use').click(function(e) {
            if (e.target != this) {
                return false;
            } else {
                removeAllVideos();
                localStorage.setItem("firstuse", "false");
                $('#firstuse-video-mp4').attr('src', '');
                $('#first-use').fadeOut(200);
            }
        });
    }
    function paused(){
         if ( $('#my-account-page').hasClass('ma-active') ){

        } else {
            //lockAllTiles();
            //$('#main-section').hide();
            //window.location.reload();
        }
    }
    function returnedFromPause() {
        console.log('session resumed');
        if ( $('#my-account-page').hasClass('ma-active') ){

        } else {
            checkIfAlreadyLoggedIn();
            getActiveMc();
            getSubmissionNumber();
            getSubmittedMC();
            checkIfIphoneX();

            //window.location.reload();
            //errorHandler("We have updated our profiles database for a much better experience. Please log out and back again to refresh your data. Thanks!");
        }
    }


    function getAds() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/13/public/values?alt=json', function(data, xhr) {
            console.log("loading ads");
            console.log('gdoc : ' + xhr);
            console.log(data);

            if (xhr == 200 || xhr == "success") {
                var context = data.feed.entry;
                console.log(context);
                $('#ads ul').empty();
                if (context.length > 0) {
                    for (var i = 0; i < context.length; i++) {
                        $('#ads ul').append('<li><a data-url="' + context[i].gsx$link.$t + '" data-adnumber="' + context[i].gsx$adnumber.$t + '" class="epage"><img src="' + context[i].gsx$bannerimageurl.$t + '"></a></li>')
                    }
                    $('#ads').show();
                    $('#ads ul').slick({
                        arrows: false,
                        dots: false,
                        infinite: true,
                        autoplay: true,
                        speed: 1000,
                        autoplaySpeed: 10000
                    });
                    $('#ads .epage').each(function() {
                        $(this).click(function(e) {
                            showLoader("Loading ad");
                            var url = $(this).attr('data-url');
                            var adnumber = $(this).attr('data-adnumber');
                            logAdClicks(adnumber, url);
                        });
                    });
                }

            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access in app purchases database.");
            }
        });
    }

    function logAdClicks(adnumber, browseurl) {
        var url = "https://script.google.com/macros/s/AKfycbz6ySlCIxnyHgzpZXYVtXcPfzM4c_lZtVm-ErzQ7hOewUOzF0Q/exec";
        var jqxhr = $.ajax({
            url: url + "?adnumber=" + adnumber + "&url=" + url,
            method: "GET",
            dataType: "json",
        }).success(function(result) {
            $('.loader').hide();
            browser(browseurl);
        });
    }


    function registeredIAP() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/7/public/values?alt=json', function(data, xhr) {
            console.log("registered iap");
            console.log('gdoc : ' + xhr);
            console.log(data);

            if (xhr == 200 || xhr == "success") {
                var context = data.feed.entry;
                console.log(context);
                for (var i = 0; i < context.length; i++) {
                    iapList.push(context[i].gsx$url.$t);
                }
                console.log('IAP List');
                console.log(iapList);
            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access in app purchases database.");
            }
        });
    }

    function performHttp(url, method, data, successCallback, failCallback) {
        if (method == "post") {
            cordovaHTTP.post(url, data, {
                Authorization: "Basic YnVubnlmaXNoY3JlYXRpdmVzOmJ1bm55aGl0bzYyMQ=="
            }, function(response) {
                console.log(response.status);
                successCallback(response);
            }, function(response) {
                $('.loader').fadeOut(200);
                errorHandler("error while doing http get, status: " + response.status + " error: " + response.error);
                console.log("error while doing http post, status: " + response.status + " error: " + response.error);
                failCallback(response);

                var errorString = JSON.stringify(response);
                logErrors(localStorage.user, errorString);
            });
        }
        if (method == "get") {
            cordovaHTTP.get(url, data, {
                Authorization: "Basic YnVubnlmaXNoY3JlYXRpdmVzOmJ1bm55aGl0bzYyMQ=="
            }, function(response) {
                console.log(response.status);
                successCallback(response);
            }, function(response) {
                $('.loader').fadeOut(200);

                errorHandler("error while doing http get, status: " + response.status + " error: " + response.error);
                console.log("error while doing http get, status: " + response.status + " error: " + response.error);
                failCallback(response);

                var errorString = JSON.stringify(response);
                logErrors(localStorage.user, errorString);
            });
        }
    }

    function logErrors(id, error) {
        var system = getMobileOperatingSystem();
        var email = localStorage.user;
        var url = "https://script.google.com/macros/s/AKfycbyVzHfMvstCBWqxvyrkl7rTGdHHmLB1K2_7wI95OJNoyDL-NOg/exec"
        var parseUrl = url + "?Id=" + id + "&Error=" + error + "&Os=" + system + "&email=" + email + "&ScriptVersion=" + scriptVersion;
        var jqxhr = $.ajax({
            url: parseUrl,
            method: "GET",
            dataType: "json"
        }).success(function() {
            console.log('errors logged');
        });
    }

    function checkIfAlreadyLoggedIn() {
        lockAllTiles();

        if (typeof(localStorage.id) != "undefined") {
            $('.main-content-container').show();

            showLoader("Welcome back " + localStorage.firstname + "!");

            $('.first-page').fadeOut(500);
            $('.login-page').fadeOut(500);
            setTimeout(function() {
                $('.first-page').remove();
                $('.login-page').remove();
            }, 500);

            // ========================================
            //              TRIAL
            // ========================================
            checkTrial(localStorage.id);
            
            if ($('body').hasClass('trial-period')) {
                unlockTrialPeriod();
            }

            // ========================================
            //              MEMBERSHIPS
            // ========================================
            if (typeof(localStorage.usermembershipids) == "undefined") {
                lockAllTiles();
            } else {
                var umList = localStorage.usermembershipids.split(",");
                if ($.inArray("778", umList) > -1) {
                    unlockVam();
                    endTrial();
                }
                if ($.inArray("777", umList) > -1) {
                    unlockVam();
                    endTrial();
                }
                if ($.inArray("945", umList) > -1) {
                    unlockVam();
                    endTrial();
                }
                if ($.inArray("775", umList) > -1) {
                    unlockDm();
                }
                if ($.inArray("214", umList) > -1) {
                    unlockCourses();
                    endTrial();
                }
                if ($.inArray("278", umList) > -1) {
                    if( localStorage.user === "emilycullin@gmail.com") {
                        unlockVam();
                    }
                    unlockCourses();
                    endTrial();
                }
            }

            

            // ========================================
            //        IOS - RESTORE IAP
            // ========================================
            if (os == "ios" && testMode != true) {
                restoreInAppPurchase(localStorage.id);
            } else {
                checkSubscription(localStorage.id);
            }

            // ========================================
            //              TEST MODE
            // ========================================
            if (testMode == true) {
                unlockVam();
                unlockDm();
                unlockCourses();
            }

            getProfile();
            console.log('pulling profiles from db');
            initProfileBtns();

        } else {
            $('.loader').fadeOut(200);
            setTimeout(function() {
             $('.sect').slideToggle(200);
            }, 250);
        }
    }

    function errorHandler(message) {
        var messageText;

        if (message) {
            messageText = message;
        } else {
            messageText = "An error has occured. Please make sure you have an internet connection and try again.";
        }

        $('.error > span').text(messageText);
        $('.loader').fadeOut();
        $('.error').show();
        $('.error').addClass('active');

        setTimeout(function() {
            $('.error').removeClass('active');
            setTimeout(function() {
                $('.error').hide();
            }, 500);
        }, 5000);

        $('.error > button').click(function() {
            $('.error').removeClass('active');
            setTimeout(function() {
                $('.error').hide();
            }, 500);
        });
    }

    function login(user, pass) {
        var user = user;
        var pass = pass;

        var dataString = "email=" + user + "&password=" + pass + "&insecure=cool";
        var html = "";

        $('.login-form p.error').stop().slideUp();
        showLoader("Logging in..");

        var url = "https://growmymusic.com/api/user/generate_auth_cookie/?";
        var httpData = {
            "email": user,
            "password": pass,
            "insecure": "cool"
        };


        showLoader("Logging in..");
        performHttp(url, "get", httpData, function(response) {
            console.log('server connected');
            console.log(response);

            var responseData = JSON.parse(response.data);

            if (responseData.status == "ok") {
                console.log('login successful :' + response);
                console.log(response);
                var data = JSON.parse(response.data);

                localStorage.setItem("user", user);
                localStorage.setItem("pass", pass);

                if (typeof(data.user.firstname) != "undefined") {
                    localStorage.setItem("firstname", data.user.firstname);
                }
                if (typeof(data.user.lastname) != "undefined") {
                    localStorage.setItem("lastname", data.user.lastname);
                }
                if (typeof(data.user.registered) != "undefined") {
                    localStorage.setItem("registered", data.user.registered);
                }
                if (typeof(data.user.id) != "undefined") {
                    localStorage.setItem("id", data.user.id);
                }

                $('.main-content-container').show();
                setTimeout(function() {
                    $('.loader').fadeOut(200);
                    $('.first-page').remove();
                    $('.login-page').remove();
                }, 1000);

                backButtons();
                restoreInAppPurchase(localStorage.id);
                partnersList();
                var resString = JSON.stringify(data);
                logErrors(user, "Log in successful! email:" + localStorage.user + " id:" + localStorage.id + "___data:" + resString);

                checkTrial(localStorage.id);
                getProfile();
                getSubmittedMC();

                if (typeof(localStorage.slide) == "undefined") {
                    showSlider();
                }

            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to log in, please check your details and try again. ( " + responseData.error + " )");
                var errorString = JSON.stringify(response);
                logErrors(user, errorString);
            }
        }, function(response) {
            var responseData = JSON.parse(response.data);
            $('.loader').fadeOut(200);
            errorHandler("An error has occured while trying to log in, please check your details and try again.( " + responseData.error + " )");

            var errorString = JSON.stringify(response);
            logErrors(user, errorString);
        });
    }

    function getSubscriptions(id, mode) {
        var url = "https://growmymusic.com/wp-api/mp/v1/members/" + id;
        var httpData = {};
        var setMode = mode == "" ? "" : typeof(mode) == "undefined" ? "" : mode;

        showLoader("syncing data : subscriptions");
        var memberships = [];
        var membershipIds = [];

        performHttp(url, "get", httpData, function(response) {
            console.log("cordovahttp subscriptions : " + response);
            console.log(response);
            var data = JSON.parse(response.data);

            var membership = data.active_memberships;
            localStorage.setItem('activeMemberships', JSON.stringify(membership));

            if (membership.length > 0) {

                showLoader("syncing data : subscriptions pulled");

                for (a = 0; a < membership.length; a++) {
                    var $this = membership[a];
                    var membershipId = $this.id;
                    memberships.push($this);
                    membershipIds.push(membershipId.toString());
                }

                //localStorage.setItem("usermemberships", memberships);
                localStorage.setItem("usermembershipids", membershipIds);

                localStorage.setItem('membership', membership[0].title);
                localStorage.setItem("isMember", "true");
                localStorage.setItem("membershipid", membership[0].id);
                localStorage.setItem("activeMembershipIds", membershipIds.join(","));

                console.log('memberships:');
                console.log(memberships);
                console.log(membershipIds);

                if ($.inArray("778", membershipIds) > -1) {
                    unlockVam();
                    endTrial();
                }
                if ($.inArray("777", membershipIds) > -1) {
                    unlockVam();
                    endTrial();
                }
                if ($.inArray("945", membershipIds) > -1) {
                    unlockVam();
                    endTrial();
                }
                if ($.inArray("775", membershipIds) > -1) {
                    unlockDm();
                }
                if ($.inArray("214", membershipIds) > -1) {
                    unlockCourses();
                    endTrial();
                }
                if ($.inArray("278", membershipIds) > -1) {
                    if( localStorage.user === "emilycullin@gmail.com") {
                        unlockVam();
                    }
                    unlockCourses();
                    endTrial();
                }

                $('.loader').fadeOut(200);
                $('.loader-message').text('');
            } else {
                localStorage.setItem("isMember", "false");
                lockAllTiles();

                if ($('body').hasClass('trial-period')) {
                    unlockTrialPeriod();
                }

                $('.loader').fadeOut(200);
            }

            if (setMode == "iosrestore") {
                console.log("restoring ios in app purchase");
                console.log(iapPurchased);
                for (a = 0; a < iapPurchased.length; a++) {
                    switch (iapPurchased[a]) {
                        case "com.growmymusic.vammonthly":
                            console.log('Virtual Artist Manager pulled from ios restore');
                            unlockVam();
                            break;
                        case "com.growmymusic.digitalmarketing":
                            console.log('DM pulled from ios restore');
                            unlockDm();
                            break;
                        case "com.growmymusic.onlinecourse2dayseminar":
                            console.log('FA pulled from ios restore');
                            unlockCourses();
                            break;
                    }
                }
            }

            checkFirstUse();
            logErrors(localStorage.user, "subscriptions successfully pulled from db : "+ localStorage.activeMembershipIds);
        }, function(response) {
            $('.loader').fadeOut();
            errorHandler("An error has occured while trying to get your subscription information, please try again later.");

            var errorString = JSON.stringify(response);
            logErrors(localStorage.user, url + " : " + errorString);
        });
    }

    function endTrial() {
        $('#trial').hide();
        $('body').removeClass('trial-period');
    }

    function checkSubscription(id, mode) {
        if (typeof(localStorage.activeMemberships) == "undefined") {
            getSubscriptions(id, mode);
            console.log('no active memberships in local storage checkSubscription performed');
        } else {

            showLoader("pulling saved subscriptions");
            var memberships; 
            
            try{
                if(typeof(localStorage.activeMembershipIds) != "undefined" && localStorage.activeMembershipIds.indexOf(",") > -1){
                    memberships = localStorage.activeMembershipIds.split(",");
                }         
            } catch(e) {
                logErrors(localStorage.user,e)
            }


            console.log(memberships);
            console.log("pulling saved subscriptions");

            if ($.inArray("778", memberships) > -1) {
                unlockVam();
                endTrial();
            }
            if ($.inArray("777", memberships) > -1) {
                unlockVam();
                endTrial();
            }
            if ($.inArray("945", memberships) > -1) {
                unlockVam();
                endTrial();
            }
            if ($.inArray("775", memberships) > -1) {
                unlockDm();
            }
            if ($.inArray("214", memberships) > -1) {

                unlockCourses();
                //endTrial();
            }
            if ($.inArray("278", memberships) > -1) {
                unlockCourses();
                if( localStorage.user === "emilycullin@gmail.com") {
                        unlockVam();
                    }
                //endTrial();
            }


            if (iapPurchased.length > 0) {
                //console.log("restoring ios in app purchase");
                console.log(iapPurchased);
                for (a = 0; a < iapPurchased.length; a++) {
                    switch (iapPurchased[a]) {
                        case "com.growmymusic.vammonthly":
                            console.log('Virtual Artist Manager');
                            unlockVam();
                            endTrial();
                            break;
                        case "com.growmymusic.digitalmarketing":
                            unlockDm();
                            break;
                        case "com.growmymusic.onlinecourse2dayseminar":
                            unlockCourses();
                            //endTrial();
                            break;
                    }
                }
            }

            checkFirstUse();

            $('.loader').fadeOut(200);
            $('.loader-message').text('');
            logErrors(localStorage.user, "loaded saved subscriptions: " + localStorage.activeMembershipIds);
        }
    }

    function getBeatStars() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/2/public/values?alt=json', function(data, xhr) {
            console.log("beatstars list");
            console.log('gdoc : ' + xhr);
            console.log(data);
            if (xhr == 200 || xhr == "success") {
                var source = $("#beatstars-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';
                var parse = {};

                if (context === undefined || typeof(context) === "undefined") {
                    $('#beatstars-items').text('There are no producer catalogs at the moment. Please check back later.');
                } else {
                    for (var i = 0; i < context.length; i++) {
                        html = html.concat(template(context[i]));
                    }
                }

                $('#beatstars-items').html('');
                $('#beatstars-items').append(html);
                $('#beatstars-items').show();

                $('#beatstars-items .epage').each(function() {
                    $(this).click(function(e) {
                        var url = $(this).attr('data-url');
                        browser(url);
                    });
                });

            } else {
                errorHandler("An error has occured while trying to access the hit producer catalog database, please try again.");
            }
        });
    }

    function getSeminarSchedule() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/1/public/values?alt=json', function(data, xhr) {
            console.log("seminar schedules");
            console.log('gdoc : ' + xhr);
            console.log(data);
            if (xhr == 200 || xhr == "success") {
                var source = $("#sched-list-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';
                var parse = {};

                if (context === undefined || typeof(context) === "undefined") {
                    $('#seminar-schedule').text("Our seminars occur once annually towards the end of the year. Express your interest to make sure you don't miss out. Seminars are free for Virtual Artist Manager subscribers and $1497 for everyone else.");
                    $('.members-calendar-tiles[data-type="2day-seminar"] .tile-wrap').removeClass('active');
                } else {
                    for (var i = 0; i < context.length; i++) {
                        html = html.concat(template(context[i]));
                    }
                    $('.members-calendar-tiles[data-type="2day-seminar"] .tile-wrap').addClass('active');
                }

                $('#seminar-schedule').append(html);
                $('#seminar-schedule').show();

            } else {
                errorHandler("An error has occured while trying to access the seminar schedules database, please try again.");
            }
        });
    }

    function setRegisteredUser(email) {
        var url = "https://script.google.com/macros/s/AKfycbzbotp9MT49gl1UuEYt9UnN0jFZmXOOOmKF2j83MYlOk7xYtxmw/exec";
        var jqxhr = $.ajax({
            url: url + "?Email=" + email,
            method: "GET",
            dataType: "json",
        }).success(function(result) {
            $('.loader').hide();
        });
    }

    function sendRegisterEmail(email, fullname) {

        var url = "https://growmymusic.com/wp-admin/admin-ajax.php";
        var action = "registerviaapp";
        var httpData = {
            "action": action,
            "RVAName": fullname,
            "RVAEmail": email
        };
        performHttp(url, "post", httpData, function(response) {
            console.log(response);
        }, function(response) {
            console.log(response.status);
            console.log(response.error);
        });
    }


    function register(user, email, pass, fname, lname, phone) {
        var fullname = fname + " " + lname;
        var displayname;
        var nonce;
        var phone;
        if (user !== '' && email !== '' && pass !== '' && fname !== '' && lname !== '' && phone !== '') {
            displayname = user;
            phone = phone;

            showLoader("Registering account..");
            var url = "https://growmymusic.com/api/get_nonce/?controller=user&method=register";

            cordovaHTTP.post(url, {}, {
                Authorization: "Basic YnVubnlmaXNoY3JlYXRpdmVzOmJ1bm55aGl0bzYyMQ=="
            }, function(response) {
                var data = JSON.parse(response.data);
                nonce = data.nonce;
                var rdata = {
                    "display_name": displayname,
                    "email": email,
                    "username": user,
                    "user_pass": pass,
                    "nonce": nonce,
                    "first_name": fname,
                    "last_name": lname,
                    "insecure": "cool",
                    "notify": "yes"
                };
                /* var rdatastring = 'display_name=' + displayname + '&email=' + email + '&username=' + user + '&user_pass=' + pass + '&nonce=' + nonce + '&first_name=' + fname + '&last_name=' + lname + '&insecure=cool&notify=yes';*/
                var regUrl = "https://growmymusic.com/api/user/register/";

                cordovaHTTP.post(regUrl, rdata, {
                    Authorization: "Basic YnVubnlmaXNoY3JlYXRpdmVzOmJ1bm55aGl0bzYyMQ=="
                }, function(response) {
                    var data = JSON.parse(response.data);
                    if (data.status == 'ok') {
                        $('.loader-message').text('Registration Successful!');
                        var cookie = data.cookie;
                        var uUrl = "https://growmymusic.com/api/user/update_user_meta/";

                        cordovaHTTP.post(uUrl, {
                            "cookie": cookie,
                            "insecure": "cool",
                            "meta_key": "phone",
                            "meta_value": phone
                        }, {
                            Authorization: "Basic YnVubnlmaXNoY3JlYXRpdmVzOmJ1bm55aGl0bzYyMQ=="
                        }, function(response) {
                            var data = JSON.parse(response.data);
                            if (data.status == 'ok') {
                                setRegisteredUser(email);
                                sendRegisterEmail(email, fullname)
                                setTimeout(function() {
                                    login(email, pass);
                                }, 1000);
                            } else {
                                $('#reg-form p.error').text(data.error).slideDown();
                                $('.loader').fadeOut(200);
                            }
                        }, function(response) {
                            console.log(response.status);
                            console.log(response.error);
                        });
                    } else {
                        $('#reg-form p.error').text(data.error).slideDown();
                        $('.loader').fadeOut(200);
                        errorHandler("An error has occured while trying to register an account, please check your details and try again.");
                    }
                }, function(response) {
                    $('.loader').fadeOut(200);
                    var redata = JSON.parse(response.error);
                    console.log(response.status);
                    console.log(response.error);
                    errorHandler("An error has occured while trying to register an account, please check your details and try again. ( " + redata.error + " )");
                });
            }, function(response) {
                $('.loader').fadeOut(200);
                console.log(response.status);
                console.log(response.error);
                $('.loader').fadeOut(200);

                errorHandler("An error has occured while trying to register an account, please check your details and try again.");
            });
        } else {
            $('.loader').fadeOut(200);
            $('#reg-form p.error').text('An error has occured please check if all of the fields are completely filled then try again.').slideDown();
        }
    }

    function logOut() {
        localStorage.clear();
        showLoader("Logging out..");

        setTimeout(function() {
            window.location.reload(true);
        }, 1000);
    }

    function myAccount() {

        var accountSource = $("#account-template-2").html();
        var accountTemplate = Handlebars.compile(accountSource);

        var fn = typeof(localStorage.firstname) == "undefined" ? "" : localStorage.firstname;
        var ln = typeof(localStorage.lastname) == "undefined" ? "" : localStorage.lastname;
        var reg = typeof(localStorage.registered) == "undefined" ? "" : localStorage.registered;
        var email = typeof(localStorage.user) == "undefined" ? "" : localStorage.user;
        var mem = typeof(localStorage.membership) == "undefined" ? "" : localStorage.membership;
        var fnp = fn.charAt(0);
        var lnp = ln.charAt(0);
        var html = '';


        var context = {
            'firstname': fn,
            'lastname': ln,
            'registered': reg,
            'initials': fnp + lnp,
            'email': email,
            'membership': mem
        };

        console.log("my account context data");
        console.log(context);

        html = html.concat(accountTemplate(context));
        $('#my-account-page > div').html('');
        $('#my-account-page > div').append(html);

        if (typeof(localStorage.membership) === 'undefined' || localStorage.membership === 'undefined' || localStorage.membership === undefined) {
            $('#my-account-page').addClass('unregistered');
            $('#my-account-page .epage').each(function() {
                $(this).click(function(e) {
                    var url = $(this).attr('data-url');
                    var id = $(this).attr('id');
                    browser(url);
                });
            });
        } else {
            $('#my-account-page').removeClass('unregistered');
        }

        // if (typeof(localStorage.profile) != "undefined") {
        //     console.log('profile in local');
        //     setProfile();
        //     initProfileBtns();
        // } else {
        //     console.log('pulling profile from db');
        //     getProfile();
        //     initProfileBtns();
        // }

        if ( typeof(localStorage.profile) != "undefined" ) {
            console.log("account has stored profile setting from local..");
            setProfile();
            initProfileBtns();
        } else {
            console.log("account has no stored profile pulling from db..");
            getProfile();
            initProfileBtns();
        }
            

        $('#artist-profile-btn').click(function() {
            $('#profile-builder').fadeIn();
        });

        initLogout();
    }

    function formatDate(date) {
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        return monthNames[monthIndex] + ' ' + day + ' ' + year;
    }

    function setLockedVideo(url) {
        removeAllVideos();
        $('#locked-mp4').attr('src', url);
        var vid = $('#locked-video')[0];
        vid.load();
        $('video#locked-video').click(function() {
            playPauseLocked();
        });
    }

    function playPauseLocked() {
        var vid = $('#locked-video')[0];
        if (vid.paused)
            vid.play();
        else
            vid.pause();
    }

    function locked(content, message) {
        removeAllVideos();
        var vurl = "";
        switch (content) {
            case 'masterclass':
                $('#locked-wrap .locked-info').hide();
                vurl = "https://s3.amazonaws.com/gmmonlinecourse2017/ads/oldmangmmadd.mp4";
                setLockedVideo(vurl);

                $('#locked-wrap .locked-html .locked-title').text('Gain access to Grow My Music Online Course');
                $('#locked-wrap .locked-html-details').html("");
                $('#locked-wrap .locked-html-details').html("<p>The Grow My Music Online Course includes:</p> <ul> <li>Modules</li> <li><b>Master Classes</b></li> <li>Partners List</li> <li>Resources</li> <li>Facebook Group</li> <li>Ongoing Mentoring</li> <li>And More</li> </ul> <p>These information-rich online video presentations are delivered by experts in their fields, and are designed to turn your from beginner or intermediate to expert very effectively. Broken down into a myriad of short videos, we call this form of education ‘snacking’. Learn anywhere at any time on desktop or mobile.</p> <p>Master Classes include:</p> <ul> <li>Music Business and Management </li> <li>Video Strategy</li> <li>Production and Engineering</li> <li>Hit Song Writing</li> <li>Mastering Your Live Show</li> <li>Lyricism</li> <li>Legal</li> <li>Music Accounting</li> </ul>");

                $('#locked-wrap .locked-btns a').text('REGISTER NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'modules':
                $('#locked-wrap .locked-info').hide();
                vurl = "https://s3.amazonaws.com/gmmonlinecourse2017/ads/oldmangmmadd.mp4";
                setLockedVideo(vurl);

                $('#locked-wrap .locked-html .locked-title').text('Gain access to Grow My Music Online Course');
                $('#locked-wrap .locked-html-details').html("");
                $('#locked-wrap .locked-html-details').html("<p>The Grow My Music Online Course includes:</p> <ul> <li><b>Modules</b></li> <li>Master Classes</li> <li>Partners List</li> <li>Resources</li> <li>Facebook Group</li> <li>Ongoing Mentoring</li> <li>And More</li> </ul> <p>Want to increase your fan base, profile and income very aggressively?</p> <p>Imagine how much more you’ll know about the industry 10 years from today. This course is designed by successful artists and artist managers to effectively fast track your career.</p> <p>If you want a career in music, then learn how to have one, don’t wing it! Whatever you do, don’t waste your time, effort, money and MUSIC doing the wrong things. </p> <p>There are no assessments or exams, just information rich video content, averaging 10 minutes in length. We call this form of education ‘snacking’. Learn anywhere at any time on desktop or mobile. </p> <p>You’ll learn best practice music business models but more importantly you’ll learn artist strategies that will increase your fan base, profile and income starting immediately.</p>");

                $('#locked-wrap .locked-btns a').text('REGISTER NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'facebookgroup':
                vurl = "https://s3.amazonaws.com/gmmonlinecourse2017/ads/oldmangmmadd.mp4";
                setLockedVideo(vurl);

                $('#locked-wrap .locked-html .locked-title').text('Gain access to Grow My Music Private Facebook Group');
                $('#locked-wrap .locked-html-details').html("");
                $('#locked-wrap .locked-html-details').html("<p>Our private Facebook group is full of other highly motivated artists that are serious enough about their music careers to invest in them, like you’re about to! </p> <p>This is a flourishing group where artists:</p> <ul> <li>Receive key industry updates and advice on how to best leverage them</li> <li>Connect with other artists</li> <li>Can ask questions</li> <li>Share wins, losses, and more</li> </ul> <p>NOTE: No self-promotion is allowed within the group. If you do self-promote you’ll be booted from the group.</p> <p> Any Grow My Music subscriber or membership receives access. Join the family! </p>");

                $('#locked-wrap .locked-btns a').text('REGISTER NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'list':
                $('#locked-wrap .locked-info').hide();
                $('#locked-wrap .locked-html .locked-title').text('Gain access to Grow My Music Online Course and unlock top-tier contacts in the industry');
                $('#locked-wrap .locked-html-details').html("<p>The Grow My Music Online Course includes:</p> <ul> <li>Modules</li> <li>Master Classes</li> <li><b>Partners List</b></li> <li>Resources</li> <li>Facebook Group</li> <li>Ongoing Mentoring</li> <li>And More</li> </ul> <p>It’s a who you know industry, so we connect you with a myriad of incredible contacts. You’ll be able to access emails and phone numbers of some of the country’s most renowned music contacts and contact them to work with them.</p> <p> All contacts on the Partners List love working with Grow My Music artists and offer discounts on their services too of 10% on average. </p>");

                $('#locked-wrap .locked-btns a').text('REGISTER NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'resources':
                $('#locked-wrap .locked-info').hide();
                vurl = "https://s3.amazonaws.com/gmmonlinecourse2017/ads/oldmangmmadd.mp4";
                setLockedVideo(vurl);

                $('#locked-wrap .locked-html .locked-title').text('Gain access to Grow My Music Online Course');
                $('#locked-wrap .locked-html-details').html("");
                $('#locked-wrap .locked-html-details').html("<p>The Grow My Music Online Course includes:</p> <ul> <li>Modules</li> <li>Master Classes</li> <li>Partners List</li> <li><b>Resources</b></li> <li>Facebook Group</li> <li>Ongoing Mentoring</li> <li>And More</li> </ul><p>You’ll be provided with over $7000 worth of resources and contracts. You will save you thousands across your music career as a result of your:</p> <ul> <li>Triple J Presenter Contact List</li> <li>Artist Release Plan</li> <li>Social Media Cheat Sheet</li> <li>Co-write Agreement</li> <li>Performance Agreement</li> <li>Booking Agreement</li> <li>Band Agreement</li> <li>Licensing Agreement</li> <li>Licensing Request Form</li> <li>BAS Tax Summary Doc</li> <li>Tax Summary Doc</li> <li>Links to sites which you’ll use weekly</li> <li>30 YouTube Promotion Channels</li> <li>Artist Yearly Plan</li> <li>Email templates for pitching to gatekeepers</li> <li>Free video software</li> <li>And much more</li> </ul>");

                $('#locked-wrap .locked-btns a').text('REGISTER NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'digitalmarketing':
                $('#locked-wrap .locked-info').hide();
                vurl = "https://s3-ap-southeast-2.amazonaws.com/digitalmarketingcourse2017/ads/digitalmarketingcartoonadfinalcompressed.mp4";
                setLockedVideo(vurl);

                $('#locked-wrap .locked-html .locked-title').text("Gain access to Grow My Music's Digital Marketing Course");
                $('#locked-wrap .locked-html-details').html("");
                $('#locked-wrap .locked-html-details').html("<ul> <li>2-Hour Essential Facebook, Twitter and Instagram Online video course</li> <li>Don’t be a fool, spend 2 hours learning how to change your career entirely</li> <li>Certificate for your resume provided upon completion</li> </ul> <p>The course covers:</p> <ul> <li>The MOST STRATEGIC way to release a video</li> <li>How to advertise for free and maximise your reach</li> <li>Effective Lead Generation</li> <li>AB Testing</li> <li>Custom Audiences</li> <li>Audience Insights</li> <li>Boosting Posts (when to Boost and when not to)</li> <li>Campaign Set Up</li> <li>Budget and Bid</li> <li>Creative Hub</li> <li>Reporting</li> <li>How to effectively digitally market for free</li> <li>Effective sales pipelines</li> <li>Instagram advertising</li> <li>Pixel Tracking</li> <li>Twitter advertising</li> </ul> <p> Effectively turn your audience from hundreds to thousands, from thousands to tens of thousands, from tens of thousands to.. You get the point. Past students have organically grown their online audience from 4000 to 21,000 in under a week. If you don’t understand how to digitally market like the back of your hand in this day and age, then know that you’re competing with artists that do.</p>");

                $('#locked-wrap .locked-btns a').text('REGISTER NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'membersdiscount':
                $('#locked-wrap .locked-info').hide();
                vurl = "https://s3.amazonaws.com/gmmonlinecourse2017/ads/vampromolongupdated.mp4";
                setLockedVideo(vurl);

                $('#locked-wrap .locked-html .locked-title').text('Subscribe to the Virtual Artist Manager App');
                $('#locked-wrap .locked-html-details').html("");
                $('#locked-wrap .locked-html-details').html("<p>Gain access to:</p> <ol> <li>Members Discounts</li> <li>Members Calendar</li> <li>Our private Facebook Group</li> </ol> <p> Through the Members Discounts you receive $150 of discount credit each month to spend on your choice of the country's best contacts including: </p> <ul> <li>Mix engineers</li> <li>Mastering engineers</li> <li>Producers</li> <li>Publicists</li> <li>Graphic Designers</li> <li>Video Clip Directors</li> <li>Merch companies</li> <li>Skate deck printers</li> <li>Poster / Sticker printers</li> <li>CD Manufacturing</li> <li>Photographers</li> <li>Recording studios</li> <li>Rehearsal studios</li> <li>Web developers</li> <li>Lyric video designers</li> <li>Music Accountants</li> <li>Music Lawyers</li> <li>Session players</li> <li>Vocalists</li> <li>And more</li> </ul> <p> It's like the Entertainment Discounts book, but purely for musicians. In addition, you'll be connected with hit producers and be able to view their exclusive instrumental catalogues every month for your use. </p> <p>Finally, you’ll receive exclusive invites to industry and Grow My Music events such as writing holidays, seminars and more.</p>");

                $('#locked-wrap .locked-btns a').text('SUBSCRIBE NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'memberscalendar':

                $('#locked-wrap .locked-info').hide();
                vurl = "https://s3.amazonaws.com/gmmonlinecourse2017/ads/vampromolongupdated.mp4";
                setLockedVideo(vurl);

                $('#locked-wrap .locked-html .locked-title').text('Subscribe to the Virtual Artist Manager App');
                $('#locked-wrap .locked-html-details').html("");
                $('#locked-wrap .locked-html-details').html("<p>Gain access to:</p> <ol> <li>Members Discounts</li> <li>Members Calendar</li> <li>Our private Facebook Group</li> </ol> <p> Every month, you'll have the opportunity to submit your music to be pitched to some of the most notable music companies in the country and globally, including: </p> <ul> <li>Record Labels</li> <li>Publishers</li> <li>Streaming Services</li> <li>Playlist Curators</li> <li>Booking Agents</li> <li>TV, Commercial, Movie and Video Game Agencies</li> </ul>");

                $('#locked-wrap .locked-btns a').text('SUBSCRIBE NOW').show();
                $('#locked-wrap .locked-html').show();
                $('.locked-modal').animate({
                    scrollTop: (0)
                }, 100);
                break;
            case 'spotify':
                $('#locked-wrap .locked-info').show();
                $('#locked-wrap .locked-html').hide();
                $('#locked-wrap .locked-info h3').text("Service not available at the moment");
                $('#locked-wrap .locked-info p').text(message);
                $('#locked-wrap .locked-btns a').hide();
                break;
            case 'writing-holidays':
                $('#locked-wrap .locked-info').show();
                $('#locked-wrap .locked-html').hide();
                $('#locked-wrap .locked-info h3').text("Service not available at the moment");
                $('#locked-wrap .locked-info p').text(message);
                $('#locked-wrap .locked-btns a').hide();
                break;
            case 'bmg':
                $('#locked-wrap .locked-info').show();
                $('#locked-wrap .locked-html').hide();
                $('#locked-wrap .locked-info h3').text("Service not available at the moment");
                $('#locked-wrap .locked-info p').text(message);
                $('#locked-wrap .locked-btns a').hide();
                break;
            case 'music-sync':
                $('#locked-wrap .locked-info').show();
                $('#locked-wrap .locked-html').hide();
                $('#locked-wrap .locked-info h3').text("Service not available at the moment");
                $('#locked-wrap .locked-info p').text(message);
                $('#locked-wrap .locked-btns a').hide();
                break;
            case 'booking-agent':
                $('#locked-wrap .locked-info').show();
                $('#locked-wrap .locked-html').hide();
                $('#locked-wrap .locked-info h3').text("Service not available at the moment");
                $('#locked-wrap .locked-info p').text(message);
                $('#locked-wrap .locked-btns a').hide();
                break;
        }
        $('#locked-wrap').fadeIn(200);
        $('#locked-wrap').click(function(e) {
            if (e.target != this) {
                return false;
            } else {
                removeAllVideos();
                $('#locked-mp4').attr('src', '');
                $('#locked-wrap').fadeOut(200);
            }
        });
    }

    function backButtons() {
        $('#back').click(function() {
            $('.navigation').removeClass('content').addClass('home');
            $('#inner-content').removeClass('content');
            $('#bottom-nav').removeClass('content');

            $(window).scrollTop(0);
            setTimeout(function() {
                $('.content-wrap').show();
            }, 150);


            setTimeout(function() {
                $('.content-body').each(function() {
                    $(this).hide();
                });
                $('#inner-content').hide();
            }, 150);

            if (cordova) {
                screen.orientation.lock('portrait');
            }

            //destroyBannerAds();
        });

        $('#log-back').click(function() {
            $('.first-page').show();
            $('.login-page').removeClass('active');
            setTimeout(function() {
                $('#log-in-form').hide();
                $('#reg-form').hide();
            }, 150);

        });
    }

    function onBackKeyDown() {
        removeAllVideos();

        if (!$('#my-account-page').hasClass('ma-active') && $('#inner-content').hasClass('content') && !$('.video').is(':visible')) {
            $('.navigation').removeClass('content').addClass('home');
            $('#inner-content').toggleClass('content');
            $('#bottom-nav').removeClass('content');
            $('.content-wrap').fadeIn(200);
            setTimeout(function() {
                $('.content-body').each(function() {
                    $(this).hide();
                });
                $('#inner-content').hide();
            }, 300);
        } else if (!$('#my-account-page').hasClass('ma-active') && $('#inner-content').hasClass('content') && $('.video').is(':visible')) {
            var vid = $('#video')[0];
            vid.pause();
            $('.video').fadeOut(200);
            $('#mp4').attr('src', '');
            //destroyBannerAds();
            if (cordova) {
                screen.orientation.lock('portrait');
            }
            $('.video').fadeOut(200);
        } else if ($('#my-account-page').hasClass('ma-active') && !$('#inner-content').hasClass('content')) {
            $('.content-wrap').fadeIn(200);
            $('.navigation').fadeIn(200);
            $('#my-account-page').removeClass('ma-active').fadeOut(200);
        } else if ($('#my-account-page').hasClass('ma-active') && $('#inner-content').hasClass('content')) {
            $('.content-wrap').fadeIn(200);
            $('.inner-content').fadeIn(200);
            $('.navigation').fadeIn(200);
            $('#my-account-page').removeClass('ma-active').fadeOut(200);
        } else if ($('#contact-page').hasClass('c-active')) {
            $('.content-wrap').fadeIn(200);
            $('.inner-content').fadeIn(200);
            $('.navigation').fadeIn(200);
            $('#contact-page').removeClass('c-active').fadeOut(200);
        } else if ($('.login-page').hasClass('active')) {
            $('.first-page').show();
            $('.login-page').removeClass('active');
            setTimeout(function() {
                $('#log-in-form').hide();
                $('#reg-form').hide();
            }, 300);
        } else {
            navigator.app.exitApp();
        }
    }

    function navScroll() {
        $(window).scroll(function() {
            if ($(window).scrollTop() >= 105) {
                $('.content-banner-text').addClass('fx');
            } else {
                $('.content-banner-text').removeClass('fx');
            }

            if ($(window).scrollTop() >= 180) {
                $('.content-body').addClass('scrolled');
            } else {
                $('.content-body').removeClass('scrolled');
            }
        });
    }

    function initLogout() {
        $('button#logout').click(function() {
            console.log('log out');
            logOut();
        });
    }

    function destroyBannerAds() {
        if (window.plugins && window.plugins.AdMob) {}
    }

    function androidFirstVid(url) {
        $('#firstvidmp4').attr('src', url);
        var vid = $('#bgvid')[0];
        $('#bgvid').show();
        vid.load();
        vid.play();
    }

    function setVideo(url) {
        removeAllVideos();

        $('#mp4').attr('src', url);
        var vid = $('#video')[0];
        vid.load();
        $('video').bind('play', function(e) {
            $('.video .top').toggleClass('play');
        });

        $('video').bind('pause', function(e) {
            $('.video .top').toggleClass('play');
        });

        $('video').click(function() {
            playPause();
        });
    }

    function playPause() {
        var vid = $('#video')[0];
        if (vid.paused)
            vid.play();
        else
            vid.pause();
    }

    function downloadTiles() {
        $('.download-tiles').each(function() {
            $(this).click(function() {
                var url = $(this).attr('data-url');
                var encodedurl = encodeURI(url);
                var item = $(this).attr('data-name');
                var type = $(this).attr('data-type');
                var y = url.split('/');
                var z = y.pop();

                window.open(encodedurl, "_system", "location=no,enableViewportScale=yes");
            });
        });
    }

    function setTiles() {
        $('.content-tiles').each(function() {
            $(this).click(function() {
                var url = $(this).attr('data-url');
                var title = $(this).attr('data-title');

                $('#vid-title').text(title);
                $('.video').fadeIn(200);

                setVideo(url);

                if (cordova) {
                    screen.orientation.unlock();
                }
            });
        });

        $('#close-vid').click(function() {
            var vid = $('#video')[0];
            vid.pause();
            $('.video').fadeOut(200);
            removeAllVideos();
            $('#mp4').attr('src', '');
            destroyBannerAds();
            if (cordova) {
                screen.orientation.lock('portrait');
            }
        });
    }

    function partnersList() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1Wyl3s9AxuK0mKNrzCAg_8ERLbuq-oSmF8F6fpGqSlNc/1/public/values?alt=json', function(data, xhr) {
            console.log("partners list");
            console.log('gdoc : ' + xhr);
            console.log(data);
            if (xhr == 200 || xhr == "success") {
                var source = $("#list-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';
                var parse = {};

                $('#partners-items .list-con').empty();

                for (var i = 0; i < context.length; i++) {
                    html = html.concat(template(context[i]));
                }

                $('#partners-items .list-con').append(html);
                $('.list-view').fadeIn(200);

                setTimeout(function() {
                    $('.content-container').animate({
                        'opacity': 1
                    }, 200);
                }, 200);

                $('.list-item').each(function() {
                    $(this).click(function() {
                        if ($('body').hasClass('locked')) {
                            locked('list');
                        }
                    });
                });

                $('.list-toggle').each(function() {
                    $(this).click(function() {
                        $(this).parent().find('.details').stop().slideToggle(200);
                        $(this).parent().toggleClass('opened');
                    });
                });

                $('.list-item p.phone a').each(function() {
                    if ($(this).text() === "") {
                        $(this).parent().hide();
                    }
                });


            } else {
                errorHandler("An error has occured while trying to access the partners database, please try again.");
            }
        });
    }

    function openInnerPages() {
        $('#inner-content').show();
        $('.content-wrap').fadeOut(200);

        setTimeout(function() {
            $('html,body').scrollTop(0);
        }, 250);

        setTimeout(function() {
            $('.navigation').removeClass('home').addClass('content');
            $('#inner-content').addClass('content');
            $('#bottom-nav').addClass('content');
        }, 350);

        backButtons();
    }

    function initClicks() {

        $('#downloading button').click(function() {
            $('#downloading').hide();
            $('#downloading p span').text('');
        });

        $('.ipage').each(function() {
            $(this).click(function() {
                var content = $(this).attr('id');
                var contentToLoad = "./pages/" + $(this).attr('id') + ".html";

                if ($(this).hasClass('locked')) {
                    locked(content);
                } else {

                    switch (content) {
                        case 'membersdiscount':

                            showLoader('');
                            getCouponCategories();
                            getMonthlyCoupons();

                            getCoupons(function() {
                                $('#membersdiscount-con').show();
                                openInnerPages();
                                navScroll();
                                $('.loader').fadeOut();
                            });

                            console.log('coupons initialized');


                            break;
                        case 'memberscalendar':
                            showLoader('');
                            membershipCalendarTiles(function() {
                                $('#memberscalendar-con').show();
                                openInnerPages();
                                navScroll();
                                $('.loader').fadeOut();
                            });

                            break;
                        case 'workshop':
                            openInnerPages();
                            $('#workshop-con').show();
                            navScroll();
                            break;
                        case 'modules':
                            openInnerPages();
                            $('#modules-con').show();
                            navScroll();
                            break;
                        case 'digitalmarketing':
                            showLoader('');
                            getDmResources(function() {
                                openInnerPages();
                                $('#digitalmarketing-con').show();

                                $('#dm-resources .download-tiles').click(function() {
                                    var url = $(this).attr('data-url');
                                    var encodedurl = encodeURI(url);
                                    var item = $(this).attr('data-name');
                                    var type = $(this).attr('data-type');
                                    var y = url.split('/');
                                    var z = y.pop();

                                    window.open(encodedurl, "_system", "location=no,enableViewportScale=yes");
                                    $('.loader').fadeOut();
                                });
                                navScroll();
                            });

                            break;
                        case 'masterclass':
                            openInnerPages();
                            $('#masterclass-con').show();
                            navScroll();
                            break;
                        case 'contact':
                            openInnerPages();
                            $('#contact-page').show();
                            navScroll();
                            break;
                        case 'resources':
                            showLoader('');
                            getResources(function() {
                                downloadTiles();
                                openInnerPages();
                                $('#resources-con').show();
                                navScroll();
                                $('.loader').fadeOut();
                            })
                            break;
                        case 'partnerslist':
                            partnersList();
                            openInnerPages();
                            $('#partners-con').show();

                            $('#partners-category').change(function() {
                                var a = parseInt($(this).val());
                                var x = $('.hidden-tab .tab').eq(a);
                                var id = x.attr('id');
                                var dataPull = a + 1;
                                console.log(a);
                                console.log(id);

                                $('html,body').animate({
                                    scrollTop: $('#navigation').outerHeight() + $('.slick-slider').outerHeight()
                                }, 200);

                                $('.list-view').fadeOut(200);
                                $('#partners-items .list-con').empty();
                                $('#partners-items').addClass('loading');

                                $('#partners-category').attr('disabled', true);

                                $.getJSON('https://spreadsheets.google.com/feeds/list/1Wyl3s9AxuK0mKNrzCAg_8ERLbuq-oSmF8F6fpGqSlNc/' + dataPull + '/public/values?alt=json', function(data) {
                                    console.log('gdoc');
                                    console.log(data);

                                    var source = $("#list-template").html();
                                    var template = Handlebars.compile(source);
                                    var context = data.feed.entry;
                                    var html = '';
                                    var parse = {};

                                    for (var i = 0; i < context.length; i++) {
                                        html = html.concat(template(context[i]));
                                    }

                                    $('#partners-items .list-con').empty();
                                    $('#partners-items .list-con').append(html);
                                    $('.list-view').fadeIn(200);

                                    setTimeout(function() {
                                        $('.content-container').animate({
                                            'opacity': 1
                                        }, 200);
                                    }, 200);

                                    $('.list-item').each(function() {
                                        $(this).click(function() {
                                            if ($('body').hasClass('locked')) {
                                                locked('list');
                                            } else {
                                                $(this).find('.details').stop().slideToggle(200);
                                                $(this).toggleClass('opened');
                                            }
                                        });
                                    });

                                    $('.list-item .inner-detail').each(function() {
                                        if ($(this).text() === "") {
                                            $(this).parent().hide();
                                        }
                                    });

                                    $('.list-item .details-section .inner-detail').each(function() {
                                        $(this).click(function() {
                                            var url = $(this).attr('data-url');
                                            window.open(url, '_system');
                                        });
                                    });

                                    $('#partners-items').removeClass('loading');
                                    $('#partners-category').removeAttr('disabled');
                                }).error(function() {
                                    $('#partners-category').removeAttr('disabled');
                                    $('#partners-items').html('<p style="text-align:center;padding:15px"><span class="fa fa-exclamation-triangle" style="display:block;margin-bottom:10px;"></span> An error has occured, please try again later</p>');
                                    $('#partners-items').removeClass('loading');
                                });
                            });

                            navScroll();
                            break;
                    }


                }
            });
        });
    }

    function initAd() {
        if (window.plugins && window.plugins.AdMob) {
            var ad_units = {
                android: {
                    banner: 'ca-app-pub-8521383528294320/2823155698',
                    interstitial: 'ca-app-pub-8521383528294320/1346422498'
                },
                ios: {
                    banner: 'ca-app-pub-8521383528294320/7253355297',
                    interstitial: 'ca-app-pub-8521383528294320/8730088493'
                }
            };
            var admobid = (/(android)/i.test(navigator.userAgent)) ? ad_units.android : ad_units.ios;

            window.plugins.AdMob.setOptions({
                publisherId: admobid.banner,
                interstitialAdId: admobid.interstitial,
                adSize: window.plugins.AdMob.AD_SIZE.SMART_BANNER,
                bannerAtTop: false,
                overlap: true,
                offsetTopBar: false,
                isTesting: false,
                autoShow: true
            });
        } else {}
    }

    function registerAdEvents() {
        document.addEventListener('onReceiveAd', function() {});
        document.addEventListener('onFailedToReceiveAd', function(data) {});
        document.addEventListener('onPresentAd', adInitialized());
        document.addEventListener('onDismissAd', adClosed());
        document.addEventListener('onLeaveToAd', function() {});
        document.addEventListener('onReceiveInterstitialAd', function() {});
        document.addEventListener('onPresentInterstitialAd', function() {});
        document.addEventListener('onDismissInterstitialAd', function() {});
    }

    function adInitialized() {
        $('body').addClass('ad');
    }

    function adClosed() {
        $('body').removeClass('ad');
    }

    function browser(url) {
        var target = "_blank";
        var options;

        if (os == "ios"){
            options = "location=no,hardwareback=yes,allowInlineMediaPlayback=yes,mediaPlaybackRequiresUserAction=no";
        } else {
            options = "location=no,hardwareback=yes";
        }

        inAppBrowserRef = cordova.InAppBrowser.open(url, target, options);
        inAppBrowserRef.addEventListener('loadstart', loadStartCallBack);
        inAppBrowserRef.addEventListener('loadstop', loadStopCallBack);
        inAppBrowserRef.addEventListener('loaderror', loadExit);
        inAppBrowserRef.addEventListener('exit', loadExit);
    }

    function loadExit() {
        if (!$('.login-page').is(':visible')) {
            checkSubscription(localStorage.id);
        } else {
            $('.loader').fadeOut(200);
        }
    }

    function loadStartCallBack() {
        showLoader("syncing data");
    }

    function loadStopCallBack() {
        showLoader("syncing data");
    }

    function unlock() {
        $('body').removeClass('locked');
        $('#modules').removeClass('locked');
        $('#masterclass').removeClass('locked');
        $('#facebookgroup').removeClass('locked');
        $('#resources').removeClass('locked');
    }

    function testIap(products) {
        console.log(products);

        $('body').addClass('has-iap');

        var source = $("#iap-template").html();
        var template = Handlebars.compile(source);
        var context = products;
        var totalProducts = products.length;

        for (var i = 0; i < context.length; i++) {
            var html = '';
            var item = context[i];

            switch (item.productId) {
                case "com.growmymusic.digitalmarketing":
                    item.meprid = "775";
                    item.id = "dm";
                    item.descriptions = [{
                        desc: "Most musicians create their music then distribute and then finally, see how well it does (or doesn’t do). Smarter business people reverse that order; numbers first, then distribution and then once they have those two key areas mapped out, they will design the product (the music/tour/merch etc etc)."
                    }, {
                        desc: "This is why good products and music go undiscovered every day. Whether you’re offering a product or service the rules are the same. First, work out what your product is going to cost and what you want it to earn you. Then work out how you’re going to distribute and market it before launching or even building your product!"
                    }, {
                        desc: "You will learn from experts who have grown companies to as large as 60,000 customers in under 3 years."
                    }, {
                        desc: "A certificate of enrolment will be provided to you upon course registration."
                    }];
                    item.benefits = [{
                        benefit: "Gain access to Grow My Music's Digital Marketing Course.",
                    }, {
                        benefit: "Lifetime access",
                    }];
                    break;
                case "com.growmymusic.onetimememberregistration":
                    item.meprid = "278";
                    item.id = "oc";
                    break;
                case "com.growmymusic.onlinecourse2dayseminar":
                    item.meprid = "214";
                    item.id = "ftm";
                    item.descriptions = [{
                        desc: "Want a career in music? Then learn how to play the game smarter not harder. This short course will fast track your career years, save thousands of money, be connected with incredible industry contacts, have a one on one industry consolation with an industry expert, receive over $7,000 worth of music contracts drafted by Music Arts lawyers."
                    }, {
                        desc: "There are no assessments, just information rich content broken down to be learned fast and easily. Jam packed full of incredible resources and short videos, each averaging 10 minutes in length each. We call this form of education ‘snacking’. Students can learn anywhere at anytime on computer or mobile."
                    }];
                    item.benefits = [{
                        benefit: "Gain access to all of Grow My Music's modules, courses and resources!",
                    }, {
                        benefit: "Lifetime access",
                    }];
                    break;
                case "com.growmymusic.vammonthly":
                    item.meprid = "778";
                    item.id = "vam-m";
                    item.descriptions = [{
                        desc: "Have your music pitched to extremely notable music companies every month. We will play your songs to key decision-makers at each company and will work tirelessly to provide you and your music with incredible opportunities based off of our existing relationships and pitching arrangements."
                    }];
                    item.benefits = [{
                        benefit: "Get discounts when you subscribe to any Grow My Music packages via the Grow My Music website",
                    }, {
                        benefit: "1 month subscription.",
                    }];
                    break;
                case "com.growmymusic.vamweekly":
                    item.meprid = "777";
                    item.id = "vam-w";
                    break;
                case "com.growmymusic.vamyearly":
                    item.meprid = "945";
                    item.id = "vam-m";
                    item.benefits = [{
                        benefit: "Get discounts when you subscribe to any Grow My Music packages via the Grow My Music website",
                    }, {
                        benefit: "1 year subscription.",
                    }];
                    break;
                case "com.growmymusic.digitalmarketingyearly":
                    item.meprid = "775";
                    item.id = "dm";
                    item.benefits = [{
                        benefit: "Gain access to Grow My Music's Digital Marketing Course.",
                    }, {
                        benefit: "Lifetime Access.",
                    }];
                    break;
            }

            html = html.concat(template(context[i]));
            $('#purchase-items').append(html);
            iapClick();
        }
    }

    function inAppPurchasesAndroid() {
        var source = $("#iap-template-android").html();
        var template = Handlebars.compile(source);
        var html = '';
        var context = [{
            url: 'https://growmymusic.com/register/virtual-artist-manager-monthly/',
            title: 'Virtual Artist Manager',
            id: "vam-m",
            type: "subscription",
            meprid: "778",
            price: "$19.00",
            descriptions: [{
                desc: "Have your music pitched to extremely notable music companies every month. We will play your songs to key decision-makers at each company and will work tirelessly to provide you and your music with incredible opportunities based off of our existing relationships and pitching arrangements."
            }],
            benefits: [{
                benefit: "Get discounts when you subscribe to any Grow My Music packages via the Grow My Music website",
            }, {
                benefit: "1 month subscription.",
            }]
        }, {
            url: 'https://growmymusic.com/register/essential-facebook-instagram-and-twitter-marketing-2-hour-course/',
            title: 'Essential Facebook, Instagram, and Twitter Marketing 2-Hour Online Course',
            id: "dm",
            meprid: "775",
            type: "onetime",
            price: "$297.00",
            descriptions: [{
                desc: "Most musicians create their music then distribute and then finally, see how well it does (or doesn’t do). Smarter business people reverse that order; numbers first, then distribution and then once they have those two key areas mapped out, they will design the product (the music/tour/merch etc etc)."
            }, {
                desc: "This is why good products and music go undiscovered every day. Whether you’re offering a product or service the rules are the same. First, work out what your product is going to cost and what you want it to earn you. Then work out how you’re going to distribute and market it before launching or even building your product!"
            }, {
                desc: "You will learn from experts who have grown companies to as large as 60,000 customers in under 3 years."
            }, {
                desc: "A certificate of enrolment will be provided to you upon course registration."
            }],
            benefits: [{
                benefit: "Gain access to Grow My Music's Digital Marketing Course.",
            }, {
                benefit: "Lifetime Access",
            }]

        }, {
            url: 'https://growmymusic.com/register/one-time-member-registration/',
            title: 'Full Online Course Access',
            id: "ftm",
            meprid: "214",
            type: "onetime",
            price: "$1497.00",
            descriptions: [{
                desc: "Want a career in music? Then learn how to play the game smarter not harder. This short course will fast track your career years, save thousands of money, be connected with incredible industry contacts, have a one on one industry consolation with an industry expert, receive over $7,000 worth of music contracts drafted by Music Arts lawyers."
            }, {
                desc: "There are no assessments, just information rich content broken down to be learned fast and easily. Jam packed full of incredible resources and short videos, each averaging 10 minutes in length each. We call this form of education ‘snacking’. Students can learn anywhere at anytime on computer or mobile."
            }],
            benefits: [{
                benefit: "Gain access to all of Grow My Music's modules, courses and resources!",
            }, {
                benefit: "Lifetime Access",
            }]
        }];

        for (var i = 0; i < context.length; i++) {
            html = html.concat(template(context[i]));
        }

        $('#purchase-items').html("");
        $('#purchase-items').html(html);
        iapClick();
    }

    function inAppPurchases(productArray) {
        if (testMode == true) {

        } else {
            inAppPurchase.getProducts(productArray).then(function(products) {
                console.log(products);

                $('body').addClass('has-iap');

                var source = $("#iap-template").html();
                var template = Handlebars.compile(source);
                var context = products;
                var totalProducts = products.length;
                var renderedHtml = "";

                /*===============================
                    0 {
                      description:string,
                      price:string,
                      productId:string,
                      title:string,
                    },
                ================================*/
                var html = '';

                for (var i = 0; i < context.length; i++) {

                    var item = context[i];

                    switch (item.productId) {
                        case "com.growmymusic.digitalmarketing":
                            item.meprid = "775";
                            item.id = "dm";
                            item.type = "onetime";
                            item.descriptions = [{
                                desc: "Most musicians create their music then distribute and then finally, see how well it does (or doesn’t do). Smarter business people reverse that order; numbers first, then distribution and then once they have those two key areas mapped out, they will design the product (the music/tour/merch etc etc)."
                            }, {
                                desc: "This is why good products and music go undiscovered every day. Whether you’re offering a product or service the rules are the same. First, work out what your product is going to cost and what you want it to earn you. Then work out how you’re going to distribute and market it before launching or even building your product!"
                            }, {
                                desc: "You will learn from experts who have grown companies to as large as 60,000 customers in under 3 years."
                            }, {
                                desc: "A certificate of enrolment will be provided to you upon course registration."
                            }];
                            item.benefits = [{
                                benefit: "Gain access to Grow My Music's Digital Marketing Course.",
                            }, {
                                benefit: "Lifetime Access",
                            }];
                            item.title = 'Essential Facebook, Instagram, and Twitter Marketing 2-Hour Online Course';
                            break;

                        case "com.growmymusic.onetimememberregistration":
                            item.meprid = "278";
                            item.id = "ftm";
                            item.type = "onetime";
                            item.descriptions = [{
                                desc: "Want a career in music? Then learn how to play the game smarter not harder. This short course will fast track your career years, save thousands of money, be connected with incredible industry contacts, have a one on one industry consolation with an industry expert, receive over $7,000 worth of music contracts drafted by Music Arts lawyers."
                            }, {
                                desc: "There are no assessments, just information rich content broken down to be learned fast and easily. Jam packed full of incredible resources and short videos, each averaging 10 minutes in length each. We call this form of education ‘snacking’. Students can learn anywhere at anytime on computer or mobile."
                            }];
                            item.benefits = [{
                                benefit: "Gain access to all of Grow My Music's modules, courses and resources!",
                            }, {
                                benefit: "Lifetime access",
                            }];
                            item.title = 'Full Online Course Access';
                            break;

                        case "com.growmymusic.onlinecourse2dayseminar":
                            item.meprid = "214";
                            item.id = "ftm";
                            item.type = "onetime";
                            item.descriptions = [{
                                desc: "Want a career in music? Then learn how to play the game smarter not harder. This short course will fast track your career years, save thousands of money, be connected with incredible industry contacts, have a one on one industry consolation with an industry expert, receive over $7,000 worth of music contracts drafted by Music Arts lawyers."
                            }, {
                                desc: "There are no assessments, just information rich content broken down to be learned fast and easily. Jam packed full of incredible resources and short videos, each averaging 10 minutes in length each. We call this form of education ‘snacking’. Students can learn anywhere at anytime on computer or mobile."
                            }];
                            item.benefits = [{
                                benefit: "Gain access to all of Grow My Music's modules, courses and resources!",
                            }, {
                                benefit: "Lifetime access",
                            }];
                            item.title = 'Full Online Course Access';
                            break;

                        case "com.growmymusic.vammonthly":
                            item.meprid = "778";
                            item.id = "vam-m";
                            item.type = "subscription";
                            item.descriptions = [{
                                desc: "Have your music pitched to extremely notable music companies every month. We will play your songs to key decision-makers at each company and will work tirelessly to provide you and your music with incredible opportunities based off of our existing relationships and pitching arrangements."
                            }];
                            item.benefits = [{
                                benefit: "Get discounts when you subscribe to any Grow My Music packages via the Grow My Music website",
                            }, {
                                benefit: "Monthly subscription.",
                            }];
                            item.title = 'Virtual Artist Manager';
                            break;

                        case "com.growmymusic.vamweekly":
                            item.meprid = "777";
                            item.type = "subscription";
                            item.id = "vam-w";
                            break;

                        case "com.growmymusic.vamyearly":
                            item.meprid = "945";
                            item.type = "subscription";
                            item.id = "vam-m";
                            item.benefits = [{
                                benefit: "Get discounts when you subscribe to any Grow My Music packages via the Grow My Music website",
                            }, {
                                benefit: "1 year subscription.",
                            }];
                            item.title = 'Virtual Artist Manager';
                            break;

                        case "com.growmymusic.digitalmarketingyearly":
                            item.meprid = "775";
                            item.type = "subscription";
                            item.id = "dm";
                            item.benefits = item.benefits = [{
                                benefit: "Gain access to Grow My Music's Digital Marketing Course.",
                            }, {
                                benefit: "One",
                            }];
                            item.title = 'Digital Marketing Course';
                            break;
                    }

                    html = html.concat(template(context[i]));
                    renderedHtml = html;
                }

                $('#purchase-items').html("");
                $('#purchase-items').append(renderedHtml);

                if (os === 'ios') {
                    $('#purchase-items a.plan[data-productid="com.growmymusic.vammonthly"]').prependTo($('#purchase-items'));
                }

                iapClick();

            }).catch(function(err) {
                console.log(err);
                errorHandler("An error has occured while trying to get In App Purchases, please try again later.");
            });
        }

    }

    function iapClick() {
        $('a.plan').each(function() {
            var $this = $(this);
            if (os === 'ios') {
                $this.click(function() {
                    var id = $this.attr('data-productid');
                    var meprprodid = $this.attr('data-meprid');
                    var productname = $this.attr('data-productname');
                    var type = $this.attr('data-type');
                    if (type === "subscription") {
                        subscribeInAppPurchase(id, meprprodid, productname);
                    } else {
                        buyInAppPurchase(id, meprprodid, productname);
                    }
                });
            } else {
                $this.click(function() {
                    var url = $this.attr('data-url');
                    browser(url);
                });
            }
        });
    }

    function meprCreateTransaction(id, meprprodid) {
        console.log("MEPR creating transation");
        var membershipid = mepreprodid;
        var credentials = btoa('bunnyfishcreatives@gmail.com:phk2D9nvc6fBkYDYa8R1LpKi');
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://growmymusic.com/wp-api/mp/v1/transactions",
            "method": "POST",
            "type": "json",
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + credentials);
            },
            "data": {
                member: id,
                membership: meprprodid,
                gateway: "manual",
                status: "complete"
            }
        };

        $.ajax(settings).done(function(response) {
            logErrors(localStorage.user, "Created MEPR Transaction : " + JSON.stringify(response) );
            console.log("Created MEPR Transaction");
            console.log(response);
            checkSubscription(id);
        });
    }

    function sendInAppPurchaseConfirmationToAdmin(name, email, product) {
        var url = "https://growmymusic.com/wp-admin/admin-ajax.php";
        var httpData = {
            "action": "sendiapemail",
            "name": name,
            "email": email,
            "product": product,
        };

        performHttp(url, "post", httpData, function(response) {
            console.log("in app purchase email confirmation to admin : " + response);
            console.log(response);
        }, function(response) {
            console.log(response.status);
            console.log(response.error);
        });
    }

    function buyInAppPurchase(id, meprprodid, productname) {
        inAppPurchase.buy(id)
            .then(function(data) {
                console.log(data);

                /*
                {
                  receipt:"",
                  transactionId:""
                }
                */

                var user = localStorage.user;
                var pass = localStorage.pass;
                var wpid = localStorage.id;
                var fullname = localStorage.firstname + " " + localStorage.lastname;
                meprCreateTransaction(wpid, meprprodid);
                sendInAppPurchaseConfirmationToAdmin(fullname, user, productname);
                $('#learnmore-wrap').fadeOut(200);
            })
            .catch(function(err) {
                console.log(err);
                errorHandler("An error has occured while trying to complete your purchase, please try again later.");
            });
    }

    function subscribeInAppPurchase(id, meprprodid, productname) {
        inAppPurchase.subscribe(id)
            .then(function(data) {
                console.log(data);
                var user = localStorage.user;
                var pass = localStorage.pass;
                var wpid = localStorage.id;
                var fullname = localStorage.firstname + " " + localStorage.lastname;
                meprCreateTransaction(wpid, meprprodid);
                sendInAppPurchaseConfirmationToAdmin(fullname, user, productname);
                $('#learnmore-wrap').fadeOut(200);
            })
            .catch(function(err) {
                console.log(err);
                errorHandler("An error has occured while trying to complete your subscription, please try again later.");
            });
    }

    function restoreInAppPurchase(id) {

        showLoader("syncing data");

        // reset
        localStorage.removeItem("activeMemberships");
        console.log('checking in app purchases');

        var sys = getMobileOperatingSystem();
        if (sys == "ios") {
            inAppPurchase.restorePurchases().then(function(data) {
                    console.log('restoring iap');
                    console.log("IOS IAP IN ACCOUNT: " + JSON.stringify(data));
                    $('.loader').fadeOut(200);

                    logErrors(localStorage.user, JSON.stringify(data));

                    if (data.length > 0) {
                        var user = localStorage.user;
                        var pass = localStorage.pass;
                        var id = localStorage.id;

                        var iapLog = JSON.stringify(data);
                        logErrors(localStorage.user, data);

                        for (var x = 0; x < data.length; x++) {
                            var product = data[x];
                            if (product.state != 1 || product.state != 2) {
                                iapPurchased = [];
                                iapPurchased.push(product.productId);
                            }
                        }

                        checkSubscription(localStorage.id);
                        var errorlog = JSON.stringify(data);
                        var iaplog = iapPurchased.join(",");

                        logErrors(localStorage.user, "successfully pulled " + data.length + " in app purchase from itunes__" + errorlog);
                        logErrors(localStorage.user, "inapppurchases for user " +  iaplog);
                    } else {
                        checkSubscription(localStorage.id);
                        var errorlog = JSON.stringify(data);
                        logErrors(localStorage.user, "failed to pull in app purchases from itunes__" + errorlog);
                        logErrors(localStorage.user, "failed to pull in app purchases from itunes__" + data);
                    }

                })
                .catch(function(err) {
                    console.log(err);
                    $('.loader').fadeOut(200);
                    var errorlog = JSON.stringify(err);
                    logErrors(localStorage.user, "failed to get in app purchases from itunes" + errorlog);
                    logErrors(localStorage.user, err);
                    //errorHandler("An error has occured while trying to restore In App Purchases, please try again later.");
                    checkSubscription(localStorage.id);
                });
        } else {
            $('.loader').fadeOut(200);
            var user = localStorage.user;
            var pass = localStorage.pass;
            var id = localStorage.id;
            checkSubscription(id);
            logErrors(localStorage.user, "checking subscriptions for android device via api");
        }
    }

    function openRenewingNature() {
        $('.renewing-nature').stop().slideToggle();
    }

    function submitMail(fn, ln, em, msg, type, subj) {
        console.log(fn);
        console.log(ln);
        console.log(em);
        console.log(msg);
        console.log(type + '@growmymusic.com');

        var emailAddress = "";

        if (testMode === true) {
            emailAddress = 'rafaellorenzodeleon@gmail.com';
        } else {
            emailAddress = type + '@growmymusic.com';
        }


        var fullMsg = "Full Name: " + fn + "\r\nLast Name: " + ln + "\r\nEmail: " + em + "\r\nMessage: " + msg;
        /*cordova.plugins.email.open({
            to:emailAddress,
            subject: subj,
            body: fullMsg,
            isHtml: false,
        });*/
        window.location.href = "mailto:" + emailAddress + "?subject=" + subj + "&body=" + fullMsg;
    }

    function generateSerial(range, length) {
        var d = new Date();
        var dnum = Date.parse(d);
        var arr = [];

        while (arr.length < length) {
            var randomnumber = Math.ceil(Math.random() * range);
            arr[arr.length] = randomnumber;
        }
        var join = arr.join('');
        console.log(join);
        return (dnum + join);
    }

    function getCoupons(callback) {
        var coupons = [];
        var id = localStorage.id;
        var availedCoupons = [];

        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/3/public/values?alt=json', function(data, xhr) {
            console.log("coupons");
            console.log('gdoc : ' + xhr);
            console.log(data);

            $('#mb-dc-items ul').html('');

            if (xhr == 200 || xhr == "success") {
                var source = $("#coupon-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';
                var parse = {};

                if (context == undefined) {

                } else {
                    for (var i = 0; i < context.length; i++) {
                        coupons.push(context[i].gsx$name.$t);
                        if (context[i].gsx$image.$t === "") {
                            context[i].gsx$image.$t = "img/coupon placeholders/voucher-1.jpg";
                        }
                        html = html.concat(template(context[i]));
                    }
                    console.log(coupons);
                }
                $('#sd-items').html('');
                $('#sd-items').append(html);
                $('.loader').fadeOut(200);

                redeemCouponItem();
                checkRedeemed(localStorage.id);

                callback();
            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access the coupons database, please try again.");
            }
        });
    }

    function getMonthlyCoupons() {
        var mdcoupons = [];
        var id = localStorage.id;
        var mdavailedCoupons = [];

        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/5/public/values?alt=json', function(data, xhr) {
            console.log("monthly coupons");
            console.log('gdoc : ' + xhr);
            console.log(data);

            $('#md-items').html('');

            if (xhr == 200 || xhr == "success") {
                var source = $("#coupon-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';
                var parse = {};

                if (context == undefined) {

                } else {
                    for (var i = 0; i < context.length; i++) {
                        mdcoupons.push(context[i].gsx$name.$t);
                        if (context[i].gsx$image.$t === "") {
                            context[i].gsx$image.$t = "img/coupon placeholders/voucher-1.jpg";
                        }
                        html = html.concat(template(context[i]));
                    }
                    console.log(mdcoupons);
                }

                $('#md-items').html('');
                $('#md-items').append(html);
                $('.loader').fadeOut(200);

                redeemCouponItem();
                checkRedeemed(localStorage.id);
            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access get monthly coupons, please try again.");
            }
        });
    }

    function checkRedeemed(id) {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/4/public/values?alt=json', function(data, xhr) {
            console.log("check redeemed coupons");
            console.log('gdoc : ' + xhr);
            console.log(data);

            var monthlyAvailed = 0;

            if (xhr == 200 || xhr == "success") {
                var context = data.feed.entry;
                console.log(context);

                if (context != undefined) {
                    for (var i = 0; i < context.length; i++) {



                        if (parseInt(context[i].gsx$id.$t) === parseInt(id)) {
                            var identifier = context[i].gsx$identifier.$t;
                            var type = context[i].gsx$type.$t;
                            var parseType = type.toLowerCase();

                            $('#mb-dc-items .coupon-block[data-identifier="' + identifier + '"]').addClass('availed');

                            if (parseType === "monthly") {
                                $('#md-items .coupon-block').each(function() {
                                    var d = $(this).attr('data-identifier');
                                    if (d === identifier) {
                                        $(this).addClass('availed');
                                        monthlyAvailed++;
                                    }
                                });
                            }

                            if (monthlyAvailed === 3) {
                                $('#md-items').hide();
                                $('#monthly-dc-items').addClass('all-availed');
                            }
                        }

                    }
                }


            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access get discount coupons, please try again.");
            }
        });
    }

    function logCoupons(userId, userName, userEmail, couponName, discount, identifier, couponCode, provider, serial, type) {
        $('form#avail-coupon input#f-name').attr('value', userName);
        $('form#avail-coupon input#f-id').attr('value', userId);
        $('form#avail-coupon input#f-cname').attr('value', couponName);
        $('form#avail-coupon input#f-ccode').attr('value', couponCode);
        $('form#avail-coupon input#f-identifier').attr('value', identifier);
        $('form#avail-coupon input#f-provider-contact').attr('value', provider);
        $('form#avail-coupon input#f-serial').attr('value', serial);
        $('form#avail-coupon input#f-email').attr('value', localStorage.user);
        $('form#avail-coupon input#f-type').attr('value', type);
        $('form#avail-coupon input#f-discount').attr('value', discount);
        var $form2 = $('form#avail-coupon');

        var url = "https://script.google.com/macros/s/AKfycbyEIzdqCY6FQAAyYGqIwi8Ngm4WDbHpk-l9Rew6iWC-0XZjDGUW/exec";
        var jqxhr = $.ajax({
            url: url,
            method: "GET",
            dataType: "json",
            data: $form2.serializeObject()
        }).success(function() {
            console.log('coupon redemption logged');
            checkRedeemed(userId);
            $('.loader').fadeOut(200);

            var message = discount + " : " + couponName + " (coupon code :" + couponCode + ")";
            sendDiscountConfirmation(message, provider, serial);
        });
    }

    function sendDiscountConfirmation(message, provider, serial) {
        var url = "https://growmymusic.com/wp-admin/admin-ajax.php";
        var httpData = {
            "action": "send_email",
            "name": localStorage.firstname + " " + localStorage.lastname,
            "email": localStorage.user,
            "message": message,
            "serial": serial,
            "provider": (provider === "" || provider === undefined || provider === null) ? "admin@growmymusic.com" : provider
        };

        performHttp(url, "post", httpData, function(response) {
            console.log("cordovahttp subscription : " + response);
            console.log(response);
            $('#ca-wrap').show();
            $('#ca-wrap .lm-close').click(function() {
                $('#ca-wrap').fadeOut();
            });
        }, function(response) {
            console.log(response.status);
            console.log(response.error);
            $('#ca-wrap').hide();
            errorHandler("An error has occured while trying to register your chosen monthly discounts, please try again later");
        });
    }

    function getLinks() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/6/public/values?alt=json', function(data, xhr) {
            console.log("get links");
            console.log('gdoc : ' + xhr);
            console.log(data);

            if (xhr == 200 || xhr == "success") {
                var context = data.feed.entry;
                console.log(context);
                for (var i = 0; i < context.length; i++) {
                    switch (context[i].gsx$section.$t) {
                        // case "BMG":
                        // case "Record Labels / Publishers":
                        //     $('.members-calendar-tiles[data-type="bmg"]').attr('data-url', context[i].gsx$link.$t);
                        //     break;
                        case "Music Sync":
                            $('.members-calendar-tiles[data-type="music-sync"]').attr('data-url', context[i].gsx$link.$t);
                            break;
                    }
                }


            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access resources.");
            }
        });
    }

    function sendMembershipCalendarMail(firstname, lastname, email, subject, message, type) {

        $('#mail-modal').fadeOut();

        var url = "https://growmymusic.com/wp-admin/admin-ajax.php";
        var action = testMode == true ? "membershipcalendarmailtest" : "membershipcalendarmail";
        var tileType = type.indexOf("-") > 0 ? type.replace("-", "") : type;
        var length
        var httpData = {
            "action": action,
            "MSFFirstName": firstname,
            "MSFLastName": lastname,
            "MSFEmail": email,
            "MSFSubject": subject,
            "MSFMessage": message,
        };
        var subtype = type;
        showLoader();


        performHttp(url, "post", httpData, function(response) {
            console.log(response);

            mailModalSuccess(type);
            logProfileSubmissions(subtype);

            $('.members-calendar-tiles[data-type="' + type + '"]').addClass('submitted');
            localStorage.setItem("submitted" + tileType, "true");

            if (parseInt(localStorage.activemc) > 0) {
                var amc = parseInt(localStorage.activemc) - 1;
                localStorage.setItem('activemc', amc);
                $('#b-mc .length').text(localStorage.activemc);
            } else {
                localStorage.setItem('activemc', "0");
            }
            $('.loader').fadeOut();
        }, function(response) {
            $('.loader').fadeOut();
            console.log(response.status);
            console.log(response.error);
            errorHandler("An error has occured while trying to send your submission, please try again later");
        });



    }

    function setMailModal(content, header, subheader, type) {
        $('#mail-modal textarea#mail-msg').val(content);
        $('#mail-modal .mail-header p.mh-h').text(header);
        $('#mail-modal .mail-header span').text(subheader);
        $('#mail-modal button#mail-send').attr('data-submitlink', type);
        $('#mail-modal').attr('data-type', type);

        $('.error-validation').each(function() {
            $(this).hide();
        });

        if ($('.mm-noprofile').length < 1) {
            $('#mail-modal > div').append('<div class="mm-noprofile"><p>You haven’t competed and saved your artist profile yet. Please complete now so you can submit.</p><button type="button" id="mm-profile">Complete your profile details</button></div>');
        }

        if (typeof(localStorage.hasprofile) != "undefined") {
            $('#mail-modal').addClass('hasprofile');
            $('#mail-modal').removeClass('noprofile');
        } else {
            $('#mail-modal').removeClass('hasprofile');
            $('#mail-modal').addClass('noprofile');
        }

        $('#mm-profile').click(function() {
            $('#mail-modal').hide();
            $('#profile-builder').fadeIn();
        })

        $('#mail-modal').fadeIn(200);
    }

    function mailModalSuccess(type) {
        switch (type) {
            case 'spotify':
            case "Streaming Services":
                $('#thankyou-wrap p').html('<p>Thank you for your submission. <br> We\'ll be in touch before the end of the month.</p>');
                break;
            case 'bmg':
            case 'Record Labels / Publishers':
                $('#thankyou-wrap p').html('<p>Thank you for your submission. <br> We\'ll be in touch before the end of the month.</p>');
                break;
            case 'hit-producer':
            case 'hitproducer':
                $('#thankyou-wrap p').html('<p>Thank you for your submission. <br> We\'ll be in touch before the end of the month.</p>');
                break;
            case 'writing-holidays':
            case 'writingholidays':
                $('#thankyou-wrap p').html('<p>Thank you for your submission. <br>We\'ll be in touch before the end of the month.</p>');
                break;
            case 'music-sync':
            case 'musicsync':
                $('#thankyou-wrap p').html('<p>Thank you for your submission. <br> We\'ll be in touch before the end of the month.</p>');
                break;
            case 'booking-agent':
            case 'bookingagent':
                $('#thankyou-wrap p').html('<p>Thank you for your submission. <br> We\'ll be in touch before the end of the month.</p>');
                break;
            case '2day-seminar':
            case '2dayseminar':
                $('#thankyou-wrap p').html('<p>Thank you for your application.  <br> We\'ll be in touch with more information shortly. Get excited, our 2 Day Seminar blows heads off and transform careers entirely!</p>');
                break;
        }
        $('#thankyou-wrap').fadeIn(200);
        $('#thankyou-wrap').click(function(e) {
            if (e.target != this) {
                return false;
            } else {
                $('#thankyou-wrap').fadeOut(200);
            }
        });
    }

    function getActiveMc() {
        console.log("active mc qty :" + localStorage.activemc);

        if (typeof(localStorage.activemc) != "undefined") {
            var parseActiveMc = parseInt(localStorage.activemc);
            console.log('puling active mc from local');
            if (parseActiveMc == 0 || parseActiveMc < 0 || parseActiveMc == NaN) {
                $('#b-mc .length').hide();
            } else {
                $('#b-mc .length').show();
                $('#b-mc .length').text(localStorage.activemc);
            }

        } else {
            $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/8/public/values?alt=json', function(data, xhr) {
                console.log("mc tiles");
                console.log('gdoc : ' + xhr);
                console.log(data);
                console.log('puling active mc from db');


                if (xhr == 200 || xhr == "success") {
                    var context = data.feed.entry;
                    console.log(context);

                    activeMC = 0;

                    if (context.length > 0) {
                        for (var i = 0; i < context.length; i++) {
                            if (context[i].gsx$status.$t === "A") {
                                activeMC++;
                            }
                        }

                        localStorage.setItem('activemc', activeMC);
                        $('#b-mc .length').show();
                        $('#b-mc .length').text(localStorage.activemc);
                    }
                }
            });
        }
    }

    function getSubmittedMC() {
        var id = localStorage.id;
        var submitteditems = 0;
        getSubmissionNumber();

        $.getJSON('https://spreadsheets.google.com/feeds/list/1Xz76QH1Cq0s3gQrcpwQCJ-fHvjjz6SKOeTGL-CKBhb0/1/public/values?alt=json', function(data, xhr) {
            console.log("mc tiles");
            console.log('gdoc : ' + xhr);
            console.log(data);
            console.log('puling submitted items from db');


            if (xhr == 200 || xhr == "success") {
                var context = data.feed.entry;
                console.log(context);
                if ( typeof(context) != "undefined" ) {
                    if (context.length > 0) {
                        for (var i = 0; i < context.length; i++) {
                            if (context[i].gsx$id.$t == id) {
                                if (context[i].gsx$submissionnumber.$t == localStorage.submissionnumber) {
                                    var submissiontype = context[i].gsx$type.$t;
                                    var parsesubmissiontype = submissiontype.replace("-", "");
                                    var submittedItem = "submitted" + parsesubmissiontype;
                                    localStorage.setItem(submittedItem, "true");
                                    submitteditems++;
                                    console.log('submitted items:' + submitteditems);
                                    $('.members-calendar-tiles[data-type="' + submissiontype + '"]').addClass('submitted');
                                }
                            }
                        }
                    }
                }
                if (typeof(localStorage.activemc) != "undefined") {
                    var active_mc = parseInt(localStorage.activemc) - parseInt(submitteditems);
                    console.log("submitted items from db:" + active_mc);
                    if (active_mc > 0) {
                        localStorage.setItem('activemc', active_mc);
                        getActiveMc();
                    } else if (active_mc < 1) {
                        localStorage.setItem('activemc', "0");
                        getActiveMc();
                    }
                }
            }
        })

    }

    function getSubmissionNumber() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/8/public/values?alt=json', function(data, xhr) {
            console.log("mc tiles");
            console.log('gdoc : ' + xhr);
            console.log(data);
            if (xhr == 200 || xhr == "success") {
                var context = data.feed.entry;
                console.log(context);
                for (var i = 0; i < context.length; i++) {
                    switch (context[i].gsx$name.$t) {
                        case "Submission Number":
                            if (typeof(localStorage.submissionnumber) != "undefined") {
                                if (parseInt(localStorage.submissionnumber) != parseInt(context[i].gsx$number.$t)) {
                                    resetMC();
                                    getActiveMc();
                                }
                            } else {
                                localStorage.setItem("submissionnumber", context[i].gsx$number.$t);
                            }
                    }
                }
            }
        })
    }

    function membershipCalendarTiles(callback) {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/8/public/values?alt=json', function(data, xhr) {
            console.log("mc tiles");
            console.log('gdoc : ' + xhr);
            console.log(data);

            if (xhr == 200 || xhr == "success") {
                var context = data.feed.entry;
                console.log("Membership Calendar Tiles");
                console.log(context);
                for (var i = 0; i < context.length; i++) {
                    console.log( context[i].gsx$name.$t + ":" + context[i].gsx$status.$t );
                    switch (context[i].gsx$name.$t) {

                        case "Streaming Services":
                        case "Spotify":
                            $('.members-calendar-tiles[data-type="spotify"]').attr('data-msg', context[i].gsx$message.$t);
                            if (context[i].gsx$status.$t === "A") {
                                $('.members-calendar-tiles[data-type="spotify"] .tile-wrap').removeClass('locked').addClass('active');
                            } else {
                                $('.members-calendar-tiles[data-type="spotify"] .tile-wrap').addClass('locked').removeClass('active');
                            }
                            if (typeof(localStorage.submittedspotify) != "undefined") {
                                $('.members-calendar-tiles[data-type="spotify"]').addClass('submitted');
                            }
                            break;
                        case "Record Labels / Publishers":
                        case "BMG":
                            $('.members-calendar-tiles[data-type="bmg"]').attr('data-msg', context[i].gsx$message.$t);
                            if (context[i].gsx$status.$t === "A") {
                                $('.members-calendar-tiles[data-type="bmg"] .tile-wrap').removeClass('locked').addClass('active');
                            } else {
                                $('.members-calendar-tiles[data-type="bmg"] .tile-wrap').addClass('locked').removeClass('active');
                            }
                            if (typeof(localStorage.submittedbmg) != "undefined") {
                                $('.members-calendar-tiles[data-type="bmg"]').addClass('submitted');
                            }
                            break;
                        case "Writing Holidays":
                            $('.members-calendar-tiles[data-type="writing-holidays"]').attr('data-msg', context[i].gsx$message.$t);
                            if (context[i].gsx$status.$t === "A") {
                                $('.members-calendar-tiles[data-type="writing-holidays"] .tile-wrap').removeClass('locked').addClass('active');
                            } else {
                                $('.members-calendar-tiles[data-type="writing-holidays"] .tile-wrap').addClass('locked').removeClass('active');
                            }
                            if (typeof(localStorage.submittedwritingholidays) != "undefined") {
                                $('.members-calendar-tiles[data-type="writing-holidays"]').addClass('submitted');
                            }
                            break;
                        case "Music Sync":
                            $('.members-calendar-tiles[data-type="music-sync"]').attr('data-msg', context[i].gsx$message.$t);
                            if (context[i].gsx$status.$t === "A") {
                                $('.members-calendar-tiles[data-type="music-sync"] .tile-wrap').removeClass('locked').addClass('active');
                            } else {
                                $('.members-calendar-tiles[data-type="music-sync"] .tile-wrap').addClass('locked').removeClass('active');
                            }
                            if (typeof(localStorage.submittedmusicsync) != "undefined") {
                                $('.members-calendar-tiles[data-type="music-sync"]').addClass('submitted');
                            }
                            break;
                        case "Booking Agent":
                            $('.members-calendar-tiles[data-type="booking-agent"]').attr('data-msg', context[i].gsx$message.$t);
                            if (context[i].gsx$status.$t === "A") {
                                $('.members-calendar-tiles[data-type="booking-agent"] .tile-wrap').removeClass('locked').addClass('active');
                            } else {
                                $('.members-calendar-tiles[data-type="booking-agent"] .tile-wrap').addClass('locked').removeClass('active');
                            }
                            if (typeof(localStorage.submittedbookingagent) != "undefined") {
                                $('.members-calendar-tiles[data-type="booking-agent"]').addClass('submitted');
                            }
                            break;
                        case "2 Day Seminar":
                            $('.members-calendar-tiles[data-type="2day-seminar"]').attr('data-msg', context[i].gsx$message.$t);
                            if (context[i].gsx$status.$t === "A") {
                                $('.members-calendar-tiles[data-type="2day-seminar"] .tile-wrap').removeClass('locked').addClass('active');
                            } else {
                                $('.members-calendar-tiles[data-type="2day-seminar"] .tile-wrap').addClass('locked').removeClass('active');
                            }
                            if (typeof(localStorage.submitted2dayseminar) != "undefined") {
                                $('.members-calendar-tiles[data-type="2day-seminar"]').addClass('submitted');
                            }
                            break;
                    }
                }
                callback();
            } else {
                errorHandler('An error has occured while trying to reach the Membership Calendar Database. Please try again later');
                $('.loader').fadeOut(200);
            }
        });
    }

    function getCouponCategories() {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/9/public/values?alt=json', function(data, xhr) {

            if (xhr == 200 || xhr == "success") {
                var source = $("#c-category-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';

                console.log(data);

                for (var i = 0; i < context.length; i++) {
                    html = html.concat(template(context[i]));
                }

                $('#mb-dc-items select').html('');
                $('#monthly-dc-items select').html('');

                $('#mb-dc-items select').append(html);
                $('#monthly-dc-items select').append(html);

                $('.loader').fadeOut(200);

            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access the hit producer catalog database, please try again.");
            }
        });
    }

    function monthlyFilters() {
        $('select#monthly-filters').change(function() {
            var x = $(this).val();

            if (x != "All") {
                $('#md-items .coupon-block').each(function() {
                    $(this).slideUp(200);
                });

                setTimeout(function() {
                    $('#md-items .coupon-block[data-category="' + x + '"]').each(function() {
                        $(this).slideDown(200);
                    });
                }, 1000);

            } else {

                $('#md-items .coupon-block').each(function() {
                    $(this).slideDown(200);
                });

                setTimeout(function() {
                    $('#md-items .coupon-block').each(function() {
                        $(this).fadeIn();
                    });
                }, 500);

            }
        });
    }

    function standardFilters() {
        $('select#standard-filters').change(function() {
            var x = $(this).val();

            if (x != "All") {
                $('#sd-items .coupon-block').each(function() {
                    $(this).slideUp(200);
                });

                setTimeout(function() {
                    $('#sd-items .coupon-block[data-category="' + x + '"]').each(function() {
                        $(this).slideDown(200);
                    });
                }, 1000);

            } else {

                $('#sd-items .coupon-block').each(function() {
                    $(this).slideDown(200);
                });

                setTimeout(function() {
                    $('#sd-items .coupon-block').each(function() {
                        $(this).fadeIn();
                    });
                }, 500);

            }
        });
    }

    function couponTabs() {
        $('.coupon-tab').each(function() {

            $(this).click(function() {
                var target = $(this).attr('data-loc');
                $('.coupon-tab').each(function() {
                    $(this).removeClass('active');
                });
                $(this).addClass('active');
                $('#monthly-dc-items').hide();
                $('#mb-dc-items').hide();
                $('#' + target).show();
            });

        });
    }

    function redeemCouponItem() {
        $('.redeem-coupon').each(function() {
            $(this).click(function(event) {
                event.stopImmediatePropagation();

                var provider = $(this).attr('data-provider');
                var discount = $(this).attr('data-discount');
                var category = $(this).attr('data-category');
                var type = $(this).attr('data-type');
                var identifier = $(this).attr('data-id');
                var couponName = $(this).attr('data-name');
                var couponCode = $(this).attr('data-code');
                var serial = generateSerial();
                var userName = localStorage.firstname + ' ' + localStorage.lastname;
                var userEmail = localStorage.user;
                var userId = localStorage.id;
                showLoader("");

                logCoupons(userId, userName, userEmail, couponName, discount, identifier, couponCode, provider, serial, type);
            });
        });
    }

    function setPages() {
        // GET WORKSHOPS
        $.ajax({
            url: "https://s3.amazonaws.com/gmmonlinecourse2017/gmm_app/workshop.json",
            dataType: 'json',
            type: 'GET',
            async: true,
            success: function(data) {
                console.log(data);
                var source = $("#ind-vid-template").html();
                var template = Handlebars.compile(source);
                var context = data.data;
                var html = '';

                for (var i = 0; i < context.length; i++) {
                    html = html.concat(template(context[i]));
                }
                $('#workshop-items').append(html);
                setTiles();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                errorHandler("An error has occured while trying to get workshops, please try again.");
            }
        });

        // GET DIGITAL MARKETING
        $.getJSON("https://s3.amazonaws.com/gmmonlinecourse2017/gmm_app/digitalmarketing.json", function(data) {
            console.log('pulled digital marketing videos');
            console.log(data);
            var source = $("#ind-vid-template").html();
            var template = Handlebars.compile(source);
            var context = data.data;
            var html = '';

            for (var i = 0; i < context.length; i++) {
                html = html.concat(template(context[i]));
            }
            $('#digitalmarketing-items').append(html);
            setTiles();
        });

        // GET MODULES
        $.ajax({
            url: "https://s3.amazonaws.com/gmmonlinecourse2017/gmm_app/modules.json",
            dataType: 'json',
            type: 'GET',
            async: true,
            success: function(data) {
                console.log(data);
                var source = $("#ind-vid-template").html();
                var template = Handlebars.compile(source);
                var context = data.data;

                var source2 = $("#group-vid-template").html();
                var template2 = Handlebars.compile(source2);

                var totalModules = data.data.length;

                for (var i = 0; i < context.length; i++) {
                    var html = '';
                    var html2 = '';

                    var context2 = data.data[i].items;
                    html = html.concat(template2(context[i]));

                    for (var z = 0; z < context2.length; z++) {
                        html2 = html2.concat(template(context2[z]));
                    }

                    $('#module-items').append(html);
                    $('#module-items .section-slide').eq(i).find('.slider').append(html2);
                }

                // $.initialize("#modules-con .slider", function() {
                //     if ($(this).find('.tile').length > 1) {
                //         $(this).slick({
                //             arrows: false,
                //             variableWidth: true,
                //             infinite: true,
                //             centerMode: true,
                //             speed: 200
                //         });
                //     } else {
                //         $(this).addClass('single');
                //     }

                // });
                setTiles();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                errorHandler("An error has occured while trying to get course modules, please try again.");
            }
        });

        // GET MASTERCLASS
        $.ajax({
            url: "https://s3.amazonaws.com/gmmonlinecourse2017/gmm_app/masterclass.json",
            dataType: 'json',
            type: 'GET',
            async: true,
            success: function(data) {
                console.log(data);
                var source = $("#ind-vid-template").html();
                var template = Handlebars.compile(source);
                var context = data.data;


                var source2 = $("#group-vid-template").html();
                var template2 = Handlebars.compile(source2);

                var totalModules = data.data.length;

                for (var i = 0; i < context.length; i++) {
                    var html = '';
                    var html2 = '';

                    var context2 = data.data[i].items;
                    html = html.concat(template2(context[i]));

                    for (var z = 0; z < context2.length; z++) {
                        html2 = html2.concat(template(context2[z]));
                    }

                    $('#masterclass-items').append(html);
                    $('#masterclass-items .section-slide').eq(i).find('.slider').append(html2);
                }

                // $.initialize("#masterclass-con .slider", function() {
                //     if ($(this).find('.tile').length > 1) {
                //         $(this).slick({
                //             arrows: false,
                //             variableWidth: true,
                //             infinite: true,
                //             centerMode: true,
                //             speed: 200
                //         });
                //     } else {
                //         $(this).addClass('single');
                //     }

                // });
                setTiles();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                errorHandler("An error has occured while trying to get course modules, please try again.");
            }
        });
    }

    function getResources(callback) {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/10/public/values?alt=json', function(data, xhr) {

            if (xhr == 200 || xhr == "success") {
                var source = $("#resource-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';

                console.log(data);

                for (var i = 0; i < context.length; i++) {
                    html = html.concat(template(context[i]));
                }
                $('#resources-items').html('');
                $('#resources-items').append(html);
                $('.loader').fadeOut(200);
                callback();
            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access the resources database, please try again.");
            }
        });
    }

    function getDmResources(callback) {
        $.getJSON('https://spreadsheets.google.com/feeds/list/1wIAhsFwuIHNld3zE42elcE3EDSQLF3icLrJBDMswFiY/11/public/values?alt=json', function(data, xhr) {

            if (xhr == 200 || xhr == "success") {
                var source = $("#resource-template").html();
                var template = Handlebars.compile(source);
                var context = data.feed.entry;
                var html = '';

                console.log(data);

                for (var i = 0; i < context.length; i++) {
                    html = html.concat(template(context[i]));
                }
                $('#dm-resources').html('');
                $('#dm-resources').append(html);
                $('.loader').fadeOut(200);
                callback();
            } else {
                $('.loader').fadeOut(200);
                errorHandler("An error has occured while trying to access the resources database, please try again.");
            }
        });
    }

    /* ==================================
            CHECK UNLOCK
    ===================================*/
    function checkUnlock(status) {
        if (status == 'unlock') {
            $('.locked').each(function() {
                $(this).removeClass('locked');
            });
            $('body').addClass('testing');
            $('.dismiss').click(function() {
                $('body').removeClass('testing');
            });
        }
    }
    /* ==================================
                EVENTS
    ===================================*/
    function backtoprevious() {
        // $('.navigation').removeClass('content').addClass('home');
        //     $('#inner-content').removeClass('content');
        //     $(window).scrollTop(0);
        //     setTimeout(function() {
        //         $('.content-wrap').fadeIn(200);
        //     }, 300);


        //     setTimeout(function() {
        //         $('.content-body').each(function() {
        //             $(this).hide();
        //         });
        //         $('#inner-content').hide();
        //     }, 300);

        //     if (cordova) {
        //         screen.orientation.lock('portrait');
        //     }

        //     destroyBannerAds();
        removeAllVideos();

        if (!$('#my-account-page').hasClass('ma-active') && $('#inner-content').hasClass('content') && !$('.video').is(':visible')) {
            $('.navigation').removeClass('content').addClass('home');
            $('#bottom-nav').removeClass('content');
            $('#inner-content').toggleClass('content');
            $('.content-wrap').fadeIn(200);
            setTimeout(function() {
                $('.content-body').each(function() {
                    $(this).hide();
                });
                $('#inner-content').hide();
            }, 300);
        } else if (!$('#my-account-page').hasClass('ma-active') && $('#inner-content').hasClass('content') && $('.video').is(':visible')) {
            var vid = $('#video')[0];
            vid.pause();
            $('.video').fadeOut(200);
            $('#mp4').attr('src', '');
            destroyBannerAds();
            if (cordova) {
                screen.orientation.lock('portrait');
            }
            $('.video').fadeOut(200);
        } else if ($('#my-account-page').hasClass('ma-active') && !$('#inner-content').hasClass('content')) {
            $('.content-wrap').fadeIn(200);
            $('.navigation').fadeIn(200);
            $('#my-account-page').removeClass('ma-active').fadeOut(200);
        } else if ($('#my-account-page').hasClass('ma-active') && $('#inner-content').hasClass('content')) {
            $('.content-wrap').fadeIn(200);
            $('.inner-content').fadeIn(200);
            $('.navigation').fadeIn(200);
            $('#my-account-page').removeClass('ma-active').fadeOut(200);
        } else if ($('#contact-page').hasClass('c-active')) {
            $('.content-wrap').fadeIn(200);
            $('.inner-content').fadeIn(200);
            $('.navigation').fadeIn(200);
            $('#contact-page').removeClass('c-active').fadeOut(200);
        } else if ($('.login-page').hasClass('active')) {
            $('.first-page').show();
            $('.login-page').removeClass('active');
            setTimeout(function() {
                $('#log-in-form').hide();
                $('#reg-form').hide();
            }, 300);
        }
    }

    function showSlider() {
        $('#t-slider').show();

        $('#t-slide-wrap').slick({
            arrows: false,
            dots: true,
            infinite: false,
            autoplay: false,
            speed: 200
        });

        $('button#t-profile').click(function() {
            showLoader("checking for existing profiles");
            getProfile();
            initProfileBtns();
            $('#profile-builder').fadeIn();
        });

        $('button#t-close').click(function() {
            $('html, body').scrollTop(0);
            $('#t-slider').fadeOut();
            localStorage.setItem('slide', 'true');
        });
    }

    function initEvents() {
        // $('#b-contact').click(function() {
        //     $('#contact.ipage').click();
        // });

        // $('#b-mc').click(function() {
        //     $('#memberscalendar.ipage').click();
        // });

        $('#bottom-nav span').each(function() {

            $(this).click(function() {
                var target = $(this).attr('data-targetcon');
                $('#bottom-nav span').each(function() {
                    $(this).removeClass('active');
                });
                $(this).addClass('active');
                $('#h-content .category-section').each(function() {
                    $(this).stop().hide();
                    $('.category-section[data-cat="' + target + '"]').stop().show();
                });
            })
        })

        // Take photo from camera
        $('#take-photo').click(function() {
            navigator.camera.getPicture(onSuccessImage, onFailImage, {
                quality: 20,
                destinationType: Camera.DestinationType.FILE,
                targetWidth: 600,
                targetHeight: 600,
                correctOrientation: true
            });
        });

        // Select from gallery
        $("#open-gallery").click(function() {
            navigator.camera.getPicture(onSuccessImage, onFailImage, {
                quality: 20,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                allowEdit: true,
                destinationType: Camera.DestinationType.DATA_URL,
                targetWidth: 600,
                targetHeight: 600,
                correctOrientation: true
            });
        });

        // Change image source
        function onSuccessImage(imageData) {
            console.log(imageData);
            // var b64;
            // window.plugins.Base64.encodeFile(imageData, function(base64){
            //     console.log('file base64 encoding: ' + base64);
            //     b64 = base64;
            // });
            var image = document.getElementById('profile-photo-img');
            var imageDataName = 'data:image/jpeg;base64,' + imageData;
            image.src = imageDataName;
            $('#image-data').val(imageData);
        }

        function onFailImage(message) {
            //alert('Upload image failed: ' + message);
            console.log("Upload image failed : " + message);
        }


        $('.start-trial').click(function() {
            $('#first-use').hide();
            logTrial(localStorage.id);
        });


        // CHECK SWIPE FUNCTIONS
        // $('#inner-content').on('swiperight', function() {
        //     console.log('swipe left');
        //     backtoprevious();
        // });

        // $('#my-account-page').on('swiperight', function() {
        //     console.log('swipe left');
        //     backtoprevious();
        // });

        // $('.video').on('swiperight', function() {
        //     console.log('swipe left');
        //     backtoprevious();
        // });

        function swipedRight() {
            backtoprevious();
        }

        $('#inner-content').swipe({
            swipeRight: function(event, direction, distance, duration, fingerCount) {
                console.log("You swiped " + direction);
                swipedRight();
            }
        });

        $('#my-account-page').swipe({
            swipeRight: function(event, direction, distance, duration, fingerCount) {
                console.log("You swiped " + direction);
                swipedRight();
            }
        });

        $('.video').swipe({
            swipeRight: function(event, direction, distance, duration, fingerCount) {
                console.log("You swiped " + direction);
                swipedRight();
            }
        });

        // var icContent = $('#inner-content');
        // var vidContent = $('.video');
        // var accountContent = $('#my-account-page');

        // var hammerOptions = {

        // };
        // $(icContent).hammer(hammerOptions).bind("panright", backtoprevious);
        // $(vidContent).hammer(hammerOptions).bind("panright", backtoprevious);
        // $(accountContent).hammer(hammerOptions).bind("panright", backtoprevious);



        $('#success-trial').click(function(e) {
            if (e.target != this) {
                return false;
            } else {
                removeAllVideos();
                localStorage.setItem("firstuse", "false");
                $('#success-trial').fadeOut(200);
            }
        });

        $('#success-trial .lm-close').click(function(e) {
            $('#success-trial').fadeOut(200);
        });

        $('#inviteafriend').click(function(e) {
            e.preventDefault();
            if (cordova) {
                if (window.plugins.socialsharing) {
                    window.plugins.socialsharing.shareWithOptions(shareoptions, shareonSuccess, shareonError);
                }
            }
        });

        $('#fpass').click(function(e) {
            e.preventDefault();
            $('#forgot-wrap').fadeIn();
        });

        $('#forgot-wrap').click(function(e) {
            if (e.target != this) {
                return false;
            } else {
                $('#forgot-wrap').fadeOut(200);
                setTimeout(function() {
                    $('#forgot-first').show();
                    $('#forgot-second').hide();
                });
            }
        });

        $('button#sendforgotpassword').click(function(e) {
            e.preventDefault();
            var email = encodeURIComponent($('#forgotemail').val());

            $.ajax({
                beforeSend: function() {
                    showLoader("");
                },
                type: "POST",
                url: "https://growmymusic.com/api/user/retrieve_password/?user_login=" + email + "&insecure=cool",
                crossDomain: true,
                cache: false,
                success: function(data, xhr) {
                    if ((xhr === 200 || xhr == "success") && data.status == 'ok') {
                        $('.loader').fadeOut(200);
                        $('#forgot-first').hide();
                        $('#forgot-second').show();
                    } else if ((xhr === 200 || xhr == "success") && data.status == 'error') {
                        $('.loader').fadeOut(200);
                        setTimeout(function() {
                            $('.login-form p.error').stop().slideDown();
                        }, 500);
                    } else {
                        errorHandler("An error has occured please try again later.");
                    }
                }
            });
            // cordovaHTTP.post(url, {
            //     "user_login": email,
            //     "insecure": "cool"
            // }, {
            //     Authorization: "Basic YnVubnlmaXNoY3JlYXRpdmVzOmJ1bm55aGl0bzYyMQ=="
            // }, function(response) {

            //     console.log("cordovahttp subscription : " + response);
            //     console.log(response);
            //     var data = JSON.parse(response.data);

            //     if (data.status == 'ok') {
            //         $('.loader').fadeOut(200);
            //         $('#forgot-first').hide();
            //         $('#forgot-second').show();
            //     } else if (data.status == 'error') {
            //         $('.loader-message').text('');
            //         $('.loader').fadeOut(200);
            //         setTimeout(function() {
            //             $('.login-form p.error').stop().slideDown();
            //         }, 500);
            //     } else {
            //         errorHandler("An error has occured please try again later.");
            //     }
            // }, function(response) {
            //     console.log(response.status);
            //     console.log(response.error);
            //     $('.loader').fadeOut(200);

            //     errorHandler("An error has occured please try again later.");
            // });
        });

        $('.login-input').each(function() {
            $(this).on('focus', function() {
                if ($(this).val() == '') {
                    $(this).addClass('focus');
                    $(this).prev().addClass('focus');
                    $(this).next().addClass('focus');
                } else {
                    $(this).prev().addClass('focus');
                    $(this).next().addClass('focus');
                }
            })
            $(this).on('blur', function() {
                if ($(this).val() == '') {
                    $(this).removeClass('focus');
                    $(this).prev().removeClass('focus');
                    $(this).next().removeClass('focus');
                } else {
                    $(this).addClass('focus');
                    $(this).prev().addClass('focus');
                    $(this).next().addClass('focus');
                }
            });
        });

        $('span#my-account').click(function() {

            $('.content-wrap').hide();
            $('.inner-content').hide();
            $('.navigation').hide();

            $('#my-account-page').show();
            setTimeout(function() {
                $('#my-account-page').addClass('ma-active');
            }, 400);

            myAccount();

            $('#ma-back').click(function() {
                if ($('#inner-content').hasClass('content')) {
                    $('.content-wrap').show();
                    $('.inner-content').show();
                }
                if (!$('#inner-content').hasClass('content')) {
                    $('.content-wrap').show();
                }
                $('.navigation').show();
                $('#my-account-page').removeClass('ma-active');

                setTimeout(function() {
                    $('#my-account-page').hide();
                }, 400);
            });

            $('#restore-purchases').click(function() {
                console.log('restoring inapp purchases');
                restoreInAppPurchase(localStorage.id);
            });

            $('#my-account-page .lm-link').each(function() {
                $(this).click(function(e) {
                    e.preventDefault();
                    $('body').addClass('learn-more-open');

                    if (os == "ios") {
                        var registeredIAP = iapList;

                        if (testMode == false) {
                            inAppPurchases(registeredIAP);
                        } else {
                            var data = [{
                                description: 'Digital Marketing - Yearly',
                                price: '$99.99',
                                productId: 'com.growmymusic.digitalmarketingyearly',
                                title: 'Digital Marketing - Yearly',
                            }, {
                                description: 'Virtual Artist Manager - Monthly',
                                price: '$19.00',
                                productId: 'com.growmymusic.vamyearly',
                                title: 'Virtual Artist Manager - Monthly',
                            }, {
                                description: 'Online Course',
                                price: '$99.99',
                                productId: 'com.growmymusic.onlinecourse2dayseminar',
                                title: 'Online Course',
                            }];
                            testIap(data);
                        }
                    } else {
                        inAppPurchasesAndroid();
                    }

                    $('#locked-wrap').hide();
                    $('#learnmore-wrap').show();

                    $('#learnmore-wrap').click(function(e) {
                        if (e.target != this) {
                            return false;
                        } else {
                            $('#learnmore-wrap').hide();
                            $('body').removeClass('learn-more-open');
                        }
                    });
                });
            });

            $('#my-account-page div.lm-close').click(function() {
                $('#learnmore-wrap').hide();
                $('body').removeClass('learn-more-open');
            });



        });

        $('.epage').each(function() {
            $(this).click(function(e) {
                if ($(this).hasClass('locked')) {
                    var id = $(this).attr('id');
                    locked(id);
                } else {
                    var url = $(this).attr('data-url');
                    var id = $(this).attr('id');
                    if (id != 'facebookgroup') {
                        browser(url);
                    } else {
                        if (os == 'ios') {
                            window.open('https://www.facebook.com/607553962736192/', '_system');
                        } else if (os == 'android') {
                            window.open('https://www.facebook.com/607553962736192/', '_system');
                        }
                    }
                }
            });
        });

        $('.lm-link').each(function() {
            $(this).click(function(e) {
                e.preventDefault();
                $('body').addClass('learn-more-open');

                if (os == "ios") {
                    var registeredIAP = iapList;

                    if (testMode == false) {
                        inAppPurchases(registeredIAP);
                    } else {
                        var data = [{
                            description: 'Digital Marketing - Yearly',
                            price: '$99.99',
                            productId: 'com.growmymusic.digitalmarketingyearly',
                            title: 'Digital Marketing - Yearly',
                        }, {
                            description: 'Virtual Artist Manager - Monthly',
                            price: '$19.00',
                            productId: 'com.growmymusic.vamyearly',
                            title: 'Virtual Artist Manager - Monthly',
                        }, {
                            description: 'Online Course',
                            price: '$99.99',
                            productId: 'com.growmymusic.onlinecourse2dayseminar',
                            title: 'Online Course',
                        }];
                        testIap(data);
                    }
                } else {
                    inAppPurchasesAndroid();
                }

                $('#locked-wrap').fadeOut(200);
                $('#learnmore-wrap').fadeIn(200);

                $('#learnmore-wrap').click(function(e) {
                    if (e.target != this) {
                        return false;
                    } else {
                        $('#learnmore-wrap').fadeOut(200);
                        $('body').removeClass('learn-more-open');
                    }
                });
            });
        });

        $('div.lm-close').click(function() {
            $('#learnmore-wrap').fadeOut(200);
            $('body').removeClass('learn-more-open');
        });

        $('#invert').click(function() {
            $('body').stop().toggleClass('light-mode');
        });

        $('#log-back').click(function() {
            $('.first-page').show();
            $('.login-page').removeClass('active');
            setTimeout(function() {
                $('#log-in-form').hide();
                $('#reg-form').hide();
            }, 300);
        });

        $('.first-page #log').click(function() {
            $('#log-in-form').show();
            $('#reg-form').hide();
            $('.login-page').toggleClass('active');
            setTimeout(function() {
                $('.first-page').hide();
            }, 300);
        });

        $('.first-page #reg').click(function() {
            $('#log-in-form').hide();
            $('#reg-form').show();
            $('.login-page').toggleClass('active');
            setTimeout(function() {
                $('.first-page').hide();
            }, 300);
        });

        $('#login').click(function() {
            var user = $('#username').val();
            var pass = $('#pass').val();
            login(user, pass);
        });

        $('#signup').click(function() {
            var user = $('#r-username').val();
            var email = $('#r-email').val();
            var pass = $('#r-pass').val();
            var rfirst = $('#r-fn').val();
            var rlast = $('#r-ln').val();
            var phone = $('#r-phone').val();
            register(user, email, pass, rfirst, rlast, phone);
        });

        $('#login-reg').click(function() {
            $('.login-page #reg-form').slideToggle();
            setTimeout(function() {
                $('.login-page #log-in-form').slideToggle();
            }, 200);
        });

        $('#reg-login').click(function() {
            $('.login-page #log-in-form').slideToggle();
            setTimeout(function() {
                $('.login-page #reg-form').slideToggle();
            }, 200);
        });

        $('#mail-modal').click(function(e) {
            if (e.target != this) {
                return false;
            } else {
                $('#mail-modal').fadeOut(200);
                $('#seminar-schedule').html('');
                $('#beatstars-items').html('');
                removeAllVideos();
            }
        });


        $('.members-calendar-tiles').each(function() {
            $(this).click(function() {
                var type = $(this).attr('data-type');
                var isSubmitted = $(this).hasClass('submitted');
                var dataType = type.indexOf('-') > -1 ? type.replace("-", "") : type;

                if ($(this).find('.tile-wrap').hasClass('locked')) {
                    locked(type, $(this).attr('data-msg'));
                } else {
                    switch (type) {
                        case 'spotify':

                            if (typeof(localStorage.submittedspotify) == "undefined") {
                                $('#writing-holidays-video').hide();
                                $('#writing-holidays-video-mp4').attr('src', '');

                                var header = "We service to Streaming Services twice a year.";
                                var subheader = "please don't forget to include the link to your music on your artist profile";
                                var content = "Please submit this single to pitch to Streaming Services  \n\n" +
                                    "[paste link to single here]";

                                setMailModal(content, header, subheader, type);

                                $('#mail-modal button#mail-profile-send').click(function() {
                                    sendProfileDetails(localStorage.firstname, localStorage.lastname, localStorage.user, "Streaming Services Submission", type);
                                });

                                $('#mail-modal button#mail-send').click(function() {
                                    var fn = $('input#mail-fn').val();
                                    var ln = $('input#mail-ln').val();
                                    var em = $('input#mail-email').val();
                                    var msg = $('textarea#mail-msg').val();
                                    var type = $(this).attr('data-submitlink');
                                    var subj = "Streaming Services Submission";

                                    if (fn == "") {
                                        $('input#mail-fn').prev().show();
                                    }
                                    if (ln == "") {
                                        $('input#mail-ln').prev().show();
                                    }
                                    if (em == "") {
                                        $('input#mail-email').prev().show();
                                    }
                                    if (msg == "") {
                                        $('textarea#mail-msg').prev().show();
                                    }

                                    if (fn != "" && ln != "" && em != "" && msg != "") {
                                        sendMembershipCalendarMail(fn, ln, em, subj, msg, type);
                                    }
                                });


                                $('#mail-modal .mail-header span').show();
                                $('#seminar-schedule').hide();
                                $('#beatstars-items').hide();
                                $('#mail-form').hide();
                                $('.mail-modal-buttons').show();
                            } else {
                                locked(type, "You have submitted already. We receive and review every submission for pitch, so don't worry we're across it.");
                            }

                            break;
                        case 'bmg':
                            if (typeof(localStorage.submittedbmg) == "undefined") {
                                $('#writing-holidays-video').hide();
                                $('#writing-holidays-video-mp4').attr('src', '');

                                var header = "We service to Record Labels / Publishers";
                                var subheader = "please don't forget to include the link to your music on your artist profile";
                                var content = "Please submit this single to pitch to Record Labels / Publishers  \n\n" +
                                    "[paste link to single here]";

                                setMailModal(content, header, subheader, type);

                                $('#mail-modal button#mail-profile-send').click(function() {
                                    sendProfileDetails(localStorage.firstname, localStorage.lastname, localStorage.user, "Streaming Services Submission", type);
                                });

                                $('#mail-modal button#mail-send').click(function() {
                                    var fn = $('input#mail-fn').val();
                                    var ln = $('input#mail-ln').val();
                                    var em = $('input#mail-email').val();
                                    var msg = $('textarea#mail-msg').val();
                                    var type = $(this).attr('data-submitlink');
                                    var subj = "Record Labels / Publishers Submission";

                                    if (fn == "") {
                                        $('input#mail-fn').prev().show();
                                    }
                                    if (ln == "") {
                                        $('input#mail-ln').prev().show();
                                    }
                                    if (em == "") {
                                        $('input#mail-email').prev().show();
                                    }
                                    if (msg == "") {
                                        $('textarea#mail-msg').prev().show();
                                    }

                                    if (fn != "" && ln != "" && em != "" && msg != "") {
                                        sendMembershipCalendarMail(fn, ln, em, subj, msg, type);
                                    }
                                });


                                $('#mail-modal .mail-header span').show();
                                $('#seminar-schedule').hide();
                                $('#beatstars-items').hide();
                                $('#mail-form').hide();
                                $('.mail-modal-buttons').show();
                            } else {
                                locked(type, "You have submitted already. We receive and review every submission for pitch, so don't worry we're across it.");
                            }
                            
                            break;
                        case 'hit-producer':

                            $('#writing-holidays-video').hide();
                            $('#writing-holidays-video-mp4').attr('src', '');
                            $('#mail-modal .mail-header p.mh-h').text('Hit Producer Catalogs');
                            getBeatStars();
                            $('#mail-modal .mail-header span').hide();
                            $('#seminar-schedule').hide();
                            $('#mail-form').hide();
                            $('#beatstars-items').show();
                            $('#mail-modal').attr('data-type','hit-producer');
                            $('#mail-modal').fadeIn(200);

                            $('.mail-modal-buttons').hide();
                            break;
                        case 'writing-holidays':
                            if (typeof(localStorage.submittedwritingholidays) == "undefined") {
                                $('#writing-holidays-video').show();
                                $('#writing-holidays-video-mp4').attr('src', 'https://s3.amazonaws.com/gmmonlinecourse2017/ads/writingholiday.mp4');
                                var vid = $('#writing-holidays-video')[0];
                                vid.load();

                                $('video#writing-holidays-video').click(function() {
                                    if (vid.paused)
                                        vid.play();
                                    else
                                        vid.pause();
                                });

                                var header = "Express your interest for the next Grow My Music Writing Holiday";
                                var subheader = "Writing Holiday’s occur a various points throughout the year in all sorts of locations. To be considered complete the form below. NOTE: There is a cost to attend the writing holiday’s. Costs vary depending on the camp. This is simply an expression of interest though from your end to get on our radar.";

                                var content = "Full name: \n" +
                                    "Email address: \n" +
                                    "Phone number: \n" +
                                    "State: \n\n" +
                                    "Paste links to 2 songs you’ve written or co-written\n" +
                                    "List what you wrote in each song\n";

                                setMailModal(content, header, subheader, type);

                                $('#mail-modal button#mail-profile-send').click(function() {

                                    sendProfileDetails(localStorage.firstname, localStorage.lastname, localStorage.user, "Writing Holidays Submission", type);
                                });

                                $('#mail-modal button#mail-send').click(function() {
                                    var fn = $('input#mail-fn').val();
                                    var ln = $('input#mail-ln').val();
                                    var em = $('input#mail-email').val();
                                    var msg = $('textarea#mail-msg').val();
                                    var type = $(this).attr('data-submitlink');
                                    var subj = "Writing Holidays Submission";

                                    if (fn === "") {
                                        $('input#mail-fn').prev().show();
                                    }
                                    if (ln === "") {
                                        $('input#mail-ln').prev().show();
                                    }
                                    if (em === "") {
                                        $('input#mail-email').prev().show();
                                    }
                                    if (msg === "") {
                                        $('textarea#mail-msg').prev().show();
                                    }

                                    if (fn !== "" && ln !== "" && em !== "" && msg !== "") {
                                        sendMembershipCalendarMail(fn, ln, em, subj, msg, type);
                                    }

                                });

                                $('#mail-modal .mail-header span').show();
                                $('#seminar-schedule').hide();
                                $('#beatstars-items').hide();
                                $('#mail-form').hide();
                                $('.mail-modal-buttons').show();
                            } else {
                                locked(type, "You have submitted already. We receive and review every submission for pitch, so don't worry we're across it.");
                            }
                            break;
                        case 'music-sync':
                            var url = $(this).attr('data-url');
                            browser(url);

                            break;
                        case 'booking-agent':
                            if (typeof(localStorage.submittedbookingagent) == "undefined") {
                                $('#writing-holidays-video').hide();
                                $('#writing-holidays-video-mp4').attr('src', '');

                                var header = "Biannually we pitch motivated artists who are tour-ready to Australia’s most heritage and notable booking agents.";
                                var subheader = "Please let us know why you or your band deserves to be signed to a booking agent in your artist profile and submit below.";

                                var content = "I'd like to pitch [Insert Artist/Band name] to be signed by a booking agent. Here's some reasons why I believe they'd value me/us on their roster: \n\n" +
                                    "[Insert, in dot points your achievements, for example \n" +
                                    "● Who you’ve supported previously?\n" +
                                    "● Have you sold out any shows yourself?\n" +
                                    "● Has someone notable posted about you?\n" +
                                    "● Does your Spotify statistics present well?\n" +
                                    "● Do you have a strong social media presence? \n" +
                                    "● Have you had radio play? etc.\n\n" +
                                    "● Links to 1-2 of your social media accounts\n" +
                                    "● 1 link to your strongest song]\n\n" +
                                    "Thank you Grow My Music, you guys are game changers for motivated muso’s!";

                                setMailModal(content, header, subheader, type);

                                $('#mail-modal button#mail-profile-send').click(function() {

                                    sendProfileDetails(localStorage.firstname, localStorage.lastname, localStorage.user, "Booking Agent Submission", type);
                                });

                                $('#mail-modal button#mail-send').click(function() {
                                    var fn = $('input#mail-fn').val();
                                    var ln = $('input#mail-ln').val();
                                    var em = $('input#mail-email').val();
                                    var msg = $('textarea#mail-msg').val();
                                    var type = $(this).attr('data-submitlink');
                                    var subj = "Booking Agent Submission";

                                    if (fn === "") {
                                        $('input#mail-fn').prev().show();
                                    }
                                    if (ln === "") {
                                        $('input#mail-ln').prev().show();
                                    }
                                    if (em === "") {
                                        $('input#mail-email').prev().show();
                                    }
                                    if (msg === "") {
                                        $('textarea#mail-msg').prev().show();
                                    }

                                    if (fn !== "" && ln !== "" && em !== "" && msg !== "") {
                                        sendMembershipCalendarMail(fn, ln, em, subj, msg, type);
                                    }
                                });

                                $('#mail-modal .mail-header span').show();
                                $('#seminar-schedule').hide();
                                $('#beatstars-items').hide();
                                $('#mail-form').hide();
                                $('.mail-modal-buttons').show();
                            } else {
                                locked(type, "You have submitted already. We receive and review every submission for pitch, so don't worry we're across it.");
                            }


                            break;
                        case '2day-seminar':
                            if (typeof(localStorage.submittedbookingagent) == "undefined") {
                                $('#writing-holidays-video').hide();
                                $('#writing-holidays-video-mp4').attr('src', '');

                                var header = "Enrol for the 2-Day Seminar 2018 NOW!";
                                var subheader = "";

                                var content = "I’d like to express my interest for this year’s Seminar. \n\n" +
                                    "Full Name: \n" +
                                    "Email address: \n" +
                                    "Phone number: \n" +
                                    "State: \n\n";

                                setMailModal(content, header, subheader, type);
                                getSeminarSchedule();

                                $('#mail-modal').fadeIn(200);

                                $('#mail-modal button#mail-profile-send').click(function() {
                                    sendProfileDetails(localStorage.firstname, localStorage.lastname, localStorage.user, "2-Day Seminar Inquiry", type);
                                });

                                $('#mail-modal button#mail-send').click(function() {
                                    var fn = $('input#mail-fn').val();
                                    var ln = $('input#mail-ln').val();
                                    var em = $('input#mail-email').val();
                                    var msg = $('textarea#mail-msg').val();
                                    var type = $(this).attr('data-submitlink');
                                    var subj = "2-Day Seminar Inquiry";

                                    if (fn === "") {
                                        $('input#mail-fn').prev().show();
                                    }
                                    if (ln === "") {
                                        $('input#mail-ln').prev().show();
                                    }
                                    if (em === "") {
                                        $('input#mail-email').prev().show();
                                    }
                                    if (msg === "") {
                                        $('textarea#mail-msg').prev().show();
                                    }

                                    if (fn !== "" && ln !== "" && em !== "" && msg !== "") {
                                        sendMembershipCalendarMail(fn, ln, em, subj, msg, type);
                                    }
                                });

                                $('#mail-modal .mail-header span').hide();
                                $('#seminar-schedule').show();
                                $('#beatstars-items').hide();
                                $('#mail-form').hide();
                                $('.mail-modal-buttons').show();
                            } else {
                                locked(type, "You have submitted already. We receive and review every submission, so don't worry we're across it.");
                            }

                            break;
                    }
                }

            });
        });

        $('span#intro.nav-icons').click(function() {
            openFirstUse();
        });

        $('div.ml-close').click(function() {
            $('#mail-modal').fadeOut(200);
            $('#seminar-schedule').html('');
            removeAllVideos();
        });
    }


    /* ==================================
                INIT ORDER
    ===================================*/


    
    if(maintenanceMode == true){
        alert("We are undergoing a scheduled maintenance to further improve our services, don't worry, we will be back as soon as possible.");
    } else {
        getAds();

        /*initAd();*/
        setPages();
        checkIfIphoneX();

        checkIfAlreadyLoggedIn();
        console.log('checked if logged in');

        if (typeof(localStorage.id) != "undefined") {
            if (typeof(localStorage.hasprofile) != "undefined") {
                setProfile();
                console.log('pulling profiles from local');
                initProfileBtns();
            } else {
                getProfile();
                console.log('pulling profiles from db');
                initProfileBtns();
            }
        }

        getActiveMc();
        getSubmissionNumber();
        getSubmittedMC();

        //getResources();
        //getDmResources();
        console.log('get resources successful');

        initClicks();
        initEvents();
        console.log('clicks and events initialized');


        getLinks();


        console.log('members discount tiles events status initialized');

        monthlyFilters();
        standardFilters();
        couponTabs();


        //redeemCouponItem();

        registeredIAP();
        console.log('in app purchases loaded');
        //errorHandler("We have updated our profiles database for a much better experience. Please log out and back again to refresh your data. Thanks!");


        //myAccount();
    }

    

    /* ==================================
            EVENT LISTENERS
    ===================================*/
    document.addEventListener("pause", paused, false);
    document.addEventListener("resume", returnedFromPause, false);
    document.addEventListener("backbutton", onBackKeyDown, false);
    /*document.addEventListener("offline", errorHandler("An error has occured trying to connect to Grow My Music's resources, please check your internet connection and try again.") , false);*/
}
