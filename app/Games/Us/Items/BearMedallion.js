import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defenseAddition: 2,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Bear Medallion",
        description: ["Add +2 to armor."],
        icon: 'BronzeMedalCircle3'
    }, options);
    return new ic(item);
}
