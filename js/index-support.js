function getAudioElement() { return document.getElementById("audioEl"); }
function getAudioFileSelection() {
	var fileEl = document.getElementById("fileInput");
	if (fileEl.files.length == 0)
		return null;
	return fileEl.files[0];
}

function setAudioSource(audioEl) {
	if (document.getElementById("fileInputRadio").checked) {
		var file = getAudioFileSelection();
		if (file == null) {
			alert("Pick a file, dork.");
			return;
		}
		var fr = new FileReader();
		fr.addEventListener("load", function() { audioEl.setAttribute("src", fr.result); }, false);
		fr.readAsDataURL(file);
	} else if (document.getElementById("genInputRadio").checked) {
		alert("Not yet implemented.");
	}
}

function loadSelectedAudioBuffer(audio, onload) {
	if (document.getElementById("fileInputRadio").checked) {
		var fr = new FileReader();
		fr.addEventListener("load", function() {
			audio.decodeAudioData(fr.result, function(output) {
				onload(output);
			})
		});
		fr.readAsArrayBuffer(getAudioFileSelection());
	} else if (document.getElementById("genInputRadio").checked) {
		alert("Not yet implemented.");
	}
}

function onRadioChange() {
	var sourceRadios = [ "fileInput", "genInput" ];
	for (var k = 0; k < sourceRadios.length; ++k) {
		var span = document.getElementById(sourceRadios[k] + "Span");
		var cb = document.getElementById(sourceRadios[k] + "Radio");
		if (cb.checked) {
			span.classList.remove("disabled");
		} else {
			span.classList.add("disabled");
		}
	}
}

function onFileSelectionChange() {
	var audioEl = getAudioElement();
	var f = getAudioFileSelection();
	if (f == null)
		return;
	document.getElementById("fileInputRadio").checked = true;
	if (audioEl.readyState != audioEl.HAVE_NOTHING) {
		audioEl.pause();
		audioEl.currentTime = 0;
	}
	onRadioChange();
	setAudioSource(audioEl);
}

function onPlayButtonClick(audioEl) {
	if (audioEl.readyState == audioEl.HAVE_NOTHING)
		return;
	if (audioEl.paused)
		audioEl.play();
	else {
		audioEl.pause();
		audioEl.currentTime = 0;
	}
}

function buttonLabeler(audioEl, button) {
	if (audioEl.paused)
		button.value = "Play";
	else
		button.value = "Stop";
}

function setupGraphTest() {
	var graph1 = {
			root: document.getElementById('graph1'),
			toggleButton: document.getElementById('graph1enable'),
			newData: new Float32Array(1),
			created: false,
			timeout: null,
			phase: 0
	};
	graph1.toggleButton.addEventListener('click', function() {
		if (!graph1.created) {
			graph1.graph = Graph(graph1.root);
			graph1.graph.setData(new Float32Array(501));
			graph1.graph.setTitle("Graph Test")
			graph1.graph.setYLabel("Amplitude");
			graph1.graph.setXLabel("Sample");
			graph1.created = true;
		}
		if (graph1.timeout == null) {
			graph1.timeout = setInterval(function() {
				var t = (new Date()).getTime();
				var freqs = [ [ 4, 439.9], [2, 440.1] ];
				graph1.newData[0] = 0;
				for (var k = 0; k < freqs.length; ++k)
					graph1.newData[0] += freqs[k][0] * Math.sin(freqs[k][1] * graph1.phase);
				graph1.phase += 1;
				graph1.graph.appendData(graph1.newData);
				graph1.graph.draw();
			}, 20);
			graph1.toggleButton.setAttribute("value", "Stop the Graph");
		} else {
			clearInterval(graph1.timeout);
			graph1.timeout = null;
			graph1.toggleButton.setAttribute("value", "Start the Graph");
		}
	});
}

function setupAudioScope() {
	var scopeData = {
		scope: null,
		analyzeButton: document.getElementById("analyzeButton"),
		scopeEl: document.getElementById("scopeGraph")
	}
	scopeData.analyzeButton.addEventListener("click", function() {
		if (scopeData.scope == null) {
			scopeData.scope = Graph(scopeData.scopeEl);
			scopeData.scope.setYLabel("Amplitude");
			scopeData.scope.setXLabel("Time (s)");
			scopeData.scope.setTitle("Scope");
			scopeData.scope.yMin = -1;
			scopeData.scope.yMax =  1;
			var audioContext = new AudioContext();
			var writeHead = 0;
			loadSelectedAudioBuffer(audioContext, function(/* AudioBuffer */ buffer) {
				var src = audioContext.createBufferSource();
				src.buffer = buffer;
				scopeData.scope.indexToHumanUnits = function(x) { return x / buffer.sampleRate; };
				scopeData.scope.setData(new Float32Array(buffer.length));
				scopeData.scope.drawFrame();
				var filt = audioContext.createScriptProcessor(1024 /* sample count - should select based on buffer.sampleRate */
						, buffer.numberOfChannels, buffer.numberOfChannels);
				filt.addEventListener("audioprocess", function(/* AudioProcessingEvent */ ev) {
					for (var k = 0; k < ev.inputBuffer.numberOfChannels; ++k) // pass-through
						ev.outputBuffer.getChannelData(k).set(ev.inputBuffer.getChannelData(k));
					var ch0 = ev.inputBuffer.getChannelData(0);
					var writeTail = writeHead + ch0.length;
					scopeData.scope.data.subarray(writeHead, writeTail).set(ch0);
					scopeData.scope.drawData(writeHead, writeTail);
					writeHead = writeTail;
				}, false);
				src.connect(filt);
				filt.connect(audioContext.destination);
				src.start(0);
			});
		}
	}, false);
}

function setupMiscTests() {
	var colorPicker = document.getElementById('bgcolorator');
	var setColor = function() { document.body.style.backgroundColor = colorPicker.value; };
	colorPicker.addEventListener('change', setColor);
	colorPicker.addEventListener('input', setColor);
}

window.addEventListener("load", function() {
	/* various elements we frequently need */
	var audioEl = document.getElementById("audioEl");
	var playButton = document.getElementById("playButton");

	document.getElementById("fileInputRadio").addEventListener("change", onRadioChange, false);
	document.getElementById("genInputRadio").addEventListener("change", onRadioChange, false);
	document.getElementById("fileInput").addEventListener("change", onFileSelectionChange, false);
	playButton.addEventListener("click", function() { onPlayButtonClick(audioEl); }, false);

	// change the button state when the audio state changes
	audioEl.addEventListener("play", function() { buttonLabeler(audioEl, playButton); }, false);
	audioEl.addEventListener("pause", function() { buttonLabeler(audioEl, playButton); }, false);
	audioEl.addEventListener("ended", function() { buttonLabeler(audioEl, playButton); }, false);

	document.getElementById("updateAudioSource").addEventListener("click", function() { setAudioSource(audioEl); }, false);
	onRadioChange();

	setupAudioScope(audioEl);
	setupGraphTest();
	setupMiscTests();
}, false);
