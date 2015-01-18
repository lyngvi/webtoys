/* Depends on complex.js */

/**
 * Expand a 'real' input signal into a complex one.
 * @param inp
 * @returns {Float32Array}
 */
function loadFloat32ArrayOfReals(/* Float32Array */ inp) {
	var output = new Float32Array(inp.length * 2);
	var arr = interpretFloat32ArrayAsComplexArray(output);
	for (var k = 0; k < inp.length; ++k)
		arr[k].assign(inp[k], 0.0);
	return output;
}

/**
 * Performs a 1D FFT on a real input signal
 * @param signal Signal to analyze
 */
function fft_re1d(signal) { return fft_1d(loadFloat32ArrayOfReals(signal)); }

/**
 * Performs a 1D FFT on a complex input signal
 * @param signal to analyze
 * @returns {Float32Array}
 */
function fft_1d(signal) {
	var input = interpretFloat32ArrayAsComplexArray(signal);
	var outputStorage = new Float32Array(signal.length);
	var output = interpretFloat32ArrayAsComplexArray(outputStorage);
	fft_1d_step(output, 0, input, 0, input.length, 1);
	return outputStorage;
}

/**
 * Knocked off of Wikipedia's Cooley-Tukey implementation
 * @param output     Output data (array of complex)
 * @param outputBase Location of output to write into
 * @param input      Input data (array of complex)
 * @param inputBase  Base location to load from
 * @param count      Number of elements in this step
 * @param stride     Stride for this step
 * @returns
 */
function fft_1d_step(output, outputBase, input, inputBase, count, stride) {
	if (count == 1) {
		output[outputBase].load(input[inputBase]);
		return;
	}
	var l = count / 2;
	fft_1d_step(output, outputBase + 0, input, inputBase         , l, stride * 2);
	fft_1d_step(output, outputBase + l, input, inputBase + stride, l, stride * 2);
	for (var k = 0; k < l; ++k) {
		var p = output[outputBase + k    ].copy()
		  , q = output[outputBase + k + l].copy();
		q.multiply(complex.from_mag_phase(1.0, -2.0 * Math.PI * k / count));
		output[outputBase + k    ].load(p);
		output[outputBase + k    ].add(q);
		output[outputBase + k + l].load(p);
		output[outputBase + k + l].subtract(q);
	}
}

/*
 * Output a Float32Array of magnitudes of the input data (assumed to be complex storage)
 */
function computeMagSquaredArray(data) {
	var inp = interpretFloat32ArrayAsComplexArray(data);
	var outp = new Float32Array(inp.length);
	for (var k = 0; k < inp.length; ++k)
		outp[k] = inp[k].mag_squared();
	return outp;
}

/**
 * Output a Float32Array of phases of the input data (assumed to be complex storage)
 * @param data
 */
function computePhaseArray(data) {
	var inp = interpretFloat32ArrayAsComplexArray(data);
	var outp = new Float32Array(inp.length);
	for (var k = 0; k < inp.length; ++k)
		outp[k] = inp[k].phase();
	return outp;
}