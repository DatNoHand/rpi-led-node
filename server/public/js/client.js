var ws = new WebSocket('ws://'+window.location.host)
var lights_on = false;
var color
var led_color
var lamp_off_color = '#707070'
var last_clicked
var clicked

// Server Messages
ws.onmessage = function(e) {
  var msg = JSON.parse(e.data);

  switch(msg.type) {
    case 'status':
      lights_on = msg.on
      led_color = '#' + msg.color
      UpdateColors()

      Lamp(lights_on)
      $('#br').attr('max', msg.max)

      setBg(msg.favorites)
    break;
  }
}

// Button handlers
$('.button.rainbow').on('click', function () {
  var bright = $('#br').val()
  ledRainbow(bright)
  Lamp(true)
})

$('.button.amount').on('click', function () {
  let bright = $('#br').val()
  let amount = $(this).attr('data-amount')
  ledAmount(bright, color, amount)
})

$('div.color.infinite.wobble').on('click', function () {
  color = $(this).attr('data-color')
})

// On / Off Button default to 'Ambient'
$('#onOff').click(function () {
  var bright = $('#br').val()
  if (!lights_on)
    ledAmount(bright, color, 5)
  OnOnOffClick()
});

$('input.button.colorpicker').on('change', function (e) {
  color = $(this).val().slice(1,7)
  clicked = $(this)
})

function UpdateColors() {
  $('body').css({color: led_color})

  clicked.css({border: '1.5px solid white'})
  if (last_clicked != null) last_clicked.css({border: ''})

  last_clicked = clicked
}

// Set BG Color of the color buttons, based on what the server sent
function setBg(colors) {
  // Get the amount of color buttons that we have
  let amount = 0
  $('div.color.infinite.wobble').each(() => { amount++ })

  // For Each entry in colors array from the Server
  for (var i = 0; i < amount; i++) {
    // If the server sent more than we can use return
    let c = colors[i]
    let current = $('div.color.infinite.wobble').eq(i)
    if (c == undefined) return;

    let r = c.slice(0, 2)
    let g = c.slice(2, 4)
    let b = c.slice(4, 6)

    current.css({'background-color': r+g+b})
    current.attr('data-color', r+g+b)
  }
}

function Lamp(on = true) {
  if (on) {
    $('#onOff').css('transform', 'scale(1.2)')
    $('#onOff').children('svg').css('color', led_color)
  } else {
    $('#onOff').css('transform', 'scale(1)')
    $('#onOff').children('svg').css('color', lamp_off_color)
  }
}

function OnOnOffClick() {
  if (lights_on) ledOff();
}

// End Button handlers
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Begin LED functions

function ledAmount(bright, color = '0000ff', amount = 2) {
  send({type: 'amount', bright: bright, color: color, amount: amount})
}

function ledOff() {
  send({type: 'off'})
}

function ledRainbow(bright) {
  send({type: 'special', bright: bright, mode: 'rainbow', arg: {speed: 50}})
}


// function ledColor(bright, color) {
//   send({type: 'color', bright: bright, color: color})
// }
//
// function ledColorMan(bright, r, g, b) {
//   send({type: 'color_man', bright: bright, r: r, g: g, b: b})
// }

// End LED functions
// ----------------------------------------------------------------------
function setColor(r, g, b) {
  color = rgbToHex(r, g, b);
}

function rgbToHex(r, g, b) {
  r = parseInt(r).toString(16).padStart(2,0)
  g = parseInt(g).toString(16).padStart(2,0)
  b = parseInt(b).toString(16).padStart(2,0)
  return '0x'+r+g+b
}

function send(msg) {
  ws.send(JSON.stringify(msg))
}
