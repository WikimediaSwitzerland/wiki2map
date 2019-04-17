var map; // The jsMind element
var data; // Map tree data

var synth = window.speechSynthesis;
var acRequest;

var nextElement;
var backElement;
var wikiElement;
var altwikiElement;
var topicElement;
var loadingElement;
var tooltipElement;

var topic; // Current topic
var wiki; // Current wiki
var lang; // Wiki language (it, en...)

var current = 0; // The current page we are at
var pages = []; // Keeping track of the pages visited
var ready = false; // Is the map ready and shown
var redlink = false; // Is the map showing a redlink
var direction; // Alternates links and sections around root

// Useful parameters
var rootName = "root"; // ID of the root element
var imageNodeColor = "#bcd0ff"; // Background color for image nodes
var videoNodeColor = "#ffbcbc"; // Background color for video nodes

var messageDefaultTime = 3000; // How long the message should stay visible
var pageLoadTime = 2000; // How long the page can load before map is shown

function init(t, w, add) {
	if(help.style.display != "none") help.style.display = "none";

	synth.cancel();

	tooltipElement.style.display = "none";
	tooltipElement.textContent = "";

	if(t == "" || w == "" || w.split(".").length != 3) {
		message("Search parameters missing! Try again...", messageDefaultTime, true);
		return;
	}

	var mapElement = get("map");

	topicElement.value = topic = t;

	if(options.indexOf(w) > -1) {
		altwikiElement.value = "";
		altwikiElement.dispatchEvent(new Event("blur"));
		wikiElement.value = wiki = w;
	}
	else {
		altwikiElement.value = wiki = w;
		altwikiElement.dispatchEvent(new Event("focus"));
	}

	ready = redlink = direction = false;
	lang = wiki.split(".")[0];

	imageNodes = [];
	videoNodes = [];

	mapElement.style.display = "none";
	loadingElement.style.display = "flex";

	if(add) { // If user clicked a link then add it to the history
		pages = pages.slice(0, current);
		pages[current] = [topic, wiki];
		current++;
	}

	wtf.fetch(topic, wiki, function(err, doc) {
		try {
			var sections = doc.sections();
		} catch(e) {
			if(e instanceof TypeError) {
				message("Page not found! Try again...", messageDefaultTime, true);
				ready = redlink = true;
				return;
			}
		}

		data = [{"id": "root", "isroot": true, "topic": sectionTooltip(generateLink(topic, "https://" + wiki+"/wiki/" + topic, null, null), sections[0])}]; // Reset tree

		console.log("-- start of logic 404 HEAD errors, ignore them --"); // Ignore the bad red warning messages

		var currentSection;
		var currentParagraph;
		var currentSubParagraph;

		addLinks(rootName, sections[0].links());
		addImages(rootName, sections[0].images());
		addExtras(rootName, sections[0]);

		sections.shift(); // Remove first element (not a section)

		sections.forEach(function(section, i) { // Cycle between all sections
			var title = section.title();
			var link = generateLink(title, "https://" + wiki + "/wiki/" + topic + "#"+ title.replace(/ /g,"_"), null, null);
			link = sectionTooltip(link, section);

			switch(section.indentation()) {
				case 0:
				currentSection = i;
				var id = rootName + "-p" + i;
				push(id, rootName, link, null, null);
				break;

				case 1:
				currentParagraph = i;
				var id = rootName + "-p" + currentSection + "-p" + i;
				push(id, rootName + "-p" + currentSection, link, null, null);
				break;

				case 2:
				currentSubParagraph = i;
				var id = rootName + "-p" + currentSection + "-p" + currentParagraph + "-p" + i;
				push(id, rootName + "-p" + currentSection + "-p" + currentParagraph, link, null, null);
				break;
			}

			addLinks(id, section.links());
			addImages(id, section.images());
			addExtras(id, section);
		});

		window.setTimeout(function() { // Temporary fixes are always the most permanent
			console.log("-- end of logic 404 HEAD errors, ready to show map --");
			show();
		}, pageLoadTime);
	});

	function show() {
		nextElement.disabled = current == pages.length;
		backElement.disabled = current == 1;

		mapElement.style.display = "block";
		loadingElement.style.display = "none";

		map.show({"meta": {"name": topic, "author": wiki, "version": "0.2"}, "format": "node_array", "data": data});

		ready = true;

		videoNodes.forEach(function(videoNode) {map.set_node_color(videoNode, videoNodeColor)});
		imageNodes.forEach(function(imageNode) {map.set_node_color(imageNode, imageNodeColor)});
	}
}

