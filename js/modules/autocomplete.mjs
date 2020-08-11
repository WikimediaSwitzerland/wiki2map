import {getURL, getTopic} from "./misc.mjs";
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
		let wiki = getURL();
  	let topic = $(this).html();
  	map.generate(wiki, topic, true);
	});

  request = new XMLHttpRequest();

  request.addEventListener("load", function() {
    let response = JSON.parse(request.response)[1];

    if(this.status == 200 && response != undefined && response.length > 0) {

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

export function update() {
  abort();

  let source = getURL();

  request.open("GET", "https://" + source + "/w/api.php?" +
    "action=opensearch&" +
    "format=json&" +
    "origin=*&" +
    "search=" + $("#topic").val() + "&" +
    "namespace=0&" +
    "limit=10&" +
    "suggest=true");

  request.send();
}

export function abort() {
    if(request != undefined && request.readyState < 4)
      request.abort();

    $("#autocomplete").empty().hide();
}
