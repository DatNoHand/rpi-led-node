/**
 * @file LED Controller with ws + express
 * @version 3.0.1
 *
 * @requires server/rpi-led-library.js:rpi-led-library
 * @requires NPM:rpi-ws218x-native
 *
 * @author Gabriel Selinschek <gabriel@selinschek.com>
 */

// Config Vars
var config = require('./config/config.js')

// Websocket
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

// Other Modules
var fs = require('fs');
var LedLib = require('./rpi-led-library')

// HTTPS Server for WSS
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var port = config.port;

var httpServer = http.createServer(app);
httpServer.listen(config.port);

var wss = new WebSocketServer({ server: httpServer });

// Global Vars
var loop
var favorites = [
  'FF0000', 'FF6600', 'FFAA00', 'FFFF00', '00FF00', '00FC9E',
  '00FFF6', '0099FF', '0000FF', '9A00FF', 'FF00F7', 'FF0077'
]

LedLib.init(config)

console.log('Listening on '+port);

// Turn all walls on
// On ready, show (green) lights
LedLib.setAllLeds(config.led.ready_color, 5)
LedLib.render()
GetStatusMessage()

// TODO: Add RESTful API
app.get('/ping', (req, res) => {
  res.json({msg: "pong", ts: Date.now(), req: req})
})

app.get('/status', (req, res) => {
  res.json(GetStatusMessage())
})

app.get('/led/brightness/:value', (req, res) => {
  if (req.params.value != undefined && parseInt(req.params.value)) {
    LedLib.setBrightness(parseInt(req.params.value, false))
    SendToEveryone(GetStatusMessage())
    res.json({msg: 'brightness', success: true, brightness: req.params.value})
  }

})

app.get('/led/color/:color', (req, res) => {
  let success = false
  if (req.params.color.length == 6) {
    LedLib.wall_data.forEach((c, i, a) => {
      a[i][0] = true
      a[i][1] = req.params.color
    })
    LedLib.setStripArray(LedLib.wall_data)
    LedLib.render()
    success = true
  }
  SendToEveryone(GetStatusMessage())
  res.json({msg: 'led.set', success: success, color: req.params.color})
})

app.get('/led/turn/:target', (req, res) => {
  let success = false

  if (['on', 'off', 'toggle'].includes(req.params.target)) {
    switch(req.params.target) {
      case 'off':
        LedLib.off()
        LedLib.render()
      break;
      case 'on':
       LedLib.wall_data.forEach( (c, i, a) => { a[i][0] = true; })
       LedLib.setStripArray(LedLib.wall_data)
       LedLib.render()
      break;
    }
    success = true
  }

  SendToEveryone(GetStatusMessage())
  res.json({msg: 'led.turn', target: req.params.target, success: success})
})

// If the server gets a connection
wss.on('connection', function(ws, req) {

  SendToEveryone(GetStatusMessage())

  ws.on('message', (msg) => {
    try {
      var msg = JSON.parse(msg);
    } catch(e){
      Send(ws, {type: 'err', msg: 'ERR_SYNTAX'});
      ws.terminate();
    }

    if (!msg.type) {
      Send(ws, {type: 'err', msg: 'ERR_SYNTAX'});
      ws.terminate();
    }

    switch (msg.type) {
      case 'off':
        LedLib.off()
        LedLib.render()
      break;
      case 'led':
        /** @type {wall_data} */
        LedLib.setStripArray(msg.wall_data)
        LedLib.render()
      break;
      // case 'special':
      //   clearInterval(loop)
      //   LedLib.setBrightness(msg.bright)
      //   ledSpecial(msg.bright, msg.mode, msg.arg)
      // break;
      case 'brightness':
        if (msg.ov == undefined) msg.ov = false
        LedLib.setBrightness(msg.bright, msg.ov)
      break;
    }

    SendToEveryone(GetStatusMessage())
  });
});

function GetStatusMessage() {
  let status = {
    type: 'status',
    on: LedLib.on,
    brightness: LedLib.brightness,
    max: LedLib.max_brightness,
    favorites: favorites,
    color: LedLib.color,
    hsl: colorToHSL(LedLib.color),
    wall_data: LedLib.wall_data
  }
  return status
}

function colorToHSL(color) {
  let r = parseInt(color.substr(0,2), 16);
  let g = parseInt(color.substr(2,4), 16);
  let b = parseInt(color.substr(4,6), 16);

  r /= 255, g /= 255, b /= 255;
  let l = Math.max(r, g, b)
  let s = l - Math.min(r, g, b)
  let h = s
    ? l === r
      ? (g - b) / s
      : l === g
      ? 2 + (b - r) / s
      : 4 + (r - g) / s
    : 0;

  let result = {
    h: 60 * h < 0 ? 60 * h + 360 : 60 * h,
    s: 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * 1 - s))) : 0),
    l: (100 * (2 * 1 - s)) / 2
  }
  return result
}

function wheel (pos) {
  if (pos < 85) {
    return '0x'+toHex(255-pos*3)+toHex(pos*3)+'00'
  } else if (pos < 170) {
    pos -= 85
    return '0x'+'00'+toHex(255-pos*3)+toHex(pos*3)
  } else {
    pos -= 170
    return '0x'+toHex(pos*3)+'00'+toHex(255-pos*3)
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

function toHex(num) {
  return num.toString(16).padStart(2,0)
}

// **************************************************
// ************* WebSocket functions ****************
// **************************************************

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
