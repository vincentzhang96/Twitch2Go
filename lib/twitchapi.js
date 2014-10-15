/* ----------------------------------------------------------------------------------------

	TWITCH API

*/
var Promise = require("sdk/core/promise");
var Request = require("sdk/request");

exports.getTopGames = getTopGames;
exports.getChannel = getChannel;
exports.getChannelVideo = getChannelVideo;
exports.getChannelFollows = getChannelFollows;
exports.searchStreams = searchStreams;
exports.searchGames = searchGames;
exports.getStream = getStream;
exports.getStreams = getStreams;
exports.getFeaturedStreams = getFeaturedStreams;
exports.getStreamsSummary = getStreamsSummary;
exports.getUser = getUser;

var baseURL = "https://api.twitch.tv/kraken/"

var httpHeader = {
	'Accept': "application/vnd.twitchtv.v2+json",
	'Client-ID': "gfr1u0ugy4idv4sg37tw4sf0hssczwh"
};

function processResponse(deferred, response) {
	if(response.status != 200) {
		console.log("status:" + response.status + " jsonStatus:" + response.json.status);
		deferred.reject(response.json);
	} else {
		deferred.resolve(response.json);
	}
}

function getTopGames(args) {
	var deferred = Promise.defer();
	
	var lim = args.lim;
	var off = args.off;
	if(typeof lim === "undefined") {
		lim = 10;
	}
	if(typeof off === "undefined") {
		off = 0;
	} 
	var req = Request.Request(
		{
			url: baseURL + "games/top?limit=" + lim + "&offset=" + off,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getChannel(args) {
	var deferred = Promise.defer();
	
	var channelName = args.name;
	var req = Request.Request(
		{
			url: baseURL + "channels/" + channelName,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getChannelVideo(args) {
	var deferred = Promise.defer();
	
	var channelName = args.name;
	var req = Request.Request(
		{
			url: baseURL + "channels/" + channelName + "/videos",
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getChannelFollows(args) {
	var deferred = Promise.defer();
	
	var channelName = args.name;
	var req = Request.Request(
		{
			url: baseURL + "channels/" + channelName + "/follows",
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function searchStreams(args) {
	var deferred = Promise.defer();
	
	var query = encodeURIComponent(args.query);
	var limit = args.lim;
	var offset = args.off;
	if(typeof limit === "undefined") {
		limit = 10;
	}
	if(typeof offset === "undefined") {
		offset = 0;
	}
	var req = Request.Request(
		{
			url: baseURL + "search/streams?q=" + query + "&limit=" + limit + "&offset=" + offset,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function searchGames(args) {
	var deferred = Promise.defer();
	
	var query = encodeURIComponent(args.query);
	var type = args.type;
	var live = args.live;
	if(typeof type === "undefined") {
		limit = "suggest";
	}
	if(typeof live === "undefined") {
		offset = false;
	}
	var req = Request.Request(
		{
			url: baseURL + "search/games?q=" + query + "&type=" + type + "&live=" + live,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getStream(args) {
	var deferred = Promise.defer();
	
	var channelName = args.name;
	var req = Request.Request(
		{
			url: baseURL + "streams/" + channelName,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getStreams(args) {
	var deferred = Promise.defer();
	
	var limit = args.lim;
	if(typeof limit === "undefined") {
		limit = 25;
	}
	var offset = args.off;
	if(typeof offset === "undefined") {
		offset = 0;
	}
	var requestURL = baseURL + "streams?limit=" + limit + "&offset=" + offset;
	if(typeof args.game === "string") {
		requestURL  += "&game=" + encodeURIComponent(args.game);
	}
	if(typeof args.channel === "string") {
		requestURL  += "&channel=" + args.channel;
	}
	var req = Request.Request(
		{
			url: requestURL,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getFeaturedStreams(args) {
	var deferred = Promise.defer();
	
	var limit = args.lim;
	if(typeof limit === "undefined") {
		limit = 25;
	}
	var offset = args.off;
	if(typeof offset === "undefined") {
		offset = 0;
	}
	var req = Request.Request(
		{
			url: baseURL + "streams/featured?limit=" + limit + "&offset=" + offset,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getStreamsSummary(args) {
	var deferred = Promise.defer();
	
	var limit = args.lim;
	if(typeof limit === "undefined") {
		limit = 25;
	}
	var offset = args.off;
	if(typeof offset === "undefined") {
		offset = 0;
	}
	var req = Request.Request(
		{
			url: baseURL + "streams/summary?limit=" + limit + "&offset=" + offset,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}

function getUser(args) {
	var deferred = Promise.defer();
	
	var username = args.name;
	var req = Request.Request(
		{
			url: baseURL + "users/" + username,
			headers: httpHeader,
			onComplete: function(response) {
				processResponse(deferred, response);
			}
		}
	);
	req.get();
	return deferred.promise;
}