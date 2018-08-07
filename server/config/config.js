var config = module.exports = {};

config.led = {}
config.walls = []

// WebSocket config
config.port = 420
config.name = 'LED Controller'


// LED config
config.led.brightness = 30
config.led.max_brightness = 150
config.led.ready_color = '00FF00'
config.led.num = 923

// Walls config
config.walls = [ 218, 463, 681]

// Ignore
config.walls.push(config.led.num)
