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
var LedLib = require('./rpi-led-library');
var presetDBInstance = new PresetDb();

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
var shouldLoop = true;
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

presetDBInstance.add(new Preset('rainbow', l_rainbow));
presetDBInstance.add(new Preset('rainbow_animated', l_rainbow_factory));


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
        shouldLoop = false;
        LedLib.off()
        LedLib.render()
      break;
      case 'led':
        shouldLoop = false;
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
      case 'preset':
        shouldLoop = false;
        presetDBInstance.run(msg.presetId, msg.data);
      break;
    }
    SendToEveryone({type: 'status', on: LedLib.on, max: LedLib.max_brightness, favorites: favorites, color: LedLib.color, wall_data: LedLib.wall_data })
  });
});

function PresetDb() {
  this.presets = [];

  this.add = (preset) => {
    if (typeof preset !== 'object') return undefined;
    let id = this.presets.push(preset) - 1;
    this.presets[id].id = id;
  }

  this.getPresetById = (id) => {
    for (a of this.presets) {
      if (a.id === id) {
        return a;
      }
    }
  }

  this.run = (id, data) => {
    let p = this.getPresetById(id);
    if (p === undefined) return false;
    let d = data === undefined ? p.data : data;

    if (p !== undefined && typeof p.action === 'function') {
      p.action(d);
      return true;
    }
    if (p !== undefined && typeof p.action === 'object') {
      // TODO:
    }
  }
}

function Preset(slug, action, data) {
  this.id;
  this.action = action;
  this.data = data;

  this.slug = slug;
}

function wheel(pos) {
  let color;

  if (pos < 85) {
    return new LedLib.Color(pos * 3, 255 - pos * 3, 0);
  }

  if (pos < 170) {
    pos -= 85
    return new LedLib.Color(255 - pos * 3, 0, pos * 3);
  }

  pos -= 170
  return new LedLib.Color(0, pos * 3, 255 - pos * 3);
}

async function l_rainbow_factory(delay = 50) {
  let shift = 0;
  shouldLoop = true;

  while (shouldLoop) {
    let color = await l_rainbow(shift++);
    SendToEveryone({type: 'color', color: color});
    await sleep(delay).catch((e) => {});
  }

}

async function l_rainbow(shift = 0) {
  let color;
  for (let i = 0; i < LedLib.num_leds; i++) {
    color = wheel(parseInt((i+shift) * 256 / LedLib.num_leds) & 255).string();
    LedLib.setLed(i, color);
  }
  LedLib.render();
  return color;
}

function sleep(ms){
  return new Promise((res, rej) => {
    setTimeout(res,ms);
  });
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
