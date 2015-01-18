/* create a complex from a 2-point float32 array */
function complex(data) {
	if (data === undefined)
		data = new Float32Array(2);
	this.data = data;
}

/* create a complex from a real-imag pair */
complex.from_real_imag = function(a, b) {
	var data = new Float32Array(2);
	data[0] = a;
	data[1] = b;
	return new complex(data);
};

/* create a complex from a mag-phase pair */
complex.from_mag_phase = function(r, theta) {
	var data = new Float32Array(2);
	data[0] = r * Math.cos(theta);
	data[1] = r * Math.sin(theta);
	return new complex(data);
};

/* load a complex from an existing complex (ie, copy) */
complex.prototype.load = function(that) {
	this.data[0] = that.data[0];
	this.data[1] = that.data[1];
	return this;
};

/* assign a complex's value from a real-imag pair */
complex.prototype.assign = function(re, im) {
	this.data[0] = re;
	this.data[1] = im;
	return this;
};

complex.prototype.re        = function() { return this.data[0]; };
complex.prototype.im        = function() { return this.data[1]; };
complex.prototype.copy      = function() { return complex.from_real_imag(this.re(),  this.im()); };
complex.prototype.conjugate = function() { return complex.from_real_imag(this.re(), -this.im()); };

complex.prototype.mag_squared = function() {
	var re = this.re(), im = this.im();
	return re * re + im * im;
};

complex.prototype.mag = function() {
	return Math.sqrt(this.mag_squared());
};

complex.prototype.phase = function() {
	return Math.atan2(this.im(), this.re());
};

/** Raise this to a (real) power */
complex.prototype.pow_re = function(expon) {
	this.assign(Math.pow(this.mag_squared(), expon / 2.0), this.phase() * expon);
};

/* FIXME no 'raise to a complex power... have never used this and don't have paper to sketch it out */

complex.prototype.add = function(that) {
	this.data[0] += that.data[0];
	this.data[1] += that.data[1];
	return this;
};

complex.prototype.subtract = function(that) {
	this.data[0] -= that.data[0];
	this.data[1] -= that.data[1];
	return this;
};

complex.prototype.multiply = function(that) {
	var p = this.re() * that.re() - this.im() * that.im();
	var q = this.re() * that.im() + this.im() * that.re();
	this.data[0] = p;
	this.data[1] = q;
	return this;
};

complex.prototype.scale = function(scalar) {
	this.data[0] *= scalar;
	this.data[1] *= scalar;
	return this;
};

complex.prototype.toString = function() {
	return this.re().toString() + " + i*" + this.im().toString();
};

/* this == (a + ib)
 * that == (c + id)
 * this / that ==
 * (a + ib) / (c + id) == 
 * (a + ib) * (c - id) / ((c + id) * (c - id)) ==
 * (a + ib) * that.conjugate / that.mag_squared
 */ 
complex.prototype.divide = function(that) {
	this.multiply(that.conjugate());
	this.scale(1.0 / that.mag_squared());
	return this;
};

/**
 * Loads a Float32Array as an array of complex. Note that all values of outp reference
 * the original data in inp
 * @param inp original input data
 * @returns Array-ish of complexes
 */
function interpretFloat32ArrayAsComplexArray(/* Float32Array */ inp) {
	var outp = [];
	for (var k = 0; k < inp.length; k += 2)
		outp.push(new complex(inp.subarray(k, k + 2)));
	return outp;
}