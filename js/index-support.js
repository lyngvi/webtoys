function getAudioFileSelection() {
	var fileEl = document.getElementById("fileInput");
	if (fileEl.files.length == 0)
		return null;
	return fileEl.files[0];
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
	var sourceRadios = [ "fileInput" ]; // , "genInput" ];
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

function audioScopeProcess(scopeData, /* AudioProcessingEvent */ ev) {
	for (var k = 0; k < ev.inputBuffer.numberOfChannels; ++k) // pass-through
		ev.outputBuffer.getChannelData(k).set(ev.inputBuffer.getChannelData(k));
	var ch0 = ev.inputBuffer.getChannelData(0);
	if (ch0.length == 0) {
		scopeData.kill();
		return;
	}
	var writeTail = scopeData.writeHead + ch0.length;
	scopeData.scope.data.subarray(scopeData.writeHead, writeTail).set(ch0);
	scopeData.scope.drawData(scopeData.writeHead, writeTail);
	scopeData.writeHead = writeTail;
}

function setupAudioScope() {
	var scopeData = {
		scope: null,
		analyzeButton: document.getElementById("analyzeButton"),
		scopeEl: document.getElementById("scopeGraph"),
		audio: null,
		audioSource: null,
		audioProcessor: null,
		writeHead: 0,
		kill: function() {
			if (scopeData.audioSource != null) {
				scopeData.audioProcessor.disconnect();
				scopeData.audioSource.disconnect();
				scopeData.audioSource.stop();
				scopeData.audioSource = null;
			}
		}
	}
	scopeData.analyzeButton.addEventListener("click", function() {
		if (scopeData.scope == null) {
			scopeData.scope = Graph(scopeData.scopeEl);
			scopeData.scope.setYLabel("Amplitude");
			scopeData.scope.setXLabel("Time (s)");
			scopeData.scope.setTitle("Scope");
			scopeData.scope.yMin = -1;
			scopeData.scope.yMax =  1;
		}

		if (scopeData.audio == null)
			scopeData.audio = new AudioContext();

		if (scopeData.audioSource == null) {
			loadSelectedAudioBuffer(scopeData.audio, function(/* AudioBuffer */ buffer) {
				scopeData.audioSource = scopeData.audio.createBufferSource();
				scopeData.audioSource.buffer = buffer;
				scopeData.scope.indexToHumanUnits = function(x) { return x / buffer.sampleRate; };
				scopeData.scope.setData(new Float32Array(buffer.length));
				scopeData.scope.drawFrame();
				scopeData.audioProcessor = scopeData.audio.createScriptProcessor(1024 /* sample count - should select based on buffer.sampleRate */
						, buffer.numberOfChannels, buffer.numberOfChannels);
				scopeData.writeHead = 0;
				scopeData.audioProcessor.addEventListener("audioprocess", function(/* AudioProcessingEvent */ ev) { audioScopeProcess(scopeData, ev); }, false);
				scopeData.audioSource.connect(scopeData.audioProcessor);
				scopeData.audioProcessor.connect(scopeData.audio.destination);
				scopeData.audioSource.start(0);
			});
		} else {
			scopeData.kill();
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
	document.getElementById("fileInputRadio").addEventListener("change", onRadioChange, false);
	// document.getElementById("genInputRadio").addEventListener("change", onRadioChange, false);

	onRadioChange();

	setupAudioScope();
	setupGraphTest();
	setupMiscTests();
}, false);
