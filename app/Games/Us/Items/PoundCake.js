import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    healthRegenerationRate: 0.5,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Pound Cake",
        description: "Regenerate +0.5 health per second.",
        icon: 'PoundCake'
    }, options);
    return new ic(item);
}
