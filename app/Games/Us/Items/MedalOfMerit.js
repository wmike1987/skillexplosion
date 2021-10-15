import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defense: 0.5,
    maxEnergy: 5,
    maxHealth: 8
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Merit",
        description: ["Add 0.75 to armor.", "Add 5 to maximum energy.", "Add 8 to maximum health."],
        icon: 'MedalOfMerit'
    }, options);
    return new ic(item);
}
