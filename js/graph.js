function Graph(root) {
	var createAndLinkChild = function(parent, typ, className) {
		var el = document.createElement(typ);
		parent.appendChild(el);
		if (className != null && className != undefined)
			el.classList.add(className);
		return el;
	}

	var self = {
		root: root,
		data: new Float32Array(10),
		yMin: null,
		yMax: null,
		xMin: null,
		xMax: null,
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
			self.data = data;
		},

		/* append data from a TypedArray */
		appendData: function(data) {
			var inOffs = 0;
			while (inOffs < data.length) {
				var toWrite = Math.min(data.length - inOffs, self.data.length - self.head);
				self.data.subarray(self.head, self.head + toWrite).set(data.subarray(inOffs, inOffs + toWrite));
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

		xToScreen: function(x, extents) {
			return self.canvas.width * (x - extents.xMin) / (extents.xMax - extents.xMin);
		},

		yToScreen: function(y, extents) {
			if (self.yLog)
				y = Math.log(y);
			return self.canvas.height * (1.0 - (y - extents.yMin) / (extents.yMax - extents.yMin));
		},

		/**
		 * retrieve the extents based on either fixed settings or analyzing input data
		 */
		getExtents: function() {
			var yMin = self.yMin;
			var yMax = self.yMax;
			var xMin = self.xMin;
			var xMax = self.xMax;
			if (xMin == null)
				xMin = 0;
			if (xMax == null)
				xMax = self.data.length - 1;
			if (yMin == null || yMax == null) {
				var foundMin = Infinity;
				var foundMax = -Infinity;
				for (var k = 0; k < self.data.length; ++k) {
					if (self.data[k] < foundMin)
						foundMin = self.data[k];
					if (self.data[k] > foundMax)
						foundMax = self.data[k];
				}
				if (yMin == null)
					yMin = foundMin;
				if (yMax == null)
					yMax = foundMax;
			}

			// round to the nearest power of 10. yMin goes down, yMax goes up
			var surroundingPowersOf10 = function(val) {
				if (val < 0) {
					val = Math.log(-val) / Math.log(10);
					return [ -Math.pow(10, Math.ceil(val)), -Math.pow(10, Math.floor(val)) ];
				} else {
					val = Math.log( val) / Math.log(10);
					return [  Math.pow(10, Math.floor(val)),  Math.pow(10, Math.ceil(val)) ];
				}
			}

			yMin = surroundingPowersOf10(yMin)[0];
			yMax = surroundingPowersOf10(yMax)[1];

			// Make up some numbers if we're insane
			if (self.yLog) {
				if (yMin <= 0)
					yMin = 0.1;
				if (yMax <= yMin)
					yMax = 10.0;
				yMin = Math.log(yMin);
				yMax = Math.log(yMax);
			} else {
				// gotta graph something
				if (yMin <= yMax) {
					yMin -= 1;
					yMax += 1;
				}
			}
			return {
				xMin: xMin,
				xMax: xMax,
				yMin: yMin,
				yMax: yMax
			};
		},

		/**
		 * draw the axis labels
		 */
		drawAxisLabels: function(ctx, style, extents) {
			/* FIXME unimpl */
		},

		/**
		 * draw a grid around the main graph area
		 */
		drawGrid: function(ctx, style, extents) {
			var mainGraphArea = [ 0, 0
					, self.canvas.width
					, self.canvas.height ];
			var drawLine = function(ctx, x0, y0, x1, y1) {
				ctx.beginPath();
				ctx.moveTo(x0, y0);
				ctx.lineTo(x1, y1);
				ctx.stroke();
			}
			for (var k = 0; k <= 10; ++k) {
				var x = k * mainGraphArea[2] / 10.0;
				drawLine(ctx, x, 0, x, self.canvas.height);
			}
			if (self.yLog) {
				for (var base = extents.yMin; base <= extents.yMax; base *= 10) {
					for (var j = 1; j <= 10 && j * base <= extents.yMax; ++j) {
						var y = self.yToScreen(base * j, extents);
						drawLine(ctx, 0, mainGraphArea[3] - y, self.canvas.width, mainGraphArea[3] - y);
					}
				}
			} else {
				for (var k = 0; k <= 10; ++k) {
					var y = k * mainGraphArea[3] / 10.0;
					drawLine(ctx, 0, y, self.canvas.width, y);
				}
			}
		},

		drawData: function(ctx, style, extents) {
			var mainGraphArea = [ 0, 0
			  					, self.canvas.width
			  					, self.canvas.height ];
			if (self.data.length == 0)
				return;

			ctx.strokeStyle = "#00FF00";
			ctx.beginPath();
			ctx.moveTo(self.xToScreen(0, extents), self.yToScreen(self.data[self.head], extents));
			for (var k = 1; k < self.data.length; ++k)
				ctx.lineTo(self.xToScreen(k, extents), self.yToScreen(self.data[ (self.head + k) % self.data.length], extents));
			ctx.stroke();
		},

		setXLabel: function(txt) {
			self.xLabelElement.innerHTML = txt;
		},

		setYLabel: function(txt) {
			self.yLabelElement.innerHTML = txt;
		},

		setTitle: function(txt) {
			self.titleElement.innerHTML = txt;
		},

		draw: function() {
			/* FIXME unimpl */
			var ctx = self.canvas.getContext("2d");
			var style = window.getComputedStyle(self.canvas, null);
			var extents = self.getExtents();

			ctx.fillStyle = style.backgroundColor;
			ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);

			ctx.fillStyle = style.color;
			ctx.strokeStyle = style.color;
			self.drawAxisLabels(ctx, style, extents);
			self.drawGrid(ctx, style, extents);
			self.drawData(ctx, style, extents);
		},

		constructHtml: function() {
			var table = createAndLinkChild(self.root, 'table');
			var tbody = createAndLinkChild(table, 'tbody');
			var div = null;

			// title row
			var tr = createAndLinkChild(tbody, 'tr');
			var td = createAndLinkChild(tr, 'td');
			td.colspan = 2;
			self.titleElement = createAndLinkChild(td, 'div', 'graph-title');

			// main body row
			//   graph
			tr = createAndLinkChild(tbody, 'tr');
			td = createAndLinkChild(tr, 'td');
			self.graphContainer = createAndLinkChild(td, 'div', 'graph-container');
			self.canvas = createAndLinkChild(self.graphContainer, 'canvas');
			//   y axis label
			td = createAndLinkChild(tr, 'td');
			div = createAndLinkChild(td, 'div', 'graph-y-axis-label-wrapper');
			self.yLabelElement= createAndLinkChild(div, 'div', 'graph-y-axis-label');

			// x axis label
			tr = createAndLinkChild(tbody, 'tr');
			td = createAndLinkChild(tr, 'td');
			self.xLabelElement = createAndLinkChild(td, 'div', 'graph-x-axis-label');
			//  and dead-zone
			td = createAndLinkChild(tr, 'td');
			div = createAndLinkChild(td, 'div', 'graph-label-deadzone');

			self.root.classList.add('graph');
		}
	};

	self.constructHtml();
	self.setTitle("Untitled");
	self.setXLabel("Units (x)");
	self.setYLabel("Units (y)");
	self.resize(self.graphContainer.offsetWidth, self.graphContainer.offsetHeight);
	self.draw();
	return self;
}
