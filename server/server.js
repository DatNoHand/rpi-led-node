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
var MessageHandler = require('./lib/MessageHandler')
var PresetDB = require('./lib/PresetDB')

// HTTPS Server for WSS
var http = require('http')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


let api = express.Router()

api.get('/power/:power', (req, res) => {
  let status =  MessageHandler.Handle("power",
                JSON.stringify({ power: req.params.power }))
  res.send(JSON.stringify({ status: status }))
})

api.get('/brightness/:brightness', (req, res) => {
  let status =  MessageHandler.Handle("set_brightness",
                JSON.stringify({ brightness: req.params.brightness, override: req.query.ov }))
  res.send(JSON.stringify({ status: status }))
})

api.get('/render/preset/:preset', (req, res) => {
  console.log(req.query.data)
  let status =  MessageHandler.Handle("render_preset",
                JSON.stringify({ type: req.params.preset, data: false }))
  res.send(JSON.stringify({ status: status }))
})

api.get('/render/walls/:wall_data', (req, res) => {
  let status =  MessageHandler.Handle("render_all_walls",
                JSON.stringify({ type: req.params.preset, data: decodeURI(req.query.data)}))
  res.send(JSON.stringify({ status: status }))
})

api.get('/status', (req, res) => {
  let status =  MessageHandler.Handle("request_status", JSON.stringify({stub: 'stub'}))
  res.send(JSON.stringify({ status: status }))
})

app.use('/api', api)
app.use(express.static(__dirname + '/public'))

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

LedLib.Init(config)
MessageHandler.Init()
PresetDB.Init()

console.log('Listening on ' + port)

// Turn all walls on
// On ready, show (green) lights
LedLib.SetAllLeds(config.led.ready_color, 5)
LedLib.Render()

PresetDB.Add('Rainbow', l_rainbow)
PresetDB.Add('Rainbow Animated', l_rainbow_factory)
PresetDB.Add('Rainbow Fancy', l_rainbow_fancy)
PresetDB.Add('Bauen', l_bauen)
PresetDB.Add('White', l_white)
PresetDB.Add('Chillen', l_porno);

MessageHandler.Register("power", OnPowerMessage)
/*MessageHandler.Register("SET_WALL", func)*/
MessageHandler.Register("render_all_walls", OnRenderAllWalls)
MessageHandler.Register("render_preset", OnRenderPresetMessage)
MessageHandler.Register("set_brightness", OnBrightnessMessage)
MessageHandler.Register("request_status", OnRequestStatusMessage)

// If the server gets a connection
wss.on('connection', function(ws, req) {
  Send(ws, {type: 'init', wall_data: LedLib.wall_data })
  setTimeout(() => {}, 50);
  Send(ws, {type: 'status', on: LedLib.on, max: LedLib.max_brightness, color: LedLib.color, wall_data: LedLib.wall_data })
  Send(ws, {type: 'presets', presets: PresetDB.presets})

  ws.on('message', (msg) => {
    try {
      var msg = JSON.parse(msg)
    } catch(e){
      Send(ws, {type: 'err', msg: 'ERR_SYNTAX_INVALID_JSON'})
      ws.terminate()
    }

    if (msg.type == undefined) {
      Send(ws, {type: 'err', msg: 'ERR_NULL_MSG_TYPE'})
      ws.terminate()
    }

    console.log(msg.type, msg.argv)
    let result = MessageHandler.Handle(msg.type, msg.argv, ws)
    console.log(result)
    // Update all Clients
    SendToEveryone({type: 'status', on: LedLib.on, max: LedLib.max_brightness, favorites: favorites, color: LedLib.color, wall_data: LedLib.wall_data })
  })
})

// ===== OnMessage functions =====

function OnPowerMessage(sender, argv) {
  LedLib.SetPower(argv.power)
  LedLib.Render()

  return "success"
}

function OnBrightnessMessage(sender, argv) {
  if (argv.override == undefined) argv.override = false

  argv.override = (argv.override == 'true')
  LedLib.SetBrightness(argv.brightness, argv.override)
  return "success"
}

function OnRenderPresetMessage(sender, argv) {
  shoudLoop = false
  return PresetDB.Run(argv.type, argv.data)
}

function OnRequestStatusMessage(sender, argv) {
  let status = {type: 'status', on: LedLib.on, max: LedLib.max_brightness, favorites: favorites, color: LedLib.color, wall_data: LedLib.wall_data }
  if (sender != 'REST')
    Send(sender, status)
  return status
}

function OnRenderAllWalls(sender, argv) {
  if (argv.wall_data == undefined) return "ERR_NULL_WALL_DATA"
  LedLib.setStripWallData(argv.wall_data)
}


// ===== OnMessage functions end =====




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
