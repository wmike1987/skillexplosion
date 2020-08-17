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
                    spawn: {total: 2 + utils.getRandomIntInclusive(1, 5), n: 1, hz: 2500, maxOnField: 1},
                    item: {type: 'worn', total: 10}
                })

                //Sentinels
                enemySets.push({
                    constructor: unitMenu.Sentinel,
                    icon: 'SentinelPortrait',
                    spawn: {total: 1 + utils.getRandomIntInclusive(1, 2), n: 1, hz: 2500, maxOnField: 1},
                    item: {type: 'rugged', total: 10}
                })

                //Banelings
            }

            return enemySets;
        }
    }

    return enemySetSpecifier;
})
