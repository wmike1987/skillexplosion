import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defense: 1,
    maxEnergy: 5,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Merit",
        description: ["Add +1 to armor.", "Add +5 to maximum energy."],
        icon: 'MedalOfMerit'
    }, options);
    return new ic(item);
}
