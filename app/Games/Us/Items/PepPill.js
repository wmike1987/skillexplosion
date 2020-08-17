define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxEnergy: 5,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Pep Pill",
            description: "Add +" + manipulations.maxEnergy + " to maximum energy.",
            icon: 'PepPillOne'
        })
    };
})
