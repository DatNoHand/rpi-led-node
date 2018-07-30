var config = module.exports = {};

config.wss = {}
config.led = {}
config.walls = []
config.mode = {}
config.mode.ambient = {}
config.mode.rider = {}

// WebSocket config
config.port = 80
config.name = 'LED Controller'


// LED config
config.led.brightness = 30
config.led.max_brightness = 150
config.led.ready_color = '00FF00'
config.led.num = 923

// Walls config
config.walls = [
  [ 280 ],
  [ 650 ],
  [ 790 ],
]
