import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js'
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js'
import {airDropStation, airDropSpecialStation} from '@games/Us/MapAndLevel/Levels/AirDropStation.js'
import {shaneLearning} from '@games/Us/MapAndLevel/Levels/ShaneLearning.js'
import {multiLevel} from '@games/Us/MapAndLevel/Levels/MultiLevel.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'

var levelFactory = {
    create: function(type, worldSpecs, options) {
        var options = options || {outer: false};
        var TypeMapping = predefinedTypes[type];
        if(TypeMapping) {
            var level = new TypeMapping(worldSpecs);
            level.init(type, worldSpecs, options);
            return level;
        } else {
            var levelObj = Object.create(levelBase);
            levelObj.type = type;
            levelObj.tileSize = 225;
            levelObj.init(type, worldSpecs, options);
            levelObj.enemySets = EnemySetSpecifier.create(type, worldSpecs, options);
            return levelObj;
        }
    }
}

var camp = function(worldSpecs, options) {
    this.init('camp', worldSpecs, options)
    this.enterLevel = function(node) {
        Matter.Events.trigger(globals.currentGame, 'GoToCamp', {node: node});
    }
}
camp.prototype = levelBase;

var predefinedTypes = {
    camp: camp,
    airDropStations: airDropStation,
    airDropSpecialStations: airDropSpecialStation,
    multiLevel: multiLevel,
    shaneLearning: shaneLearning,
}

export {levelFactory};
