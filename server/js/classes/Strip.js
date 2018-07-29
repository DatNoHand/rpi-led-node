/**
 * Class for the LED strip
 * @author Gabriel Selinschek
**/

var brightness
var color
var on
var led_amount
var pixelData
var loop
var LStrip
var favorites

class Strip {

  constructor(_led_amount) {
    LStrip = require('rpi-ws281x-native')
    led_amount = _led_amount

    // Filled with default colors
    favorites = [
      'FF0000', 'FF6600', 'FFAA00', 'FFFF00', '00FF00', '00FC9E',
      '00FFF6', '0099FF', '0000FF', '9A00FF', 'FF00F7', 'FF0077'
    ]

    LStrip.init(led_amount)
    pixelData = new Uint32Array(led_amount)
  }

  Off() {
    clearInterval(loop)
    this.SetBrightness(0)
    on = false
  }

  // _color =
  SetColor(_color, _brightness = false, _amount = false) {
    clearInterval(loop)
    this.Clear()
    color = _color

    let __color = '0x' + _color
    _amount = parseInt((_amount == false) ? 1 : _amount)

    if (_brightness !== false)
      this.SetBrightness(_brightness)

    for (let i = 0; i < led_amount; i++) {
      pixelData[i] = __color
    }

    if (!favorites.includes(color))
      favorites.unshift(color)
    favorites = favorites.slice(0,15)

    LStrip.render(pixelData)
    on = true
  }

  Rainbow(_speed = 50, _brightness = false) {
    if (_brightness !== false)
      this.SetBrightness(_brightness)

    _speed = (_speed < 50) ? 50 : _speed

    loop = setInterval(() => {
      for (var i = 0; i < 256; i++) {
        for (var j = 0; j < led_amount; j++) {
          pixelData[j] = this.Wheel(parseInt(j*256 / led_amount + i) & 255)
        }
        LStrip.render(pixelData)
      }
    }, _speed)
  }

  Wheel(_pos) {
    if (_pos < 85) {
      return '0x'+(255-_pos*3).toString(16).padStart(2,0)+(_pos*3).toString(16).padStart(2,0)+'00'
    } else if (_pos < 170) {
      _pos -= 85
      return '0x'+'00'+(255-_pos*3).toString(16).padStart(2,0)+(_pos*3).toString(16).padStart(2,0)
    } else {
      _pos -= 170
      return '0x'+(_pos*3).toString(16).padStart(2,0)+'00'+(255-_pos*3).toString(16).padStart(2,0)
    }
  }

  // Zeroes out LEDs color data, but doesn't render it | Preparation for new pattern
  Clear() {
    for (var i = 0; i < led_amount; i++)  {
      pixelData[i] = '0x000000'
    }
  }

  SetBrightness(_brightness) {
    LStrip.setBrightness(parseInt(_brightness))
    brightness = parseInt(_brightness)
  }
}

module.exports = Strip;
