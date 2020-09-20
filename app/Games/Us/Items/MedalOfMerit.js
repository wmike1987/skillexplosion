import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    defense: 1,
    maxEnergy: 5,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Medal Of Merit",
        description: ["Add +1 to defense.", "Add +5 to maximum energy."],
        icon: 'MedalOfMerit'
    })
};
