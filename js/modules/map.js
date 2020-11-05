import * as voice from "./voice.js";
import * as history from "./history.js";
import {getTopicURL, getAPIParams, getBaseURL, getRouting, flattenJSON} from "./misc.js";

export const NO_TOOLTIP = 0;
export const LINK_TOOLTIP = 1;
export const SECTION_TOOLTIP = 2;

const ROOT_NODE = "root"; // ID of the root element
const IMAGE_THUMB_SIZE = 210; // Width of thumbnails shown in node

var direction = false;

export const content = {
	"queued": [],

	"tree": [],
	"map": undefined,

	"routing": undefined,
	"ready": false,
	"speech": false
};

export function generate(track, routing = false) {
	$("#errorpage, #about").hide();

	content.ready = false;
	if(routing !== false) {
		content.routing = routing;
	}

	$("#topic").val(content.routing.topic);

	voice.abort(); // Stop talking
	reset(); // Hide map, show spinner

	$.getJSON(getBaseURL() + "/w/api.php",
		getAPIParams(content.routing), function(data) {
		let dump = wtf(flattenJSON(data)["*"]);
		let sections;

		try {
			sections = dump.sections();
		} catch(e) {
			if(e instanceof TypeError) {
				$("#loading").hide();
				$("#errorpage").slideDown();

				content.ready = true;
			}
			return;
		}

		if(track)	history.push(content.routing); // Incognito mode or not?

		// Tooltip params for main section
		let tooltip = [SECTION_TOOLTIP,
			sections[0]];

		content.tree = [{
			"id": ROOT_NODE,
			"isroot": true,
			"topic": getInternalLink(content.routing, tooltip)[0].outerHTML
		}];

		// Create nodes around main element
		makeLinks(ROOT_NODE, sections[0].links());
		makeImages(ROOT_NODE, sections[0].images());
		makeTemplates(ROOT_NODE, sections[0]);

		// Keeps track of where we are on the page when building the mindmap
		let index = [0, 0, 0, 0];

		sections.shift(); // Remove first element (not a section)
		// Create nodes around children of main element
		sections.forEach(function(section, i) { // Cycle between all sections
			let title = section.title();

			let url = getTopicURL(content.routing) + "#" + title.replace(/ /g,"_");

			// Tooltip params for children sections
			let tooltip = [SECTION_TOOLTIP, section];
			// Make section node clickable and take user to #section
			let link = getTextLink(title, url, tooltip);

			let tab = section.indentation();
			let parent = ROOT_NODE;
			index[tab] = i;

			// Build node id, each -p marks another level (max 4)
			for(let k = 0; k < tab; k++) {
				parent += "-p" + index[k];
			}

			let id = parent + "-p" + i;

			// Add node to tree, this will be used by jsmind later
			addNode(id, parent, link[0].outerHTML);

			// Create nodes for this section
			makeLinks(id, section.links());
			makeImages(id, section.images());
			makeTemplates(id, section);
		});

		// Done, show map
		// Note that show() may be called again when images and some
		// templates have finished their async loading
		// This is necessary as jsmind has to relayout the map
		show();

		content.ready = true;
	});
}

// Hide spinner, show map
function show() {

	$("#map").show();
	$("#loading").hide();

	content.map.show(
		{"meta": {
			"name": content.topic,
			"author": content.wiki,
			"version": "0.2"
		},
		"format": "node_array", // Using node array tree format
		"data": content.tree}
	);
}

// Hide map, show spinner
function reset() {
	$("#tooltip").empty().hide();

	// Empty async queue
	content.queued = [];

	$("#map").hide();
	$("#loading").css("display", "flex");
}

// Build links, both internal and external
function makeLinks(parent, links) {
	let external = $("<img/>");
	external.prop("title", "External link")
		.attr("src", "res/map/globe.png")
		.addClass("icon-link");

	let internal = $("<img/>");
	internal.prop("title", "Move to center")
		.attr("src", "res/map/sync.png")
		.addClass("icon-link internal");

	links.forEach(function(link, i) {
		let id = parent + "-l" + i;
		let container = $("<div></div>");

		// Is the link pointing to another website (non-wiki)?
		if(link.page() == undefined && link.type() == "external") {
			// Create link element
			let value = getTextLink(link.text(), link.site(), [NO_TOOLTIP], external);
			container.append(value);
		} else { // Or is this an internal link?
			internal.attr("data-topic", link.page());
			// Create link element
			let value = getInternalLink(
				getRouting(content.routing.base, link.page()),
				[LINK_TOOLTIP]);

			container.append(internal.clone());
			container.append(value);
		}

		// Add link node to tree
		addNode(id, parent, container.html());
	});
}

function makeImages(parent, images) {
	let img = $("<img/>");
	img.prop("title", "Open image")
		.prop("alt", "Missing image");

	images.forEach(function(image, i) {
		let id = parent + "-i" + i;

		// Check if the image type is supported
		if(["jpg", "jpeg", "png", "gif", "svg"].indexOf(image.format()) > -1) {
			// STRATEGY: since we want to load a thumbnail without knowing its
			// size in advance we make our ajax call to the wiki api, get the size
			// and then actually build the node. The node is not shown immediately,
			// though, as we wait till the image is loaded and visible.

			// Params for requesting thumb url
			let params = {action: "query",
				format: "json",
				origin: "*",
				titles: image.file(),
				prop: "imageinfo",
				iiprop: "url",
				iiurlwidth: IMAGE_THUMB_SIZE
			};

			let url = getBaseURL(content.routing) + "/w/api.php";

			$.getJSON(url, params, (dump) => {
				let data = flattenJSON(dump);
				// We add the image to a queue so we know when all images are done
				// loading: at this point we call show() once again to fix the layout
				content.queued.push(id);
				img.attr("data-source", data.url);

				let thumb = img.clone();
				let link = getImageLink(thumb);
				// Fix layout once image loads
				thumb.one("load", () => {
					addNode(id, parent, link[0].outerHTML, IMAGE_THUMB_SIZE);

					let index = content.queued.indexOf(id);
					if(index > -1) content.queued.splice(index, 1);
					if(content.queued.length == 0) show();
				});

				thumb.attr("src", data.thumburl);
			});
		}
	});
}

