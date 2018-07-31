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
var strip_led_data = []
var strip_wall_data = []
var color
var favorites = [
  'FF0000', 'FF6600', 'FFAA00', 'FFFF00', '00FF00', '00FC9E',
  '00FFF6', '0099FF', '0000FF', '9A00FF', 'FF00F7', 'FF0077'
]

// Initialize the LED data to 0
for (let i = 0; i < NUM_LEDS; i++) {
  // Format;
  // [ bool on, string color ]
  strip_led_data.push([ 0, '000000'])
}
// Initialize the wall data to 0
for (let i = 0; i < strip_walls.length; i++) {
  // Format:
  // [ bool on, string color, int amount ]
  strip_wall_data.push([ 0, '000000', 0])
}

console.log('Listening on '+port);

strip.init(NUM_LEDS)
strip.setBrightness(config.led.brightness)

// On ready, show (green) lights
// Set all walls to on
SetStrip([[1, 'ff0000', 1], [1, '00ff00', 1], [1, '0000ff', 1], [1, 'b6cc18', 1]])
RenderLedData()

on = true

// Removed: API

// If the server gets a connection
wss.on('connection', function(ws, req) {

  // SendToEveryone({type: 'status', on: on, max: config.led.max_brightness, favorites: favorites, color: , wall_data: strip_wall_data })

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

    change()

    switch (msg.type) {
      case 'off':
        ledOff()
      break;
      case 'amount':
        console.log(msg.walls)
        SetStrip(msg.walls)
        ledAmount(msg.bright, msg.amount)
      break;
      case 'special':
        clearInterval(loop)
        ledSpecial(msg.bright, msg.mode, msg.arg)
      break;
    }

    // SendToEveryone({type: 'status', on: on, max: config.led.max_brightness, favorites: favorites, walls_active: strip_walls_active })
  });
});

/** Functions
* Unsorted (as of now)
* Maybe moved to different file later
* Maybe use classes later-later
**/

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

function SetLedData(_led, _on = 1, _color) {
  if (_on == 0) _color = strip_led_data[_led][1]
  strip_led_data[_led] = [ _on, _color]
}

// Format: SetStrip( array _walls, string _color, int _amount)
// Format: array _walls = wall [ bool on, string color, int amount ]
function SetStrip(_walls = 0, _color = 'ff0000', _amount = 1) {
  // If nothing or 0 was passed as the first arg
  // Set the whole strip to red / _color
  if (_walls == 0) {
    for (var i = 0; i < NUM_LEDS; i+=parseInt(_amount)) {
      color = _color
      SetLedData(i, 1, _color)
    }
  } else {
    var led = 0
    var led2 = 0
    // Foreach wall in the configuration
    for (var i = 0; i < strip_walls.length; i++) {
      // Foreach LED / wall
      // First black out all LEDs
      for (var led = strip_walls[i]; led < strip_walls[i]; led++) {
        SetLedData(led, 0)
      }

      let amount = (_walls[i][2] < 1) ? 1 : _walls[i][2]
      // Then show only used LEDs
      for (led2; led2 < strip_walls[i]; led2+=parseInt(amount)) {
        // If a wall is disabled,
        if (_walls[i][0] == 0) {
          SetLedData(led2, false, _walls[i][1])
        } else {
          SetLedData(led2, true, _walls[i][1])
        }
      }
    }
    color = _walls[0][1]
  }
}

function ledOff() {
  clearInterval(loop);
  clear()
  strip.render(pixelData)
  on = false;
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

function send(ws, msg) {
  ws.send(JSON.stringify(msg))
}

function SendToEveryone(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function SendToEveryoneButOrigin(data, ws) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
