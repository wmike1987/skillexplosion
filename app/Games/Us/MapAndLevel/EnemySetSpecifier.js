import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import unitMenu from '@games/Us/UnitMenu.js';

var easyMode = false;
var innerMultiplier = 1.0;
var outerMultiplier = 2.0;
var outerMobMultiplier = 1.5;
var basicBottom = 2;
var basicTop = 4;

var hardenedBottom = 4;
var hardenedTop = 6;

var rareBottom = 2;
var rareTop = 3;

var enemySetSpecifier = {
    create: function(enemyDef) {
        var enemySets = [];

        var enemySetSpecs = enemyDef.enemySets;
        if($.isArray(enemyDef)) {
            enemySetSpecs = enemyDef;
        }
        if(enemySetSpecs) {
            enemySetSpecs.forEach((enemySpec) => {
                var enemyCount = mathArrayUtils.convertToArray(enemySpec.amount);
                enemyCount = mathArrayUtils.getRandomElementOfArray(enemyCount);
                var constructor = unitMenu[enemySpec.type];
                enemySets.push({
                    constructor: constructor.c,
                    wave: 1,
                    item: enemyDef.item,
                    icon: constructor.p,
                    initialDelay: enemySpec.initialDelay,
                    spawn: {total: enemyCount/(easyMode ? 2 : 1) || mathArrayUtils.getRandomIntInclusive(3, 4), hz: enemySpec.hz || 4500,
                        atATime: enemySpec.atATime || 1, maxOnField: 1}
                });
            });
        }

        return enemySets;
    }
};

export default enemySetSpecifier;
