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
config.mode.fancy.delay = 50
config.mode.fancy.color = '0xff00ff'
config.mode.ambient.color = '0x000080'
config.mode.rider.color = '0xff0000'

// LED config
config.led.brightness = 30
config.led.max_brightness = 150
config.led.ready_color = '0x00ff00'
config.led.num = 923
