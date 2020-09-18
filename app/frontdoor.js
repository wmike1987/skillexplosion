import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import {globals} from '@core/GlobalState.js'
import collisionPlugin from '@lib/matter-collision-events/plugin.js'

$(document).ready(async function() {
    window.PIXI = PIXI;
    await import(/* webpackChunkName: "pixi-layers" */'pixi-layers');
    await import(/* webpackChunkName: "pixi-spine" */'pixi-spine');
    await import(/* webpackChunkName: "pixi-particles" */'pixi-particles');

    Matter.use('matter-collision-events');

    //anoint button
    $('.game').each((i, gameElement) => {
        let gameName = $(gameElement).attr('name');
        $(gameElement).text(gameName);
        $(gameElement).click(() => {
            if(globals.currentGame) {
                globals.currentGame.nuke({noMercy: true})
            }
            import(/* webpackChunkName: "[request]" */ /* webpackInclude: /(Marbles)+.js$/ */'@games/' + gameName + '.js').then((module) => {

                module.default.loadGame();
            })
        })
    })
});
