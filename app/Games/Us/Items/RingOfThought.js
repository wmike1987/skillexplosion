import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    energyRegenerationRate: 0.3,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Ring Of Thought",
        description: "Regenerate +0.3 energy per second.",
        icon: 'RingOfReason'
    }, options);
    return new ic(item);
}
