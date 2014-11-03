var loadingGameList = 0;
var currentGameName = "";

function spinner(id, classes) {
    var s = '<div';
    if (typeof id === "string") {
        s = s + ' id="' + id + '"';
    }
    s = s + ' class="spinner';
    if (typeof classes === "string") {
        s = s + ' ' + classes;
    }
    s = s + '">';
    return s +
        '<div class="spinner-container container1"><div class="circle1"></div><div class="circle2"></div><div ' +
        'class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container2"><div ' +
        'class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div>' +
        '</div><div class="spinner-container container3"><div class="circle1"></div><div class="circle2"></div>' +
        '<div class="circle3"></div><div class="circle4"></div></div></div>';
}

/*
 * Clears the topGames section, shows a loading indicator, and invokes the API call
 * to retrieve the top games on Twitch.
 */
function getTopGames() {
    $(".gameitem").remove();
    $("ul.gamelist").after(spinner("gameListSpinner", "gameitem"));
    loadingGameList += 1;
    self.port.emit("invoke", {
        functName: "getTopGames",
        args: {
            lim: 30
        }
    });
}

/*
 * Handles panel visibility events that are fired when the panel is shown or hidden.
 */
self.port.on("panelVisible", function (isVisible) {
    if (isVisible) {
        getTopGames();
    } else {

    }
});



/*
 * Handles the getTopGames API result - processes and displays the results.
 */
self.port.on("REQgetTopGames", function (result) {
    var i, game, gameId, html;
    $("#topgametitle").text("Top Games Streaming");
    $(".gameitem").remove();
    $("#gameback").hide();
    if (!result.syserr) {
        if (loadingGameList > 0) {
            loadingGameList -= 1;
            for (i = result.top.length - 1; i >= 0; i -= 1) {
                game = result.top[i];
                gameId = game.game._id;
                html = jsonToDOM(["li", {class: "gameitem", id: "gameitem-" + gameId},
                    ["a", {},
                        [
                            ["span", {},
                                ["img", {
                                    src: game.game.logo.small,
                                    class: "gameimg",
                                    alt: "",
                                    onerror: "imgError(this)",
                                    width: "60px",
                                    height: "36px"
                                }]
                            ],
                            ["div", {class: "name"}, game.game.name],
                            ["div", {class: "info"}, game.viewers + " viewers on " + game.channels + " channels"]
                        ]
                    ]
                ], document, {});
                $("ul.gamelist").after(html);
                iHateJavaScriptApplyGameClick(gameId, game.game.name);
            }
        }
    } else {
        console.log("errorGetTopGames: " + result.result.status + ": " + result.result.message);
        $("div.gamelist").text("Unable to load results: " + result.result.message);
    }
    $("#gamescroller").scrollTop(0);
    $("#gamescroller").perfectScrollbar("update");
});

/*
 * Helper function for handling getTopGames results.
 */
function iHateJavaScriptApplyGameClick(gameId, name) {
    $("#gameitem-" + gameId).click(function () {
        handleGameClick(name);
        return false;
    });
}

/*
 *  Handles clicks on top game results. Transitions to the stream list and invokes the API call.
 */
function handleGameClick(gameName) {
    $(".gameitem").remove();
    $("ul.gamelist").after(spinner("gameListSpinner", "gameitem"));
    loadingGameList += 1;
    currentGameName = gameName;
    self.port.emit("invoke", {
        functName: "getStreams",
        args: {
            game: gameName
        }
    });
}

/*
 * Handles the getStreams API result - processes and displays the results.
 */
self.port.on("REQgetStreams", function (result) {
    var i, stream, streamId, html;
    $("#topgametitle").text(currentGameName);
    $(".gameitem").remove();
    $("#gameback").show();
    $("#gameback").click(getTopGames);
    if (!result.syserr) {
        if (loadingGameList > 0) {
            loadingGameList -= 1;
            for (var i = result.streams.length - 1; i >= 0; i--) {
                stream = result.streams[i];
                streamId = stream._id;
                html = jsonToDOM([
                    "li", {class: "gameitem", id: "gameitem-" + streamId},
                    ["a", {},
                        [
                            ["span", {},
                                ["img", {
                                    src: stream.channel.logo,
                                    alt: "",
                                    width: "36px",
                                    height: "36px"
                                }]
                            ],
                            ["div", {class: "name"}, stream.channel.display_name],
                            ["div", {class: "info"}, stream.viewers + " viewers"]
                        ]
                    ]
                ], document, {});
                $("ul.gamelist").after(html);
                openUrlOnDomIdClicked("#gameitem-" + streamId, stream.channel.url);
            }
        }
    } else {
        console.log("errorGetStreams: " + result.result.status + ": " + result.result.message);
        $("div.gamelist").text("Unable to load results: " + result.result.message);
    }
    $("#gamescroller").scrollTop(0);
    $("#gamescroller").perfectScrollbar("update");
});

