var clicked = false;
$('#onOff').click(function () {
    if (clicked === true) {
        $(this).css('transform', 'scale(1)');
        $('svg').css('color', '#707070')
        clicked = false;
    }
});

$('.color, .effect').click(function () {
    if (clicked === false) {
        $('#onOff').css('transform', 'scale(1.2)');
        $('svg').css('color', 'yellow')
        clicked = true;
    }
});
