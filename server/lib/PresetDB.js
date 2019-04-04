/**
 * @file Provides a way to call methods based on string index
 * @version 4.0.0
 *
 * @module server/PresetDB
 *
 * @author Gabriel Selinschek <gabriel@selinschek.com>
 */

exports.Init = () => {
  exports.presets = []
}

exports.Add = (type, method) => {
  if (typeof type !== 'string' || typeof handler !== 'function')
  return "ERR_SYNTAX"

  exports.presets.push({ type: type, method: method})
  return "success"
}

exports.Run = (type, argv) => {
  // Only allow valid JSON
  try { JSON.parse(argv) } catch (e) { return "ERR_SYNTAX_INVALID_JSON" }
  for (let i = 0; i < exports.presets.length; i++) {
    let preset = exports.presets[i]

    if (preset.type.toUpperCase() == type.toUpperCase()) {
      preset.method(JSON.parse(argv))
      return "success"
    }

    return "ERR_NOTFOUND_PRESET"
  }
}
