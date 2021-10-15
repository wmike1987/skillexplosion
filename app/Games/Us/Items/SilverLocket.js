import ic from '@core/Unit/ItemConstructor.js';

var amount = 10;

var manipulations = {
    defenseAddition: 0.5,
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
        name: "Silver Locket",
        description: ["Add 0.5 to armor.", "Gain " + amount + " hp after dodging killing blow."],
        icon: 'Locket'
    }, options);
    return new ic(item);
}
