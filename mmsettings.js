//MobilMenetrend
var cookieUserid = getCookie("userid");
var calendarEventsList, loginContent, notifContent, content;
document.addEventListener("DOMContentLoaded", function (event) {
    loginContent = document.getElementById("LoginContent");
    notifContent = document.getElementById("notification");
    content = document.getElementById("content");
});

function handleClientLoad() {
    // Loads the client library and the auth2 library together for efficiency.
    // Loading the auth2 library is optional here since `gapi.client.init` function will load
    // it if not already loaded. Loading it upfront can save one network request.
    gapi.load('client:auth2', initClient);
}

function initClient() {
    // Initialize the client with API key and People API, and initialize OAuth with an
    // OAuth 2.0 client ID and scopes (space delimited string) to request access.
    gapi.client.init({
        apiKey: 'AIzaSyCD1ugK3SbKB3BLBBA4u3M96EwtsyB0fI4',
        //discoveryDocs: ["https://people.googleapis.com/$discovery/rest?version=v1"],
        clientId: '858976792314-o5ctfle20f5php5pshg78jij5rsi5gcd.apps.googleusercontent.com',
        scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.appdata"
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

function updateSigninStatus(isSignedIn) {
    // When signin status changes, this function is called.
    // If the signin status is changed to signedIn, we make an API call.
    if (isSignedIn) {
        loadClientGDrive();

        loadClient();
        var user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
        notifContent.innerHTML = "Bejelentkezve " + user + " néven!";
        content.style.display = "block";
        loginContent.style.display = "none";

    } else {
        notifContent.innerHTML = "Nem vagy bejelentkezve!";
        content.style.display = "none";
        loginContent.style.display = "block";
    }
}

function handleSignInClick(event) {
    // Ideally the button should only show up after gapi.client.init finishes, so that this
    // handler won't be called before OAuth is initialized.
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignOutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}



function loadClient() {
    return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/calendar/v3/rest")
        .then(function () {
            console.log("GAPI client loaded for API");

            //calendarEvents();

            if (cookieUserid != 0) {
                notifContent.innerHTML = "Kiválasztott Naptár Eseményei JSON-ban(Fejlesztés Alatt)!";
                // calendarListGenerate();
                calendarEvents(cookieUserid);
            } else {
                calendarListGenerate();

            }
        },
            function (err) {
                console.error("Error loading GAPI client for API", err);

                notifContent.innerHTML = "Hiba történt!";
            });

}
//Google Drive Rész
function loadClientGDrive() {
    return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest")
        .then(function () {
            console.log("GAPI Drive client loaded for API");
            DriveFileList();
        },
            function (err) { console.error("Error loading GAPI client for API", err); });
}

function DriveFileList() {
    return gapi.client.driveService.files.list({
        spaces: 'appDataFolder',
        fields: 'nextPageToken, files(id, name)',
        pageSize: 100
    })
        .then(function (response) {
            // Handle the results here (response.result has the parsed body).
            console.log("Response", response);
        },
            function (err) { console.error("Execute error", err); });


    /*return  gapi.client.drive.files.list({
       spaces: 'appDataFolder',
       fields: 'nextPageToken, files(id, name)',
       pageSize: 100
     }, function (err, res) {
       if (err) {
         // Handle error
         console.error(err);
       } else {
           console.log(res);
         res.files.forEach(function (file) {
           console.log('Found file:', file.name, file.id);
         });
       }
     });*/
}

function calendarEvents(calID) {
    // Make an API call to the People API, and print the user's given name.

    return gapi.client.calendar.events.list({
        "calendarId": calID
    })
        .then(function (response) {
            // Handle the results here (response.result has the parsed body).
            console.log("Response", response);
            calendarEventsList = response.result;
            content.innerHTML = JSON.stringify(calendarEventsList.items);
            content.innerHTML += "<button  onclick=\"deleteAllCookies()\">Választás Törlése</button>"

        },
            function (err) {
                createcookie('userid', 0, 365);
                notifContent.innerHTML = "Hiba történt!";
                content.innerHTML = "A kiválasztott naptár időközben törlődött. A lap frissítése utánellenőrizd a listában vagy a Google Naptár szolgáltatásán belül."
            });
}

function calendarCreator(calendarName) {
    return gapi.client.calendar.calendars.insert({
        "resource": {
            "summary": calendarName,
            "timeZone": "Europe/Budapest"
        }
    })
        .then(function (response) {
            // Handle the results here (response.result has the parsed body).
            console.log("Response", response.result);
            document.getElementById("content").innerHTML = "Naptár Létrehozva " + response.result.summary + " néven!<br>A beállító fájlban ezt az id-t kell beírnod: " + response.result.id + "<br>A lapot frissítve mostmár elérheted az események szerkesztését.";
            setPublic(response.result.id);
            // calendarEvents(response.result.id);
            createcookie('userid', response.result.id, 365);
        },
            function (err) {
                console.error("Execute error", err);
                notifContent.innerHTML = "Először be kell lépned!";
            });
}
function setPublic(calID) {
    return gapi.client.calendar.acl.insert({
        "calendarId": calID,
        "resource": {
            "role": "reader",
            "scope": {
                "type": "default"
            }
        }
    })
        .then(function (response) {
            // Handle the results here (response.result has the parsed body).
            console.log("Response", response);
        },
            function (err) { console.error("Execute error", err); });
}


function submitCalendar() {
    var x = document.getElementById("frm1");
    var text = "";
    var i;
    for (i = 0; i < x.length - 1; i++) {
        text += x.elements[i].value;
    }
    calendarCreator(text);
    content.innerHTML = "Töltődik... Ne zárd be az ablakot!";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = document.cookie;
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return 0;
}

function createcookie(name, value, days, banner) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires;

    /*   if (banner == "banner") { document.getElementById("myCookie").style.display = 'none'; } else if ((name == policyAgreementCookie) | (name == themeCookie)) { modal_open("cookie_settings"); }
       //*Téma választó cookie létrehozásával egyben át is váltjuk az általa képviselt kinézetre
       if (name == themeCookie) {
           if (value == "dark") {
               if (internetStatus == "online") { Dark(eventsLength); } else { Dark(offlineLength); }
           }
           if (value == "light") {
               if (internetStatus == "online") { Light(eventsLength); } else { Light(offlineLength); }
           }
           modal_open("cookie_settings");
       }
       */
}
var listCalendarArray;

function calendarListGenerate() {
    return gapi.client.calendar.calendarList.list({})
        .then(function (response) {
            // Handle the results here (response.result has the parsed body).
            console.log("Response", response.result);
            var listDiv = document.getElementById("listCalendar");
            listCalendarArray = response.result.items;
            var array = listCalendarArray;
            var selectList = document.createElement("select");
            selectList.id = "listc";
            listDiv.appendChild(selectList);
            var buttonListSelect = document.createElement("button");
            buttonListSelect.type = "button";
            buttonListSelect.setAttribute('OnClick', "ListSelectIndex()");
            buttonListSelect.innerHTML = "SelectCalendar";
            listDiv.appendChild(buttonListSelect);


            //create and append options
            for (var i = 0; i < array.length; i++) {
                var option = document.createElement("option");
                option.value = array[i].summary;
                option.text = array[i].summary;
                selectList.appendChild(option);
            }

        },
            function (err) { console.error("Execute error", err); });
}

function ListSelectIndex() {
    var x = document.getElementById("listc").selectedIndex;

    content.innerHTML = "Naptár Kiválasztva " + listCalendarArray[x].summary + " néven!<br>A beállító fájlban ezt az id-t kell beírnod: " + listCalendarArray[x].id + "<br>A lapot frissítve mostmár elérheted az események szerkesztését.";
    setPublic(listCalendarArray[x].id);
    //calendarEvents(listCalendarArray[x].id);
    createcookie('userid', listCalendarArray[x].id, 365);

}

function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    location.reload();
}
