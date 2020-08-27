define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxHealth: 6,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Sturdy Canteen",
            description: "Add +" + manipulations.maxHealth + " to maximum health.",
            icon: 'SturdyCanteen'
        })
    };
})
