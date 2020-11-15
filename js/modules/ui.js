import * as autocomplete from "./autocomplete.js";
import * as voice from "./voice.js";
import * as map from "./map.js";
import * as history from "./history.js";
import {getTranslation} from "./locale.js";
import {getRouting,
	flattenJSON,
	getAPIParams,
	getBaseURL,
	populateList} from "./misc.js";

export function init() {
	let config = getTranslation("dropdown-data");

	populateList("wiki-dropdown", config.wikis);
	populateList("lang-dropdown", config.languages);
	// Make Bootstrap dropdowns behave decently
	$(".dropdown-container").on("click", "a", function() {
		let target = $(this);

		let button = target.closest(".dropdown-container").children(".btn");
		button.attr("data-value", target.attr("data-value"));
		button.find("span").html(target.html());
	});

	// Set UI up for inputting custom wiki URL
	$("#custom-url-button").click(function() {
		$("#dropdown-container").hide();
		$("#custom-url-container").css("display", "flex");

		// Getting wiki URL from custom text bar
		$("#controls").attr("data-target", true);
	});

	// Cancel what happened above
	$("#custom-url-back").click(function() {
		$("#dropdown-container").css("display", "flex");
		$("#custom-url-container").css("display", "none");

		// Getting wiki URL from dropdowns
		$("#controls").attr("data-target", false);
	});

	// Start the show
	$("#submit").click(function() {
		map.generate(true, getRouting());
	});

	// Cliked on a mappable link (internal) - Do the thing
	$("#map").on("click", ".internal", function() {
		let target = $(this);
		// Direct access to the map routing
		map.content.routing.topic = target.attr("data-topic");
		// It already knows what to do
		map.generate(true);
	});

	// ============= MIDDLE NAV BUTTONS ============= //

	// Handle collapsing and expanding
	$("#collapse-button").click(function() {
		map.content.map.collapse_all();
	});

	$("#expand-button").click(function() {
		map.content.map.expand_all();
	});

	// Handle zooming
	$("#zoom-in-button").click(function() {
		let content = map.content;
		if(!content.ready) return;

		if(content.map.view.zoomIn()) {
			$("#zoom-out-button").removeClass("disabled");
		} else {
			$("#zoom-in-button").addClass("disabled");
		}
	});

	$("#zoom-out-button").click(function() {
		let content = map.content;
		if(!content.ready) return;

		if(content.map.view.zoomOut()) {
			$("#zoom-in-button").removeClass("disabled");
		} else {
			$("#zoom-out-button").addClass("disabled");
		}
	});

	$("#back-button").prop("disabled", true);

	// Handle history
	$("#back-button").click(function() {
		history.back();
		let content = history.content;
		$("#forward-button").prop("disabled", false);
		if(content.index < 1) {
			$(this).prop("disabled", true);
		} else {
			$(this).removeClass("disabled", false);
		}
	});

	$("#forward-button").click(function() {
		history.forward();
		let content = history.content;
		$("#back-button").prop("disabled", false);
		if(content.pages.length - 1 == content.index) {
			$(this).prop("disabled", true);
		}	else {
			$(this).prop("disabled", false);
		}
	});

	$("#about-button").click(function() {
		$("#about-message").css("width",
			$("#topic-container").outerWidth()).slideToggle();
	});

	// ============= END MIDDLE NAV BUTTONS ============= //

	// All-in-one button to enable tts
	$("#tts-dropdown-btn").click(function(e) {
		if(map.content.speech) {
			map.content.speech = false;
			voice.abort();
			$("img", this).show();
			$("p, span", this).html("");
			$(this).attr("data-toggle", "dropdown").
				addClass("dropdown-toggle btn-primary").
				removeClass("btn-success").
				dropdown("toggle");
		}	else {
			$("p", this).html(getTranslation("tts-select-language"));
			$("img", this).hide();
		}
	});

	// Make the tts dropdown with all the different language options work
	$("#tts-dropdown .dropdown-menu").on("click", "a", function() {
		map.content.speech = true;

		$("#tts-dropdown-btn p").html(getTranslation("tts-hover"));
		$("#tts-dropdown-btn").dropdown("toggle").
			attr("data-toggle", "").
			removeClass("dropdown-toggle btn-primary").
			addClass("btn-success");
	});

	// If the bubble is ".readable" and tts is enabled read it out loud
	$("#map").on("mouseover", ".readable", function() {
		if(map.content.speech)
			voice.read($(this).text());
	});

	// ============= TOOLTIP GENERATION AND DISPLAY ============= //
	// STRATEGY: if element has data-tip-type attrib && doesn't have any data
	// in data-tip yet then attempt to fetch it from its page; this
	// is for LINK_TOOLTIPs only. Otherwise, simply display it, as all data is
	// already loaded.
	$("#map").on("mouseover", "[data-tip-type]", function(event) {
		event.preventDefault();
		let target = $(this);
		let type = target.attr("data-tip-type");

		if(type == map.LINK_TOOLTIP) {
			// We don't have anything to display yet - load it and store in attribute
			if(target.attr("data-tip") == undefined) {
				let icon = $("<img/>")
					.attr("src", "res/map/ellipsis.gif")
					.css({height: "20px", width: "20px"});
				$("#tooltip").html(icon);
				let routing = JSON.parse(target.attr("data-tip-routing"));

				$.getJSON(getBaseURL() + "/w/api.php",
					getAPIParams(routing), function(data) {
					let dump = wtf(flattenJSON(data)["*"]);
					try {
						target.attr("data-tip", dump.sentences(0)["data"]["text"]);
					} catch(e) {
						// If we cannot get a tip for this node disable tooltipping
						target.removeAttr("data-tip-type");
						$("#tooltip").empty().hide();
						return;
					}
					// Are we still on that element?
					if(target.is(":hover")) {
						$("#tooltip").html(target.attr("data-tip")).show();
					}
				});
			}
		}

		// Whatever happens, show tooltip
		$("#tooltip").html(target.attr("data-tip")).show();
	});

	// Make tooltip follow mouse
	$("#map").on("mousemove", "[data-tip-type]", function(event) {
		event.preventDefault();
		// Compensate a couple pixels
		let left = event.clientX + 15 + "px";
		let top = event.clientY + 15 + "px";

		$("#tooltip").css("left", left).css("top", top);
	});

	// Hide tooltip when pointer exits from node
	$("#map").on("mouseout", "[data-tip-type]", function(event) {
		event.preventDefault();
		$("#tooltip").empty().hide();
	});

	// "Click anywhere to dismiss"
	$("body").click(function() {
		$("#help").fadeOut(200);
	});
}
