define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxHealth: 25,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Gleaming Canteen",
            description: "Add +" + manipulations.maxHealth + " to maximum health.",
            icon: 'GleamingCanteen'
        })
    };
})