function makeTemplates(parent, section) {
	// Add other templates you want to support here, with the respective
	// handler function below
	let templates = section.json()["templates"];

	if(templates != undefined) { // Some sections don't have templates in them
		templates.forEach(function(item, i) {
			switch(item.template) {
				case "youtube":
				handleYoutubeTemplate(parent, item, i);
				break;

				case "vk":
				handleVikidiaTemplate(parent, item, i);
				break;
				// Add more as needed
			}
		});
	}
}

// Adds a node to the mindmap tree
function addNode(id, parent, value, width = undefined, height = undefined) {
	let node = {
		"id": id,
		"parentid": parent,
		"topic": value,
		"expanded": false
	};

	// Alternate between right and left
	if(parent == ROOT_NODE) {
		direction = !direction;
		node["direction"] = direction ? "left" : "right";
	}

	if(width != undefined) node["width"] = width;
	if(height != undefined) node["height"] = height;

	content.tree.push(node);
}

// ================================ TEMPLATES =============================== //

const YOUTUBE_BASE_URL = "https://www.youtube.com/watch?v=";

function handleYoutubeTemplate(parent, t, i) {
	let id = parent + "-yt" + i;
	let thumb = $("<img/>");
	let params = {format: "json", url: YOUTUBE_BASE_URL + t.id};

	// Here we use noembed to get a thumbnail. Thankfully they are all the
	// same size so we can add the node right away.
	$.getJSON("https://noembed.com/embed", params).done(function(data) {
		// If video is not available don't bother adding it
		// Possibly not the best behavior
		if(data.hasOwnProperty("error")) {
			return;
		}

		let thumburl = "https://img.youtube.com/vi/" + t.id + "/mqdefault.jpg";
		thumb.attr("data-source", "https://www.youtube.com/watch?v=" + t.id)
			.attr("src", "https://img.youtube.com/vi/" + t.id + "/mqdefault.jpg");

		let link = getImageLink(thumb);
		link.addClass("video-link")
			.prop("title", data.title);

		addNode(id, parent, link[0].outerHTML, IMAGE_THUMB_SIZE, 115);

		let index = content.queued.indexOf(id);
		if(index > -1) content.queued.splice(index, 1);
		if(content.queued.length == 0) show();
	});
}

function handleVikidiaTemplate(parent, t, i) {
	if(!Array.isArray(t.list)) return; // Abort if redlink

	let icon = $("<img/>");
	icon.attr("src", "res/map/vk.png")
		.addClass("icon-link")
		.prop("title", "Vikidia link");

	let id = parent + "-vk" + i;

	// Vikidia templates use this weird format...
	let topic = t.list[0];

	let lang = content.routing.base.split(".")[0];
	let routing = getRouting(lang + ".vikidia.org", topic);
	// Replace with NO_TOOLTIP with LINK_TOOLTIP when (and if) vikidia
	// fixes CORS permissions to enable tooltips
	let tooltip = [LINK_TOOLTIP, routing];
	let link = getTextLink(topic, getTopicURL(routing), tooltip, icon);

	addNode(id, parent, link[0].outerHTML);
}

// ================================ TOOLTIP ================================= //

// STRATEGY: If the tooltip is of type LINK_TOOLTIP we only want to load
// the text once. To do so we check whether the attr "data-tip" is set.
// If it is set the use the content as tooltip, if not load it asyncronously
// from the api.
function attachTooltip(link, tooltip) {
	let type = tooltip[0];
	if(type == NO_TOOLTIP) return link;

	// Attach tooltips if requested
	if(type == LINK_TOOLTIP) {
		link.attr("data-tip-routing", JSON.stringify(tooltip[1]));
	} else if(type == SECTION_TOOLTIP) {
		// Use first sentence of section as tooltip
		let sentences = tooltip[1].sentences();
		if(sentences.length == 0) return link;

		let section = sentences[0]["data"]["text"];
		link.attr("data-tip", section);
	}

	link.attr("data-tip-type", type);

	return link;
}

// =============================== LINKS ==================================== //

// Main link generator
function getLink(value, url, icon = null) {
	let link = $("<a></a>");
	link.attr("target", "_blank")
		.attr("href", url);

	if(icon != null) link.append(icon);

	link.append(value);
	return link;
}

// Make a text link
function getTextLink(text, url, tooltip, icon = null) {
	let link = getLink(text, url, icon);

	link.addClass("readable");

	return attachTooltip(link, tooltip);
}

// Make a link with an image
function getImageLink(image) {
	let link = getLink(image, image.attr("data-source"));

	link.addClass("image-link");
	return link;
}

// Link to a wiki page
function getInternalLink(routing, tooltip, icon = null) {
	let topic = routing.topic;
	let text = topic.charAt(0).toUpperCase() + topic.slice(1);
	if(tooltip[0] == LINK_TOOLTIP) {
		tooltip = [tooltip, routing];
	}

	return getTextLink(text, getTopicURL(routing), tooltip, icon);
}
