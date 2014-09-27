self.port.on("panelVisible", function(isVisible) {
	if(isVisible) {
		self.port.emit("invoke", {functName: "getTopGames", args: {lim: 12}});
	} else {
		
	}
});

self.port.on("REQgetTopGames", function(result) {
	if(!result.syserr) {
		$(".gameitem").remove();
		for(var i = result.top.length - 1; i >= 0; i--) {
			var game = result.top[i];
			var html = jsonToDOM([
				"li", {class: "gameitem"},
				[
					"a", {},
					[
						["span", {}, ["img", {src: game.game.logo.small, alt: game.game.name}]],
						["div", {class: "name"}, game.game.name],
						["div", {class: "info"}, game.viewers+" viewers on "+game.channels+" channels"]
					]
				]
			], document, {});
			$("ul.gamelist").after(html);
		}
	} else {
		console.log("errorGetTopGames: "+result.result.status+": "+result.result.message);
		$("div.topgames").text("Unable to load results: "+result.result.message);
	}
});



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



$("#config input[name='toastNotifications']:checkbox").change(function() {
	if($(this).is(':checked')) {
		console.log("toastChecked");
	} else {
		console.log("toastUnchecked");
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