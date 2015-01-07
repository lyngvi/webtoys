window.addEventListener("load", function() {
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
		// FIXME action it.
	};
	for (var k = 0; k < sourceRadios.length; ++k) {
		document.getElementById(sourceRadios[k] + "Radio").addEventListener("change", radioChange, false);
	}
	radioChange();

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
			graph1.graph.setTitle("Graph Test: Beat Frequency")
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
}, false);
