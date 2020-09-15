import * as $ from 'jquery'
import * as PIXI from 'pixi.js'

$(document).ready(async function() {
    window.PIXI = PIXI;
    await import('pixi-layers');
    await import('pixi-spine');
    await import('pixi-particles');

    //anoint button
    $('#simpleTargets').click(() => {
        import('@games/Simple_Zarya.js').then((module) => {
            module.default.initializeGame();
        })
    })
});
