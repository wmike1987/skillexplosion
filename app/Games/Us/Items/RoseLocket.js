import ic from '@core/Unit/ItemConstructor.js';

var amount = 20;

var manipulations = {
    defenseAddition: 1.0,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveHealth(amount, null, {showGainAnimation: true});
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Rose Locket",
        description: ["Add 1.0 to armor.", "Gain " + amount + " hp after dodging killing blow."],
        icon: 'GoldenLocket'
    }, options);
    return new ic(item);
}
