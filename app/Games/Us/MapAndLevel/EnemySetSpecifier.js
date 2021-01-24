import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import unitMenu from '@games/Us/UnitMenu.js'

var easyMode = true;
var innerMultiplier = 1.0;
var outerMultiplier = 2.0;
var outerMobMultiplier = 1.5;
var basicBottom = 2;
var basicTop = 4;

var hardenedBottom = 2;
var hardenedTop = 6;

var rareBottom = 2;
var rareTop = 3;

var enemySetSpecifier = {
    create: function(options) {
        var type = options.type;
        var possibleEnemies = options.possibleEnemies;
        var enemySets = [];
        var multiplier = options.outerLevel ? outerMultiplier : innerMultiplier;
        var mobMultiplier = options.outerLevel ? outerMobMultiplier : innerMultiplier;
        if(type == 'singles') {
            //Basic normal
            var basicNormal = unitMenu[possibleEnemies.basic.normal];
            enemySets.push({
                constructor: basicNormal.c,
                icon: basicNormal.p,
                spawn: {total: mathArrayUtils.getRandomIntInclusive(basicBottom, basicTop) * multiplier,  hz: 2200, maxOnField: 1},
                item: {type: 'worn', total: mathArrayUtils.getRandomElementOfArray([0,0,0,0,0,0,1])}
            })

            //Basic rare
            var basicRare = unitMenu[possibleEnemies.basic.rare];
            enemySets.push({
                constructor: basicRare.c,
                icon: basicRare.p,
                spawn: {total: mathArrayUtils.getRandomIntInclusive(rareBottom, rareTop) * multiplier, hz: 2500, maxOnField: 1},
                item: {type: 'rugged', total: mathArrayUtils.getRandomElementOfArray([0,0,0,0,0,0,1])}
            })
        }
        else if(type == 'hardened') {
            //Hardened normal
            var basicNormal = unitMenu[possibleEnemies.hardened.normal];
            enemySets.push({
                constructor: basicNormal.c,
                icon: basicNormal.p,
                spawn: {total: mathArrayUtils.getRandomIntInclusive(basicBottom, basicTop) * multiplier,  hz: 2200, maxOnField: 1, atATime: 2},
                item: {type: 'worn', total: mathArrayUtils.getRandomElementOfArray([0,0,1])}
            })

            //Hardened rare
            if(possibleEnemies.hardened.rare) {
                var basicRare = unitMenu[possibleEnemies.hardened.rare];
                enemySets.push({
                    constructor: basicRare.c,
                    icon: basicRare.p,
                    spawn: {total: mathArrayUtils.getRandomIntInclusive(rareBottom, rareTop) * multiplier, hz: 2500, maxOnField: 1},
                    item: {type: 'rugged', total: mathArrayUtils.getRandomIntInclusive(0, 1)}
                })
            }
        } else if(type == 'mobs') {
            //Mob noraml
            var mobNormal = unitMenu[possibleEnemies.mobs.normal];
            enemySets.push({
                constructor: mobNormal.c,
                wave: 1,
                icon: mobNormal.p,
                spawn: {total: Math.ceil(mathArrayUtils.getRandomIntInclusive(20, 23) * mobMultiplier), hz: 2200, atATime: 8},
            })

            //Mob rare
            var mobRare = unitMenu[possibleEnemies.mobs.rare];
            enemySets.push({
                constructor: mobRare.c,
                wave: 1,
                icon: mobRare.p,
                spawn: {total: mathArrayUtils.getRandomIntInclusive(2, 2) * multiplier, hz: 6000, maxOnField: 1},
                item: {type: 'rugged', total: mathArrayUtils.getRandomIntInclusive(0, 1)}
            })
        } else { //for custom levels
            var enemySetSpecs = options.worldSpecs.enemySets[type];
            var normal = unitMenu[enemySetSpecs.normal];

            enemySets.push({
                constructor: normal.c,
                wave: 1,
                icon: normal.p,
                spawn: {total: enemySetSpecs.amount || mathArrayUtils.getRandomIntInclusive(3, 4), hz: enemySetSpecs.hz || 4500,
                    atATime: enemySetSpecs.atATime || 1, maxOnField: 1}
            })
        }

        return enemySets;
    }
}

export default enemySetSpecifier;
