import ic from '@core/Unit/ItemConstructor.js';

var amount = 15;
var dodgeGain = 10;

var manipulations = {
    dodgeAddition: 4,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveHealth(amount, null, {showGainAnimation: true});
                blockingUnit.giveEnergy(amount, null, {showGainAnimation: true});

                var item = event.item;

                if(!item.applied) {
                    blockingUnit.applyDodgeBuff({duration: 3000, amount: dodgeGain, callback: () => {
                        item.applied = false;
                    }});
                    item.applied = true;
                }
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Jade Locket",
        description: ["Add 4 to dodge.", "Gain " + amount + " hp and energy after dodging killing blow.", "Gain " + dodgeGain + " dodge for 3 seconds after dodging killing blow (does not stack)."],
        icon: 'JadeLocket'
    }, options);
    return new ic(item);
}
