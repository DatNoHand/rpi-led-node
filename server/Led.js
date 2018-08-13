var ledlib = {}
var strip = require('rpi-ws281x-native');


ledlib.init = (_config) => {
	ledlib.num_leds = _config.led.num
	ledlib.walls = _config.walls
	ledlib.led_data = []
	ledlib.wall_data = []
	ledlib.color = ''
	ledlib.favorites = []
	ledlib.max_brightness = _config.led.max_brightness
	ledlib.pixel_data = new Uint32Array(ledlib.num_leds)

	// Initialize the LED data to 0
	for (let i = 0; i < ledlib.num_leds; i++) {
		ledlib.led_data.push([ 0, '000000' ])
	}
	// Initialize the wall data to 0
	for (let i = 0; i < ledlib.walls.length; i++) {
		ledlib.wall_data.push([ 0, '000000', 0 ])
	}

	strip.init(ledlib.num_leds)
	ledlib.setBrightness(_config.led.brightness)
}

/**
 * Sets the brightness of the strip, optional override of max_brightness
 * @param {Number}  _br               - The brightness to set
 * @param {Boolean} [_override=false] - If ledlib.max_brightness should be ignored
 */
ledlib.setBrightness = (_br, _override = false) => {
	_br = parseInt(_br)
	limit = (_br > ledlib.max_brightness) ? ledlib.max_brightness : _br

	if (_override) {
		strip.setBrightness(_br)
		return _br
	} else {
		strip.setBrightness(limit)
		return limit
	}
}

/**
 * Sets specific LED's data
 * @param {Number}  _index     - The nth LED to modify
 * @param {string}  _color     - The color to set nth LED to
 * @param {Boolean} [_on=true] - If the LED is turned on
 */
ledlib.setLed = (_index, _color, _on = true) => {
	if (_index > ledlib.num_leds) return false
	// If the led is turned off, preserve the color
	if (!_on) _color = ledlib.led_data[_index][1]
	// If the color is longer than 6 chars, show red LED's for error
	if (_color.length !== 6) _color = 'ff0000'
	ledlib.led_data[_index] = [_on, _color]
	return ledlib.color = _color
}

/**
 * Prepares to render the whole strip with one setting
 * @param {String}  _color      - The color string to use (RRGGBB)
 * @param {Number}  [_amount=1] - The amount of LEDs to skip
 * @param {Boolean} [_on=true]  - Turn the strip on or off
 */
ledlib.setAllLeds = (_color, _amount = 1, _on = true) => {
	if (_amount < 1) _amount = 1
	for (var i = 0; i < ledlib.num_leds; i+=(parseInt(_amount))) {
		ledlib.setLed(i, _color, _on)
	}
	for (let i = 0; i < ledlib.walls.length; i++) {
		ledlib.wall_data[i] = [ true, _color, _amount ]
	}
	return ledlib.color = _color
}

ledlib.render = () => {
	for (let i = 0; i < ledlib.num_leds; i++) {
		if (ledlib.led_data[i][0] == false) {
			ledlib.pixel_data[i] = '0x000000'
		} else {
			ledlib.pixel_data[i] = '0x' + ledlib.led_data[i][1]
		}
	}
	strip.render(ledlib.pixel_data)
}

/**
 * Prepares to render with provided data
 * Format: [ bool on, string color, int amount_to_skip]
 * @param {Array}  _data - The data to set the LEDs
 */
ledlib.setStripAdvanced = (_data) => {
	// Clear data
	ledlib.setAllLeds(0, 0, 0)

	// Foreach wall
	// _data[i]: [ bool on, string color, int amount_to_skip]
	let index = 0
	for (let i = 0; i < _data.length && i < ledlib.walls.length; i++) { // 0-4
		for (index; index < ledlib.walls[i]; index+=parseInt(_data[i][2])) {
			let r = ledlib.setLed(index, _data[i][1], _data[i][0])
			if (r === false) break
		}
	}
	ledlib.wall_data = _data
	return ledlib.color = _data[0][1]
}


module.exports = ledlib
