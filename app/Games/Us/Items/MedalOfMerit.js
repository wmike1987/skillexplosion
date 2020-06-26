define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        defense: 1,
        maxEnergy: 5,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Medal Of Merit",
            description: ["Add +1 to defense.", "Add +5 to maximum energy."],
            icon: 'MedalOfMerit'
        })
    };
})
