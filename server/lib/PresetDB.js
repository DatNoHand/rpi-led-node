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
  return false

  exports.presets.push({ type: type, method: method})
  return true
}

exports.Run = (type, argv) => {
  // Only allow valid JSON
  try { JSON.parse(argv) } catch (e) { return false }
  for (let i = 0; i < exports.presets.length; i++) {
    let preset = exports.presets[i]

    if (preset.type.toUpperCase() == type.toUpperCase()) {
      preset.method(JSON.parse(argv))
      return true
    }

    return false
  }
}
