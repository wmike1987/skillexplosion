import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    damageAddition: 8,
};
export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Violet Tipped Cartridge",
        description: "Add +8 to base damage.",
        icon: 'VioletTipCartridge'
    }, options, shaneOnly);
    return new ic(item);
}
