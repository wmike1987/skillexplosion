import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxEnergy: 9,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Picture Of Earth",
        description: "Add " + manipulations.maxEnergy + " to maximum energy.",
        icon: 'PictureOfEarth'
    }, options);
    return new ic(item);
}
