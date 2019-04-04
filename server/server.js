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
var WebSocket = require('ws')
var WebSocketServer = require('ws').Server

// Other Modules
var fs = require('fs')
var LedLib = require('./lib/rpi-led-library')
var MessageHandler = require('./lib/ServerMessageHandler')
var presetDBInstance = new PresetDb()

// HTTPS Server for WSS
var http = require('http')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))

// TODO: Add RESTful API
app.get('/users/:userId', (req, res) => {
  return res.send(req.context.models.users[req.params.userId]);
});

app.get('/power/:power', (req, res) => {
  console.log(req)
  MessageHandler.handle("POWER", req.params.power)
})

var port = config.port

var httpServer = http.createServer(app)
httpServer.listen(config.port)

var wss = new WebSocketServer({ server: httpServer })

// Global Vars
var shouldLoop = true
var favorites = [
  'FF0000', 'FF6600', 'FFAA00', 'FFFF00', '00FF00', '00FC9E',
  '00FFF6', '0099FF', '0000FF', '9A00FF', 'FF00F7', 'FF0077'
]

LedLib.init(config)
MessageHandler.init()

console.log('Listening on ' + port)

// Turn all walls on
// On ready, show (green) lights
LedLib.setAllLeds(config.led.ready_color, 5)
LedLib.render()

presetDBInstance.add(new Preset('rainbow', l_rainbow))
presetDBInstance.add(new Preset('rainbow_animated', l_rainbow_factory))
presetDBInstance.add(new Preset('rainbow_fancy', l_rainbow_fancy))
presetDBInstance.add(new Preset('bauen', l_bauen))
presetDBInstance.add(new Preset('white', l_white))
presetDBInstance.add(new Preset('Chillen', l_porno));

MessageHandler.register("power", OnPowerMessage)
/*MessageHandler.register("SET_WALL", func)
MessageHandler.register("SET_ALL_WALLS", func)
MessageHandler.register("SET_PRESET", func)
MessageHandler.register("SET_BRIGHTNESS", func)
MessageHandler.register("STATUS", func) */

// If the server gets a connection
wss.on('connection', function(ws, req) {
  Send(ws, {type: 'init', wall_data: LedLib.wall_data })
  setTimeout(() => {}, 50);
  Send(ws, {type: 'status', on: LedLib.on, max: LedLib.max_brightness, color: LedLib.color, wall_data: LedLib.wall_data })
  Send(ws, {type: 'presets', presets: presetDBInstance.presets})

  ws.on('message', (msg) => {
    try {
      var msg = JSON.parse(msg)
    } catch(e){
      Send(ws, {type: 'err', msg: 'ERR_SYNTAX'})
      ws.terminate()
    }

    if (!msg.type) {
      Send(ws, {type: 'err', msg: 'ERR_SYNTAX'})
      ws.terminate()
    }

    MessageHandler.handle(msg.type, msg.argv)

    SendToEveryone({type: 'status', on: LedLib.on, max: LedLib.max_brightness, favorites: favorites, color: LedLib.color, wall_data: LedLib.wall_data })
  })
})

// ===== OnMessage functions =====

function OnPowerMessage(argv) {
  // True if ON
  if (argv.power) {
    // TODO
  } else
    LedLib.off(true)
}

// ===== OnMessage functions end =====

function PresetDb() {
  this.presets = []

  this.add = (preset) => {
    if (typeof preset !== 'object') return undefined
    let id = this.presets.push(preset) - 1
    this.presets[id].id = id
  }

  this.getPresetById = (id) => {
    for (a of this.presets) {
      if (a.id === id) {
        return a
      }
    }
  }

  this.run = (id, data) => {
    id = parseInt(id)

    let p = this.getPresetById(id)
    if (p === undefined) return false
    let d = data === undefined ? p.data : data

    if (p !== undefined && typeof p.action === 'function') {
      p.action(d)
      return true
    }
    if (p !== undefined && typeof p.action === 'object') {
      // TODO:
    }
  }
}

function Preset(slug, action, data) {
  this.id
  this.action = action
  this.data = data

  this.slug = slug
}

function wheel(pos) {
  let color

  if (pos < 85) {
    return new LedLib.Color(pos * 3, 255 - pos * 3, 0)
  }

  if (pos < 170) {
    pos -= 85
    return new LedLib.Color(255 - pos * 3, 0, pos * 3)
  }

  pos -= 170
  return new LedLib.Color(0, pos * 3, 255 - pos * 3)
}

async function l_rainbow_factory(delay = 50, shift = 0) {
  shouldLoop = true

  let color = await l_rainbow(shift)
  SendToEveryone({type: 'color', color: color})
  await sleep(delay).catch((e) => {})

  if (shouldLoop) l_rainbow_factory(delay, shift+=2)
}

async function l_rainbow_fancy(delay = 75) {
  shouldLoop = true

  let color = await l_rainbow(Math.floor(Math.random() * LedLib.num_leds))

  SendToEveryone({type: 'color', color: color})
  await sleep(delay).catch((e) => {})

  if (shouldLoop) l_rainbow_fancy(delay)
}

async function l_rainbow(shift = 0) {
  let color
  let data = []

  for (let i = 0; i < LedLib.num_leds; i++) {
    color = wheel(parseInt((i+shift) * 256 / LedLib.num_leds) & 255).string()
    data[i] = '0x' + color
  }

  LedLib.setStripAdvanced(data)
  return color
}

async function l_bauen() {
  LedLib.off();

  for (let i = 0; i < LedLib.num_leds; i+=2) {
    if (i < 80) LedLib.setLed(i, 'ffffff')
    if (i > 800) LedLib.setLed(i, 'ffffff')
  }
  LedLib.render();
}

async function l_white() {
  LedLib.off();

  for (let i = 0; i < LedLib.num_leds; i++) {
    switch (i % 3) {
      case 0:
        LedLib.setLed(i, 'ff0000')
        break;
      case 1:
        LedLib.setLed(i, '00ff00')
        break;
      case 2:
        LedLib.setLed(i, '0000ff')
        break;
    }
  }
  LedLib.render()
}

async function l_porno() {
  LedLib.off();

  for (let i = 0; i < LedLib.num_leds; i++) {
    if (i >= 180 && i <= 500) {
      LedLib.setLed(i, 'ff0000')
    }
  }
  LedLib.render()
}

function sleep(ms){
  return new Promise((res, rej) => {
    setTimeout(res,ms)
  })
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
      client.send(JSON.stringify(_data))
    }
  })
}

/**
 * Sends the passed data to every client but not back to origin
 * @param {Object} _data - Object should be in JSON format
 * @param {Object} _ws   - Is needed to know which was the origin
 */
function SendToEveryoneButOrigin(_ws, _data) {
  wss.clients.forEach(function each(client) {
    if (client !== _ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(_data))
    }
  })
}
