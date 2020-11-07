import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import utils from '@utils/GameUtils.js'
import unitMenu from '@games/Us/UnitMenu.js'

var enemySetSpecifier = {
    create: function(options) {
        var type = options.type;
        var possibleEnemies = options.possibleEnemies;
        var enemySets = [];
        if(type == 'singles') {
            //Basic normal
            var basicNormal = unitMenu[possibleEnemies.basic.normal];
            enemySets.push({
                constructor: basicNormal.c,
                icon: basicNormal.p,
                spawn: {total: 2 + utils.getRandomIntInclusive(1, 5), n: 1, hz: 2200, maxOnField: 1},
                item: {type: 'worn', total: 1}
            })

            //Basic rare
            var basicRare = unitMenu[possibleEnemies.basic.rare];
            enemySets.push({
                constructor: basicRare.c,
                icon: basicRare.p,
                spawn: {total: 1 + utils.getRandomIntInclusive(1, 2), n: 1, hz: 2500, maxOnField: 1},
                item: {type: 'rugged', total: utils.getRandomIntInclusive(0, 1)}
            })
        } else if(type == 'mobs') {
            //Mob noraml
            var mobNormal = unitMenu[possibleEnemies.mobs.normal];
            enemySets.push({
                constructor: mobNormal.c,
                wave: 1,
                icon: mobNormal.p,
                spawn: {total: 2 + utils.getRandomIntInclusive(12, 15), n: 1, hz: 1800, atATime: 5},
                item: {type: 'worn', total: 1}
            })

            //Mob rare
            var mobRare = unitMenu[possibleEnemies.mobs.rare];
            enemySets.push({
                constructor: mobRare.c,
                wave: 1,
                icon: mobRare.p,
                spawn: {total: 1 + utils.getRandomIntInclusive(3, 4), n: 1, hz: 4500, maxOnField: 1},
                item: {type: 'rugged', total: utils.getRandomIntInclusive(0, 1)}
            })
        }

        return enemySets;
    }
}

export default enemySetSpecifier;
