function Graph(root) {
	var self = {
		root: root,
		canvas: document.createElement("canvas"),
		data: new Float32Array(10),
		xLabel: "Samples",
		yLabel: "Y",
		yMin: null,
		yMax: null,
		yLog: false,
		title: "Title",
		samples: 1000,

		/* internal: data is a ring buffer */
		head: 0,

		/* set the number of samples to render. we allocate a new buffer and implicitly clear */
		setDomain: function(samples) {
			self.data = new Float32Array(samples);
			self.head = 0;
		},

		/* expect something like a Float32Array */
		setData: function(data) {
			self.clearData();
			self.appendData(data);
		},

		/* append data from a TypedArray */
		appendData: function(data) {
			var inOffs = 0;
			while (inOffs < data.length) {
				var toWrite = min(data.length - inOffs, self.data.length - self.head);
				self.data.subarray(self.head, self.head + toWrite).set(data, inOffs);
				self.head = (self.head + toWrite) % self.data.length;
				inOffs += toWrite;
			}
		},

		/* clear data... this simply zeroes everything */
		clearData: function() {
			self.setDomain(self.data.length);
		},

		/* draw the data!
         * if yMin and yMax are null, infer them from the input data by auto-scaling them to the nearest power of 10.
         */

		resize: function(width, height) {
			self.canvas.width = width;
			self.canvas.height = height;
		},

		draw: function() {
			/* FIXME unimpl */
			var ctx = self.canvas.getContext("2d");
			ctx.fillStyle = "#ff0000";
			ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
			ctx.fillStyle = "#000000";
			ctx.fillRect(self.canvas.width / 4,
				self.canvas.height / 4,
				self.canvas.width / 2,
				self.canvas.height / 2);
		}
	};
	root.appendChild(self.canvas);
	self.resize(self.root.offsetWidth, self.root.offsetHeight);
	self.draw();
	return self;
}
