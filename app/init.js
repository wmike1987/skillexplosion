import * as $ from 'jquery'
import * as PIXI from 'pixi.js'

$(document).ready(async function() {
    window.PIXI = PIXI;
    await import('pixi-layers');
    await import('pixi-spine');
    //anoint button
    $('#simpleTargets').click(() => {
        import('@games/Simple_Target.js').then((module) => {
            module.default.initializeGame();
        })
    })
});
