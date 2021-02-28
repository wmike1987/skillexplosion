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
    create: function(type, worldSpecs) {
        var TypeMapping = levelTypeMappings[type];
        if(TypeMapping) {
            return new TypeMapping(worldSpecs);
        } else {
            var levelObj = Object.create(levelBase);
            levelObj.type = type;
            levelObj.tileSize = 225;
            levelObj.onCreate(worldSpecs);
            var customEnemySetConfig = worldSpecs.enemySets[type];
            levelObj.enemySets = EnemySetSpecifier.create({type: type, worldSpecs: worldSpecs});
            return levelObj;
        }
    }
}

//Common Level types
var singles = function(worldSpecs) {
    this.type = 'singles';
    this.onCreate(worldSpecs)
    this.tileSize = 225;
    this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: worldSpecs.enemySets});
}
singles.prototype = levelBase;

var hardened = function(worldSpecs) {
    this.type = 'hardened';
    this.onCreate(worldSpecs)
    this.tileSize = 225;
    this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: worldSpecs.enemySets});
}
hardened.prototype = levelBase;

var mobs = function(worldSpecs) {
    this.type = 'mobs';
    this.onCreate(worldSpecs)
    this.tileSize = 225;
    this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: worldSpecs.enemySets});
}
mobs.prototype = levelBase;

var camp = function(worldSpecs) {
    this.type = 'camp';
    this.onCreate(worldSpecs)
    this.enterLevel = function(node) {
        Matter.Events.trigger(globals.currentGame, 'GoToCamp', {node: node});
    }
}
camp.prototype = levelBase;

var levelTypeMappings = {
    singles: singles,
    hardened: hardened,
    camp: camp,
    mobs: mobs,
    airDropStations: airDropStation,
    airDropSpecialStations: airDropSpecialStation,
    multiLevel: multiLevel,
}

export {levelFactory};
