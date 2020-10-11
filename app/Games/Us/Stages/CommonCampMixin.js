import * as $ from 'jquery'
import * as Matter from 'matter-js'
import * as PIXI from 'pixi.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js'
import utils from '@utils/GameUtils.js'
import campfireShader from '@shaders/CampfireAtNightShader.js'
import valueShader from '@shaders/ValueShader.js'
import TileMapper from '@core/TileMapper.js'
import Doodad from '@utils/Doodad.js'
import Scene from '@core/Scene.js'

/* options
 * start {x: , y: }
 * width, height
 * density (0-1)
 * possibleTrees []
 */
var fillAreaWithTrees = function(options) {
    var trees = [];
    for(var x = options.start.x; x < options.start.x+options.width; x+=(220-options.density*200)) {
        for(var y = options.start.y; y < options.start.y+options.height; y+=(220-options.density*200)) {
            var tree = new Doodad({collides: true, autoAdd: false, radius: 120, texture: 'Doodads/'+utils.getRandomElementOfArray(options.possibleTrees), stage: 'stageTwo', scale: {x: 1.1, y: 1.1}, offset: {x: 0, y: -75}, sortYOffset: 75,
            shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 4, y: 4}, shadowOffset: {x: -6, y: 20}, position: {x: x+(Math.random()*100 - 50), y: y+(Math.random()*80 - 40)}})
            trees.push(tree);
        }
    }
    return trees;
};

