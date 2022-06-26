import ic from '@core/Unit/ItemConstructor.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import * as Matter from 'matter-js';

var gainDuration = 8000;
var gainAmount = 1999;
var chargeLength = 500;
var eventName = 'goldenYinYangTimesActive';

var manipulations = {
    genericEquip: function(equipped, item) {
        if(!equipped) {
            if(item.chargeHandler) {
                item.cancelCharge();
                item.chargeHandler.removeHandler();
                item.chargeActive = false;
                var buff = this.getBuffById("RangeBuff" + item.id);
                if(buff) {
                    buff.removeBuff();
                }
            }
        }
    },
    events: {
        holdPosition: {
            callback: function(event) {
                var unit = event.equippedUnit;
                var hpId = unit.holdPositionId;
                var item = event.item;

                item.chargeThenActivate({
                    setupCancel: function() {
                        if(item.chargeHandler) {
                            item.chargeHandler.removeHandler();
                        }
                        item.chargeHandler = gameUtils.matterOnce(unit, 'changeHoldPosition', function(event) {
                            if(!event.value) {
                                item.cancelCharge();
                            }
                        });
                    },
                    chargeDuration: chargeLength,
                    activeDuration: gainDuration,
                    activateFunction: () => {
                        if (unit.holdPositionId == hpId && unit.isHoldingPosition) {
                            Matter.Events.trigger(globals.currentGame, eventName, event);
                            unit.applyRangeBuff({
                                id: "RangeBuff" + item.id,
                                duration: gainDuration,
                                amount: gainAmount
                            });
                            return true;
                        } else {
                            return false;
                        }
                    }
                });
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Golden Yin Yang",
        description: ["Gain infinite heal range for 8 seconds by holding position for 0.5 seconds."],
        icon: 'GoldenYinYang',
        type: 'Medic',
        fontType: 'ursula',
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += 1;
            },
            presentation: {
                labels: ["Times activated"],
                values: ["value"]
            }
        }
    }, options, ursulaOnly);
    return new ic(item);
}
