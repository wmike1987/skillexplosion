define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxHealth: 15,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Rugged Canteen",
            description: "Add +" + manipulations.maxHealth + " to maximum health.",
            icon: 'RuggedCanteen'
        })
    };
})
