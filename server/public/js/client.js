var ws = new WebSocket('ws://'+window.location.host)
var lights_on = false;
var color = '0xff0000'
// var arr = JSON.parse(JSON.stringify(
//   {
//     type: 'setup',
//     on: true,
//     lastUsed: []
//   }))

// TODO: _2 Make Color Buttons work (#ez #zufaul)

// Server Messages
// setBg(['00ff00', '0000ff', 'f0f0f0', '8f00ff'])

ws.onmessage = function(e) {
  var msg = JSON.parse(e.data);

  switch(msg.type) {
    case 'status':
      lights_on = msg.on
    break;
    case 'setup':
      lights_on = msg.on
      $('#br').attr('max', msg.max)
      setBg(msg.colors)
    break;
  }
}

// Button handlers

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

$('.button.amount').on('click', function () {
  let amount = $(this).attr('data-amount')
  send()
})

// On / Off Button default to 'Ambient'
$('#onOff').click(function () {
  var bright = $('#br').val()
  ledAmbient(bright)

  OnOnOffClick()
});

// Set BG Color of the color buttons, based on what the server sent
function setBg(colors) {
  // Get the amount of color buttons that we have
  let amount = 0
  $('div.color.infinite.wobble').each(() => { amount++ })

  // For Each entry in colors array from the Server
  let index = 0
  colors.forEach(function(e) {
    // If the server sent more than we can use return
    if (index > amount-1) return

    let current = $('div.color.infinite.wobble').eq(index)
    let c = e
    if (c == undefined) return;

    let r = c.slice(0, 2)
    let g = c.slice(2, 4)
    let b = c.slice(4, 6)

    current.css({'background-color': r+g+b})


    index++
  })

  for (index = 0; index <= amount; index++) {
  }
}

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
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Begin LED functions

function ledAmount(bright, color = '0x0000ff', amount = 2) {
  send({type: 'amount', bright: bright, color: color, amount: amount})
}

function ledOff() {
  send({type: 'off'})
}

function ledRainbow(bright) {
  send({type: 'special', bright: bright, mode: 'rainbow'})
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