function addLinks(parent, links) {
	links.forEach(function(link, i) {
		var id = parent + "-l" + i;
		var img = document.createElement("img");

		if(link.page == undefined && link.type == "external") {
			var text = link.text;
			var site = link.site;

			img.title = "External link";
			img.src = "css/img/icon/globe.png";

			push(id, parent, generateLink(text, site, null, img), null, null);
		} else {
			var text = link.page;

			img.title = "Move to center";
			img.src = "css/img/icon/sync.png";
			img.className += "linkicon";
			img.addEventListener("click", function() {
				init(text, wiki, true);
			});

			var div = document.createElement("div");
			div.appendChild(img);
			div.appendChild(linkTooltip(generateLink(text, null, null, null), text, wiki));

			push(id, parent, div, null, null);
		}
	});
}

var imageNodes = [];

function addImages(parent, images) {
	images.forEach(function(image, i) {
		var img = document.createElement("img");
		img.title = "Go to image";
		img.alt = "Missing image";

		var url = image.url();
		var altUrl = image.url(wiki.split(".")[0]);

		var src = image.thumbnail(210);
		var altSrc = image.thumbnail(210, wiki.split(".")[0]);

		if(["jpg", "jpeg", "png", "gif", "svg"].indexOf(image.format()) > -1) { // Check if the image type is supported
			var id = parent + "-i" + i;
			var headRequest = new XMLHttpRequest();

			headRequest.timeout = pageLoadTime;

			headRequest.addEventListener("load", function() {
				if(this.status != 404) {
					img.src = src;
					img.setAttribute("full", url);
				} else {
					img.src = altSrc;
					img.setAttribute("full", altUrl);
				}

				imageNodes.push(id);
				push(id, parent, generateLink(null, null, img, null), 210, 140);
			});

			headRequest.addEventListener("timeout", function() {
				img.src = src;
				img.setAttribute("full", url);

				imageNodes.push(id);
				push(id, parent, generateLink(null, null, img, null), 210, 140);
			});

			headRequest.open('HEAD', image.thumbnail(210)); // Sometimes the wikimedia commons url is broken
			headRequest.send();
		}
	});
}

var videoNodes = [];

function addExtras(parent, section) {
	var templates = section.json()["templates"];

	if(templates != undefined) { // Some sections dont have templates in them
		templates.forEach(function(template, i) {

			if(template["template"] != undefined) var type = template["template"].toLowerCase();
			var img = document.createElement("img");

			if(type == "vk" && Array.isArray(template["data"])) { // If data is not an array then we have a redlink
				img.src = "css/img/icon/vk.png";
				var id = parent + "-vk" + i;
				var title = template["data"][0];

				push(id, parent, linkTooltip(generateLink(title, "https://" + lang + ".vikidia.org/wiki/" + title, null, img),
					title, lang + ".vikidia.org"), null, null);
			}

			if(type == "youtube") {
				var wikitext = template["wikitext"];
				var id = parent + "-yt" + i;

				// This one is tricky - the template changes for every language
				// Moreover, the user can choose to add identifiers or not
				// Supporting italian and english (default) at the moment

				switch(lang) {
					case "it":
					wikitext = parseTemplate(wikitext, "id", "titolo");
					break;

					default:
					wikitext = parseTemplate(wikitext, "id", "title"); // Fall back to english
					break;
				}

				img.setAttribute("full", "https://www.youtube.com/watch?v=" + wikitext[0]);
				img.title = "Go to " + wikitext[1];
				img.src = "https://img.youtube.com/vi/" + wikitext[0] + "/mqdefault.jpg";

				videoNodes.push(id);
				push(id, parent, generateLink(null, null, img, null), 210, 115); // YouTube generated thumbnails are 120x90
			}

			// More templates coming
		});
	}
}

function generateLink(title, site, thumb, icon) { // Returns a custom HTML link
	var link = document.createElement("a");
	link.href = "#";

	if(icon != null) {
		icon.className += "linkicon";
		link.appendChild(icon);
	}

	if(title != null) { // Normal link
		var title = title.charAt(0).toUpperCase() + title.slice(1);
		link.appendChild(document.createTextNode(title));
	} else { // Image link
		link.className += "linkimg";
		link.appendChild(thumb);
	}

	if(site == null) {
		if(title == null) site = thumb.getAttribute("full");// Image link
		else site = "https://" + wiki + "/wiki/" + title;
	}

	link.addEventListener("mouseover", function() {
		read(link.textContent);
	});

	link.addEventListener("click", function() {
		window.open(site);
	});
			
	return link;
}

