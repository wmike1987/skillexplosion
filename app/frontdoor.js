import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import {globals} from '@core/GlobalState.js'
import collisionPlugin from '@lib/matter-collision-events/plugin.js'
import * as particles from 'pixi-particles'
import polydecomp from 'poly-decomp'

$(document).ready(async function() {
    window.PIXI = PIXI;
    PIXI.particles = particles;
    window.decomp = polydecomp;
    await import(/* webpackChunkName: "pixi-layers" */'pixi-layers');
    await import(/* webpackChunkName: "pixi-spine" */'pixi-spine');

    Matter.use('matter-collision-events');

    //anoint button
    $('.game').each((i, gameElement) => {
        let gameName = $(gameElement).attr('name');
        // $(gameElement).text(gameName);
        $(gameElement).click(() => {
            if(globals.currentGame) {
                globals.currentGame.nuke({noMercy: true})
            }
            import(/* webpackChunkName: "[request]" */ /* webpackInclude: /(SequenceMatch)+.js$/ */'@games/' + gameName + '.js').then((module) => {

                module.default.loadGame();
            })
        })
    })
});
