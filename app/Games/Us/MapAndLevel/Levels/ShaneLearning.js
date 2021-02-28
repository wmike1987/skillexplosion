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
var shaneLearning = Object.create(levelBase);

shaneLearning.createMapNode = function(options) {

    return mapNode;
}

export {shaneLearning};
