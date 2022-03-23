import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defenseAddition: 0.75,
    gritAddition: 8,
    maxHealth: 8,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Grit",
        description: ["Add 0.75 to armor.", "Add 8 to maximum health.", "Add 8 to grit."],
        icon: 'MedalOfGrit'
    }, options);
    return new ic(item);
}
