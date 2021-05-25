import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    damageAddition: 2,
};
export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Mask Of Rage",
        description: "Add +2 to base damage.",
        icon: 'MaskOfRage'
    }, options);
    return new ic(item);
}
