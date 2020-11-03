import {getRouting, getBaseURL, getAPIParams} from "./misc.js";
import * as map from "./map.js";

var request = undefined;

export function init() {
  // Attach listeners first
  $("#topic").keyup(function() {
  	update();
  });

  $("#topic").blur(function() {
  	abort();
  });

  $("#autocomplete").on("mousedown", "li", function() {
  	let topic = $(this).html();
  	map.generate(true, getRouting(false, topic));
	});
}

export function update() {
  abort();

  $.getJSON(getBaseURL() + "/w/api.php", getAPIParams(), function(data) {
    let response = data[1];

    if(response != undefined && response.length > 0) {
      let topic = $("<li></li>");
      topic.addClass("list-group-item py-2");

      response.forEach(function(t) {
        topic.html(t);
        $("#autocomplete").append(topic.clone());
      });
    }
    $("#autocomplete").show();
  });
}

export function abort() {
    if(request != undefined && request.readyState < 4) {
      request.abort();
    }

    $("#autocomplete").empty().hide();
}
