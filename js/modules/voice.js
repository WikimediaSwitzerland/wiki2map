import {populateList} from "./misc.js";

var synth = window.speechSynthesis;

export function init() {
	let voices = synth.getVoices();
	if(voices.length > 0) {
    let list = [];

		voices.forEach(function(voice, i) {
      let string = voice.name + " (" + voice.lang + ")";
      list.push([string, i]);
		});

    populateList("tts-dropdown", list);
		$("#tts-nav").show();
	}

  if(typeof synth !== "undefined" &&
    synth.onvoiceschanged !== undefined) synth.onvoiceschanged = init;
}

export function read(text) {
  abort();

	let voice = $("#tts-dropdown-btn").attr("data-value");
  let speech;
	try {
		speech = new SpeechSynthesisUtterance(text);
	} catch(e) {
	  console.log("Text-to-speech synthesis not supported by this browser!");
		return;
	}

	speech.voice = synth.getVoices()[voice];
	synth.speak(speech);
}

export function abort() {
  synth.cancel();
}
