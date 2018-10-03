function addListeners() {
	var peopleElement = get("people");
	get("about").addEventListener("click", function() {
		if(peopleElement.style.display != "none") peopleElement.style.display = "none";
		else peopleElement.style.display = "block";
	});

	get("export").addEventListener("click", function() {
		var extraElement = get("extra");
		if(extraElement.style.display != "none") extraElement.style.display = "none";
		else extraElement.style.display = "flex";
		peopleElement.style.display = "none";
	});

	get("submit").addEventListener("click", function() {
		var wiki = (altwikiElement.value == "") ? wikiElement.value : altwikiElement.value;
		init(topicElement.value, wiki, true);
	});

	get("freemind").addEventListener("click", function() {
		if(ready && !redlink) {
			jsMind.util.file.save(
				map.get_data("freemind").data, 
				"text/xml", 
				topic + ".mm"
			);
		}
	});

	get("nodearray").addEventListener("click", function() {
		if(ready && !redlink) {
			jsMind.util.file.save(
				jsMind.util.json.json2string(map.get_data("node_array")),
				"text/plain", 
				topic + ".nodearray"
			);
		}	});

	get("nodetree").addEventListener("click", function() {
		if(ready && !redlink) {
			jsMind.util.file.save(
				jsMind.util.json.json2string(map.get_data()),
				"text/plain", 
				topic + ".nodetree"
			);
		}
	});

	get("screenshot").addEventListener("click", function() {
		if(ready && !redlink) map.screenshot.shootDownload();
	});

	get("back").addEventListener("click", function() {
		if(ready) {
			current--;
			var entry = pages[current - 1];
			init(entry[0], entry[1], false);
		}
	});


	var inElement = get("in");
	var outElement = get("out");
	inElement.addEventListener("click", function() {
		if(ready) {
			if(map.view.zoomIn()) outElement.disabled = false;
			else inElement.disabled = true;
		}
	});

	outElement.addEventListener("click", function() {
		if(ready) {
			if(map.view.zoomOut()) inElement.disabled = false;
			else outElement.disabled = true;
		}
	});

	get("next").addEventListener("click", function() {
		if(ready) {
			var entry = pages[current];
			current++;
			init(entry[0], entry[1], false);
		}
	});

	get("checklabel").addEventListener("click", function() {
		if(!get("togglespeech").checked) synth.cancel();
	});

	var topicElement = get("topic");
	topicElement.addEventListener("input", function() {
		var container = get("autocomplete");
		var source = (altwikiElement.value == "") ? wikiElement.value : altwikiElement.value;

		if(source.split(".").length == 3) {
			if(acRequest != undefined && acRequest.readyState < 4) acRequest.abort();
			acRequest = new XMLHttpRequest();

			acRequest.addEventListener("load", function() {
				var response = JSON.parse(acRequest.response)[1];

				if(this.status == 200 && response != undefined && response.length > 0) {
					container.innerHTML = "";
					response.forEach(function(topic) {
						var article = document.createElement("span");
						article.textContent = topic;
						container.appendChild(article);

						article.addEventListener("click", function() {init(topic, source, true)});
					});
				} else container.innerHTML = "";
			});

			acRequest.open("GET", "https://" + source + "/w/api.php?" + 
				"action=opensearch&" + 
				"format=json&" + 
				"origin=*&" + 
				"search=" + topicElement.value + "&" + 
				"namespace=0&" + 
				"limit=10&" + 
			"suggest=true");

			acRequest.send();
		} else container.innerHTML = "";
	});

	topicElement.addEventListener("blur", function() {
		window.setTimeout(function() {
			get("autocomplete").innerHTML = "";
		}, 100);
	});	

	altwikiElement.addEventListener("focus", function() {
		altwikiElement.style.width = "214px";
		get("container").style.marginTop = "1px"; // Pixel perfection
		wikiElement.style.display = "none";
	});

	altwikiElement.addEventListener("blur", function() {
		if(altwikiElement.value == "") {
			altwikiElement.style.width = "30px";
			get("container").style.marginTop = "0px"; // Pixel perfection
			wikiElement.style.display = "initial";
		}
	});
}

function get(id) {
	return document.getElementById(id);
}