import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import {airDropStation} from '@games/Us/MapAndLevel/Levels/AirDropStation.js';
import {morphineStation} from '@games/Us/MapAndLevel/Levels/TravelTokens.js';
import {shaneLearning} from '@games/Us/MapAndLevel/Levels/ShaneLearning.js';
import {multiLevel} from '@games/Us/MapAndLevel/Levels/MultiLevel.js';
import {campLevel} from '@games/Us/MapAndLevel/Levels/CampLevel.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';

var levelFactory = {
    create: function(type, worldSpecs, options) {
        var TypeMapping = predefinedTypes[type];
        if(TypeMapping) {
            let level = new TypeMapping(worldSpecs);
            level.init(type, worldSpecs, options);
            return level;
        } else {
            //Base functionality, aka a level with enemies
            let level = Object.create(levelBase);
            level.tileSize = 225;
            level.init(type, worldSpecs, options);
            return level;
        }
    }
};

var predefinedTypes = {
    camp: campLevel,
    airDropStation: airDropStation,
    multiLevel: multiLevel,
    morphineStation: morphineStation,
    shaneLearning: shaneLearning,
};

export {levelFactory};
