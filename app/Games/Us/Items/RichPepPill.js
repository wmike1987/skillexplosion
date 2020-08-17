define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxEnergy: 10,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Rich Pep Pill",
            description: "Add +" + manipulations.maxEnergy + " to maximum energy.",
            icon: 'RichPepPill'
        })
    };
})
