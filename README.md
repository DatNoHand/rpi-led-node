# rpi-led-node
Controls a ws281x LED strip via nodejs + express.

## Installation

```bash
git clone https://github.com/datnohand/rpi-led-node.git
cd rpi-led-node
npm install

```
## Configuration

Config file location
``` server/config/config.js ```

Under 'LED config', change
``` config.led.num ```
to the amount of LEDs you have

Under 'Walls config' change
``` config.walls ```

to the last LED of every wall you have.
So if you have a 20x20 square it would look like this:

``` config.walls = [ 20, 40, 60 ] ```

## Run
Run the program with one of the following commands:

* node server/server
* nodejs server/server
* nodemon server/server

After everything has been initialized successfully all LEDs will turn green.
> config.led.ready_color

## Usage
1. Open the IP-Address of your Raspberry Pi in any modern Browser
> config.led.port
1. Choose a (or multiple) colors from the center color pads OR
1. Choose a color with the colorpicker which is directly under the lightbulb
1. Now that you have a color selected look a bit down and there you should see four squares lined up. Those are the four walls you may or may not have in your room
1. Select which wall(s) you want to have in that color you've just selected
1. You can choose a different color for every wall.
1. To turn off a wall just press the button for that wall again. The square will be darkened out
1. Now you can select the brightness value with the slider
1. If you are happy with your colors, choose if you want to have all LEDs turn on or every 5th or 10th.
1. Enjoy
