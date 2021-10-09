import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    dodgeAddition: 4,
    defenseAddition: 0.5,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Leather Belt",
        description: ["Add 0.5 to armor.", "Add 4 to dodge."],
        icon: 'LeatherBelt'
    }, options);
    return new ic(item);
}