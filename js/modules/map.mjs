import * as voice from "./voice.mjs";
import * as history from "./history.mjs";
import {getTopicURL, flattenJSON} from "./misc.mjs";

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

	"wiki": undefined,
	"topic": undefined,
	"lang": undefined,
};

export function generate(wiki, topic, track) {
	content.wiki = wiki;
	content.topic = topic;

	$("#topic").val(topic);

	voice.abort(); // Stop talking
	reset();

	if(track) history.push(wiki, topic);

	let params = {lang: wiki.split(".")[0],
		wiki: wiki.split(".")[1]};

	content.lang = params.lang;
	//FIXME

	wtf.fetch(topic, params).then((dump) => {
		let sections;

		try {
			sections = dump.sections();
		} catch(e) {
			if(e instanceof TypeError) {

				// TODO error message for redlink
			}
			return;
		}

		let tooltip = [SECTION_TOOLTIP,
			sections[0]];

		content.tree = [{
			"id": "root",
			"isroot": true,
			"topic": getInternalLink(wiki, topic, tooltip)[0].outerHTML
		}];

		makeLinks(ROOT_NODE, sections[0].links());
		makeImages(ROOT_NODE, sections[0].images());
		makeExtras(ROOT_NODE, sections[0]);

		// Keeps track of where we are on the page when building the mindmap
		let index = [0, 0, 0, 0];

		sections.shift(); // Remove first element (not a section)
		sections.forEach(function(section, i) { // Cycle between all sections
			let title = section.title();

			let url = getTopicURL(wiki, topic) + "#" + title.replace(/ /g,"_");

			let tooltip = [SECTION_TOOLTIP, section];
			let link = getTextLink(title, url, tooltip);

			let tab = section.indentation();
			let parent = ROOT_NODE;
			index[tab] = i;

			for(let k = 0; k < tab; k++)
				parent += "-p" + index[k];

			let id = parent + "-p" + i;

			addNode(id, parent, link[0].outerHTML);

			makeLinks(id, section.links());
			makeImages(id, section.images());
			makeExtras(id, section);
		});

		show();
	});
}

function show() {
	$("#map").show();
	$("#loading").hide();

	content.map.show(
		{"meta": {
			"name": content.topic,
			"author": content.wiki,
			"version": "0.2"
		},
		"format": "node_array",
		"data": content.tree}
	);
}

function reset() {
	$("#tooltip").empty().hide();

	content.queued = [];

	$("#map").hide();
	$("#loading").css("display", "flex");
}

function makeLinks(parent, links) {
	let external = $("<img/>");
	external.prop("title", "External link")
		.attr("src", "res/icon/globe.png")
		.addClass("icon-link");

	let internal = $("<img/>");
	internal.prop("title", "Move to center")
		.attr("src", "res/icon/sync.png")
		.addClass("icon-link internal");

	links.forEach(function(link, i) {
		let id = parent + "-l" + i;
		let container = $("<div></div>");

		// Is the link pointing to another website (non-wiki)?
		if(link.page() == undefined && link.type() == "external") {
			let value = getTextLink(link.text(), link.site(), [NO_TOOLTIP], external);
			container.append(value);
		} else { // Or is this an internal link?
			internal.attr("data-wiki", content.wiki);
			internal.attr("data-topic", link.page());

			let value = getInternalLink(content.wiki, link.page(), [LINK_TOOLTIP]);

			container.append(internal.clone());
			container.append(value);
		}

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
			let params = {action: "query",
				format: "json",
				origin: "*",
				titles: encodeURIComponent(image.file()),
				prop: "imageinfo",
				iiprop: "url",
				iiurlwidth: IMAGE_THUMB_SIZE
			};

			$.getJSON("https://" + content.wiki + "/w/api.php", params, (dump) => {
				let data = flattenJSON(dump);
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

function makeExtras(parent, section) {
	let templates = section.json()["templates"];

	let vk = $("<img/>");
	vk.attr("src", "src/icon/vk.png");

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
			/*if(type == "vk" && Array.isArray(temp.data)) {
				let id = parent + "-vk" + i;
				let topic = template["data"][0];

				let url = "https://" + lang + ".vikidia.org/wiki/" + topic;
				let tooltip = [
					LINK_TOOLTIP,
					lang + ".vikidia.org",
					topic];
				let link = getTextLink(topic, url, tooltip, vk);
				addNode(id, parent, link[0].outerHTML);
			}*/
			// More templates coming
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

	$.getJSON("https://noembed.com/embed", params, (data) => {
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

// ================================ TOOLTIP ================================= //

function attachTooltip(link, tooltip) {
	let type = tooltip[0];
	if(type == NO_TOOLTIP) return link;

	// Attach tooltips if requested
	if(type == LINK_TOOLTIP) {
		let source = getTopicURL(tooltip[1], tooltip[2]);
		link.attr("data-tip-source", source);
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
	link.attr("target", "_blank");
	link.attr("href", url);

	if(icon != null) link.append(icon);

	link.append(value);
	return link;
}

// Make a text link
function getTextLink(text, url, tooltip, icon = null) {
	let link = getLink(text, url, icon);

	link.mouseover(() => {
		voice.read(link.html());
	});

	return attachTooltip(link, tooltip);
}

// Make a link with an image
function getImageLink(image) {
	let link = getLink(image, image.attr("data-source"));

	link.addClass("image-link");
	return link;
}

// Link to a wiki page
function getInternalLink(wiki, topic, tooltip, icon = null) {
	let text = topic.charAt(0).toUpperCase() + topic.slice(1);
	if(tooltip[0] == LINK_TOOLTIP)
		tooltip = [tooltip, wiki, topic];
	return getTextLink(text, getTopicURL(wiki, topic), tooltip, icon);
}
