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
var strip_color
var favorites = [
  'FF0000', 'FF6600', 'FFAA00', 'FFFF00', '00FF00', '00FC9E',
  '00FFF6', '0099FF', '0000FF', '9A00FF', 'FF00F7', 'FF0077'
]

console.log('Listening on '+port);

strip.init(NUM_LEDS)
strip.setBrightness(config.led.brightness)

// On ready, show (green) lights
ledAmount(config.led.brightness, config.led.ready_color)
on = true

app.post('/api', function(req, res) {
  var mode

  switch (req.body.func) {
    case 'off':
      ledOff()
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

  SendToEveryone({type: 'status', on: on, color: strip_color, max: config.led.max_brightness, favorites: favorites})

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
        ledAmount(msg.bright, msg.color, msg.amount)
      break;
      case 'special':
        clearInterval(loop)
        ledSpecial(msg.bright, msg.mode, msg.arg)
      break;
    }

    SendToEveryone({type: 'status', on: on, color: msg.color, max: config.led.max_brightness, favorites: favorites})
  });
});

/** Functions
* Unsorted (as of now)
* Maybe moved to different file later
* Maybe use classes later-later
**/

function ledAmount(bright = conifg.led.brightness, color, amount = 1) {
  strip.setBrightness(parseInt(bright))
  color = '0x' + color
  amount = parseInt(amount)
  clear()

  if (amount < 1) amount = 1;

  for (var i = 0; i < config.led.num; i+=amount)  {
    pixelData[i] = color
  }

  color = color.slice(2,8)
  strip_color = color

  if (!favorites.includes(color.toUpperCase()))
    favorites.unshift(color.toUpperCase())
  favorites = favorites.slice(0,15)

  strip.render(pixelData)
  on = true
}

// Zeroes out LEDs color data, but doesn't render it | Preparation for new pattern
function clear() {
  for (var i = 0; i < config.led.num; i++)  {
    pixelData[i] = '0x000000'
  }
}

function change() {
  clearInterval(loop)
  clear()
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
