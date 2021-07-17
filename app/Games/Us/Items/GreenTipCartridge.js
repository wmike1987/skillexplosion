import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    damageAddition: 5,
};
export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Green Tipped Cartridge",
        description: "Add +5 to base damage.",
        icon: 'GreenTipCartridge',
        type: 'Marine'
    }, options);
    return new ic(item);
}
