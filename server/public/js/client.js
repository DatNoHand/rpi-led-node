var ws
var lights_on = false;
var color
var wall_data = []
var led_color
var lamp_off_color = '#707070'
var tries = 0
var live = false
var drawn = false

let ok = DrawPage('main')
if (ok) {
  Start()
} else { setTimeout(() => { Start() }), 20}

function Start() {
  if (tries > 10) reload()
  ws = new WebSocket('ws://'+window.location.host)

  ws.onclose = function() {
    ws = null
    if (live) {
      setTimeout(() => { Start() }, 1000);
    } else {
      reload()
    }
  }

  // Server Messages
  ws.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    console.log(msg)

    switch(msg.type) {
      case 'status':
        lights_on = msg.on
        led_color = '#' + msg.color
        color = msg.color
        wall_data = msg.wall_data
        $('div.colorreference').css({'background-color': color})

        if (!drawn) DrawWall()
        Lamp(lights_on)
        UpdateWalls()

        $('#br').attr('max', msg.max)

        setBg(msg.favorites)
      break;
    }
  }

  tries++
}

/** Reloads the current page */
function reload() {
  window.location.href = window.location
}

/**
 * @param {string} _text - The string to work with
 */
function Text(_text) {
  this.lines = _text.split('\n')
  this.lineCount = _text.split('\n').length

/**
 * Run the function for each line in the passed text
 * @callback doForEachLine
 * @param {doForEachLine} cb - Callback function to run for each line
 */
  this.foreach = (cb) => {
    for (let i = 0; i < this.lineCount; i++) {
      cb(this.lines[i])
    }
  }
}

/**
 * Loads _name.tbd from server/public/pages/ and draws it
 * @param {string} _name - Filename to load, without extension
 */
function DrawPage(_name) {
  let data = false
  let req_url = window.location + 'pages/' + _name + '.tbd'

  // Check if the requested page exists
  return $.ajax({
    url: req_url,
    success: (data) => {
      // If the page exists, draw it into <div class='b'>
      Draw(data)
    }
  })
}

/**
 * Appends html to a div
 * @param {string} _html - The string to append must be HTML
 */
function Draw(html) {
  $('div.b').html(html)
}

function DrawWall() {
  // Draw wall buttons depending on how many are set in server/config/config.js
  for (let i = 0; i < wall_data.length; i++) {
    $('div.wallholder').children().eq(0).append("<div class='col animate infinite wobble wall' data-wall='"+(i+1)+"'></div>")
  }
  $('div.wallholder').children().eq(0).append("<div class='hidden colorreference' hidden></div>")

  drawn = true
}

// Button handlers
$('div.b').on('input', '#br', function () {
  SendBrightness($(this).val())
})

$('div.b').on('click', '.button.amount', function () {
  let bright = $('#br').val()
  let amount = $(this).attr('data-amount')
  SetLed(bright, amount)
})

$('div.b').on('click', '.button.preset', function () {
  LoadPreset($(this).attr('data-preset'))
})


// On Wall button click
$('div.b').on('click', 'div.wall', function () {
  // Set Background color of clicked element
  var col_reference = $('div.colorreference')
  var index = $(this).attr('data-wall') - 1
  col_reference.css({'background-color': color})

  if (($(this).attr('data-active') == undefined) || ($(this).css('background-color') != col_reference.css('background-color'))) {
    $(this).attr('data-active', 1)
    $(this).css({'background-color': color})
  } else {
    $(this).attr('data-active', 0)
    $(this).css({'background-color': '#212121'})
  }

  if ($(this).attr('data-active') == 1) {
    wall_data[index][0] = true
    wall_data[index][1] = color
  } else {
    wall_data[index][0] = false
  }
})

// Longpress to show colorpicker
var timer
$('div.b').on('mousedown', '.color', function (e) {
  timer = setTimeout(() => {
    $('.button.colpicker').click();
  }, 400)
  e.preventDefault()
}).on('mouseup mouseleave', () => {
  clearTimeout(timer)
})

$('div.b').on('click', '.color', function () {
  color = $(this).attr('data-color')
})

$('div.b').on('contextmenu', '.color', function (e) {
  $('input.button.colpicker').click();
  e.preventDefault()
})

// On / Off Button default to 'Ambient'
$('div.b').on('click', '#onOff', function () {
  var bright = $('#br').val()
  if (!lights_on)
    SetLed(bright, 5)
  OnOnOffClick()
});

$('div.b').on('click', '.button.colpicker', function (e) {
  color = $(this).val().slice(1,7)
})

function UpdateWalls() {
  for (let i = 0; i < wall_data.length; i++) {
    var wall = $('div.wall').eq(i)

    if ((wall != null) && (wall_data[i] != null)) {
      if (wall_data[i][0] == 1) {
        wall.css({'background-color': wall_data[i][1] })
        wall.attr('data-active', 1)
      } else {
        wall.css({'background-color': '#212121'})
        wall.attr('data-active', 0)
      }
    }
  }
}

// Set BG Color of the color buttons, based on what the server sent
function setBg(colors) {
  $('body').css({color: led_color})
  $('input.button.colpicker').val(led_color)

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
  if (lights_on) SendOff();
}

// End Button handlers
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Begin LED functions

function SetLed(bright, amount, _on = true) {
  if (!_on) {
    for (let i = 0; i < wall_data; i++) {
      wall_data[i][0] = _on
    }
  } else {
    // wall_data: [ bool on, string color, int amount]
    for (let i = 0; i < wall_data.length; i++) {
      wall_data[i][2] = amount
    }
  }
  SendBrightness(bright)
  console.log(wall_data)
  send({type: 'led', wall_data: wall_data})
}

function SendBrightness(bright) {
  send({type: 'brightness', bright: bright})
}

function SendOff() {
  send({type: 'off'})
}

function ledRainbow(bright) {
  SendBrightness(bright)
  send({type: 'special', mode: 'rainbow', arg: {speed: 50}})
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
