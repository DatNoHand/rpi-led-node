/**
* LED Controller wit ws + express
* @author Gabriel Selinschek
**/

// Config Vars
var config = require('./config/config.js')

// Websocket
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

// Other Modules
var fs = require('fs');
var strip = require('rpi-ws281x-native');

// HTTPS Server for WSS
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded());
app.use(express.static(__dirname + '/public'));

var port = config.port;
var NUM_LEDS = parseInt(config.led.num)
var pixelData = new Uint32Array(NUM_LEDS)

var httpServer = http.createServer(app);
httpServer.listen(config.port);

var wss = new WebSocketServer({ server: httpServer });

// Global Vars
var loop
var on = false
var strip_walls = config.walls
/**
 * @typedef {Array} wall_data
 * @type {boolean, string} */
var strip_led_data = []
/** @type {boolean, string, int} */
var strip_wall_data = []
var color
var favorites = [
  'FF0000', 'FF6600', 'FFAA00', 'FFFF00', '00FF00', '00FC9E',
  '00FFF6', '0099FF', '0000FF', '9A00FF', 'FF00F7', 'FF0077'
]

// Initialize the LED data to 0
for (let i = 0; i < NUM_LEDS; i++) {
  strip_led_data.push([ 0, '000000'])
}
// Initialize the wall data to 0
for (let i = 0; i < strip_walls.length; i++) {
  strip_wall_data.push([ 0, '000000', 0])
}

console.log('Listening on '+port);

strip.init(NUM_LEDS)
strip.setBrightness(config.led.brightness)

// Turn all walls on
// On ready, show (green) lights
SetStrip(0, config.led.ready_color, 5)
RenderLedData()

on = true

// Removed: API

// If the server gets a connection
wss.on('connection', function(ws, req) {

  SendToEveryone({type: 'status', on: on, max: config.led.max_brightness, favorites: favorites, color: color, wall_data: strip_wall_data })

  ws.on('message', (msg) => {
    try {
      var msg = JSON.parse(msg);
    } catch(e){
      ws.send('{"type": "err", "msg": "ERR_SYNTAX"}');
      ws.terminate();
    }

    if (!msg.type) {
      ws.send('{"type": "err", "msg": "ERR_SYNTAX"}');
      ws.terminate();
    }

    switch (msg.type) {
      case 'off':
        SetStrip(0, 0, 0, false)
        RenderLedData()
      break;
      case 'led':
        SetBrightness(msg.bright)
        SetStrip(msg.wall_data)
        RenderLedData()
      break;
      case 'special':
        clearInterval(loop)
        SetBrightness(msg.bright)
        ledSpecial(msg.bright, msg.mode, msg.arg)
      break;
      case 'brightness':
        SetBrightness(msg.bright)
      break;
    }
    SendToEveryone({type: 'status', on: on, max: config.led.max_brightness, favorites: favorites, color: color, wall_data: strip_wall_data })
  });
});

/** Functions
* Unsorted (as of now)
* Maybe move to a different file later
* Maybe use classes later-later
**/

/**
 * Sets the brightness of the Strip
 * @param {int|string} _brightness - The Brightness to set which can be an int or
 * string which contains numbers
 */
function SetBrightness(_brightness = config.led.brightness) {
  if (_brightness > config.led.max_brightness) _brightness = config.led.max_brightness
  strip.setBrightness(parseInt(_brightness))
}

/** Renders whatever is in strip_led_data */
function RenderLedData() {
  for (var i = 0; i < NUM_LEDS; i++) {
    if (strip_led_data[i][0] == 0) {
      pixelData[i] = '0x000000'
    } else {
      pixelData[i] = '0x' + strip_led_data[i][1]
    }
  }
  strip.render(pixelData)
}

/**
 * Sets strip_led_data for the given LED
 * @param {int} _led - The LED index
 * @param {boolean} [_on = true] - If the LED is on
 * @param {string} _color - The color to set the LED to // Format: RRGGBB (00-FF)
 */
