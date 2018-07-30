var ws
var lights_on = false;
var color
var walls = []
var led_color
var lamp_off_color = '#707070'
var tries = 0

Start()

function Start() {
  if (tries > 10) window.location.href = window.location
  ws = new WebSocket('ws://'+window.location.host)

  ws.onclose = function() {
    ws = null
    setTimeout(() => { Start() }, 1000);
  }

  ws.onerror = function(err) {
    ws = null
    setTimeout(() => { Start() }, 1000);
  };

  // Server Messages
  ws.onmessage = function(e) {
    var msg = JSON.parse(e.data);

    switch(msg.type) {
      case 'status':
        lights_on = msg.on
        led_color = '#' + msg.color
        walls = msg.walls_active

        Lamp(lights_on)
        UpdateColors()

        $('#br').attr('max', msg.max)

        setBg(msg.favorites)
      break;
    }
  }
  tries++
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
  ledAmount(bright, color, amount, wall)
})

$('.button.wall').on('click', function () {
  wall = $(this).attr('data-wall')
  if ($(this).attr('data-active') === null) {
    $(this).attr('data-active', 1)
  } else {
    $(this).attr('data-active', 0)
  }
})

// Longpress to show colorpicker
var timer
$('div.color.animate.infinite.wobble').on('mousedown touchstart', function (e) {
  timer = setTimeout(() => {
    $('input.button.colpicker').click();
  }, 400)
  e.preventDefault()
}).on('mouseup mouseleave touchend', () => {
  clearTimeout(timer)
})

$('div.color.animate.infinite.wobble').on('click', function () {
  color = $(this).attr('data-color')
})

$('div.color.animate.infinite.wobble').on('contextmenu', function (e) {
  $('input.button.colpicker').click();
  e.preventDefault()
})

// On / Off Button default to 'Ambient'
$('#onOff').click(function () {
  var bright = $('#br').val()
  if (!lights_on)
    ledAmount(bright, color, 5)
  OnOnOffClick()
});

$('input.button.colpicker').on('change', function (e) {
  color = $(this).val().slice(1,7)
})

function UpdateColors() {
  $('body').css({color: led_color})
  $('input.button.colpicker').val(led_color)

  for (let i = 0; i < walls.length; i++) {
    let wall = $('div.col.animate.infinite.wobble').eq(i)
    if ((wall != null) && (walls[i] != null)) {
      if (walls[i][0] == 1) {
        wall.css({'background-color', walls[i][1]})
      } else {
        wall.css({'background-color', lamp_off_color})        
      }
    }
  }
}

// Set BG Color of the color buttons, based on what the server sent
function setBg(colors) {
  // Get the amount of color buttons that we have
  let amount = 0
  $('div.color.animate.infinite.wobble').each(() => { amount++ })

  // For Each entry in colors array from the Server
  for (var i = 0; i < amount; i++) {
    // If the server sent more than we can use return
    let c = colors[i]
    let current = $('div.color.animate.infinite.wobble').eq(i)
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

function rgbToHex(r, g, b) {
  r = parseInt(r).toString(16).padStart(2,0)
  g = parseInt(g).toString(16).padStart(2,0)
  b = parseInt(b).toString(16).padStart(2,0)
  return '0x'+r+g+b
}

function send(msg) {
  if (ws.readyState && (ws != null)) ws.send(JSON.stringify(msg))
}
