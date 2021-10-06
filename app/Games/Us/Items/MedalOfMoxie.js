import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defenseAddition: 0.5,
    gritAddition: 5,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Moxie",
        description: ["Add 0.5 to armor.", "Add 5 to grit."],
        icon: 'BronzeMedalCircle2'
    }, options);
    return new ic(item);
}
