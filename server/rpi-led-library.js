/**
 * @file A Library to interact with rpi-ws281x-native
 * @version 1.5
 *
 * @module rpi-led-library
 * @requires NPM:rpi-ws281x-native
 *
 * @author Gabriel Selinschek (Da1N0Hand)
 */

var strip = require('rpi-ws281x-native');

exports.init = (_config) => {
	/** @type {Number} */
	exports.num_leds = _config.led.num
	/** @type {Array} */
	exports.walls = _config.walls
	/** @type {Led[]} */
	exports.led_data = []
	// wall_data is just a placeholder for the Webinterface
	// only led_data counts when calling render()
	/** @type {wall_data} */
	exports.wall_data = []
	/** @type {String} */
	exports.color = ''
	/** @type {String[]} */
	exports.favorites = []
	/** @type {Integer} */
	exports.brightness = _config.led.brightness
	/** @type {Integer} */
	exports.max_brightness = _config.led.max_brightness
	// TODO: jsdoc
	exports.pixel_data = new Uint32Array(exports.num_leds)

	// Generate new led objects
	for (let i = 0; i < exports.num_leds; i++) {
		exports.led_data.push([ 0, '000000' ])
	}
	// Initialize the wall data to 0
	for (let i = 0; i < exports.walls.length; i++) {
		exports.wall_data.push([ 0, '000000', 0 ])
	}

	strip.init(exports.num_leds)
	exports.setBrightness(_config.led.brightness)
}

/**
 * Sets the brightness of the strip, optional override of max_brightness
 * @param {Number}  _br               The brightness to set
 * @param {Boolean} [_override=false] If exports.max_brightness should be ignored
 */
exports.setBrightness = (_br, _override = false) => {
	_br = parseInt( _override ? _br : (_br > exports.max_brightness) ? exports.max_brightness : _br )
	console.log(_br)
	strip.setBrightness(_br)
}

/**
 * Sets specific LED's data
 * @param {Number}  _index					  The nth LED to modify
 * @param {string}  [_color='ff0000'] The color to set nth LED to
 * @param {Boolean} [_on=true] 				If the LED is turned on
 */
exports.setLed = (_index, _color = 'ff0000', _on = true) => {
	if (_index > exports.num_leds) return false
	// If the led is turned off, preserve the color
	if (!_on) _color = exports.led_data[_index][1]
	// If the color is longer than 6 chars, show red LED's for error
	if (_color.length !== 6) _color = 'ff0000'
	exports.led_data[_index] = [_on, _color]
	return exports.color = _color
}

/**
 * Prepares to render the whole strip with one setting
 * @param {String}  _color      The color string to use (RRGGBB)
 * @param {Number}  [_amount=1] The amount of LEDs to skip
 * @param {Boolean} [_on=true]  Turn the strip on or off
 * @returns {String}					  The color that the LEDs were set to
 */
exports.setAllLeds = (_color, _amount = 1, _on = true) => {
	if (_amount < 1) _amount = 1
	for (var i = 0; i < exports.num_leds; i+=(parseInt(_amount))) {
		exports.setLed(i, _color, _on)
	}
	for (let i = 0; i < exports.walls.length; i++) {
		exports.wall_data[i] = [ _on, _color, _amount ]
	}
	return exports.color = _color
}

/**
 * Renders the current exports.led_data
 * @returns {Boolean} Returns true if it was successful
 */
exports.render = () => {
	for (let i = 0; i < exports.num_leds; i++) {
		if (exports.led_data[i][0] == false) {
			exports.pixel_data[i] = '0x000000'
		} else {
			exports.pixel_data[i] = '0x' + exports.led_data[i][1]
		}
	}
	strip.render(exports.pixel_data)
	return true
}

/**
 * Prepares to render with provided data
 * Format: [ bool on, string color, int amount_to_skip]
 * @param {Array}  _data The data to set the LEDs
 */
exports.setStripArray = (_data) => {
	// Clear data
	exports.setAllLeds(0, 0, 0)

	// Foreach wall
	// _data[i]: [ bool on, string color, int amount_to_skip]
	let index = 0
	for (let i = 0; i < _data.length && i < exports.walls.length; i++) { // 0-4
		for (index; index < exports.walls[i]; index+=parseInt(_data[i][2])) {
			let r = exports.setLed(index, _data[i][1], _data[i][0])
			if (r === false) break
		}
	}
	exports.wall_data = _data
	return exports.color = _data[0][1]
}

/**
 * LED Object which holds data
 * Must be converted to array before render
 * @class
 * @constructor
 *
 * @since 3.0.1
 *
 * @param    {String} [_color = 'ff0000'] The color to initialize the LED to
 *
 * @property {Integer} id The ID of the LED
 * @property {Boolean} on The status of the LED
 * @property {String} color The color the LED is set to
 */
function Led(_color = 'ff0000') {
	this.id = Led.count++
	this.on = false
	this.color = _color
	/**
	 * Toggles the LED
	 * @return {Boolean} The new status of the LED
	 */
	this.toggle = () => {
		this.on = !this.on
		return this.on
	}
	/** Turns the lED off */
	this.off = () => {
		this.on = false
	}
	/** Turns the LED on */
	this.on = () => {
		this.on = true
	}
	/** Sets the color of the LED */
	this.setColor = (_color) => {
		if (_color.length !== 6) return false
		this.color = _color
	}
}
/** @type {Integer} */
Led.count = 0

/**
 * @typedef {Array} wall_data
 * @property {Boolean} on 	  If the LED is on
 * @property {String} color   The color to set the LED to
 * @property {Integer} amount The amount of LEDs to skip
 */
