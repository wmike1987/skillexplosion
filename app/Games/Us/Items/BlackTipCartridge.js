import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    damageAddition: 2,
};
export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Black Tipped Cartridge",
        description: "Add +2 to base damage.",
        icon: 'BlackTipCartridge',
        type: 'Marine'
    }, options);
    return new ic(item);
}
