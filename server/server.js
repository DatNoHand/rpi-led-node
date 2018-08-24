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


// TODO: Add RESTful API

// If the server gets a connection
wss.on('connection', function(ws, req) {

  SendToEveryone({type: 'status', on: LedLib.on, max: LedLib.max_brightness, favorites: favorites, color: LedLib.color, wall_data: LedLib.wall_data })

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
    SendToEveryone({type: 'status', on: LedLib.on, max: LedLib.max_brightness, favorites: favorites, color: LedLib.color, wall_data: LedLib.wall_data })
  });
});

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
