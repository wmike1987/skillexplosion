define(['jquery', 'matter-js', 'pixi', 'utils/GameUtils', 'games/Us/UnitMenu'],
function($, Matter, PIXI, utils, unitMenu) {
    var enemySetSpecifier = {
        create: function(type, seed) {
            var enemySet = {};
            if(type == 'singles') {
                enemySet.constructor = unitMenu.Critter,
                enemySet.spawn = {total: 1 + utils.getRandomIntInclusive(1, 8), n: 1, hz: 2500, maxOnField: 1},
                enemySet.item = {type: 'basic', total: 1}
            }

            return enemySet;
        }
    }

    return enemySetSpecifier;
})
