import ic from '@core/Unit/ItemConstructor.js';

var amount = 4;

var manipulations = {
    events: {
        dodgeAttack: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveEnergy(amount, null, {showGainAnimation: true});
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Picture Of The Moon",
        description: ["Gain " + amount + " energy after dodging attack."],
        icon: 'PictureOfTheMoon'
    }, options);
    return new ic(item);
}