function SetLedData(_led, _on = true, _color) {
  if (!_on) _color = strip_led_data[_led][1]
  if (_color.length != 6) _color = 'ff0000'
  strip_led_data[_led] = [ _on, _color]
}

/**
 * Sets the LEDs to the data given
 * @param {Boolean|wall_data} [_walls=false] - If this is false or 0
  *                                            sets all LEDs else expect wall_data
 * @param {String}  [_color='ff0000']        - The color that will be set if the first arg is 0
 * @param {Number}  [_amount=1]              - The amount of spaces
 * @param {Boolean} [_on=true]               - If the strip will be on or not
 */
function SetStrip(_walls = false, _color = 'ff0000', _amount = 1, _on = true) {
  // If nothing or 0 was passed as the first arg
  // Set the whole strip to _color
  if (!_walls) {
    // If the Strip is turned off
    if (!_on) {
      for (var i = 0; i < NUM_LEDS; i++) {
        SetLedData(i, false)
      }
      on = false
      return
    }

    for (var i = 0; i < strip_walls.length; i++) {
      strip_wall_data[i] = [ true, _color, _amount ]
    }

    for (var i = 0; i < NUM_LEDS; i+=parseInt(_amount)) {
      SetLedData(i, true, _color)
    }

    color = _color
  } else {
    var led = 0
    var led2 = 0
    // Foreach wall in the configuration
    for (var i = 0; i < strip_walls.length; i++) {
      // Foreach LED / wall
      // First black out all LEDs
      for (led; led < strip_walls[i]; led++) {
        SetLedData(led, false)
      }
      var amount = (_walls[i][2] < 1) ? 1 : _walls[i][2]
      // If the wall is disabled
      // Then show only used LEDs
      for (led2; led2 < strip_walls[i]; led2+=parseInt(amount)) {
        if (!_walls[i][0]) {
          SetLedData(led2, false, _walls[i][1])
        } else {
          SetLedData(led2, true, _walls[i][1])
        }
      }
    }
    on = true
    color = _walls[0][1]
    strip_wall_data = _walls
  }
}

function ledSpecial(bright = config.led.brightness, mode, arg) {
  strip.setBrightness(parseInt(bright))

  switch (mode) {
    case 'rainbow':
      loop = setInterval(() => { ledRainbow() }, arg.speed)
    break;
  }
}

function wheel (pos) {
  if (pos < 85) {
    return '0x'+(255-pos*3).toString(16).padStart(2,0)+(pos*3).toString(16).padStart(2,0)+'00'
  } else if (pos < 170) {
    pos -= 85
    return '0x'+'00'+(255-pos*3).toString(16).padStart(2,0)+(pos*3).toString(16).padStart(2,0)
  } else {
    pos -= 170
    return '0x'+(pos*3).toString(16).padStart(2,0)+'00'+(255-pos*3).toString(16).padStart(2,0)
  }
}

function ledRainbow() {
  for (var i = 0; i < 256; i++) {
    for (var j = 0; j < NUM_LEDS; j++) {
      pixelData[j] = wheel(parseInt(j*256 / NUM_LEDS + i) & 255)
    }
    strip.render(pixelData)
  }
}

/**
 * Sends the passed data to the origin
 * @param  {Object} _ws   - The origin socket
 * @param  {Object} _data - Should be in JSON
 */
function Send(_ws, _msg) {
  _ws.send(JSON.stringify(_msg))
}

/**
 * Sends the passed data to every client
 * @param {Object} _data - Object should be in JSON format
 */
function SendToEveryone(_data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(_data));
    }
  });
}

/**
 * Sends the passed data to every client but not back to origin
 * @param {Object} _data - Object should be in JSON format
 * @param {Object} _ws   - Is needed to know which was the origin
 */
function SendToEveryoneButOrigin(_data, _ws) {
  wss.clients.forEach(function each(client) {
    if (client !== _ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(_data));
    }
  });
}
