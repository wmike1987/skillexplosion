import ic from '@core/Unit/ItemConstructor.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import * as Matter from 'matter-js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var eventName = 'blueVisorCollector';

var manipulations = {
    genericEquip: function(equipped, item) {
        if(!equipped && this.blueVisorHandler) {
            this.blueVisorHandler.removeHandler();
        }
    },
    events: {
        applyEnrageBuff: {
            callback: function(event) {
                var unit = event.equippedUnit;
                var item = event.item;
                var buffId = event.id;
                unit.blueVisorBuff = unit.buffs[buffId];

                if(unit.blueVisorHandler) {
                    unit.blueVisorHandler.removeHandler();
                }

                unit.blueVisorHandler = gameUtils.matterOnce(unit, 'dealNonLethalDamage', (event) => {
                    var target = event.sufferingUnit;
                    event.equippedUnit = unit;
                    Matter.Events.trigger(globals.currentGame, eventName, event);
                    target.stun({duration: 1000, stunningUnit: unit});
                });
            }
        },
        removeBuff: {
            callback: function(event) {
                var removedBuff = event.buff;
                var unit = event.equippedUnit;
                if(unit.blueVisorBuff) {
                    if(removedBuff.id == unit.blueVisorBuff.id) {
                        if(unit.blueVisorHandler) {
                            unit.blueVisorHandler.removeHandler();
                        }
                    }
                }
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Blue Visor",
        description: ["Stun first target after becoming enraged for 1 second."],
        icon: 'BlueVisor',
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += 1;
            },
            presentation: {
                labels: ["Enemies stunned"],
                values: ["value"]
            }
        }
    }, options, shaneOnly);
    return new ic(item);
}
