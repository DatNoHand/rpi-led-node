var ws = new WebSocket('ws://'+window.location.host)

ws.onopen(() => {
  ws.send(JSON.stringify({type: 'msg', txt: 'RANDOM NOISES', arg: Date.now()}))
})

ws.onmessage((msg) => {
  if (msg.type == 'status' && msg.txt != 'ok')
    alert(msg.txt)
})

$('btn.color').on('click', (e) => {
  var color = $(this.data('color'))
  console.log('Clicked color '+color)
})

function led_color(color) {
  br = $('#br').val();

  $.ajax({
  type: "POST",
  url: '/api.php',
  dataType: 'json',
  data: {
      func: 'led_color',
      color: color,
      bright: br
  },
  });
}

function led_off() {
  $.ajax({
  type: "POST",
  url: '/api.php',
  dataType: 'json',
  data: {
      func: 'led_off',
  },
  });
}

function led_rainbow() {
  br = $('#br').val();

  $.ajax({
  type: "POST",
  url: '/api.php',
  dataType: 'json',
  data: {
      func: 'led_rainbow',
      bright: br
  },
  });
}

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
