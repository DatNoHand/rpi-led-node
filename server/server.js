/**
* LED Controller wit ws + express
* @author Gabriel Selinschek
**/

// Config Vars
var config = require('../config/config.js');

// Other Modules
var fs = require('fs');
var strip = require('rpi-ws281x-native');

// HTTPS Server for WSS
var http = require('http');
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

// Websocket
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

var port = config.port;
var NUM_LEDS = parseInt(config.led.num)
var pixelData = new Uint32Array(NUM_LEDS)

var httpServer = http.createServer();
httpsServer.listen(config.port);
var wss = new WebSocketServer({ server: httpsServer });

strip.init(NUM_LEDS)
strip.setBrightness(config.led.brightness)

console.log('Listening on '+config.wss.port);

// Testing
// ledSpecial(30, 'ambient')

// If the server gets a connection
wss.on('connection', function(ws, req) {
  SendToEveryone({type: 'msg', txt: 'LED Controller - Control your LED\'s from anywhere!'})

  ws.on('message', (msg) => {
    var valid = false;

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

    switch (msg.type) {
      case 'color':
        ledColor(msg.bright, msg.color)
      break;
      case 'color_man':
        ledColorMan(msg.bright, msg.r, msg.g, msg.b)
      break;
      case 'special':
        ledSpecial(msg.bright, msg.mode, msg.arg)
      break;
    }
  });
});

function ledColor(bright = config.led.brightness, color) {
  strip.brightness = bright
  for (i = 0; i < config.led.num; i++) {
    pixelData[i] = color
  }
  strip.render(pixelData)
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
