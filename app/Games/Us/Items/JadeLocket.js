import ic from '@core/Unit/ItemConstructor.js';

var amount = 15;

var manipulations = {
    defenseAddition: 0.5,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveHealth(amount, null, {showGainAnimation: true});
                blockingUnit.giveEnergy(amount, null, {showGainAnimation: true});
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Jade Locket",
        description: ["Add 0.5 to armor.", "Gain " + amount + " hp and energy after dodging killing blow."],
        icon: 'JadeLocket'
    }, options);
    return new ic(item);
}
