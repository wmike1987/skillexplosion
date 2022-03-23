import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defenseAddition: 0.3,
    gritAddition: 6,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Moxie",
        description: ["Add 0.3 to armor.", "Add 6 to grit."],
        icon: 'BronzeMedalCircle2'
    }, options);
    return new ic(item);
}
