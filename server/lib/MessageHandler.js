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

exports.Handle = (type, argv, sender = 'REST') => {
  // If argv == undefined, skip JSON syntax check
  if (argv != undefined)
    try { JSON.parse(argv) } catch (e) { return "ERR_SYNTAX_INVALID_JSON" }
    // Only allow valid JSON

  for (let i = 0; i < exports.messages.length; i++) {
    let msg = exports.messages[i]
    if (msg.type.toUpperCase() == type.toUpperCase()) {
      return msg.handler(sender, JSON.parse(argv))
    }
  }

  return "ERR_NOTFOUND_HANDLER"
}
