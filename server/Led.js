var ledlib = {}
var strip = require('rpi-ws281x-native');


ledlib.init = (_num, _walls, _maxBr, _brightness) => {
	ledlib.num_leds = _num
	ledlib.walls = _walls
	ledlib.led_data = []
	ledlib.wall_data = []
	ledlib.color = ''
	ledlib.favorites = []
	ledlib.max_brightness = _maxBr

	// Initialize the LED data to 0
	for (let i = 0; i < ledlib.num_leds; i++) {
		ledlib.led_data.push([ 0, '000000'])
	}
	// Initialize the wall data to 0
	for (let i = 0; i < ledlib.walls.length; i++) {
		ledlib.wall_data.push([ 0, '000000', 0])
	}

	strip.init(ledlib.num_leds)
	ledlib.setBrightness(_brightness)
}

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

ledlib.setLed = (_index, _color, _on = true) => {
	// If the led is turned off, preserve the color
	if (!_on) _color = ledlib.led_data[_index][1]
	// If the color is longer than 6 chars, show red LED's for error
	if (_color.length !== 6) _color = 'ff0000'
	ledlib.led_data[_index] = [_on, _color]
}

ledlib.setWholeStrip = (_color, _amount = 1, _on = true) => {
	if (_amount < 1) _amount = 1
	for (var i = 0; i < ledlib.num_leds; i+=(parseInt(_amount))) {
		ledlib.setLed(i, _color, _on)
	}
	return _color
}

ledlib.setStrip = (_walls, _color, _amount = 1, _on = true) => {
  // If the Strip is turned off
  if (!_on) {
    ledlib.setWholeStrip(0, 0, false)
    on = false
    return true
  }

	let led = 0
	let led2 = 0

	// Foreach wall
	for (let i = 0; i < ledlib.walls.length; i++) {
		// Foreach LED / Wall
		// Blackout w/o render
		ledlib.setWholeStrip(0, 0, 0)
		let amount = (_walls[i].amount < 1) ? 1 : _walls[i][2]
	}
}


module.exports = ledlib
