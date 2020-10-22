'use strict';

import * as voice from "./modules/voice.js";
import * as ui from "./modules/ui.js";
import * as autocomplete from "./modules/autocomplete.js";
import * as map from "./modules/map.js";
import {getRouting, populateList} from "./modules/misc.js";

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
  populateList("wiki-dropdown", defaultConfig.wikis);
  populateList("lang-dropdown", defaultConfig.languages);
}

$(document).ready(function() {
	init();

  voice.init();
  ui.init();
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

		map.generate(true, getRouting());
	}
});
