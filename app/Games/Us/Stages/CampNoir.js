import * as $ from 'jquery'
import * as Matter from 'matter-js'
import * as PIXI from 'pixi.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import CommonCamp from './CommonCampMixin.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import campfireShader from '@shaders/CampfireAtNightShader.js'
import valueShader from '@shaders/ValueShader.js'
import TileMapper from '@core/TileMapper.js'
import Doodad from '@utils/Doodad.js'
import Scene from '@core/Scene.js'
import Map from '@games/Us/MapAndLevel/Map/Map.js'

var tileSize = 225;
var acceptableTileTints = [0xad850b, 0x7848ee, 0x990065, 0xbb6205, 0xb0376a];
var levelTiles = function() {
    var backgroundTiles = [];
    for(var i = 1; i <= 6; i++) {
        backgroundTiles.push('FrollGround/Dirt'+i);
    }
    return backgroundTiles;
};

var tileExtension = function(scene, tint) {
    var ornamentTiles = [];
    for(var i = 1; i <= 4; i++) {
        ornamentTiles.push('FrollGround/Ornament'+i);
    }
    var ornamentMap = TileMapper.produceTileMap({possibleTextures: ornamentTiles, tileWidth: tileSize, hz: .5, tileTint: tint});
    scene.add(ornamentMap);
};

var possibleTrees = ['avgoldtree1', 'avgoldtree2', 'avgoldtree3', 'avgoldtree4', 'avgoldtree5', 'avgoldtree6'];

var camp = {
    tileSize: tileSize,
    getBackgroundTiles: levelTiles,
    tileMapExtension: tileExtension,

    initSounds: function() {
        this.entercamp = gameUtils.getSound('entercamp.wav', {volume: .05, rate: .75});
    },

    cleanUpSounds: function() {
        this.entercamp.unload();
    },

    getPossibleTrees: function() {
        return possibleTrees;
    },

    getCampObjects: function() {
        var objs = [];
        var tent = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 120, texture: ['Tent'], stage: 'stage',
            scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 30}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
            position: {x: gameUtils.getCanvasCenter().x-150, y: gameUtils.getPlayableHeight()-500}})
        objs.push(tent);

        var sleepingbags = new Doodad({drawWire: false, collides: false, autoAdd: false, radius: 15, texture: 'SleepingBags',
            stage: 'stage', scale: {x: 1.4, y: 1.4}, offset: {x: 0, y: 0}, sortYOffset: -99999,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
            position: {x: gameUtils.getCanvasCenter().x+150, y: gameUtils.getPlayableHeight()-350}})
        objs.push(sleepingbags);

        var gunrack = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 10, texture: 'gunrack',
            stage: 'stage', scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 0}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -2, y: 15},
            position: {x: gameUtils.getCanvasCenter().x-180, y: gameUtils.getPlayableCenter().y-30}})
        objs.push(gunrack);

        return objs;
    },
}

var campConstructor = function() {
    Object.assign(this, camp, CommonCamp);
}


var noirEnemySets = {
    basic: {normal: 'Critter', amount: 6, atATime: 2, hz: 4500, rare: 'Sentinel'},
    hardened: {normal: 'Gargoyle'},
    mobs: {normal: 'Eruptlet', rare: 'Sentinel'},
    sentinels: {normal: 'Sentinel', amount: 6, atATime: 3, hz: 4500},
}

var map = {
    options: {
        levels: {
            // singles: 4,
            // hardened: 0,
            // sentinels: 1,
            // // boss: 1,
            // // norevives: 1,
            // mobs: 0,
            // airDropStations: 1,
            // multiLevel: 1,
            // airDropSpecialStations: 1,
        },
        worldSpecs: {
            enemySets: noirEnemySets,
            tileSize: tileSize,
            acceptableTileTints: acceptableTileTints,
            getLevelTiles: levelTiles,
            possibleTrees: possibleTrees,
            levelTileExtension: function(scene, tint) {
                tileExtension(scene, tint);
                var l1 = gameUtils.createAmbientLights([0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303], 'backgroundOne', .2);
                scene.add(l1);
            }
        }
    },

    initializeMap: function() {
        this.map = new Map(this.options);
        return this.map;
    },

    phaseOne: function() {
        this.map.addCampNode();
        this.map.addMapNode('sentinels');
        this.map.addMapNode('airDropStations');
        this.map.addMapNode('mobs');
        this.map.addMapNode('basic');
        this.map.addMapNode('basic');
        this.map.addMapNode('basic');
        this.map.addMapNode('multiLevel');
    },

    phaseTwo: function() {

    }
}


export {campConstructor, map};
