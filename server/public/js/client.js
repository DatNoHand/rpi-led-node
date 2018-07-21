var ws = new WebSocket('ws://'+window.location.host)
var lights_on = false;

ws.onmessage = (msg) => {
  if (msg.type == 'status' && msg.txt != 'ok')
    alert(msg.txt)
}

// TODO: _1 Control with GET
// TODO: _2 Make Color Buttons work (#ez #zufaul)

// Button handlers

// TODO: _2
/*
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
*/

$('.button.fancy').on('click', function () {
  var bright = $('#br').val()
  ledFancy(bright)
  Lamp(true)
})

$('.button.rainbow').on('click', function () {
  var bright = $('#br').val()
  ledRainbow(bright)
  Lamp(true)
})

$('.button.ambient').on('click', function () {
  var bright = $('#br').val()
  ledAmbient(bright)
  Lamp(true)
})

$('.button.rider').on('click', function () {
  var bright = $('#br').val()
  ledRider(bright)
  Lamp(true)
})

// On / Off Button default to 'Ambient'
$('#onOff').click(function () {
  var bright = $('#br').val()
  ledAmbient(bright)

  OnOnOffClick()
});

function Lamp(on = true) {
  if (on) {
    $('#onOff').css('transform', 'scale(1.2)')
    $('#onOff').children('svg').css('color', 'yellow')
  } else {
    $('#onOff').css('transform', 'scale(1)')
    $('#onOff').children('svg').css('color', '#707070')
  }
}

function OnOnOffClick() {
  lights_on = !lights_on
  if (!lights_on) ledOff();
  Lamp(lights_on);
}

// End Button handlers

// Begin LED functions
function ledOff() {
  send({type: 'off'})
}

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
