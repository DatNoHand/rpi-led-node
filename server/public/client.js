var ws = new WebSocket('ws://'+window.location.host)

ws.onopen = () => {
  ws.send(JSON.stringify({type: 'msg', txt: 'RANDOM NOISES', arg: Date.now()}))
}

ws.onmessage = (msg) => {
  if (msg.type == 'status' && msg.txt != 'ok')
    alert(msg.txt)
}


$('button.color').on('click', function () {
  var color = $(this).data('color')
  var bright = $('#br').val()

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
  ledRainbow(bright)
})

function send(msg) {
  ws.send(JSON.stringify(msg))
}

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

function led_epilepsy() {
  br = $('#br').val();

  $.ajax({
  type: "POST",
  url: '/api.php',
  dataType: 'json',
  data: {
      func: 'led_epilepsy',
      bright: br
  },
  });
}

function led_color_man() {
  red = $('#red').val();
  green = $('#green').val();
  blue = $('#blue').val();

  br = $('#br').val();

  $.ajax({
  type: "POST",
  url: '/api.php',
  dataType: 'json',
  data: {
      func: 'led_color_man',
      red: red,
      green: green,
      blue: blue,
      bright: br
  },
  });
}

function led_color_hex() {
  hex = $('#hex').val();
  br = $('#br').val();

  r = hexToRgb(hex).r;
  g = hexToRgb(hex).g;
  b = hexToRgb(hex).b;

  $.ajax({
  type: "POST",
  url: '/api.php',
  dataType: 'json',
  data: {
      func: 'led_color_man',
      red: red,
      green: green,
      blue: blue
  },
  });
}

function led_ambient() {
  br = $('#br').val();

  $.ajax({
  type: "POST",
  url: '/api.php',
  dataType: 'json',
  data: {
      func: 'led_ambient',
      bright: br
  },
  });
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
