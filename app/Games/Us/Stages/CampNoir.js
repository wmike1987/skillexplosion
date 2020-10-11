import * as $ from 'jquery'
import * as Matter from 'matter-js'
import * as PIXI from 'pixi.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import CommonCamp from './CommonCampMixin.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import utils from '@utils/GameUtils.js'
import campfireShader from '@shaders/CampfireAtNightShader.js'
import valueShader from '@shaders/ValueShader.js'
import TileMapper from '@core/TileMapper.js'
import Doodad from '@utils/Doodad.js'
import Scene from '@core/Scene.js'
import Map from '@games/Us/Map.js'

var camp = {
    tileSize: 225,
    getBackgroundTiles: function() {
        var backgroundTiles = [];
        for(var i = 1; i <= 6; i++) {
            backgroundTiles.push('FrollGround/Dirt'+i);
        }
        return backgroundTiles;
    },

    _tileMapExtension: function(scene) {
        var ornamentTiles = [];
        for(var i = 1; i <= 4; i++) {
            ornamentTiles.push('FrollGround/Ornament'+i);
        }
        var ornamentMap = TileMapper.produceTileMap({possibleTextures: ornamentTiles, tileWidth: this.tileSize, hz: .5});
        scene.add(ornamentMap);
    },

    getPossibleTrees: function() {
        return ['avgoldtree1', 'avgoldtree2', 'avgoldtree3', 'avgoldtree4', 'avgoldtree5', 'avgoldtree6'];
    },

    getCampObjects: function() {
        var objs = [];
        var tent = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 120, texture: ['Tent'], stage: 'stage',
            scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 30}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
            position: {x: utils.getCanvasCenter().x-150, y: utils.getPlayableHeight()-500}})
        objs.push(tent);

        var sleepingbags = new Doodad({drawWire: false, collides: false, autoAdd: false, radius: 15, texture: 'SleepingBags',
            stage: 'stage', scale: {x: 1.4, y: 1.4}, offset: {x: 0, y: 0}, sortYOffset: -99999,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
            position: {x: utils.getCanvasCenter().x+150, y: utils.getPlayableHeight()-350}})
        objs.push(sleepingbags);

        var gunrack = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 10, texture: 'gunrack',
            stage: 'stage', scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 0}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -2, y: 15},
            position: {x: utils.getCanvasCenter().x-180, y: utils.getPlayableCenter().y-30}})
        objs.push(gunrack);

        return objs;
    },
}
Object.assign(camp, CommonCamp);

var map = {
    options: {
        levelSpecification: {
            singles: 26,
            doubles: 1,
            boss: 1,
            norevives: 1,
            mobs: 1
        }
    },

    initializeMap: function() {
        return new Map(this.options);
    }
}


export {camp, map};
