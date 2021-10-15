import ic from '@core/Unit/ItemConstructor.js';

var amount = 10;

var manipulations = {
    defenseAddition: 1.0,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveEnergy(amount, null, {showGainAnimation: true});
                blockingUnit.boostSpeed({duration: 1000, amount: 0.6});
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Diamond Locket",
        description: ["Add 1.0 to armor.", "Gain " + amount + " energy after dodging killing blow.", "Increase move speed for 1 second after dodging killing blow"],
        icon: 'DiamondLocket'
    }, options);
    return new ic(item);
}
