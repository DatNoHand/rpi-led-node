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
var lastUsed = []
for (var i = 0; i < 16; i++) {
  lastUsed.push('ff0000');
}

console.log('Listening on '+port);

strip.init(NUM_LEDS)
strip.setBrightness(config.led.brightness)

// On ready, show (green) lights
ledColor(config.led.brightness, config.led.ready_color)
on = true

app.post('/api', function(req, res) {
  var mode

  switch (req.body.func) {
    case 'off':
      ledOff()
    break;
    case 'color':
      clearInterval(loop)
      ledColor(req.body.bright, req.body.color)
    break;
    case 'color_man':
      clearInterval(loop)
      ledColorMan(req.body.bright, req.body.r, req.body.g, req.body.b)
    break;
    case 'special':
      clearInterval(loop)
      ledSpecial(req.body.bright, req.body.mode, req.body.arg)
    break;
  }
  res.send(req.body)
})


// If the server gets a connection
wss.on('connection', function(ws, req) {
  // TODO: Send Light Status and last used Colors

  send(ws, {type: 'setup', on: on, lastUsed: lastUsed, max: config.led.max_brightness})

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
      case 'color':
        clearInterval(loop)
        ledColor(msg.bright, msg.color)
      break;
      case 'color_man':
        clearInterval(loop)
        ledColorMan(msg.bright, msg.r, msg.g, msg.b)
      break;
      case 'amount':
        ledAmount(msg.bright, msg.color, msg.amount)
        // TODO: send new lastused to clients
      break;
      case 'special':
        clearInterval(loop)
        ledSpecial(msg.bright, msg.mode, msg.arg)
      break;
    }
    send(ws, {type: 'status', on: on})
  });
});

/** Functions
* Unsorted (as of now)
* Maybe moved to different file later
* Maybe use classes later-later
**/

function ledAmount(bright = conifg.led.brightness, color, amount) {
  strip.setBrightness(parseInt(bright))
  console.log(color)

  clear()

  if (amount < 2) amount = 2;
  for (var i = 0; i < config.led.num; i+=(amount-1))  {
    pixelData[i] = color
  }
  strip.render(pixelData)
}

function clear() {
  for (var i = 0; i < config.led.num; i++)  {
    pixelData[i] = '0x000000'
  }
}

function change() {
  clearInterval(loop)
}

function sleep(ms) {
  return setTimeout(() => {}, ms);
}

function ledOff() {
  clearInterval(loop);

  for (var i = 0; i < config.led.num; i++)  {
    pixelData[i] = '0x000000'
  }
  strip.render(pixelData)
  on = false;
}

function ledSpecial(bright = config.led.brightness, mode, arg) {
  strip.setBrightness(parseInt(bright))

  switch (mode) {
    case 'rainbow':
      loop = setInterval(() => { ledRainbow() }, 0)
    break;
  }
}

function ledColorMan(bright = config.led.brightness, r, g, b) {
  strip.setBrightness(parseInt(bright))
  color = rgbToHex(r, g, b)
  for (i = 0; i < config.led.num; i++) {
    pixelData[i] = color
  }
  strip.render(pixelData)
}

function ledColor(bright = config.led.brightness, color) {
  strip.setBrightness(parseInt(bright))

  for (i = 0; i < config.led.num; i++) {
    pixelData[i] = color
  }
  strip.render(pixelData)

  // Add new color to first of lastused, and trim to 16 length
  lastUsed.unshift(color.slice(2,8))
  lastUsed = lastUsed.slice(0,15)
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

function rgbToHex(r, g, b) {
  r = parseInt(r).toString(16).padStart(2,0)
  g = parseInt(g).toString(16).padStart(2,0)
  b = parseInt(b).toString(16).padStart(2,0)
  return '0x'+r+g+b
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
