import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defense: 1.0,
    maxHealth: 10
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Resilience",
        description: ["Add 1.0 to armor.", "Add 10 to maximum health."],
        icon: 'SilverMedalDiamond2'
    }, options);
    return new ic(item);
}
