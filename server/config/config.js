var config = module.exports = {};

config.wss = {}
config.led = {}
config.mode = {}
config.mode.fancy = {}
config.mode.ambient = {}

// WebSocket config
config.wss.port = '80';

config.name = 'LED Controller'

// Mode specific config
config.mode.fancy.color = '0xff00ff'
config.mode.fancy.delay = 10

config.mode.ambient.color

// LED config
config.led.brightness = '30'
config.led.num = 923
