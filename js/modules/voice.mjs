var synth = window.speechSynthesis;

export function init() {
  let voicesList = $("#voices");
	voicesList.html = "";

	let voices = synth.getVoices();
	if(voices.length > 0) {
		voices.forEach(function(voice) {

			let option = $("<option></option>");
			option.text(voice.name + " (" + voice.lang + ")");
			voicesList.append(option);
		});

		$("#speech").show();
	}

  if(typeof synth !== "undefined" &&
    synth.onvoiceschanged !== undefined) synth.onvoiceschanged = init;
}

export function read(text) {
	let voice = $("#voices").selectedIndex;
	try {
		let speech = new SpeechSynthesisUtterance(text);
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
