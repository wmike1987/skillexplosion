import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxHealth: 6,
    gritAddition: 6,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Heart",
        description: ["Add 6 to maximum health.", "Add 6 to grit."],
        icon: 'BronzeMedalCircle1'
    }, options);
    return new ic(item);
}
