/**
* LED Controller wit ws + express
* @author Gabriel Selinschek
**/

// Config Vars
var config = require('./config/config.js');

// Websocket
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

// Other Modules
var fs = require('fs');
var strip = require('rpi-ws281x-native');

// HTTPS Server for WSS
var http = require('http');
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

var port = config.port;
var NUM_LEDS = parseInt(config.led.num)
var pixelData = new Uint32Array(NUM_LEDS)

var httpServer = http.createServer(app);
httpServer.listen(config.port);

var wss = new WebSocketServer({ server: httpServer });

// Global Vars
var loop

console.log('Listening on '+config.port);

strip.init(NUM_LEDS)
strip.setBrightness(config.led.brightness)

// Testing
// ledSpecial(30, 'ambient')

// If the server gets a connection
wss.on('connection', function(ws, req) {
  SendToEveryone({type: 'msg', txt: 'LED Controller - Control your LED\'s from anywhere!'})

  ws.on('message', (msg) => {
    try {
      var msg = JSON.parse(msg);
    } catch   (e){
      ws.send('{"type": "err", "msg": "ERR_SYNTAX"}');
      ws.terminate();
    }

    // If there is no type in the message
    if (!msg.type) {
    ws.send('{"type": "err", "msg": "ERR_SYNTAX"}');
    ws.terminate();
    }

    ws.send(JSON.stringify({type: 'status', txt: 'ok'}))
    console.log(msg)

    switch (msg.type) {
      case 'color':
        clearInterval(loop)
        ledColor(msg.bright, msg.color)
      break;
      case 'color_man':
        clearInterval(loop)
        ledColorMan(msg.bright, msg.r, msg.g, msg.b)
      break;
      case 'special':
        clearInterval(loop)
        ledSpecial(msg.bright, msg.mode, msg.arg)
      break;
    }
  });
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ledSpecial(bright = config.led.brightness, mode, arg) {
  strip.brightness = bright

  switch (mode) {
    case 'fancy':
      loop = setInterval( async () => {
        for (var i = 0; i < config.led.num; i++) {
          pixelData[i] = config.mode.fancy.color
        }
        strip.render(pixelData);
        await sleep(config.mode.fancy.delay)
        strip.reset()
        await sleep(config.mode.fancy.delay)
      }, 1000 / 10);

    break;
    case 'ambient':
      for (var i = 0; i < config.led.num; i+=5)  {
        pixelData[i] = config.mode.ambient.color
      }
      strip.render(pixelData)
    break;
    case 'rider':
    // TODO: get script from Karim
    break;
  }
}

function ledColorMan(bright = config.led.brightness, r, g, b) {
  strip.brightness = bright

  color = rgbToHex(r, g, b)

  for (i = 0; i < config.led.num; i++) {
    pixelData[i] = color
  }
  strip.render(pixelData)
}

function ledColor(bright = config.led.brightness, color) {
  strip.brightness = bright
  for (i = 0; i < config.led.num; i++) {
    pixelData[i] = color
  }
  strip.render(pixelData)
}

function rgbToHex(r, g, b) {
  r = r.toString(16)
  g = g.toString(16)
  b = b.toString(16)
  return color = '0x'+r+g+b
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
