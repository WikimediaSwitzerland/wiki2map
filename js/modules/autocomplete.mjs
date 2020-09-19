import {getWiki, getLang, getURL} from "./misc.mjs";
import * as map from "./map.mjs";

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
  	map.generate(getWiki(), topic, getLang(), true);
	});
}

export function update() {
  abort();

  let params = {action: "opensearch",
    format: "json",
    origin: "*",
    search: $("#topic").val(),
    namespace: "0",
    limit: "10",
    suggest: "true"
  };

  $.getJSON("https://" + getURL() + "/w/api.php", params, (data) => {
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
    if(request != undefined && request.readyState < 4)
      request.abort();

    $("#autocomplete").empty().hide();
}
