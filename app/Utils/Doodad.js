define(['jquery', 'utils/GameUtils', 'matter-js'], function($, utils, Matter) {

    //This module represents a doodad (a physical, non-unit body, which can have properties)
    /*
    *   options = {
    *       collides: boolean (default false)
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
    var doodad = function(options) {
        var options = $.extend({pathingBlocker: true, autoAdd: true, sightBlocker: false, collides: false}, options);

        // create body
        this.body = Matter.Bodies.circle(-5000, -5000, options.radius, {
            isStatic: true,
        });

        //default position
        if(!options.position) {
            options.position = utils.calculateRandomPlacementForBodyWithinCanvasBounds(this.body, true);
        }

        Matter.Body.setPosition(this.body, options.position);

        if(options.drawWire)
            this.body.drawWire = true;

        //setup the body's render children
        this.body.renderChildren = [{
            data: options.texture,
            offset: options.offset || {x: 0, y: 0},
            scale: options.scale,
            stage: options.stage || 'foreground',
            sortYOffset: options.sortYOffset || 0,
        },
        {
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: options.shadowScale || {x: 1, y: 1},
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageZero",
            offset: options.shadowOffset || {x: 0, y: 0}
        }
        ]

        // make non-colliding body
        if(!options.collides)
            this.body.collisionFilter.category = 0;

        //automatically add if specified
        if(options.autoAdd) {
            currentGame.addBody(this.body);
        }
    }

    return doodad;
})
