import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {globals} from '@core/Fundamental/GlobalState.js';

//This module represents a doodad (a physical, non-unit body, which can have properties)
/*
*   options = {
*       collides: boolean (default false)
*       bodyScale: {x, y}
*       bodyRotate: float (degrees)
*       pathingBlocker: boolean (default true)
*       radius: float
*       sightBlocker: boolean (default false)
*       texture: texture to be used
*       position: {x, y} (default: random placement within canvas bounds)
*       scale: {x, y}
*       shadowScale: {x, y}
*       shadowOffset: {x, y}
*       autoAdd: boolean (default true)
*   }
*/
var Doodad = function(options) {
    this.rebuildOptions = Object.assign({}, options);
    options = Object.assign({pathingBlocker: true, autoAdd: true, sightBlocker: false, collides: true}, options);

    // create body
    this.body = Matter.Bodies.circle(-5000, -5000, options.radius, {
        isStatic: true,
    });

    if(options.bodyScale) {
        Matter.Body.scale(this.body, options.bodyScale.x || 1, options.bodyScale.y || 1);
    }

    //default position
    if(!options.position) {
        options.position = gameUtils.calculateRandomPlacementForBodyWithinCanvasBounds(this.body, true);
    }

    Matter.Body.setPosition(this.body, options.position);
    this.position = this.body.position;
    this.rebuildOptions.position = this.position;

    if(options.bodyRotate) {
        Matter.Body.rotate(this.body, options.bodyRotate);
    }

    if(options.drawWire) {
        this.body.drawWire = true;
    }

    //get textures
    var rchildren = [];
    if(!Array.isArray(options.texture)) {
        options.texture = [options.texture];
    }

    options.texture.forEach((item, i) => {
        var data = item;
        var offset = options.offset || {x: 0, y: 0};
        var scale = item.scale || options.scale || {x: 1, y: 1};
        var stage = item.where || options.stage || 'foreground';
        if(item.doodadData) {
            data = item.doodadData;
            offset = item.offset || offset;
            scale = item.scale || scale;
            stage = item.stage || stage;
        }
        rchildren.push({
            id: item.name || 'mainData' + i,
            data: data,
            offset: offset,
            rotate: 'none',
            scale: scale,
            stage: stage,
            sortYOffset: options.sortYOffset || 0,
        });
    });

    if(!options.noShadow) {
        rchildren.push({
            id: 'shadow',
            data: options.shadowIcon || 'IsoShadowBlurred',
            scale: options.shadowScale || {x: 1, y: 1},
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: options.shadowOffset || {x: 0, y: 0}
        });
    }

    this.body.renderChildren = rchildren;

    // make non-colliding body
    if(!options.collides) {
        this.body.collisionFilter.category = 0;
    }

    this.initialize = function() {
        globals.currentGame.addBody(this.body);
        this.initialized = true;
    };

    //automatically add if specified
    if(options.autoAdd) {
        this.initialize();
    }

    this.cleanUp = function() {
        globals.currentGame.removeBody(this.body);
    };

    this.rebuild = function() {
        return new Doodad(this.rebuildOptions);
    };
};

export {Doodad};
