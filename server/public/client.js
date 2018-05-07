var ws = new WebSocket('ws://'+window.location.host)

ws.onmessage = (msg) => {
  if (msg.type == 'status' && msg.txt != 'ok')
    alert(msg.txt)
}

// TODO: Control with GET

// Button handlers
$('button.color').on('click', function () {
  var color = $(this).data('color')
  var bright = $('#br').val()

  switch (color) {
    case 'red':
      color = '0xff0000'
    break
    case 'green':
      color = '0x00ff00'
    break
    case 'blue':
      color = '0x0000ff'
    break
  }

  ledColor(bright, color)
})

$('button.color_man').on('click', function () {
  var bright = $('#br').val()
  var r = $('#red').val()
  var g = $('#green').val()
  var b = $('#blue').val()

  ledColorMan(bright, r, g, b)
})

$('button.fancy').on('click', function () {
  var bright = $('#br').val()
  ledFancy(bright)
})

$('button.rainbow').on('click', function () {
  var bright = $('#br').val()
  ledRainbow(bright)
})

$('button.ambient').on('click', function () {
  var bright = $('#br').val()
  ledAmbient(bright)
})

$('button.rider').on('click', function () {
  var bright = $('#br').val()
  ledRider(bright)
})
// End Button handlers

// Begin LED functions
function ledRainbow(bright) {
  send({type: 'special', bright: bright, mode: 'rainbow'})
}

function ledRider(bright) {
  send({type: 'special', bright: bright, mode: 'rider'})
}

function ledAmbient(bright) {
  send({type: 'special', bright: bright, mode: 'ambient'})
}

function ledFancy(bright) {
  send({type: 'special', bright: bright, mode: 'fancy'})
}

function ledColor(bright, color) {
  send({type: 'color', bright: bright, color: color})
}

function ledColorMan(bright, r, g, b) {
  send({type: 'color_man', bright: bright, r: r, g: g, b: b})
}
// End LED functions

function send(msg) {
  ws.send(JSON.stringify(msg))
}
