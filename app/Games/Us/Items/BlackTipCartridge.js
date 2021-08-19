import ic from '@core/Unit/ItemConstructor.js';

var damageAmount = 3;

var manipulations = {
    damageAddition: damageAmount,
};
export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Black Tipped Cartridge",
        description: "Add +" + damageAmount + " to base damage.",
        icon: 'BlackTipCartridge',
        type: 'Marine',
        fontType: 'shane'
    }, options);
    return new ic(item);
}
