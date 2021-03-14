import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js'
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js'
import {airDropStation, airDropSpecialStation} from '@games/Us/MapAndLevel/Levels/AirDropStation.js'
import {multiLevel} from '@games/Us/MapAndLevel/Levels/MultiLevel.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'

var levelFactory = {
    create: function(type, worldSpecs, options) {
        var options = options || {outer: false};
        var TypeMapping = specialtyLevels[type];
        if(TypeMapping) {
            var level = new TypeMapping(worldSpecs);
            level.onCreate(type, worldSpecs, options);
            return level;
        } else {
            var levelObj = Object.create(levelBase);
            levelObj.type = type;
            levelObj.tileSize = 225;
            levelObj.onCreate(type, worldSpecs, options);
            levelObj.enemySets = EnemySetSpecifier.create(type, worldSpecs, options);
            return levelObj;
        }
    }
}

// //Common Level types
// var singles = function(worldSpecs, options) {
//     this.type = 'singles';
//     this.onCreate(worldSpecs)
//     this.tileSize = 225;
//     this.enemySets = EnemySetSpecifier.create(type, worldSpecs);
// }
// singles.prototype = levelBase;
//
// var hardened = function(worldSpecs) {
//     this.type = 'hardened';
//     this.onCreate(worldSpecs)
//     this.tileSize = 225;
//     this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: worldSpecs.enemySets});
// }
// hardened.prototype = levelBase;
//
// var mobs = function(worldSpecs) {
//     this.type = 'mobs';
//     this.onCreate(worldSpecs)
//     this.tileSize = 225;
//     this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: worldSpecs.enemySets});
// }
// mobs.prototype = levelBase;
//
var camp = function(worldSpecs, options) {
    this.onCreate('camp', worldSpecs, options)
    this.enterLevel = function(node) {
        Matter.Events.trigger(globals.currentGame, 'GoToCamp', {node: node});
    }
}
camp.prototype = levelBase;

var specialtyLevels = {
    camp: camp,
    airDropStations: airDropStation,
    airDropSpecialStations: airDropSpecialStation,
    multiLevel: multiLevel,
}

export {levelFactory};
