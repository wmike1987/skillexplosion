import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxEnergy: 18,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Sharp Picture Of Earth",
        description: "Add +" + manipulations.maxEnergy + " to maximum energy.",
        icon: 'SharpPictureOfEarth'
    }, options);
    return new ic(item);
}
