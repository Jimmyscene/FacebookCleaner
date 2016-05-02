$(function() {
    checkNewInstall(
        function() { //isNewInstall
            showHelpMessage();
        },
        function() { //init Background
            checkAccessToken(
                function(accessToken) { //have access Token
                    console.log("Have Access Token: " + accessToken);
                },
                function() { //don't have access Token
                	clearData();
                    getAccessToken(
                        function(accessToken) {
                        	getUserInfo();
                            console.log("Got Access Token: " + accessToken);
                        });
                });
        });

});

function checkNewInstall(isNewInstall, initBackground) {
    chrome.storage.sync.get("helpMessageShown", function(results) {
        if (results["helpMessageShown"]) {
            initBackground();
        } else {
            isNewInstall();
            initBackground();
        }

    });
}

function showHelpMessage() {
    console.log("Showing Help Message");
    chrome.storage.sync.set({
        'helpMessageShown': true
    })
    window.open("helpMessage.html");
}

function checkAccessToken(success, failure) {
    chrome.storage.sync.get("access_token", function(tokenResults) {
        if (tokenResults["access_token"]) {
            chrome.storage.sync.get("expires_on", function(dateResults) { //Check if token expired
                if (dateResults["expires_on"] > new Date().getTime()) { //Date stored as UNIX timestamp; ie- 1461822756721
                    success(tokenResults["access_token"]);
                } else {
                    failure();
                }
            });
        } else {
            failure();
        }
    });
}

function getAccessToken(callback) {
    var tokenUrl = "https://www.facebook.com/dialog/oauth?" +
        "client_id=1547373988913293&" +
        "redirect_uri=https://www.facebook.com/connect/login_success.html&" +
        "scope=user_posts&" + "response_type=token";
    chrome.tabs.create({
        url: tokenUrl
    }, function(tabDetails) {
        chrome.tabs.onUpdated.addListener(function checkTab(tabId, changeInfo, tab) {
            if (tabId == tabDetails.id) {
                if (tab.url != tokenUrl) {
                    console.log("Not handling Denial");
                    if (tab.url.includes('error')) { // Need to handle this
                        console.log("Denied");
                    } else if (tab.url.includes('access_token=')) {
                        var regex = /.*access_token\=(.*)\&expires_in=(.*).*/g;
                        var matches = regex.exec(tab.url);
                        chrome.storage.sync.set({
                            "access_token": matches[1],
                            "expires_on": new Date(new Date().getTime() + parseInt(matches[2]) * 1000).getTime()
                        });
                        chrome.tabs.remove(tabDetails.id);
                        chrome.tabs.onUpdated.removeListener(checkTab);
                        if (callback) {
                            callback(matches[1]);
                        }
                    }
                }
            }
        });
    });
}



function setUpMessaging(deletionList){
    chrome.tabs.create({
        "url": "https://www.facebook.com/",
        "active" : false
    }, function(tab) {
        localStorage.success=0;
        localStorage.failed=0;
        chrome.tabs.executeScript(tab.id, { "file": "injection.js" },
            function() {
                var port = chrome.tabs.connect(tab.id);
                setUpMessaging.index =0;
                port.postMessage({postId: deletionList[setUpMessaging.index++]});
                port.onMessage.addListener(function(msg) {
                    if(msg.status==200){
                        localStorage.success++;
                    }else{
                        localStorage.failed++;
                    }
                    if(setUpMessaging.index<deletionList.length){
                        port.postMessage({postId: deletionList[setUpMessaging.index++]});
                    }else{
                        alert("Deletion Finished. Thank you for using FacebookCleaner.");
                        localStorage.clear();
                        chrome.tabs.remove(tab.id);
                    }
                
                });
            });
    });

}




function getUserInfo(callback) {

    chrome.storage.sync.get("access_token", function(results) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://graph.facebook.com/v2.5/me?fields=name,picture&access_token=" + results.access_token);
        xhr.addEventListener("load", function() {
            responseText = JSON.parse(xhr.responseText);
            resultsObj = {
            	'Name': responseText["name"],
                'Picture': responseText["picture"]["data"]["url"]
            }
            chrome.storage.sync.set(resultsObj, function() {
            	if(callback){
            		callback(resultsObj);
            	}
            });
        });
        xhr.send();

    });
}

function clearData() { //Doesnt clear helpMessageShown
    chrome.storage.sync.remove(["Name", "Picture", "access_token", "expires_on"]);
}


