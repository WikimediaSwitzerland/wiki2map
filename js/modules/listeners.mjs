import * as autocomplete from "./autocomplete.mjs";
import * as map from "./map.mjs";
import {getURL, getTopic} from "./misc.mjs";

export function init() {
	$(".dropdown-container").on("click", "a", function() {
		let target = $(this);

		let button = target.closest(".dropdown-container").children(".btn");
		button.attr("data-value", target.attr("data-value"));
		button.html(target.html());
	});

	$("#custom-url-button").click(function() {
		$("#dropdown-container").hide();
		$("#custom-url-container").css("display", "flex");

		// Getting wiki URL from custom text bar
		$("#controls").attr("data-target", true);
	});

	$("#custom-url-back").click(function() {
		$("#dropdown-container").css("display", "flex");
		$("#custom-url-container").css("display", "none");

		// Getting wiki URL from dropdowns
		$("#controls").attr("data-target", false);
	});

	$("#submit").click(function() {
		let wiki = getURL();
		let topic = getTopic();
		map.generate(wiki, topic, true);
	});

	$("#map").on("click", ".internal", function() {
		let target = $(this);
		map.generate(target.attr("data-wiki"), target.attr("data-topic"), true);
	});

	$("#map").on("mouseover", "[data-tip-type]", function(event) {
		event.preventDefault();
		let target = $(this);
		let type = target.attr("data-tip-type");

		if(type == map.LINK_TOOLTIP) {
			if(target.attr("data-tip") == undefined) {
				$("#tooltip").html("Loading...");
				wtf.fetch(target.attr("data-tip-source")).then((dump) => {
					try {
						target.attr("data-tip", dump.sentences(0)["data"]["text"]);
					} catch(e) {
						// If we cannot get a tip for this node just disable tooltipping
						target.removeAttr("data-tip-type");
						$("#tooltip").empty().hide();
						return;
					}
					// Are we still on that element?
					if(target.is(":hover"))
						$("#tooltip").html(target.attr("data-tip")).show();
				});
			}
		}

		$("#tooltip").html(target.attr("data-tip")).show();
	});

	// Make tooltip follow mouse
	$("#map").on("mousemove", "[data-tip-type]", function(event) {
		event.preventDefault();
		let left = event.clientX + 15 + "px";
		let top = event.clientY + 15 + "px";

		$("#tooltip").css("left", left).css("top", top);
	});

	// Hide tooltip when pointer exits from node
	$("#map").on("mouseout", "[data-tip-type]", function(event) {
		event.preventDefault();
		$("#tooltip").empty().hide();
	});
}
