import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defenseAddition: 1,
    gritAddition: 4,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Moxie",
        description: ["Add +1 to armor.", "Add 4% to grit."],
        icon: 'BronzeMedalCircle2'
    }, options);
    return new ic(item);
}