/*
 * Handles clicks on stream links - directs the browser to open a new tab of the stream.
 */
function openUrlOnDomIdClicked(domId, url) {
    $(domId).click(function () {
        self.port.emit("openStreamUrl", url);
        return false;
    });
}

$("#addStreamer").submit(function (event) {
    event.preventDefault();
    var name = $("#addStreamer input:first").val();
    if (typeof name != "string" || name.trim().length == 0) {
        $("#addStatus").text("Please enter a name").show();
        return;
    }
    name = name.trim();
    $("#addStatus").text("Finding...").show();
    self.port.emit("invoke", {
        functName: "getChannel",
        args: {
            name: name
        }
    });
});

self.port.on("favList", function (streamers) {
    var online = {};
    var offline = {};
    for (key in streamers) {
        if (streamers[key].online) {
            online[key] = streamers[key];
        } else {
            offline[key] = streamers[key];
        }
    }
    layoutFavorites(online, offline);
});

function layoutFavorites(onlineStreamers, offlineStreamers) {
    $(".favoriteItem").remove();
    


}

self.port.on("REQgetChannel", function (result) {
    if (!result.syserr) {
        self.port.emit("addFavStreamer", {name: result.name, displayName: result.display_name});
        $("#addStatus").text("Added " + result.display_name).show();
    } else {
        console.log("errorGetChannel: " + result.result.status + ": " + result.result.message);
        $("#addStatus").text("Unable to add channel: " + result.result.message).show();
    }
});



$("#config input[name='toastNotifications']").change(function () {
    self.port.emit("updateConfig", {toast: $(this).is(':checked')});
});

$("#config input[name='interval']").change(function () {
    var value = $(this).val();
    if (value < 1 || value > 99) {
        return;
    }
    self.port.emit("updateConfig", {interval: value});
});

$("#config select[name='streamOpen']").change(function () {
    self.port.emit("updateConfig", {streamOpen: $(this).find("option:selected").val()});
});

$("#config input[name='popoutPlayer']").change(function () {
    self.port.emit("updateConfig", {popout: $(this).is(':checked')});
});

$("#config input[name='sortFavoritesByGame']").change(function () {
    self.port.emit("updateConfig", {sortByGame: $(this).is(':checked')});
});

self.port.on("updateConfig", function (config) {
    if ("interval" in config) {
        $("#config input[name='interval']").val(config.interval);
    }
    if ("toast" in config) {
        $("#config input[name='toastNotifications']").prop('checked', config.toast);
    }
    if ("streamOpen" in config) {
        $("#config select[name='streamOpen']").val(config.streamOpen);
    }
    if ("popout" in config) {
        $("#config input[name='popoutPlayer']").prop('checked', config.popout);
    }
    if ("sortByGame" in config) {
        $("#config input[name='sortFavoritesByGame']").prop('checked', config.sortByGame);
    }
});


/*dom insertion library function from MDN - https://developer.mozilla.org/en-US/docs/XUL_School/DOM_Building_and_HTML_Insertion*/
jsonToDOM.namespaces = {
    html: 'http://www.w3.org/1999/xhtml',
    xul: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'
};
jsonToDOM.defaultNamespace = jsonToDOM.namespaces.html;
function jsonToDOM(xml, doc, nodes) {
    function namespace(name) {
        var m = /^(?:(.*):)?(.*)$/.exec(name);        
        return [jsonToDOM.namespaces[m[1]], m[2]];
    }

    function tag(name, attr) {
        if (Array.isArray(name)) {
            var frag = doc.createDocumentFragment();
            Array.forEach(arguments, function (arg) {
                if (!Array.isArray(arg[0]))
                    frag.appendChild(tag.apply(null, arg));
                else
                    arg.forEach(function (arg) {
                        frag.appendChild(tag.apply(null, arg));
                    });
            });
            return frag;
        }

        var args = Array.slice(arguments, 2);
        var vals = namespace(name);
        var elem = doc.createElementNS(vals[0] || jsonToDOM.defaultNamespace, vals[1]);

        for (var key in attr) {
            var val = attr[key];
            if (nodes && key == 'key')
                nodes[val] = elem;

            vals = namespace(key);
            if (typeof val == 'function')
                elem.addEventListener(key.replace(/^on/, ''), val, false);
            else
                elem.setAttributeNS(vals[0] || '', vals[1], val);
        }
        args.forEach(function(e) {
            try {
                elem.appendChild(
                                    Object.prototype.toString.call(e) == '[object Array]'
                                    ?
                                        tag.apply(null, e)
                                    :
                                        e instanceof doc.defaultView.Node
                                        ?
                                            e
                                        :
                                            doc.createTextNode(e)
                                );
            } catch (ex) {
                elem.appendChild(doc.createTextNode(ex));
            }
        });
        return elem;
    }
    return tag.apply(null, xml);
}
/*end - dom insertion library function from MDN*/