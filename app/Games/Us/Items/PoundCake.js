import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    healthRegenerationRate: 0.7,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Pound Cake",
        description: "Regenerate +0.7 health per second.",
        icon: 'PoundCake'
    }, options);
    return new ic(item);
}
