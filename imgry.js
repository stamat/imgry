/* imgry v1.0.0 | Nikola Stamatovic <@stamat> | MIT */
/*
	TODO: SVG Support
	TODO: VIDEO Support
	TODO: object-fit polyfill
	TODO: Custom Intersection callback
	TODO: jQuery.youtube-background support
*/


// MDN
// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
// https://tc39.github.io/ecma262/#sec-array.prototype.reduce
if (!Array.prototype.reduce) {
	Object.defineProperty(Array.prototype, 'reduce', {
		value: function(callback /*, initialValue*/) {
			if (this === null) {
				throw new TypeError( 'Array.prototype.reduce ' +
					'called on null or undefined' );
			}
			if (typeof callback !== 'function') {
				throw new TypeError( callback +
					' is not a function');
			}

			// 1. Let O be ? ToObject(this value).
			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// Steps 3, 4, 5, 6, 7
			var k = 0;
			var value;

			if (arguments.length >= 2) {
				value = arguments[1];
			} else {
				while (k < len && !(k in o)) {
					k++;
				}

				// 3. If len is 0 and initialValue is not present,
				//		throw a TypeError exception.
				if (k >= len) {
					throw new TypeError( 'Reduce of empty array ' +
						'with no initial value' );
				}
				value = o[k++];
			}

			// 8. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kPresent be ? HasProperty(O, Pk).
				// c. If kPresent is true, then
				//		i.	Let kValue be ? Get(O, Pk).
				//		ii. Let accumulator be ? Call(
				//					callbackfn, undefined,
				//					« accumulator, kValue, k, O »).
				if (k in o) {
					value = callback(value, o[k], k, o);
				}

				// d. Increase k by 1.
				k++;
			}

			// 9. Return accumulator.
			return value;
		}
	});
}


window.imgry = {};

imgry.load = function(src, callback) {
	var img = new Image();
	if (callback) {
		img.addEventListener('load', callback, false);
	}
	img.src = src;
};

imgry.closest = function(arr, goal) {
	return arr.reduce(function(prev, curr) {
		return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
	});
};

imgry.ajax = function(url, method, success, fail) {
	method = !method ? 'GET' : method;

	var xhr = new XMLHttpRequest();
	xhr.onload = function () {
		if (xhr.status >= 200 && xhr.status < 300) {
			if (typeof success !== 'undefined') {
				success(xhr);
			}
		} else {
			if (typeof fail !== 'undefined') {
				fail(xhr);
			}
		}
	};

	xhr.open(method, url);
	xhr.send();
};

imgry.inlineSVG = function(selector) {
	selector = !selector ? 'img' : selector;

	var elements = document.querySelectorAll(selector+':not(.not-inline)');
	console.log(elements);

	for (var i = 0; i < elements.length; i++) {
		var elem = elements[i];

		if (elem.src.match(/.*\.svg$/gi)) {
			var id = elem.id;
			var cls = elem.className;
			var src = elem.src;

			console.log(src);
		}

		if (elem.src.match(/.*\.svg$/gi)) {
			var id = elem.id;
			var cls = elem.className;
			var src = elem.src;

			(function(elem) {
				imgry.ajax(src, 'GET', function(xhr) {
					var parser = new DOMParser();
					var xmlDoc = null;
					try {
						xmlDoc = parser.parseFromString(xhr.response, 'text/xml');
					} catch (e) {
						console.error('Not XML:', elem.src);
						return;
					}

					var svgs = xmlDoc.getElementsByTagName('svg');
					console.log(svgs, elem);

					for (var i = 0; i < svgs.length; i++) {
						var svg = svgs[i];

						svg.removeAttribute('xmlns:a');
						svg.className = svg.className + ' inline-svg';
						elem.parentNode.replaceChild(svg, elem);
					}
				});
			})(elem); //cause forloop + async
		}
	}
};

imgry.parseSrcset = function(srcset) {
	var type = null;
	var map = {};
	var sizes = [];
	var lines = srcset.split(',');

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		line = line.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); //trim
		var pts = line.split(/[\s\uFEFF\xA0]+/g);

		if (pts.length > 1) {
			if (pts[1].match(/^[0-9\.]+x$/gi)) {
				type = "ratio"
				pts[1] = parseFloat(pts[1].replace(/x$/gi, ''));
			} else {
				type = "size"
				pts[1] = parseInt(pts[1].replace(/px|vw|w$/gi, ''), 10);
			}

			if (!isNaN(pts[1])) {
				sizes.push(pts[1]);
				map[pts[1]] = pts[0];
			}
		}
	}

	return {
		type: type,
		srcset: map,
		sizes: sizes
	}
};

imgry.emptyImageBase64 = function(w, h) {
	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;

	return canvas.toDataURL();
};

