var Sstorage = require("sdk/simple-storage").storage;
var Sprefs = require("sdk/simple-prefs");
var Toggles = require("sdk/ui/button/toggle");
var Notifications = require("sdk/notifications");
var Tabs = require("sdk/tabs");
var Self = require("sdk/self");
var Panels = require("sdk/panel");
var Timer = require("sdk/timers");
var Twitch = require("./twitchapi.js");

var button;
var panel;
var pollTaskId;
var streamers = {};

if (!Sstorage.favStreamers) {
    Sstorage.favStreamers = {};
}

if (Sstorage.pollInterval < 1) {
    Sstorage.pollInterval = 10;
}
if (Sstorage.pollInterval > 99) {
    Sstorage.pollInterval = 10;
}

for (key in Sstorage.favStreamers) {
    streamers[key] = {
        displayName: Sstorage.favStreamers[key],
        online: false,
        streamData: null
    };
    console.log("Loaded fav streamer " + Sstorage.favStreamers[key]);
}

function openNewTab(url) {
    Tabs.open(url);
    panel.hide();
}

/* ----------------------------------------------------------------------------------------

    TOOLBAR BUTTON

*/
function onIconTypePrefChanged(prefName) {
    if (prefName === "light") {
        button.icon = {
            "16": "./icons/icon_lightondark_16.png",
            "32": "./icons/icon_lightondark_32.png",
            "64": "./icons/icon_lightondark_64.png"
        };
        console.log("Twitch2Go icon set to light-on-dark");
    } else {
        button.icon = {
            "16": "./icons/icon_darkonlight_16.png",
            "32": "./icons/icon_darkonlight_32.png",
            "64": "./icons/icon_darkonlight_64.png"
        };
        console.log("Twitch2Go icon set to dark-on-light");
    }
}

function onButtonToggle(state) {
    if (state.checked) {
        panel.show({
            position: button
        });
    }
}

button = Toggles.ToggleButton({
    id: "twitch2go",
    label: "Show Twitch2Go",
    icon: {
        "16": "./icons/icon_darkonlight_16.png",
        "32": "./icons/icon_darkonlight_32.png",
        "64": "./icons/icon_darkonlight_64.png"
    },
    onChange: onButtonToggle
});
Sprefs.on("iconType", onIconTypePrefChanged);
onIconTypePrefChanged("iconType");

/* ----------------------------------------------------------------------------------------

    POPUP PANEL

*/
function onPanelShow() {
    panel.port.emit("panelVisible", true);
}

function onPanelHide() {
    button.state("window", {
        checked: false
    });
    panel.port.emit("panelVisible", false);
}

panel = Panels.Panel({
    width: 350,
    height: 610,
    contentURL: Self.data.url("panel.html"),
    onHide: onPanelHide,
    contentScriptFile: [
        Self.data.url("jquery.min.js"),
        Self.data.url("perfect-scrollbar.min.js"),
        Self.data.url("paneldriver.js")
    ],
    onShow: onPanelShow
});

/* ----------------------------------------------------------------------------------------

    TWITCH API INTEGRATION

*/

function makeRequest(functName, args) {
    var prom = Twitch[functName](args);
    prom.then(function (result) {
        panel.port.emit("REQ" + functName, result);
    }, function (error) {
        panel.port.emit("REQ" + functName, {
            result: error,
            syserr: true
        });
    });
}

function pollFavoriteStreamers() {
    console.log("Polling");
    for (key in Sstorage.favStreamers) {
        poll(key);
    }
}

function poll(key) {
    console.log("Polling fav " + key);
    Twitch.getStream({name: key}).then(function (result) {
        streamers[key].streamData = result.stream;
        var wasOnline = streamers[key].online;
        streamers[key].online = (result.stream != null);
        if(!wasOnline && streamers[key].online) {
            onStreamerOnline(streamers[key]);
        }
    });
}

function onStreamerOnline(streamer) {
    console.log(streamers[key].displayName + " is online!");
    //  TODO notify front end
    
    
    //  Toast notification
    if(Sstorage.toast) {
        Notifications.notify({
            title: "Twitch2Go: Favorite Streamer Online!",
            text: streamer.displayName + " is now streaming " + streamer.streamData.game,
            data: streamer.streamData,
            onClick: function (data) {
                openNewTab(data.url);
            }
        });
    }
}

function startPoll() {
    pollTaskId = Timer.setInterval(pollFavoriteStreamers, Sstorage.interval * 1000);
    pollFavoriteStreamers();
}

function stopPoll() {
    Timer.clearTimeout(pollTaskId);
}

function setPollInterval(interval) {
    if (isNaN(interval)) {
        return;
    }
    interval = Math.trunc(interval);
    Sstorage.interval = interval;
    stopPoll();
    Sstorage.interval = Sstorage.interval || 10;
    if (Sstorage.interval < 1) {
        Sstorage.interval = 1;
    }
    if (Sstorage.interval > 99) {
        Sstorage.interval = 99;
    }
    console.log("Poll interval set to " + Sstorage.interval + " s");
    panel.port.emit("setInterval", Sstorage.interval);
    startPoll();
}

panel.port.on("invoke", function (invocation) {
    console.log("Invoking " + invocation.functName);
    makeRequest(invocation.functName, invocation.args);
});

setPollInterval(Sstorage.interval);
panel.port.on("updateInterval", setPollInterval);
panel.port.on("openTab", openNewTab);

panel.port.on("setToast", function (toast) {
    Sstorage.toast = toast;
    console.log("Toast notifications " + (toast ? "enabled" : "disabled"));
});


function addFavoriteStreamer(streamer) {
    if(Sstorage.favStreamers[streamer.name]) {
        console.log("Ignoring duplicate favorite " + streamer.name + " aka " + streamer.displayName);
        return;
    }
    Sstorage.favStreamers[streamer.name] = streamer.displayName;
    streamers[streamer.name] = {
        displayName: streamer.displayName,
        online: false
    };
    console.log("Added favorite " + streamer.name + " aka " + streamer.displayName);
}

function removeFavoriteStreamer(name) {
    delete Sstorage.favStreamers[name];
    delete streamers[name];
}

panel.port.on("addFavStreamer", addFavoriteStreamer);
panel.port.on("remFavStreamer", removeFavoriteStreamer);
panel.port.on("getFavStreamer", function(name, callback) {
    callback(streamers[name]);
});
panel.port.on("getFavStreamers", function(callback) {
    callback(streamers);
});

