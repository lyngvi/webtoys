window.addEventListener("load", function() {
	/* various elements we frequently need */
	var audioEl = document.getElementById("audioEl");
	var playButton = document.getElementById("playButton");
	var fileEl = document.getElementById("fileInput");

	/** Input selection crap */
	var sourceRadios = [ "fileInput", "genInput" ];
	var radioChange = function() {
		for (var k = 0; k < sourceRadios.length; ++k) {
			var span = document.getElementById(sourceRadios[k] + "Span");
			var cb = document.getElementById(sourceRadios[k] + "Radio");
			if (cb.checked) {
				span.classList.remove("disabled");
			} else {
				span.classList.add("disabled");
			}
		}
	};
	for (var k = 0; k < sourceRadios.length; ++k) {
		document.getElementById(sourceRadios[k] + "Radio").addEventListener("change", radioChange, false);
	}

	var setAudioSource = function() {
		if (document.getElementById("fileInputRadio").checked) {
			if (fileEl.files.length == 0) {
				alert("Pick a file, dork.");
				return;
			}
			var fr = new FileReader();
			fr.addEventListener("load", function() { audioEl.src = fr.result; }, false);
			fr.readAsDataURL(fileEl.files[0]);
		} else if (document.getElementById("genInputRadio").checked) {
			alert("Not yet implemented.");
		}
	};

	fileEl.addEventListener("change", function() {
		if (fileEl.files.length == 0)
			return;
		document.getElementById("fileInputRadio").checked = true;
		if (audioEl.readyState != audioEl.HAVE_NOTHING) {
			audioEl.pause();
			audioEl.currentTime = 0;
		}
		radioChange();
		setAudioSource();
	}, false);

	playButton.addEventListener("click", function() {
		if (audioEl.readyState == audioEl.HAVE_NOTHING)
			return;
		if (audioEl.paused)
			audioEl.play();
		else {
			audioEl.pause();
			audioEl.currentTime = 0;
		}
	}, false);

	// change the button state when the audio state changes
	var buttonLabeler = function() {
		if (audioEl.paused)
			playButton.value = "Play";
		else
			playButton.value = "Stop";
	};
	audioEl.addEventListener("play", buttonLabeler, false);
	audioEl.addEventListener("pause", buttonLabeler, false);
	audioEl.addEventListener("ended", buttonLabeler, false);

	document.getElementById("updateAudioSource").addEventListener("click", setAudioSource, false);
	radioChange();

	/* Graph test stuff */
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

	var colorPicker = document.getElementById('bgcolorator');
	var setColor = function() { document.body.style.backgroundColor = colorPicker.value; };
	colorPicker.addEventListener('change', setColor);
	colorPicker.addEventListener('input', setColor);
}, false);
