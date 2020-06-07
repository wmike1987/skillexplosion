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
                id: 'mainData' + i,
                data: data,
                offset: offset,
                scale: scale,
                stage: stage,
                sortYOffset: options.sortYOffset || 0,
            })
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
            })
        }

        this.body.renderChildren = rchildren;

        // make non-colliding body
        if(!options.collides)
            this.body.collisionFilter.category = 0;

        this.initialize = function() {
            currentGame.addBody(this.body);
            this.initialized = true;
        }

        //automatically add if specified
        if(options.autoAdd) {
            this.initialize();
        }

        this.cleanUp = function() {
            currentGame.removeBody(this.body);
        }
    }

    return doodad;
})
