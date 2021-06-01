import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxHealth: 4,
    gritAddition: 4,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Heart",
        description: ["Add +4 to maximum health.", "Add 4% to grit."],
        icon: 'BronzeMedalCircle1'
    }, options);
    return new ic(item);
}
