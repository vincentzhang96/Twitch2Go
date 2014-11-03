var Sstorage = require("sdk/simple-storage").storage;
var Sprefs = require("sdk/simple-prefs");
var Toggles = require("sdk/ui/button/toggle");
var Notifications = require("sdk/notifications");
var Tabs = require("sdk/tabs");
var Windows = require("sdk/windows").browserWindows;
var Self = require("sdk/self");
var Panels = require("sdk/panel");
var Timer = require("sdk/timers");
var Twitch = require("./twitchapi.js");

var button;
var panel;
var pollTaskId;
var streamers = {};

if (!Sstorage.config) {
    Sstorage.config = {
        interval: 10,
        toast: true,
        streamOpen: "newtab",
        popoutPlayer: true,
        sortByGame: true
    };
}
if (!Sstorage.favStreamers) {
    Sstorage.favStreamers = {};
}
if (Sstorage.config.interval < 10) {
    console.log("Reset option interval, had invalid value " + Sstorage.config.interval);
    Sstorage.config.interval = 10;
}
if (Sstorage.config.interval > 99) {
    console.log("Reset option interval, had invalid value " + Sstorage.config.interval);
    Sstorage.config.interval = 10;
}
if (Sstorage.config.streamOpen != "newtab" && Sstorage.config.streamOpen != "newwindow") {
    console.log("Reset option streamOpen, had invalid value " + Sstorage.config.streamOpen);
    Sstorage.config.streamOpen = "newtab"
}

console.log("Polling interval is " + Sstorage.config.interval);
console.log("Toast notifications are " + (Sstorage.config.toast ? "enabled" : "disabled"));
console.log("Streams will open in " + Sstorage.config.streamOpen);
console.log("Streams will use the " + (Sstorage.config.popoutPlayer ? "popout" : "regular") + " player");
console.log("Favorites will be sorted by " + (Sstorage.config.sortByGame ? "game" : "name"));


for (key in Sstorage.favStreamers) {
    streamers[key] = {
        displayName: Sstorage.favStreamers[key],
        online: false,
        newOnline: false,
        streamData: null
    };
    console.log("Loaded fav streamer " + Sstorage.favStreamers[key]);
}

function openUrl(url) {
    Tabs.open(url);
    panel.hide();
}

function openUrlTabOrWindow(url) {
    if (Sstorage.config.streamOpen === "newwindow") {
        Windows.open(url);
    } else {
        Tabs.open(url);
    }
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
    emitUpdateFavoriteStreamersList();
}

function poll(key) {
    console.log("Polling fav " + key);
    Twitch.getStream({name: key}).then(function (result) {
        streamers[key].streamData = result.stream;
        var wasOnline = streamers[key].online;
        streamers[key].online = (result.stream != null);
        streamers[key].newOnline = (!wasOnline && streamers[key].online);
    });
}
//  TODO bulk notify instead of per-item notify
function onStreamerOnline(streamer) {
    console.log(streamers[key].displayName + " is online!");
    //  TODO notify front end
    
    
    //  Toast notification
    if (Sstorage.config.toast) {
        console.log(streamer.displayName + " is now streaming " + streamer.streamData.game);
        var icon;
        if (Sprefs['iconType'] === "light") {
            icon = Self.data.url("./icons/icon_lightondark_64.png");
        } else {
            icon = Self.data.url("./icons/icon_darkonlight_64.png");
        }
        Notifications.notify({
            title: "Twitch2Go: " + streamer.displayName + " now streaming " + streamer.streamData.game,
            text: streamer.streamData.status,
            data: streamer.streamData.url,
            iconURL: icon,
            onClick: openUrlTabOrWindow
        });
    }
}

function startPoll() {
    pollFavoriteStreamers();
    pollTaskId = Timer.setInterval(pollFavoriteStreamers, Sstorage.config.interval * 1000);
}

function stopPoll() {
    Timer.clearTimeout(pollTaskId);
}

function setPollInterval(interval) {
    if (isNaN(interval)) {
        console.log("Invalid poll interval " + interval);
        return;
    }
    interval = Math.trunc(interval);
    Sstorage.config.interval = interval;
    stopPoll();
    Sstorage.config.interval = Sstorage.config.interval || 10;
    if (Sstorage.config.interval < 10) {
        Sstorage.config.interval = 10;
    }
    if (Sstorage.config.interval > 99) {
        Sstorage.config.interval = 99;
    }
    console.log("Poll interval set to " + Sstorage.config.interval + " s");
    panel.port.emit("updateConfig", {interval: Sstorage.config.interval});
    startPoll();
}

panel.port.on("invoke", function (invocation) {
    console.log("Invoking " + invocation.functName);
    makeRequest(invocation.functName, invocation.args);
});


function setToast(toast) {
    Sstorage.config.toast = toast;
    console.log("Toast notifications " + (toast ? "enabled" : "disabled"));
    panel.port.emit("updateConfig", {toast: toast});
}

panel.port.emit("updateConfig", Sstorage.config);
panel.port.on("openUrl", openUrlTabOrWindow);
panel.port.on("openStreamUrl", function (url) {
    if (Sstorage.config.popout) {
        openUrlTabOrWindow(url + "/popout");
    } else {
        openUrlTabOrWindow(url);
    }
});

panel.port.on("updateConfig", function (config) {
    if ("interval" in config) {
        setPollInterval(config.interval);
    }
    if ("toast" in config) {
        setToast(config.toast);
    }
    if ("streamOpen" in config) {
        Sstorage.config.streamOpen = config.streamOpen;
        console.log("Opening streams in " + config.streamOpen);
    }
    if ("popout" in config) {
        Sstorage.config.popout = config.popout;
        console.log("Popout player " + (config.popout ? "enabled" : "disabled"));
    }
    if ("sortByGame" in config) {
        Sstorage.config.sortByGame = config.sortByGame;
        console.log("Sort favorites by game " + (config.sortByGame ? "enabled" : "disabled"));
    }
});

function addFavoriteStreamer(streamer) {
    if(Sstorage.favStreamers[streamer.name]) {
        console.log("Ignoring duplicate favorite " + streamer.name + " aka " + streamer.displayName);
        return;
    }
    Sstorage.favStreamers[streamer.name] = streamer.displayName;
    streamers[streamer.name] = {
        displayName: streamer.displayName,
        online: false,
        newOnline: false,
        streamData: null
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

function emitUpdateFavoriteStreamersList() {
    panel.port.emit("favList", streamers);
}
