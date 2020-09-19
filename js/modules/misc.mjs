export function getTopic() {
  return $("#topic").val();
}

export function getWiki() {
  let splitted = getURL().split(".").slice(-2);
  return splitted.join(".");
}

export function getWikiName() {
  return getURL().split(".")[1];
}

export function getLang() {
  return getURL().split(".")[0];
}

export function getURL() {
  let url;

  if($("#controls").attr("data-target") == "true")
    url = $("#custom-url").val();
  else
    url = $("#lang-dropdown-btn").attr("data-value") + "." +
      $("#wiki-dropdown-btn").attr("data-value");

  url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];

  return url;
}

export function getTopicURL(wiki, topic, lang) {
  return "https://" + lang + "." + wiki + "/wiki/" + topic;
}

export function getWikiURL(wiki, lang) {
  return "https://" + lang + "." + wiki;
}

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
