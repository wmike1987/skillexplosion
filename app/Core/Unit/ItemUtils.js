import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {ItemClasses} from '@games/Us/Items/ItemClasses.js';

var initiateBlinkDeath = function(options) {
    var time = options.time || 8000;
    var timerTime = time/50;
    var item = options.item;
    //create item removal and blink
    var t = globals.currentGame.addTimer({name: 'itemRemove' + item.body.id, runs: timerTime, timeLimit: 50,
    callback: function() {
        $.each(item.renderlings, function(i, rl) {
            if(this.totalPercentOfRunsDone > 0.5) {
                if(this.totalPercentOfRunsDone < 0.8) {
                    if(this.currentRun % 4 == 0 || this.currentRun-1 % 4 == 0) {
                        rl.alpha = 0.3;
                    } else {
                        rl.alpha = 1;
                    }
                } else if(this.currentRun % 2 == 0) {
                    $.each(item.renderlings, function(i, rl) {
                        rl.alpha = 0.3;
                    });
                } else {
                    rl.alpha = 1;
                }
            } else {
                rl.alpha = 1;
            }
        }.bind(this));
    },
    totallyDoneCallback: function() {
        globals.currentGame.removeItem(item);
    }.bind(this)});

    item.deathTimer = t;
    var originalCollect = item.removePhysicalForm;
    item.removePhysicalForm = function() {
        if(this.deathTimer) {
            globals.currentGame.invalidateTimer(this.deathTimer);
        }
        originalCollect.call(item);
    };
    gameUtils.deathPact(item, t);
};

var getRandomItemFromClass = function(itemClass, itemType) {
    return mathArrayUtils.getRandomElementOfArray(ItemClasses[itemClass][itemType].items);
};

var getRandomItemsFromClass = function(itemClass, itemType, amount) {
    var returnItems = [];
    var collision = false;
    var chosenItem = null;
    do {
        collision = true;
        chosenItem = mathArrayUtils.getRandomElementOfArray(ItemClasses[itemClass][itemType].items);
        if(!returnItems.includes(chosenItem)) {
            collision = false;
            returnItems.push(chosenItem);
        }
    } while (collision || returnItems.length < amount);

    return returnItems;
};

var giveUnitItem = function(options) {
    //extract unit from options
    var unit = options.unit;
    options.unit = null;

    var itemInfo = resolveItemInformation(options);
    Object.assign(options, itemInfo);

    var itemName = itemInfo.itemName;

    //This is assuming a particular structure of the Item files within the project and game
    const target = 'Items/'+ itemName +'.js';
    import(/* webpackChunkName: "us-items"*/ /*webpackMode: "lazy-once" */ `@games/Us/${target}`).then((item) => {
        item = item.default(options);
        if(unit.isDead) {
            item.drop(unit.position);
        } else {
            unit.pickupItem(item, null, true);
        }
    });
};

var dropItemAtPosition = function(options) {
    var itemInfo = resolveItemInformation(options);
    Object.assign(options, itemInfo);

    var itemName = itemInfo.itemName;

    //This is assuming a particular structure of the Item files within the project and game
    const target = 'Items/'+ itemName +'.js';
    import(/* webpackChunkName: "us-items"*/ /*webpackMode: "lazy-once" */ `@games/Us/${target}`).then((item) => {
        item = item.default(options);
        item.drop(options.position);
    });
};

var createItemObj = function(options) {
    var itemInfo = resolveItemInformation(options);
    Object.assign(options, itemInfo);

    var itemName = itemInfo.itemName;

    //This is assuming a particular structure of the Item files within the project and game
    const target = 'Items/'+ itemName +'.js';
    import(/* webpackChunkName: "us-items"*/ /*webpackMode: "lazy-once" */ `@games/Us/${target}`).then((item) => {
        options.itemDeferred.resolve(item.default(options));
    });
};

var createItemAndGrasp = function(options) {
    var itemInfo = resolveItemInformation(options);
    Object.assign(options, itemInfo);

    var itemName = itemInfo.itemName;

    //This is assuming a particular structure of the Item files within the project and game
    const target = 'Items/'+ itemName +'.js';
    import(/* webpackChunkName: "us-items"*/ /*webpackMode: "lazy-once" */ `@games/Us/${target}`).then((item) => {
        item = item.default(options);
        item.owningUnit = options.unit;
        graphicsUtils.addOrShowDisplayObject(item.icon);
        item.grasp(options.unit, true);
    });
};

/*
 *
 * options {
 *   itemClass: string
 *   itemType: string
 *   OR
 *   itemName: [string]
 * }
 *
 */
var resolveItemInformation = function(options) {
    var chosenItem = null;
    var chosenClassKey = 'noClass';
    var chosenTypeKey = 'item';
    if(options.itemClass) {
        //if we've specified the item class name, choose a random item from within
        chosenClassKey = options.itemClass || chosenClassKey;
        chosenTypeKey = options.itemType || chosenTypeKey;
        chosenItem = getRandomItemFromClass(chosenClassKey, chosenTypeKey);
    } else {
        //if we've provided a list, randomly choose one
        var itemNames = mathArrayUtils.convertToArray(options.itemName);
        chosenItem = mathArrayUtils.getRandomElementOfArray(itemNames);

        //locate the chosen item's class
        mathArrayUtils.operateOnObjectByKey(ItemClasses, function(itemClassKey, itemClass) {
            mathArrayUtils.operateOnObjectByKey(itemClass, function(itemTypeKey, type) {
                if(type.items.includes(chosenItem)) {
                    chosenClassKey = itemClassKey;
                    chosenTypeKey = itemTypeKey;
                }
            });
        });
    }

    return {itemName: chosenItem, classInformation: {itemClassContext: ItemClasses[chosenClassKey], itemType: chosenTypeKey, itemClass: chosenClassKey, typeInfo: ItemClasses[chosenClassKey][chosenTypeKey]}};
}

export default {initiateBlinkDeath: initiateBlinkDeath, giveUnitItem: giveUnitItem, dropItemAtPosition: dropItemAtPosition, createItemObj: createItemObj, createItemAndGrasp: createItemAndGrasp, getRandomItemsFromClass: getRandomItemsFromClass, getRandomItemFromClass: getRandomItemFromClass};