export default {
    initializeCamp: function() {
        var campScene = new Scene();

        //grab stuff from inheriters
        var tileWidth = this.tileSize;
        var backgroundTiles = this.getBackgroundTiles();

        //Init ground
        var tileMap = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth});
        campScene.add(tileMap);

        if(this._tileMapExtension) {
            this._tileMapExtension(campScene);
        }

        //Init camp objects
        this.getCampObjects().forEach((obj) => {
            campScene.add(obj);
        })

        //Init trees/doodads
        var possibleTrees = this.getPossibleTrees();
        var treeOptions = {};
        treeOptions.start = {x: 0, y: 0};
        treeOptions.width = 300;
        treeOptions.height = utils.getPlayableHeight()+50;
        treeOptions.density = .3;
        treeOptions.possibleTrees = possibleTrees;
        campScene.add(fillAreaWithTrees(treeOptions));

        treeOptions.start = {x: utils.getPlayableWidth()-200, y: 0};
        campScene.add(fillAreaWithTrees(treeOptions));

        //Init common doodads
        var flag = utils.getAnimationB({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'wflag',
            speed: .2,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flag.play();
        var flag = new Doodad({collides: true, autoAdd: false, radius: 20, texture: [flag], stage: 'stage',
        scale: {x: 1, y: 1}, shadowOffset: {x: 0, y: 30}, shadowScale: {x: .7, y: .7}, offset: {x: 0, y: 0}, sortYOffset: 35,
        position: {x: utils.getCanvasCenter().x+50, y: utils.getCanvasCenter().y-175}})
        campScene.add(flag);

        var fireAnimation = utils.getAnimationB({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'campfire',
            speed: .75,
            loop: true,
            transform: [0, 0, 1.2, 1.3]
        });
        fireAnimation.where = 'stageOne';
        fireAnimation.play();
        var campfire = new Doodad({collides: true, autoAdd: false, radius: 40, texture: [fireAnimation, {doodadData: 'Logs', offset: {x: 2, y: 0}}], stage: 'stageNOne',
            scale: {x: 1.4, y: 1.4}, shadowOffset: {x: 0, y: 25}, shadowScale: {x: 1.3, y: 1.3}, offset: {x: 0, y: 0}, sortYOffset: 35,
            position: {x: utils.getCanvasCenter().x, y: utils.getCanvasCenter().y-40}})
        campScene.add(campfire);
        this.campfire = campfire;

        //Add map
        var mapTableSprite = utils.createDisplayObject('MapTable');
        var mapTable = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 30, texture: [mapTableSprite], stage: 'stage',
        scale: {x: 1.2, y: 1.2}, offset: {x: 0, y: 0}, sortYOffset: 0,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.3, y: 1.3}, shadowOffset: {x: 0, y: 15},
        position: {x: utils.getCanvasCenter().x-130, y: utils.getPlayableHeight()-190}})
        campScene.add(mapTable);

        var mapHoverTick = globals.currentGame.addTickCallback(function(event) {
            if(Matter.Vertices.contains(mapTable.body.vertices, mousePosition)) {
                mapTableSprite.tint = 0xff33cc;
            } else {
                mapTableSprite.tint = 0xFFFFFF;
            }
        }.bind(this));

        //Establish map click listeners
        var mapClickListener = globals.currentGame.addPriorityMouseDownEvent(function(event) {
            var canvasPoint = {x: 0, y: 0};
            utils.pixiPositionToPoint(canvasPoint, event);

            if(Matter.Vertices.contains(mapTable.body.vertices, canvasPoint) && !this.mapActive && this.campActive) {
                this.openmap.play();
                this.unitSystem.pause();
                this.map.show();
                this.mapActive = true;
            }
        }.bind(globals.currentGame));

        $('body').on('keydown.map', function( event ) {
            var key = event.key.toLowerCase();
            if(key == 'escape' && this.mapActive) {
                this.deactivateMap();
            }
        }.bind(globals.currentGame))

        //Apply environment effects
        var l1 = utils.createAmbientLights([0x080C09, 0x080C09, 0x080C09, 0x080C09, 0x080C09], 'backgroundOne', .5);
        campScene.add(l1);
        var l2 = utils.createAmbientLights([0x0E5B05, 0x03491B, 0x0E5B05, 0x03491B, 0x0E5B05], 'backgroundOne', .6);
        campScene.add(l2);

        //Setup light
        this.lightPower = 0.0;
        this.lightDirection = 1;
        this.lightRadius = 700;

        var backgroundRed = 4.0;
        this.backgroundLightShader = new PIXI.Filter(null, campfireShader, {
            lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
            flameVariation: 0.0,
            yOffset: 0.0,
            red: backgroundRed,
            green: 1.0,
            blue: 1.0,
            lightPower: 2.0,
        });

        var stageRed = 3.4;
        this.stageLightShader = new PIXI.Filter(null, campfireShader, {
            lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
            flameVariation: 0.0,
            yOffset: 30.0,
            red: stageRed,
            green: 1.5,
            blue: 1.0,
            lightPower: 2.0,
        });
        this.treeShader = new PIXI.Filter(null, valueShader, {
            colors: [0.4, 0.4, 2.0]
        });
        this.treeShader.myName = 'treeShader';
        this.backgroundLightShader.myName = 'campfire';
        this.backgroundLightShader.uniforms.lightRadius = this.lightRadius;
        if(true) {
            globals.currentGame.renderer.layers.background.filters = [this.backgroundLightShader];
            globals.currentGame.renderer.layers.stage.filters = [this.stageLightShader];
            globals.currentGame.renderer.layers.stageTwo.filters = [this.treeShader];
            var flameTimer = globals.currentGame.addTimer({
                name: 'flame',
                gogogo: true,
                timeLimit: 90,
                callback: function() {
                    //Reverse light direction over time
                    if(!this.lightPower)
                        this.lightPower = 0.0;
                    this.lightPower += (.02+Math.random()*.045)*this.lightDirection;
                    if(this.lightPower < 0.0) {
                        this.lightDirection = 1;
                    } else if(this.lightPower > 2.5) {
                        this.lightDirection = -1;
                    }

                    this.backgroundLightShader.uniforms.flameVariation = this.lightPower;
                    this.stageLightShader.uniforms.flameVariation = this.lightPower;
                    this.backgroundLightShader.uniforms.red = backgroundRed + this.lightPower/2;
                    this.stageLightShader.uniforms.red = stageRed + this.lightPower*1.05;
                }.bind(this)
            })

            this.backgroundLightShader.uniforms.lightRadius = this.lightRadius;
            this.stageLightShader.uniforms.lightRadius = this.lightRadius;
        }

        campScene._clearExtension = function() {
            this.removeTickCallback(mapHoverTick);
            this.removePriorityMouseDownEvent(mapClickListener);
            this.renderer.layers.background.filters = [];
            this.renderer.layers.stage.filters = [];
            this.renderer.layers.stageTwo.filters = [];
            this.map.hide();
            $('body').off('mousedown.map');
            $('body').off('keydown.map');
        }.bind(globals.currentGame);

        var nextLevelInitiated = false;
        return campScene;

    },

    cleanUp: function() {

    }
}
