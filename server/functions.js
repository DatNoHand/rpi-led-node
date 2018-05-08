function sleep(ms) {
  return setTimeout(() => {}, ms);
}

function ledOff() {
  for (var i = 0; i < config.led.num; i++)  {
    pixelData[i] = '0x000000'
  }
  strip.render(pixelData)
}

function ledSpecial(bright = config.led.brightness, mode, arg) {
  strip.setBrightness(parseInt(bright))

  switch (mode) {
    case 'fancy':
    for (var i = 0; i < config.led.num; i++) {
      pixelData[i] = config.mode.fancy.color
    }
    strip.render(pixelData);

    loop = setInterval(() => {
      sleep(config.mode.fancy.delay)
      strip.setBrightness(0)
      sleep(config.mode.fancy.delay)
      strip.setBrightness(parseInt(bright))
    }, 1000 / 30);

    break;
    case 'ambient':
    for (var i = 0; i < config.led.num; i+=5)  {
      pixelData[i] = config.mode.ambient.color
    }
    strip.render(pixelData)
    break;
    case 'rainbow':
      loop = setInterval(() => { ledRainbow(10) }, 5000)
    break;
    case 'rider':
      loop = setInterval(() => { ledRider(config.mode.rider.color, 100)})
    break;
  }
}

function ledColorMan(bright = config.led.brightness, r, g, b) {
  strip.setBrightness(parseInt(bright))
  color = rgbToHex(r, g, b)
  for (i = 0; i < config.led.num; i++) {
    pixelData[i] = color
  }
  strip.render(pixelData)
}

function ledColor(bright = config.led.brightness, color) {
  strip.setBrightness(parseInt(bright))

  for (i = 0; i < config.led.num; i++) {
    pixelData[i] = color
  }
  strip.render(pixelData)
}

function wheel (pos) {
  if (pos < 85) {
    return '0x'+(255-pos*3).toString(16)+(pos*3).toString(16)+'00'
  } else if (pos < 170) {
    pos -= 85
    return '0x'+'00'+(255-pos*3).toString(16)+(pos*3).toString(16)
  } else {
    pos -= 170
    return '0x'+(pos*3).toString(16)+'00'+(255-pos*3).toString(16)
  }
}

function ledRainbow(iterations) {
  for (var i = 0; i < 256*iterations; i++) {
    for (var j = 0; j < NUM_LEDS; j++) {
      pixelData[j] = wheel(parseInt(j*256 / NUM_LEDS + i) & 255)
    }
    strip.render(pixelData)
  }
  sleep(50)
}

function ledRider(color, wait_ms) {
  for (var i = 0; i < conifg.led.num; i++) {
    pixelData[i] = color
    strip.render(pixelData)
    sleep(wait_ms)
    pixelData[i] = '0x000000'
    pixelData[i-1] = '0x000000'
  }

  for (var i = config.led.num; i > 0; i--) {
    pixelData[i] = color
    strip.render(pixelData)
    sleep(wait_ms)
    pixelData[i] = '0x000000'
    pixelData[i+1] = '0x000000'
  }
}



function rgbToHex(r, g, b) {
  r = parseInt(r).toString(16)
  g = parseInt(g).toString(16)
  b = parseInt(b).toString(16)
  return color = '0x'+r+g+b
}
