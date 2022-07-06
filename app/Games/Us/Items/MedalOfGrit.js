import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    gritAddition: 20
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Medal Of Grit",
        description: ["Add 20 to grit."],
        icon: 'MedalOfGrit'
    }, options);
    return new ic(item);
}
