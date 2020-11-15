'use strict';

import * as voice from "./modules/voice.js";
import * as ui from "./modules/ui.js";
import * as autocomplete from "./modules/autocomplete.js";
import * as map from "./modules/map.js";
import * as locale from "./modules/locale.js";
import {getRouting} from "./modules/misc.js";

// ============================  DOCUMENT SETUP  ============================ //

$(document).ready(function() {
  let url = new URL(window.location.href);

  locale.init(url.searchParams.get("lang") || "en", () => {
    voice.init();
    ui.init();
    autocomplete.init();

  	map.content.map = new jsMind({
      container: "map",
      editable: true,
      theme: "default"});

    // Check for GET parameters
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
});
