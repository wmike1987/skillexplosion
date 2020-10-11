import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import utils from '@utils/GameUtils.js'
import unitMenu from '@games/Us/UnitMenu.js'

var enemySetSpecifier = {
    create: function(type, seed) {
        var enemySets = [];
        if(type == 'singles') {
            //Critters
            enemySets.push({
                constructor: unitMenu.Critter,
                icon: 'CritterPortrait',
                spawn: {total: 2 + utils.getRandomIntInclusive(1, 5), n: 1, hz: 2200, maxOnField: 1},
                item: {type: 'worn', total: 1}
            })

            //Sentinels
            enemySets.push({
                constructor: unitMenu.Sentinel,
                icon: 'SentinelPortrait',
                spawn: {total: 1 + utils.getRandomIntInclusive(1, 2), n: 1, hz: 2500, maxOnField: 1},
                item: {type: 'rugged', total: utils.getRandomIntInclusive(0, 1)}
            })

            //Banelings
        } else if(type == 'mobs') {
            //Eruptlets
            enemySets.push({
                constructor: unitMenu.Eruptlet,
                wave: 1,
                icon: 'EruptletPortrait',
                spawn: {total: 2 + utils.getRandomIntInclusive(12, 15), n: 1, hz: 1800, atATime: 5},
                item: {type: 'worn', total: 1}
            })

            //Sentinels
            enemySets.push({
                constructor: unitMenu.Sentinel,
                wave: 1,
                icon: 'SentinelPortrait',
                spawn: {total: 1 + utils.getRandomIntInclusive(3, 4), n: 1, hz: 4500, maxOnField: 1},
                item: {type: 'rugged', total: utils.getRandomIntInclusive(0, 1)}
            })
        }

        return enemySets;
    }
}

export default enemySetSpecifier;
