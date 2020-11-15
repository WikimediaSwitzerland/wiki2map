export function getRouting(base = false, topic = false) {
  let routing = {};
  if($("#controls").attr("data-target") == "true") {
    // Clean up custom URL: "https://www.en.wikipedia.org/whatever" becomes
    // "en.wikipedia.org"
    let base = $("#custom-url").val();
    routing.base = base.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
      .split("/")[0];
  } else {
    routing.base = $("#lang-dropdown-btn").attr("data-value") + "." +
      $("#wiki-dropdown-btn").attr("data-value");
    }

  routing.topic = $("#topic").val();

  // Override routing if set
  if(base !== false) {
    routing.base = base;
  }

  if(topic !== false) {
    routing.topic = topic;
  }

  return routing;
}

export function getTopicURL(routing) {
  return "https://" + routing.base + "/wiki/" + routing.topic;
}

export function getBaseURL(routing = false) {
  routing = (routing !== false) ? routing : getRouting();
  return "https://" + routing.base;
}

const AUTOCOMPLETE_PARAMS = {
  action: "opensearch",
  format: "json",
  origin: "*",
  search: "",
  namespace: "0",
  limit: "10",
  suggest: "true"
};

const TOPIC_PARAMS = {
  action: "query",
  redirects: true,
  prop: "revisions",
  rvprop: "content",
  maxlag: 5,
  format: "json",
  origin: "*",
  titles: ""
};

export function getAPIParams(routing = false) {
  let params;

  if(routing !== false) {
    params = TOPIC_PARAMS;
    params.titles = routing.topic;
  } else {
    params = AUTOCOMPLETE_PARAMS;
    params.search = $("#topic").val();
  }
  return params;
}

// Populate control lists on startup

export function populateList(element, data) {
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

/** @https://stackoverflow.com/users/3593896/webber
 * Flatten a multidimensional object
 *
 * For example:
 *   flattenObject({ a: 1, b: { c: 2 } })
 * Returns:
 *   { a: 1, c: 2}
 */
export const flattenJSON = (obj) => {
  const flattened = {};

  Object.keys(obj).forEach((key) => {
    if(typeof obj[key] === 'object' && obj[key] !== null)
      Object.assign(flattened, flattenJSON(obj[key]))
    else
      flattened[key] = obj[key]
  })

  return flattened;
}
