/**
 * @file	Stores configuration data
 * @version 3.0.1
 *
 * @module server/config
 *
 * @author Gabriel Selinschek <gabriel@selinschek.com>
 */

/**
 * Parent Object of {@link config_led}
 * @type {Object}
 */
exports.led = {}
exports.walls = []

// WebSocket config
exports.port = 420
exports.name = 'LED Controller'

// LED config
exports.led.brightness = 30
exports.led.max_brightness = 150
exports.led.ready_color = '00FF00'
exports.led.num = 923

// Walls exports
exports.walls = [ 218, 463, 681 ]

// Ignore
exports.walls.push(exports.led.num)

// ====================	JSDoc typedef	====================
/**
 * @typedef {Object}					Config
 * @prop		{config_led}			led						Stores configuration about LEDs
 * @prop		{Array.<Integer>}	walls					Stores segment data
 * @prop		{Integer}					port					Which port the application will use
 * @prop		{String}					name					The name of the app
 */
/**
 * @typedef	{Object}				config_led
 * @prop		{Integer}				brightness			The default brightness
 * @prop		{Integer}				max_brightness	The max allowed brightness (can be overridden)
 * @prop		{String}				ready_color			The default color the LEDs will have after a reboot
 * @prop		{Integer}				num							The number of LEDs you have
 */
