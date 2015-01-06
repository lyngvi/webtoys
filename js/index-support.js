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
	var graph = Graph(document.getElementById("graph1"));
	graph.setData(new Float32Array(256));
	graph.draw();
	var phase = 0;
	var newData = new Float32Array(1);
	setInterval(function() {
		var t = (new Date()).getTime();
		var freqs = [ [ 4, 439.9], [2, 440.1] ];
		newData[0] = 0;
		for (var k = 0; k < freqs.length; ++k)
			newData[0] += freqs[k][0] * Math.sin(freqs[k][1] * phase);
		phase += 1;
		graph.appendData(newData);
		graph.draw();
	}, 20);
}, false);
