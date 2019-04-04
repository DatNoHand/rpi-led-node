/**
 * @file Handles Messages
 * @version 4.0.0
 *
 * @module server/MessageHandler
 *
 * @author Gabriel Selinschek <gabriel@selinschek.com>
 */

exports.Init = () => {
  exports.messages = []
}

exports.Register = (type, handler) => {
  if (typeof type !== 'string' || typeof handler !== 'function')
  return false

  exports.messages.push({ type: type.toUpperCase(), handler: handler});
  return true
}

exports.Handle = (type, argv) => {
  // Only allow valid JSON
  try { JSON.parse(argv) } catch (e) { return false }
  for (let i = 0; i < exports.messages.length; i++) {
    let msg = exports.messages[i]

    if (msg.type.toUpperCase() == type.toUpperCase()) {
      msg.handler(JSON.parse(argv))
      return true
    }

    return false
  }
}
