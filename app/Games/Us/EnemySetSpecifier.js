define(['jquery', 'matter-js', 'pixi', 'utils/GameUtils', 'games/Us/UnitMenu'],
function($, Matter, PIXI, utils, unitMenu) {
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
                //Critters
                enemySets.push({
                    constructor: unitMenu.Critter,
                    wave: 1,
                    icon: 'CritterPortrait',
                    spawn: {total: 2 + utils.getRandomIntInclusive(9, 16), n: 1, hz: 1800, atATime: 2},
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

    return enemySetSpecifier;
})
