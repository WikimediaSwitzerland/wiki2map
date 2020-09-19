import * as autocomplete from "./autocomplete.mjs";
import * as voice from "./voice.mjs";
import * as map from "./map.mjs";
import * as history from "./history.mjs";
import {getWiki, getTopic, getLang} from "./misc.mjs";

export function init() {
	$(".dropdown-container").on("click", "a", function() {
		let target = $(this);

		let button = target.closest(".dropdown-container").children(".btn");
		button.attr("data-value", target.attr("data-value"));
		button.find("span").html(target.html());
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
		map.generate(getWiki(), getTopic(), getLang(), true);
	});

	$("#map").on("click", ".internal", function() {
		let target = $(this);
		map.generate(map.content.wiki,
			target.attr("data-topic"),
			map.content.lang,
			true);
	});

	$("#zoom-in-button").click(function() {
		let content = map.content;
		if(!content.ready) return;

		if(content.map.view.zoomIn())
			$("#zoom-out-button").removeClass("disabled");
		else
			$("#zoom-in-button").addClass("disabled");
	});

	$("#zoom-out-button").click(function() {
		let content = map.content;
		if(!content.ready) return;

		if(content.map.view.zoomOut())
			$("#zoom-in-button").removeClass("disabled");
		else
			$("#zoom-out-button").addClass("disabled");
	});

	$("#back-button").click(function() {
		history.back();
		let content = history.content;
		$("#forward-button").prop("disabled", false);
		if(content.index < 1)
			$(this).prop("disabled", true);
		else
			$(this).removeClass("disabled", false);
	});

	$("#forward-button").click(function() {
		history.forward();
		let content = history.content;
		$("#back-button").prop("disabled", false);
		if(content.pages.length - 1 == content.index)
			$(this).prop("disabled", true);
		else
			$(this).prop("disabled", false);
	});

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
			$("p", this).html("Select a language");
			$("img", this).hide();
		}
	});

	$("#tts-dropdown .dropdown-menu").on("click", "a", function() {
		map.content.speech = true;

		$("#tts-dropdown-btn p").html("Hover cursor on map");
		$("#tts-dropdown-btn").dropdown("toggle").
			attr("data-toggle", "").
			removeClass("dropdown-toggle btn-primary").
			addClass("btn-success");
	});

	$("#map").on("mouseover", ".readable", function() {
		if(map.content.speech)
			voice.read($(this).text());
	});

	$("#map").on("mouseover", "[data-tip-type]", function(event) {
		event.preventDefault();
		let target = $(this);
		let type = target.attr("data-tip-type");

		if(type == map.LINK_TOOLTIP) {
			if(target.attr("data-tip") == undefined) {
				let icon = $("<img/>")
					.attr("src", "res/icon/ellipsis.gif")
					.css({height: "20px", width: "20px"});
				$("#tooltip").html(icon);
				wtf.fetch(target.attr("data-tip-source")).then((dump) => {
					try {
						target.attr("data-tip", dump.sentences(0)["data"]["text"]);
					} catch(e) {
						// If we cannot get a tip for this node disable tooltipping
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
