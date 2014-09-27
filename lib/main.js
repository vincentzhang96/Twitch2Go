var Sstorage = require("sdk/simple-storage").storage;
var Sprefs = require("sdk/simple-prefs");
var Toggles = require("sdk/ui/button/toggle");
var Notifications = require("sdk/notifications");
var Tabs = require("sdk/tabs");
var Self = require("sdk/self");
var Panels = require("sdk/panel");
var Twitch = require("./twitchapi.js");

var button;
var panel;

if(!Sstorage.storage.favStreamers) {
	Sstorage.storage.favStreamers = [];
}

/* ----------------------------------------------------------------------------------------

	TOOLBAR BUTTON

*/
button = Toggles.ToggleButton(
	{
		id: "twitch2go",
		label: "Show Twitch2Go",
		icon: {
			"16": "./icons/icon_darkonlight_16.png",
			"32": "./icons/icon_darkonlight_32.png",
			"64": "./icons/icon_darkonlight_64.png"
		},
		onChange: onButtonToggle
	}
);
Sprefs.on("iconType", onIconTypePrefChanged);
onIconTypePrefChanged("iconType");
function onIconTypePrefChanged(prefName) {
	if(Sprefs.prefs["iconType"] === "light") {
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
	if(state.checked) {
		panel.show(
			{
				position: button
			}
		);
	}
}
/* ----------------------------------------------------------------------------------------

	POPUP PANEL

*/
panel = Panels.Panel(
	{
		width: 330,
		height: 610,
		contentURL: Self.data.url("panel.html"),
		onHide: onPanelHide,
		contentScriptFile: [
			Self.data.url("jquery.min.js"),
			Self.data.url("paneldriver.js")
		],
		onShow: onPanelShow
	}
);

function onPanelShow() {
	panel.port.emit("panelVisible", true);
}

function onPanelHide() {
	button.state("window", {checked: false});
	panel.port.emit("panelVisible", false);
}



/* ----------------------------------------------------------------------------------------

	TWITCH API INTEGRATION

*/
panel.port.on("invoke", function(invocation) {
	console.log(invocation.functName);
	makeRequest(invocation.functName, invocation.args);
});

function makeRequest(functName, args) {
	prom = Twitch[functName](args);
	prom.then(function(result){
		panel.port.emit("REQ"+functName, result);
	},
	function(error) {
		panel.port.emit("REQ"+functName, {result: error, syserr: true});
	});
	
}

//	Poll every 30 seconds
var pollTaskId = setInterval(pollFavoriteStreamers, 30000);

function pollFavoriteStreamers() {
	for(var i = 0; i < Sstorage.storage.favStreamers.length; i++) {
		var streamerName = Sstorage.storage.favStreamers[i].name;
		
		
	}

}
