import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    healthRegenerationRate: 2,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Fruit Cake",
        description: "Regenerate +2 hp per second.",
        icon: 'FruitCake'
    }, options);
    return new ic(item);
}
