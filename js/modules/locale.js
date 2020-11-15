export const current = {
  locale: undefined,
  content: undefined
};

const FALLBACK_LOCALE = "en";

export function init(locale, callback) {
  let url = "res/locale/" + locale + ".json";
  $.getJSON(url).done((res) => {
    current.content = res.data;
    current.locale = res.meta.locale;

    console.log("Locale <" + locale + "> loaded!");

    $("[localized]").each((i, target) => {
      target = $(target);
      let data = target.attr("localized");

      let key = data.split("|")[0];
      let fields = data.split("|")[1].split(",");
      fields.forEach((field) => {
        if(field == "html") {
          target.html(getTranslation(key));
        } else {
          target.attr(field, getTranslation(key));
        }
      });
    });

    callback();
    $("body").fadeIn(100);
  }).fail(() => {
    console.log("Failed to load locale <" + locale + ">, falling back to <" +
      FALLBACK_LOCALE + ">.");
    init(FALLBACK_LOCALE, callback);
  });
}

export function getTranslation(key) {
  return current.content[key];
}
