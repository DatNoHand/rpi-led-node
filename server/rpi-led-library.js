/**
 * @file A Library to interact with rpi-ws281x-native
 * @version 3.0.1
 *
 * @module server/rpi-led-library
 * @requires NPM:rpi-ws281x-native
 *
 * @author Gabriel Selinschek <gabriel@selinschek.com>
 */

var strip = require('rpi-ws281x-native');
var e = require('events');

/**
 * After require, this must me the first function called
 * @param		{Config} 						_config					Config object
 *
 * @prop		{Integer}						num_leds				Amount of LEDs
 * @prop		{Array.<Integer>}		walls						Stores boundaries for walls
 * @prop		{Array.<Led>}				led_data				Stores the LED data
 * @prop		{Array.<wall_data>}	wall_data				Stores wall_data for the webinterface
 * @prop		{String}						color						The last used color
 * @prop		{Array.<String>}		favorites				The last used 15 colors
 * @prop		{Integer}						brightness			The current brightness
 * @prop		{Integer}						max_brightness	The maximum brightness allowed
 * @prop		{Array.<Integer>}		pixel_data			The pixeldata to render
 *
 * @returns	{Boolean}														True if successful
 */

exports.init = (_config) => {
	exports.num_leds = _config.led.num
	exports.walls = _config.walls
	exports.led_data = []
	// wall_data is just a placeholder for the Webinterface
	// only led_data counts when calling render()
	exports.wall_data = []
	exports.color = ''
	exports.favorites = []
	exports.brightness = _config.led.brightness
	exports.max_brightness = _config.led.max_brightness
	exports.pixel_data = new Uint32Array(exports.num_leds)
	exports.on = false
	exports.event = new e.EventEmitter();

	// Generate new led objects
	for (let i = 0; i < exports.num_leds; i++) {
		exports.led_data.push(new Led())
	}

	// Initialize the wall data to 0
	for (let i = 0; i < exports.walls.length; i++) {
		exports.wall_data.push([ 0, '000000', 0 ])
	}

	strip.init(exports.num_leds)
	exports.setBrightness(_config.led.brightness, true)
}

/**
 * Sets the brightness of the strip, optional override of max_brightness
 * @param {Number}  _br               The brightness to set
 * @param {Boolean} [_override=false] If exports.max_brightness should be ignored
 */
exports.setBrightness = (_br, _override = false) => {
	_br = parseInt( _override ? _br : (_br > exports.max_brightness) ? exports.max_brightness : _br )
	strip.setBrightness(_br)
}

/**
 * Sets specific LED's data
 * @param {Integer}  _index					  The nth LED to modify
 * @param {string}  [_color='ff0000'] The color to set nth LED to
 * @param {Boolean} [_on=true] 				If the LED is turned on
 *
 * @returns {Led|Boolean} The modified LED object or false if failed
 */
exports.setLed = (_index, _color = 'ff0000', _on = true) => {
	// If we try to modify an LED that doesn't exist, return false
	if (_index > exports.num_leds) return false

	// If the color is longer than 6 chars, show red LED's for error
	if (_color.length !== 6) _color = 'ff0000'

	let led = exports.led_data[_index]

	// If the LED was turned on, set the color also
	// "saves" the previous color if turned off
	if (led.setState(_on)) led.setColor(_color)

	return _color
}

/**
 * Prepares to render the whole strip with one setting
 * @param		{String}  _color      The color string to use (RRGGBB)
 * @param		{Integer}  [_amount=1] The amount of LEDs to skip
 * @param 	{Boolean} [_on=true]  Turn the strip on or off
 * @returns	{String}					  	The color that the LEDs were set to
 */
exports.setAllLeds = (_color, _amount = 1, _on = true) => {
	if (_amount < 1) _amount = exports.wall_data[0][2]
	for (var i = 0; i < exports.num_leds; i+=(parseInt(_amount))) {
		exports.setLed(i, _color, _on)
	}
	// Set wall_data to send to the Webinterface
	// No actual use for this in terms of setting LEDs
	for (let i = 0; i < exports.walls.length; i++) { // 0-3
		if (!_color) {
			exports.wall_data[i] = [ false, exports.wall_data[i][1], _amount ]
		} else {
			exports.wall_data[i] = [ _on, _color, _amount ]
		}
	}
	return _color
}

