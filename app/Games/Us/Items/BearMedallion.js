import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    defenseAddition: 0.8,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Bear Medallion",
        description: ["Add 0.8 to armor."],
        icon: 'BronzeMedalCircle3'
    }, options);
    return new ic(item);
}
