var config = module.exports = {};

config.wss = {}
config.led = {}
config.mode = {}
config.mode.fancy = {}
config.mode.ambient = {}
config.mode.rider = {}

// WebSocket config
config.port = 80

config.name = 'LED Controller'

// Mode specific config
config.mode.fancy.color = '0xff00ff'
config.mode.fancy.delay = 50

config.mode.ambient.color = '0xff6e00'

config.mode.rider.color = '0xff0000'

// LED config
config.led.brightness = 30
config.led.num = 923
