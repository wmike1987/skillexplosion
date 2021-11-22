import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';

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
    this.isDoodad = true;
    options = Object.assign({
        pathingBlocker: true,
        autoAdd: true,
        sightBlocker: false,
        collides: true,
        scale: {
            x: 1,
            y: 1
        },
        noZone: null
    }, options);
    if(options.collides) {
        this.collides = true;
    }
    this.loneNZRadius = options.loneNZRadius;
    if (!options.scale.x) {
        options.scale = {
            x: options.scale,
            y: options.scale
        };
    }
    if (options.randomHFlip) {
        if (mathArrayUtils.flipCoin()) {
            options.scale.x *= -1;
        }
    }

    //create noZone
    if (options.noZone) {
        this.noZone = options.noZone;
    }

    // create body
    this.body = Matter.Bodies.circle(-5000, -5000, options.radius, {
        isStatic: true,
    });

    if (options.bodyScale) {
        Matter.Body.scale(this.body, options.bodyScale.x || 1, options.bodyScale.y || 1);
    }

    //default position
    if (!options.position) {
        options.position = gameUtils.calculateRandomPlacementForBodyWithinCanvasBounds(this.body, true);
    }

    Matter.Body.setPosition(this.body, options.position);
    this.position = this.body.position;
    this.rebuildOptions.position = this.position;

    if (options.bodyRotate) {
        Matter.Body.rotate(this.body, options.bodyRotate);
    }

    if (options.drawWire) {
        this.body.drawWire = true;
    }

    //get textures
    var rchildren = [];
    if (!Array.isArray(options.texture)) {
        options.texture = [options.texture];
    }

    options.texture.forEach((item, i) => {
        var data = item;
        var offset = item.offset || options.offset || {
            x: 0,
            y: 0
        };
        var scale = item.scale || options.scale;
        var stage = item.where || options.stage || 'foreground';
        var tint = options.tint || 0xffffff;
        var alpha = item.alpha || options.alpha || 1;
        if (item.doodadData) {
            data = item.doodadData;
            offset = item.offset || offset;
            stage = item.stage || stage;
        }
        rchildren.push({
            id: item.name || 'mainData' + i,
            data: data,
            offset: mathArrayUtils.cloneVector(offset),
            alpha: alpha,
            rotate: 'none',
            scale: mathArrayUtils.cloneVector(scale),
            stage: stage,
            tint: tint,
            sortYOffset: options.sortYOffset || 0,
        });
    });

    if (!options.noShadow) {
        rchildren.push({
            id: 'shadow',
            alpha: options.shadowAlpha || 1.0,
            data: options.shadowIcon || 'IsoShadowBlurred',
            scale: mathArrayUtils.cloneVector(options.shadowScale) || {
                x: 1,
                y: 1
            },
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: mathArrayUtils.cloneVector(options.shadowOffset) || {
                x: 0,
                y: 0
            }
        });
    }

    //for debugging

    // if(options.noZone) {
    //     rchildren.push({
    //         id: 'shadow2',
    //         data: 'MineZero',
    //         scale: options.shadowScale || {
    //             x: 1,
    //             y: 1
    //         },
    //         visible: true,
    //         avoidIsoMgr: true,
    //         rotate: 'none',
    //         stage: "hud",
    //         offset: options.noZone.offset
    //     });
    // }

    this.body.renderChildren = rchildren;

    // make non-colliding body
    if (!options.collides) {
        this.body.collisionFilter.category = 0;
    }

    this.initialize = function() {
        globals.currentGame.addBody(this.body);
        this.initialized = true;
    };

    //automatically add if specified
    if (options.autoAdd) {
        this.initialize();
    }

    this.cleanUp = function() {
        globals.currentGame.removeBody(this.body);
    };

    this.rebuild = function() {
        return new Doodad(this.rebuildOptions);
    };

    this.setPosition = function(position) {
        Matter.Body.setPosition(this.body, position);
        this.position = this.body.position;
    };
};

Doodad.prototype.getNoZone = function() {
    if (this.noZone) {
        return {
            offset: this.noZone.offset,
            center: Matter.Vector.add(this.position, this.noZone.offset),
            radius: this.noZone.radius
        };
    } else if(this.collides) {
        return {
            offset: this.offset || {x: 0, y: 0},
            center: Matter.Vector.add(this.position, this.offset || {x: 0, y: 0}),
            radius: this.loneNZRadius || 60
        };
    } else {
        return {
            offset: this.offset || {x: 0, y: 0},
            center: Matter.Vector.add(this.position, this.offset || {x: 0, y: 0}),
            radius: 0
        };
    }
};

Doodad.prototype.collidesInTheory = function(myPosition, otherNoZone) {
    var offset = this.noZone ? this.noZone.offset : this.offset || {x: 0, y: 0};
    var radius = this.noZone ? this.noZone.radius : this.loneNZRadius || 60;
    if(!this.collides) {
        radius = 30;
    }
    var theoreticalNoZone = {center: Matter.Vector.add(myPosition, offset), radius: radius};
    return gameUtils.detectNoZoneCollision(theoreticalNoZone, otherNoZone);
};

Doodad.prototype.clone = function() {
    return new Doodad(this.rebuildOptions);
};

export {
    Doodad
};