imgry.proportionalDimensions = function(w, h, max_w, max_h) {
	if (w > h) {
		h = h * max_w / w;
		w = max_w;
	} else {
		w = w * max_h / h;
		h = max_h;
	}

	return [w, h];
};

imgry.LazySpacers = function(selector, max_w, max_h) {
	this.selector = selector ? selector : '.lazy-spacer';
	this.max_w = max_w ? max_w : 100;
	this.max_h = max_h ? max_h : 100;

	this._map = {};
	this._prop_map = {};
	this.__storage = [];

	this.init(this.selector, this.max_w, this.max_h);
};

imgry.LazySpacers.prototype.init = function(selector, max_w, max_h) {
	var elements = document.querySelectorAll(selector+':not(.initialized)');

	if (elements && elements.length) {
		for (var i = 0; i < elements.length; i++) {
			var elem = elements[i];

			var dimensions = this.getDimensions(elem);

			if (dimensions) {
				var key = dimensions.join('x');

				if (!this._map.hasOwnProperty(key)) {
					var proportional_dimensions = imgry.proportionalDimensions(dimensions[0], dimensions[1], 100, 100);
					var prop_key = proportional_dimensions.join('x');

					if (!this._prop_map.hasOwnProperty(prop_key)) {
						this.__storage.push(imgry.emptyImageBase64(proportional_dimensions[0], proportional_dimensions[1]));
						this._prop_map[prop_key] = this.__storage.length - 1;
					}
					this._map[key] = this._prop_map[prop_key];
					this._map[prop_key] = this._prop_map[prop_key];
				}

				var image = document.createElement('img');
				image.src = this.__storage[this._map[key]];
				image.alt = elem.getAttribute('data-alt');
				image.className = elem.className + ' initialized';
				elem.parentNode.replaceChild(image, elem);
			}
		}
	}

	return elements;
};

imgry.LazySpacers.prototype.getDimensions = function(elem) {
	var w = elem.getAttribute('data-width');
	var h = elem.getAttribute('data-height');

	if (w && typeof w === 'string') {
		w = parseInt(w, 10);
	}

	if (h && typeof h === 'string') {
		h = parseInt(h, 10);
	}

	if (!w || isNaN(w)) {
		console.warn('data-width invalid or not present:', elem);
		return;
	}

	if (!h || isNaN(h)) {
		console.warn('data-height invalid or not present:', elem);
		return;
	}

	return [w, h];
};

imgry.LazyLoad = function(selector, callback) {
	this.selector = selector ? selector : '.lazy-load';
	this.px_ratio = window.hasOwnProperty('devicePixelRatio') ? window.devicePixelRatio : 1;
	this.callback = callback;

	return this.init(this.selector);
};

imgry.LazyLoad.prototype.loadImage = function(elem) {
	var src = elem.getAttribute('data-src');
	var srcset = elem.getAttribute('data-srcset');

	if (srcset) {
		var data = imgry.parseSrcset(srcset);
		var selected = this.closest(data.sizes, data.type);
		src = data.srcset[selected];
	}

	if (src && src.length) {
		var self = this;

		imgry.load(src, function() {
			var bg = elem.getAttribute('data-background');
			if (bg && (bg === '' || bg === 'true')) {
				elem.style.backgroundImage = 'url('+src+')';
			} else {
				elem.src = src;
			}

			if (self.hasOwnProperty('callback') && typeof self.callback !== 'undefined') {
				self.callback(elem);
			}

			elem.className = elem.className +' loaded';
		});
	}
};

imgry.LazyLoad.prototype.loadAll = function(elements) {
	if (elements && elements.length) {
		for (var i = 0; i < elements.length; i++) {
			this.loadImage(elements[i]);
		}
	}
};

imgry.LazyLoad.prototype.observe = function(entries, observer) {
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];

		if (entry.isIntersecting) {
			var elem = entry.target;
			this.loadImage(elem);
			this.observer.unobserve(elem);
		}
	}
};

imgry.LazyLoad.prototype.init = function(selector) {
	var elements = document.querySelectorAll(selector);

	if (elements && elements.length) {
		if (window.hasOwnProperty('IntersectionObserver')) {
			if (!this.hasOwnProperty('observer')) {
				var self = this;
				this.observer = new IntersectionObserver(function(entries, observer) {
					self.observe(entries, observer);
				});
			}

			if (elements && elements.length) {
				for (var i = 0; i < elements.length; i++) {
					this.observer.observe(elements[i]);
				}
			}
		} else {
			this.loadAll(elements);
		}
	}
};

//TODO: imgry.LazyLoad.prototype.parseSizes

imgry.LazyLoad.prototype.closest = function(sizes, type) {
	var goal = window.innerWidth * this.px_ratio;

	if (type === 'ratio') {
		goal = this.px_ratio;
	}

	return imgry.closest(sizes, goal);
};
