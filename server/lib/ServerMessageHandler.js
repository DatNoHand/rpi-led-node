/**
 * @file Handles WebSocket messages for the server
 * @version 3.0.1
 *
 * @module server/ServerMessageHandler
 * @requires NPM:ServerMessageHandler
 *
 * @author Gabriel Selinschek <gabriel@selinschek.com>
 */

exports.init = () => {
  exports.messages = []

  exports.register = (type, handler) => {
    if (typeof type !== 'string' || typeof handler !== 'function')
      return false

    let jsonString = JSON.stringify({ type: type.toUpperCase, handler: handler})
    exports.messages.push(jsonString);
    return true
  }

  exports.handle = (type, jsonString) => {
    // Only allow valid JSON
    try { JSON.parse(jsonString) } catch (e) { return false }
    for (let i = 0; i < exports.messages.length; i++) {
      let msg = exports.messages[i]
      let msgObj = JSON.parse(msg)

      if (msgObj.typetoUpperCase == typetoUpperCase) {
        console.log('Called ' + msgObj.type)
        msgObj.handler(JSON.parse(jsonString))
        return true
      }

      return false
    }
  }
}
