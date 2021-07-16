import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import {airDropStation, airDropSpecialStation} from '@games/Us/MapAndLevel/Levels/AirDropStation.js';
import {shaneLearning} from '@games/Us/MapAndLevel/Levels/ShaneLearning.js';
import {multiLevel} from '@games/Us/MapAndLevel/Levels/MultiLevel.js';
import {campLevel} from '@games/Us/MapAndLevel/Levels/CampLevel.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';

var levelFactory = {
    create: function(type, worldSpecs, options) {
        options = options || {outer: false};
        var TypeMapping = predefinedTypes[type];
        if(TypeMapping) {
            var level = new TypeMapping(worldSpecs);
            level.init(type, worldSpecs, options);
            return level;
        } else {
            //Base functionality, aka a level with enemies
            var levelObj = Object.create(levelBase);
            levelObj.type = type;
            levelObj.tileSize = 225;
            levelObj.init(type, worldSpecs, options);
            return levelObj;
        }
    }
};

var predefinedTypes = {
    camp: campLevel,
    airDropStation: airDropStation,
    airDropSpecialStation: airDropSpecialStation,
    multiLevel: multiLevel,
    shaneLearning: shaneLearning,
};

export {levelFactory};
