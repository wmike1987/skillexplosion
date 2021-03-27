import * as $ from 'jquery';
import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js';
import CommonCamp from './CommonCampMixin.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import TileMapper from '@core/TileMapper.js';
import Doodad from '@utils/Doodad.js';
import Scene from '@core/Scene.js';
import Map from '@games/Us/MapAndLevel/Map/Map.js';

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
    var ornamentMap = TileMapper.produceTileMap({possibleTextures: ornamentTiles, tileWidth: tileSize, hz: 0.5, tileTint: tint});
    scene.add(ornamentMap);
};

var possibleTrees = ['avgoldtree1', 'avgoldtree2', 'avgoldtree3', 'avgoldtree4', 'avgoldtree5', 'avgoldtree6'];

var camp = {
    tileSize: tileSize,
    getBackgroundTiles: levelTiles,
    tileMapExtension: tileExtension,

    initSounds: function() {
        this.entercamp = gameUtils.getSound('entercamp.wav', {volume: 0.05, rate: 0.75});
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
            position: {x: gameUtils.getCanvasCenter().x-150, y: gameUtils.getPlayableHeight()-500}});
        objs.push(tent);

        var sleepingbags = new Doodad({drawWire: false, collides: false, autoAdd: false, radius: 15, texture: 'SleepingBags',
            stage: 'stage', scale: {x: 1.4, y: 1.4}, offset: {x: 0, y: 0}, sortYOffset: -99999,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
            position: {x: gameUtils.getCanvasCenter().x+150, y: gameUtils.getPlayableHeight()-350}});
        objs.push(sleepingbags);

        var gunrack = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 10, texture: 'gunrack',
            stage: 'stage', scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 0}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -2, y: 15},
            position: {x: gameUtils.getCanvasCenter().x-180, y: gameUtils.getPlayableCenter().y-30}});
        objs.push(gunrack);

        return objs;
    },
};

Object.assign(camp, CommonCamp);

var noirEnemySets = {
    basic: [{type: 'Critter', amount: 2, atATime: 2, hz: 4000}, {type: 'Sentinel', amount: 0, atATime: 1, hz: 4500}],
    outerBasic: [{type: 'Critter', amount: 12, atATime: 2, hz: 4000}, {type: 'Sentinel', amount: 3, atATime: 1, hz: 4000}],
    hardened: [{type: 'Gargoyle', amount: 4, atATime: 1, hz: 2500}],
    outerHardened: [{type: 'Gargoyle', amount: 8, atATime: 2, hz: 4500}],
    mobs: [{type: 'Eruptlet', amount: 25, atATime: 5, hz: 5000}],
    outerMobs: [{type: 'Eruptlet', amount: 50, atATime: 10, hz: 4000}, {type: 'Sentinel', amount: 3, atATime: 1, hz: 6000}],
    sentinels: [{type: 'Sentinel', amount: 6, atATime: 3, hz: 4500}],
    outerSentinels: [{type: 'Sentinel', amount: 10, atATime: 2, hz: 5000}],
};

var campNoir = {
    worldSpecs: {
        enemySets: noirEnemySets,
        tileSize: tileSize,
        acceptableTileTints: acceptableTileTints,
        getLevelTiles: levelTiles,
        possibleTrees: possibleTrees,
        levelTileExtension: function(scene, tint) {
            tileExtension(scene, tint);
            var l1 = gameUtils.createAmbientLights([0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303], 'backgroundOne', 0.2);
            scene.add(l1);
        }
    },

    initializeMap: function() {
        this.map = new Map(this.worldSpecs);
        return this.map;
    },

    phaseOne: function() {
        var firstLevelPosition = {x: 200, y: 180};
        this.map.addMapNode('camp', {levelOptions: {camp: camp}});
        var learningNode = this.map.addMapNode('shaneLearning', {position: firstLevelPosition, levelOptions: {levelId: 'shaneLearning', tileTint: 0x7848ee}});
        this.map.setHeadToken('shaneOnly');
        this.map.setHeadTokenPosition({node: learningNode});
        this.map.addMapNode('basic', {position: mathArrayUtils.clonePosition(firstLevelPosition, {x: 100, y: 150}), levelOptions: {gotoMapOnWin: true}});
        this.map.addMapNode('basic', {position: mathArrayUtils.clonePosition(firstLevelPosition, {x: 200, y: 180}), levelOptions: {gotoMapOnWin: true}});
        this.map.addMapNode('airDropStations', {position: mathArrayUtils.clonePosition(firstLevelPosition, {x: 280, y: 150})});
    },

    phaseTwo: function() {

    }
};


export {campNoir};
