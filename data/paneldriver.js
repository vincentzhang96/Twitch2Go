var loadingGameList = 0;
var currentGameName = "";
self.port.on("panelVisible", function(isVisible) {
    if(isVisible) {
        getTopGames();
    } else {
    
    }
});

function getTopGames() {
    $(".gameitem").remove();
    $("ul.gamelist").after(spinner("gameListSpinner", "gameitem"));
    loadingGameList++;
    self.port.emit("invoke", {functName: "getTopGames", args: {lim: 30}});
}

self.port.on("REQgetTopGames", function(result) {
    $("#topgametitle").text("Top Games Streaming");
    $(".gameitem").remove();
    $("#gameback").hide();
    if(!result.syserr) {
        if(loadingGameList > 0) {
            loadingGameList--;
            for(var i = result.top.length - 1; i >= 0; i--) {
                var game = result.top[i];
                var gameId = game.game._id;
                var html = jsonToDOM([
                    "li", {class: "gameitem", id: "gameitem-"+gameId},
                    [
                        "a", {},
                        [
                            ["span", {}, ["img", {src: game.game.logo.small, alt: "", width: "60px", height: "36px"}]],
                            ["div", {class: "name"}, game.game.name],
                            ["div", {class: "info"}, game.viewers+" viewers on "+game.channels+" channels"]
                        ]
                    ]
                ], document, {});
                $("ul.gamelist").after(html);
                iHateJavaScriptApplyGameClick(gameId, game.game.name);
            }
        }
    } else {
        console.log("errorGetTopGames: "+result.result.status+": "+result.result.message);
        $("div.gamelist").text("Unable to load results: "+result.result.message);
    }
    $("#gamescroller").scrollTop(0);
    $("#gamescroller").perfectScrollbar("update");
});

function iHateJavaScriptApplyGameClick(gameId, name) {
    $("#gameitem-"+gameId).click(function() { handleGameClick(name); return false; });
}

function handleGameClick(gameName) {
    $(".gameitem").remove();
    $("ul.gamelist").after(spinner("gameListSpinner", "gameitem"));
    loadingGameList++;
    currentGameName = gameName;
    self.port.emit("invoke", {functName: "getStreams", args: {game: gameName}});
}

self.port.on("REQgetStreams", function(result) {
    $("#topgametitle").text(currentGameName);
    $(".gameitem").remove();
    $("#gameback").show();
    $("#gameback").click(getTopGames);
    if(!result.syserr) {
        if(loadingGameList > 0) {
            loadingGameList--;
            for(var i = result.streams.length - 1; i >= 0; i--) {
                var stream = result.streams[i];
                var streamId = stream._id;
                var html = jsonToDOM([
                    "li", {class: "gameitem", id: "gameitem-"+streamId},
                    [
                        "a", {},
                        [
                            ["span", {}, ["img", {src: stream.channel.logo, alt: "", width: "36px", height: "36px"}]],
                            ["div", {class: "name"}, stream.channel.display_name],
                            ["div", {class: "info"}, stream.viewers+" viewers"]
                        ]
                    ]
                ], document, {});
                $("ul.gamelist").after(html);
                openTopGamesTab(streamId, stream.channel.url);
            }
        }
    } else {
        console.log("errorGetStreams: "+result.result.status+": "+result.result.message);
        $("div.gamelist").text("Unable to load results: "+result.result.message);
    }
    $("#gamescroller").scrollTop(0);
    $("#gamescroller").perfectScrollbar("update");
});

function openTopGamesTab(streamId, url) {
    $("#gameitem-"+streamId).click(function() { self.port.emit("openTab", url); return false; });
}

$("#addStreamer").submit(function(event) {
    event.preventDefault();
    var name = $("#addStreamer input:first").val();
    if(typeof name != "string" || name.trim().length == 0) {
        $("#addStatus").text("Please enter a name").show();
        return;
    }
    name = name.trim();
    $("#addStatus").text("Finding...").show();
    self.port.emit("invoke", {functName: "getChannel", args: {name: name}});
});

self.port.on("REQgetChannel", function(result) {
    if(!result.syserr) {
        console.log(result);
        $("#addStatus").text("Added "+result.display_name).show();
    } else {
        console.log("errorGetChannel: "+result.result.status+": "+result.result.message);
        $("#addStatus").text("Unable to add channel: "+result.result.message).show();
    }
});



$("#config input[name='toastNotifications']").change(function() {
    if($(this).is(':checked')) {
        console.log("toastChecked");
    } else {
        console.log("toastUnchecked");
    }
});
$("#config input[name='interval']").change(function() {
    var value = $(this).val();
    if(value < 1 || value > 99) {
        return;
    }
    self.port.emit("updateInterval", value);
});

self.port.on("setInterval", function(interval) {
    $("#config input[name='interval']").val(interval);
});

function spinner(id, classes) {
    var s = '<div';
    if(typeof id === "string") {
        s = s+' id="'+id+'"';
    }
    s = s+' class="spinner';
    if(typeof classes === "string") {
        s = s+' '+classes;
    }
    s = s+'">'
    return s+'<div class="spinner-container container1"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container2"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container3"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div></div>';

}

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