/**
 * Turns off all LEDs but preserves color
 * @since 3.0.1
 */
exports.off = () => {
	exports.setAllLeds(0, 0, 0)
	exports.on = false
}

/**
 * Renders the current led_data
 * @returns {Boolean} True if successful
 */
exports.render = () => {
	for (let i = 0; i < exports.num_leds; i++) {
		if (!exports.led_data[i].on) {
			exports.pixel_data[i] = '0x000000'
		} else {
			exports.pixel_data[i] = '0x' + exports.led_data[i].color
		}
	}
	strip.render(exports.pixel_data);
	exports.event.emit('render');
	
	return true
}

/**
 * Prepares to render with provided data
 * @param {wall_data} _data The data to set the LEDs
 */
exports.setStripArray = (_data) => {
	// Foreach wall
	let index = 0
	for (let i = 0; i < _data.length && i < exports.walls.length; i++) { // 0-4
		for (index; index < exports.walls[i]; index++) {
			// If index % amount == 0 we set the color
			if (index % parseInt(_data[i][2]) == 0) {
				exports.setLed(index, _data[i][1], _data[i][0])
			} else { // else turn the led off ( looks weird if we don't )
				exports.setLed(index, 0, 0)
			}
		}
	}
	exports.wall_data = _data
	return exports.color = _data[0][1]
}

/**
 * LED Object which holds data
 * Must be converted to array before render
 * @memberof module:server/rpi-led-library
 *
 * @class Led
 * @constructor
 *
 * @since 3.0.1
 *
 * @param	{String} [_color = 'ff0000'] The color to initialize the LED to
 *
 * @prop {Boolean} on The status of the LED
 * @prop {String} color The color the LED is set to
 */
function Led(_color = 'ff0000') {
	this.on = false
	this.color = _color
	/**
	 * Toggles the LED
	 * @returns {Boolean} The new state of the LED
	 */
	this.toggle = () => {
		this.on = !this.on
		return this.on
	}
	/**
	 * Sets the state to arg1
	 * @param {Boolean} _on The boolean
	 * @returns {Boolean} The new state
	 */
	this.setState = (_on) => {
		this.on = _on
		return this.on
	}
	/** Sets the color of the LED
	 * @param		{?String} _color The color to set or NULL
	 * @returns	{String} 				The new color or if _color === null returns color
	 */
	this.setColor = (_color) => {
		if (_color.length !== 6 || _color === undefined) return _color
		exports.on = true;
		this.color = exports.color = _color
		return this.color
	}
}

function toHex(num) {
  return num.toString(16).padStart(2,0)
}

/**
 * Returns a color object, values must be 0-255
 * @memberof module:server/rpi-led-library
 *
 * @class Led
 * @constructor
 *
 * @since 3.1.0
 *
 * @param	{Integer} r	Red value
 * @param	{Integer}	g value
 * @param	{Integer} b	Blue value
 *
 * @prop	{Integer} r	Red value
 * @prop	{Integer}	g value
 * @prop	{Integer} b	Blue value
 */
function Color(r, g, b) {

  this.r = toHex(r);
  this.g = toHex(g);
  this.b = toHex(b);

	/**
	 * Returns the color as String
	 * @returns {String} Format: RRGGBB(hex)
	 */
  this.string = () => {
    return this.r + this.g + this.b;
  }
}
exports.Color = Color;

/**
 * @typedef	{Array}				wall_data
 * @prop		{Boolean}			on							If the LED is on
 * @prop		{String}			color						The color to set the LED to
 * @prop		{Integer}			amount					The amount of LEDs to skip
 */
/**
 * @memberof server/rpi-led-library
 * @name	num_leds
 * @type	{Integer}
 */
/**
 * @name	walls
 * @type	{Array.<Integer>}
 */
/**
 * @name	led_data
 * @type	{Array.<Led>}
 */
/**
 * @name	wall_data
 * @type	{Array.<wall_data>}
 */
/**
 * @name	color
 * @type	{String}
 */
/**
 * @name	favorites
 * @type	{Array.<String>}
 */
/**
 * @name	brightness
 * @type	{Integer}
 */
/**
 * @name	max_brightness
 * @type	{Integer}
 */
/**
 * @name	pixel_data
 * @type	{Array.<Integer>}
 */
