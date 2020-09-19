import {generate} from "./map.mjs";
import {getURL} from "./misc.mjs";

export const content = {
  pages: [],
  index: 0
};

export function push(topic, wiki, lang) {
  let oldLength = content.pages.length;

  content.pages.splice(content.index + 1,
    oldLength,
    [topic, wiki, lang]);

  let newLength = content.pages.length;
  content.index = newLength - 1;

  $("#forward-button").prop("disabled", true);
  if(newLength > 1)
    $("#back-button").prop("disabled", false);
}

export function back(n = 1) {
  content.index -= n;
  update(content.pages[content.index]);
}

export function forward(n = 1) {
  content.index += n;
  update(content.pages[content.index]);
}

function update(entry) {
  $("#custom-url-button").click();
  $("#custom-url").val(entry[2] + "." + entry[1]);
  generate(entry[1], entry[0], entry[2], false);
}
