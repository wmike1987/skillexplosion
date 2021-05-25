import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxHealth: 3,
    maxEnergy: 3,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Jewel Of Vitality",
        description: "Add +3 to maximum health and maximum energy.",
        icon: 'JewelOfLife'
    }, options);
    return new ic(item);
}
