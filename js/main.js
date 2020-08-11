'use strict';

import * as voice from "./modules/voice.mjs";
import * as listeners from "./modules/listeners.mjs";
import * as autocomplete from "./modules/autocomplete.mjs";
import * as map from "./modules/map.mjs";

// ============================  DOCUMENT SETUP  ============================ //

let defaultConfig = {
  "languages": [["Italiano", "it"],
    ["English", "en"],
    ["Français", "fr"],
    ["Deutsch", "de"],
    ["Español", "es"]],
  "wikis": [["Wikipedia", "wikipedia.org"],
    ["Wikiversity", "wikiversity.org"],
    ["Vikidia", "vikidia.org"]]
};

function init() {
  populate("wiki-dropdown", defaultConfig.wikis);
  populate("lang-dropdown", defaultConfig.languages);

  function populate(element, data) {
    let dropdown = $("#" + element + " div");
    let option = $("<a></a>");
    option.addClass("dropdown-item");
    option.attr("href", "#");

    data.forEach(function(e, i) {
  		option.text(e[0]);
      option.attr("data-value", e[1]);

  		dropdown.append(option.clone());
  	});
  }
}

$(document).ready(function() {

	init();

  voice.init();
  listeners.init();
  autocomplete.init();

	map.content.map = new jsMind({
    container: "map",
    editable: true,
    theme: "default"});

  // Check for GET parameters

	let url = new URL(window.location.href);
	let wiki = url.searchParams.get("wiki");
	let topic = url.searchParams.get("topic");

	if(wiki != null && topic != null) {
    // Show custom url textbox
    $("#custom-url-button").trigger("click");

		$("#custom-url").val(wiki);
		$("#topic").val(topic);

		map.generate(wiki, topic, true);
	}

});

export {map};
