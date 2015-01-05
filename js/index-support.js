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
	};
	for (var k = 0; k < sourceRadios.length; ++k) {
		document.getElementById(sourceRadios[k] + "Radio").addEventListener("change", radioChange, false);
	}
	radioChange();
}, false);
