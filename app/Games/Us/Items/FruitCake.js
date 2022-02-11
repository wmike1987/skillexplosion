import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    healthRegenerationRate: 1.5,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Fruit Cake",
        description: "Regenerate +1.5 hp per second.",
        icon: 'FruitCake'
    }, options);
    return new ic(item);
}
