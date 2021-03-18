import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js'
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'
import Tooltip from '@core/Tooltip.js'
import TileMapper from '@core/TileMapper.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import Doodad from '@utils/Doodad.js'
import {Dialogue, DialogueChain} from '@core/Dialogue.js'
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js'

var entrySound = gameUtils.getSound('enterairdrop1.wav', {volume: .04, rate: 1});
var airDropClickTokenSound = gameUtils.getSound('clickairdroptoken1.wav', {volume: .03, rate: 1});

//Create the air drop base

var shaneLearning = function(options) {

    this.createTerrainExtension = function(scene) {
        var podDoodad = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 130, texture: ['LandingPod'], stage: 'stage',
        scale: {x: .6, y: .6}, offset: {x: 0, y: 30}, sortYOffset: 10,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.0, y: 1.0}, shadowOffset: {x: 0, y: 18},
        position: {x: gameUtils.getCanvasCenter().x-200, y: gameUtils.getPlayableHeight()-500}})
        scene.add(podDoodad);
    }

    this.enterLevel = function() {
        Matter.Events.trigger(globals.currentGame, 'InitCustomLevel', {level: this});
    }

    this.onInitLevel = function() {
        globals.currentGame.setUnit(globals.currentGame.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter()), moveToCenter: false});
    }

}
shaneLearning.prototype = levelBase;

export {shaneLearning};
