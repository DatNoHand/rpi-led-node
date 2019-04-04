/**
 * @file Handles WebSocket messages for the server
 * @version 3.0.1
 *
 * @module server/ServerMessageHandler
 * @requires NPM:ServerMessageHandler
 *
 * @author Gabriel Selinschek <gabriel@selinschek.com>
 */

exports.Init = () => {
  exports.messages = []

  exports.register = (type, handler) => {
    if (typeof type !== 'string' || typeof handler !== 'function')
      return false

    exports.messages.push({ type: type.toUpperCase(), handler: handler});
    return true
  }

  exports.handle = (type, jsonString) => {
    // Only allow valid JSON
    try { JSON.parse(jsonString) } catch (e) { return false }
    for (let i = 0; i < exports.messages.length; i++) {
      let msg = exports.messages[i]

      if (msg.type.toUpperCase() == type.toUpperCase()) {
        msg.handler(JSON.parse(jsonString))
        return true
      }

      return false
    }
  }
}
