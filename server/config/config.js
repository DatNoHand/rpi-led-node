var config = module.exports = {};

config.wss = {};
config.led = {};

// WebSocket config
config.wss.secure = true;
config.wss.online = true;
config.wss.port = '80';

config.name = 'LED Controller'

// LED config
config.led.brightness = '30'
config.led.num = 923
