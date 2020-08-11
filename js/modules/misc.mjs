export function getTopic() {
  return $("#topic").val();
}

function normalizeURL(url) {
  let ret = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  return ret;
}

export function getURL() {
  let url;

  if($("#controls").attr("data-target") == "true")
    url = $("#custom-url").val();
  else
    url = $("#lang-dropdown-btn").attr("data-value") + "." +
      $("#wiki-dropdown-btn").attr("data-value");

  return normalizeURL(url);
}

export function getTopicURL(wiki, topic) {
  return "https://" + wiki + "/wiki/" + topic;
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
