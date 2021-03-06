import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defense: 0.5,
    maxEnergy: 3,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Merit",
        description: ["Add +0.5 to armor.", "Add +3 to maximum energy."],
        icon: 'MedalOfMerit'
    }, options);
    return new ic(item);
}