function push(id, parent, topic, width, height, expanded) {
	var node = {"id": id, "parentid": parent, "topic": topic, "expanded": false};

	if(parent == rootName) {
		direction = !direction;
		node["direction"] = direction ? "left" : "right";
	}
	if(width != null) node["width"] = width;
	if(height != null) node["height"] = height; 

	data.push(node);
}

function parseTemplate(template, idIdentifier, titleIdentifier) { // Outputs a consistent data object regardless of language
	template = template.slice(2, -2).split("|");
	template.shift();

	var data = [];
	template.forEach(function(part, i) {
		if(part.indexOf("=") > -1) {
			part = part.split("=");
			var value = part[1].trim();

			switch(part[0].trim()) {
				case idIdentifier:
				data[0] = value;
				break;

				case titleIdentifier:
				data[1] = value;
				break;
			}
		} else {
			data.push(part.trim());
		}
	});

	return data;
}

function message(text, time, isError) {
	var outputElement = get("console");

	time = time || messageDefaultTime;
	isError = isError || false;

	clear();

	loadingElement.style.display = "none";
	if(isError) outputElement.className += "error";
	outputElement.textContent = text;
	outputElement.style.display = "block";

	setTimeout(clear, time);

	function clear() {
		outputElement.textContent = "";
		outputElement.className = "";
		outputElement.style.display = "none";
	}
}

function read(text) {
	if(get("togglespeech").checked) {
		var voice = get("voices").selectedIndex;
		try {
			var speech = new SpeechSynthesisUtterance(text);
		} catch(e) {
			console.log("Text-to-speech synthesis not supported by this browser!");
			return;
		}
		speech.voice = synth.getVoices()[voice];
		synth.speak(speech);
	}
}

function loadVoices() {
	var voicesElement = get("voices");
	voicesElement.innerHTML = "";
	var voices = synth.getVoices();
	if(voices.length > 0) {
		voices.forEach(function(voice) {
			var option = document.createElement("option");
			option.textContent = voice.name + " (" + voice.lang + ")";
			voicesElement.appendChild(option);
		});
		get("speech").style.display = "block";
	}
}

function makeTooltip(tip, mouse) {
	tooltipElement.textContent = tip;
	tooltipElement.style.display = "block";
	tooltipElement.style.left = mouse.clientX + 15 + "px";
	tooltipElement.style.top = mouse.clientY + 15 + "px";
}

function linkTooltip(link, article, wiki) {
	link.addEventListener("mouseover", function(event) {
		if(!link.hasAttribute("tip")) {
			wtf.fetch(article, wiki, function(err, doc) {
				try {
					link.setAttribute("tip", doc.sentences(0)["data"]["text"]);
					makeTooltip(link.getAttribute("tip"), event);
				} catch(e) {
					link.setAttribute("tip", "");
				}
			});
		}
	});

	link.addEventListener("mousemove", function(event) {
		if(link.hasAttribute("tip") && link.getAttribute("tip") != "") makeTooltip(link.getAttribute("tip"), event);
	});

	link.addEventListener("mouseout", function() {
		event.preventDefault();
		tooltipElement.style.display = "none";
		tooltipElement.textContent = "";
	});

	return link;
}

function sectionTooltip(link, section) {
	link.addEventListener("mousemove", function(event) {
		event.preventDefault();
		try {
			makeTooltip(section.sentences(0)["data"]["text"], event);
		} catch(e) {
			return;
		}
	});

	link.addEventListener("mouseout", function(event) {
		event.preventDefault();
		tooltipElement.style.display = "none";
		tooltipElement.textContent = "";
	});

	return link;
}

var languages = ["it", "en", "fr", "de", "es"];
var projects = ["wikipedia", "wikiversity", "wikibooks", "wikivoyage", "vikidia"];
var options = [];

function addWikis() {
	projects.forEach(function(project, index) {
		languages.forEach(function(language) {
			var option = document.createElement("option");
			var value = language + "." + project + ".org";
			options.push(value);
			option.value = value;
			option.textContent = value;
			wikiElement.appendChild(option);
		});
		if(index < projects.length - 1) {
			var blank = document.createElement("option");
			wikiElement.appendChild(blank);
		}
	});
}

window.onload = function() {
	nextElement = get("next");
	backElement = get("back");
	wikiElement = get("wiki");
	altwikiElement = get("altwiki");
	topicElement = get("topic");
	loadingElement = get("loading");
	tooltipElement = get("tooltip");

	addWikis();

	loadVoices();
	if(typeof synth !== "undefined" && 
		synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;

	addListeners();

	map = new jsMind({container: "map", editable: false, theme: "default"});
};
