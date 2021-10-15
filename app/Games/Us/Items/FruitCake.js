import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    healthRegenerationRate: 3,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Fruit Cake",
        description: "Regenerate +3 hp per second.",
        icon: 'FruitCake'
    }, options);
    return new ic(item);
}
