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
  return "ERR_SYNTAX"

  exports.messages.push({ type: type.toUpperCase(), handler: handler});
  return "success"
}

exports.Handle = (type, argv) => {
  // Only allow valid JSON
try { JSON.parse(argv) } catch (e) { return "ERR_SYNTAX_INVALID_JSON" }
  for (let i = 0; i < exports.messages.length; i++) {
    let msg = exports.messages[i]
    console.log(msg.type.toUpperCase() + ' ' + type.toUpperCase())
    if (msg.type.toUpperCase() == type.toUpperCase()) {
      msg.handler(JSON.parse(argv))
      return "success"
    }

    return "ERR_NOTFOUND_HANDLER"
  }
}
