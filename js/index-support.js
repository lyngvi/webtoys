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
			fft_mags: document.getElementById('graph_fft_mags'),
			fft_phases: document.getElementById('graph_fft_phases'),
			toggleButton: document.getElementById('graph1enable'),
			newData: new Float32Array(1),
			created: false,
			timeout: null,
			phase: 0
	};
	graph1.toggleButton.addEventListener('click', function() {
		if (!graph1.created) {
			graph1.graph = Graph(graph1.root);
			graph1.graph.setData(new Float32Array(512));
			graph1.graph.setTitle("Graph Test")
			graph1.graph.setYLabel("Amplitude");
			graph1.graph.setXLabel("Sample");

			graph1.fft_graph_mags = Graph(graph1.fft_mags);
			graph1.fft_graph_mags.indexToHumanUnits = function(x) { return 2.0 * x / graph1.fft_graph_mags.data.length; };
			graph1.fft_graph_mags.xMax = 256;
			graph1.fft_graph_mags.setData(new Float32Array(512));
			graph1.fft_graph_mags.setTitle("Graph Signal FFT: Magnitude")
			graph1.fft_graph_mags.setYLabel("Magnitude");
			graph1.fft_graph_mags.setXLabel("Frequency (Ny)");

			if (graph1.fft_phases) {
				graph1.fft_graph_phases = Graph(graph1.fft_phases);
				graph1.fft_graph_phases.indexToHumanUnits = function(x) { return 2.0 * x / graph1.fft_graph_phases.data.length; };
				graph1.fft_graph_phases.xMax = 256;
				graph1.fft_graph_phases.setData(new Float32Array(512));
				graph1.fft_graph_phases.setTitle("Graph Signal FFT: Phase")
				graph1.fft_graph_phases.setYLabel("Phase");
				graph1.fft_graph_phases.setXLabel("Frequency (Ny)");
			}

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

				var fft = fft_re1d(graph1.graph.data);
				graph1.fft_graph_mags.appendData(computeMagSquaredArray(fft));
				graph1.fft_graph_mags.draw();
				if (graph1.fft_phases) {
					graph1.fft_graph_phases.appendData(computePhaseArray(fft));
					graph1.fft_graph_phases.draw();
				}
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

function f32toString(z) {
	if (z.length == 0)
		return "[ ]";
	var out = '[ ';
	for (var k = 0; k < z.length; ++k)
		out += z[k].toString() + ", ";
	return out.substring(0, out.length - 2) + " ]";
}

function setupMiscTests() {
	var colorPicker = document.getElementById('bgcolorator');
	var setColor = function() { document.body.style.backgroundColor = colorPicker.value; };
	colorPicker.addEventListener('change', setColor);
	colorPicker.addEventListener('input', setColor);

	var arr = new Float32Array(10);
	var subarr = arr.subarray(1, 3);
	subarr[0] = -9.0;
	subarr[1] = -12.0;
	arr[5] = -33.0;
	document.getElementById("subarrtest").innerText = "arr: " + f32toString(arr) + "; subarr: " + f32toString(subarr);
}

function setupClTests() {
	var clinf = document.getElementById("clinfo");
	if (clinf == null)
		return;

	if (!window.webcl) {
		clinf.innerText = "WebCL not available.";
		return;
	}

	var platforms = webcl.getPlatformIDs();
	var info = "";
	for (var k = 0; k < platforms.length; ++k) {
		info += platform.getInfo(webcl.PLATFORM_VENDOR) + " " + platform.getInfo(webcl.PLATFORM_NAME) + "\n"
			+ "   Version: " + platform.getInfo(webcl.PLATFORM_VERSION) + "\n"
			+ "   Profile: " + platform.getInfo(webcl.PLATFORM_PROFILE) + "\n"
			+ "   Extensions:\n" + platform.getInfo(webcl.PLATFORM_PROFILE) + "\n";
	}
	clinf.innerText = info;
}

function setupGlTests() {
	var glinf = document.getElementById("glinfo");
	if (glinf == null)
		return;
	if (!window.WebGLRenderingContext) {
		glinf.innerText = "WebGL not available.";
		return;
	}
	var o = {
		root: glinf,
		textDiv: document.createElement("div"),
		canvas: document.createElement("canvas"),
		context: null
	};
	o.root.appendChild(o.textDiv);
	o.textDiv.id = "gldebuginfo";
	o.root.appendChild(o.canvas);
	o.canvas.style.display = 'none';

	var names = [ 'webgl', 'experimental-webgl' ];
	for (var k = 0; k < names.length; ++k) {
		o.context = o.canvas.getContext(names[k]);
		if (o.context != null)
			break;
	}

	if (o.context == null) {
		o.textDiv.innerText = "WebGL available, but getContext('webgl') returns null.";
		return;
	}

	o.textDiv.appendChild(document.createTextNode("WebGL Available\n"
		+ "  Vendor:    " + o.context.getParameter(o.context.VENDOR) + "\n"
		+ "  Version:   " + o.context.getParameter(o.context.VERSION) + "\n"
		+ "  SLVersion: " + o.context.getParameter(o.context.SHADING_LANGUAGE_VERSION) + "\n"
		+ "  Renderer:  " + o.context.getParameter(o.context.RENDERER) + "\n"
		+ "  Extensions:\n    " + o.context.getSupportedExtensions().join("\n    ")));
	return o;
}

function setupComplexTests() {
	var el = document.getElementById("complextest");
	if (el == null)
		return;

	var a = complex.from_real_imag(2.0, -3.0), b = complex.from_real_imag(4.0, 5.0);
	el.innerText = '';
	el.innerText += "a: " + a.toString() + "\n" +
			"b: " + b.toString() + "\n";
	el.innerText += "a * b: " + a.copy().multiply(b).toString() + "\n";
	el.innerText += "a.mag_squared(): " + a.mag_squared().toString() + "\n";
	el.innerText += "a.conjugate(): " + a.conjugate().toString() + "\n";
	el.innerText += "a / b: " + a.copy().divide(b).toString() + "\n";
	el.innerText += "5 * a: " + a.copy().scale(5.0).toString() + "\n";
	el.innerText += "a.mag(), a.phase(): " + a.mag().toString() + ", " + a.phase().toString() + "\n";
	el.innerText += "a.re(), a.im(): " + a.re().toString() + ", " + a.im().toString() + "\n";
}

window.addEventListener("load", function() {
	document.getElementById("fileInputRadio").addEventListener("change", onRadioChange, false);
	// document.getElementById("genInputRadio").addEventListener("change", onRadioChange, false);

	onRadioChange();

	setupAudioScope();
	setupGraphTest();
	setupMiscTests();
	setupGlTests();
	setupClTests();
	setupComplexTests();
}, false);
