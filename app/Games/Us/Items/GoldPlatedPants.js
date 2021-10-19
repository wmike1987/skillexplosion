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

var armorGainDuration = 6000;
var armorGain = 4;
var chargeLength = 2000;

var manipulations = {
    gritAddition: 10,
    genericEquip: function(equipped, item) {
        if(!equipped) {
            if(item.chargeHandler) {
                item.cancelCharge();
                item.chargeHandler.removeHandler();
                item.isActive = false;
                var buff = this.buffs["DefensiveBuff" + item.id];
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
                    activeDuration: armorGainDuration,
                    activateFunction: () => {
                        if (unit.holdPositionId == hpId && unit.isHoldingPosition) {
                            unit.applyDefenseBuff({
                                id: "DefensiveBuff" + item.id,
                                duration: armorGainDuration,
                                amount: armorGain
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
        name: "Gold Plated Pants",
        description: ["Add 10 grit.", "Gain " + armorGain + " armor for 6 seconds by holding position for 2 seconds."],
        icon: 'Pants2'
    }, options);
    return new ic(item);
}
