define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var equip = function(unit) {
        if(unit.healAmount)
            unit.healAmount += 0.5;
    };

    var unequip = function(unit) {
        if(unit.healAmount)
            unit.healAmount -= 0.5;
    };

    return function() {
        return ic({
            equip: equip,
            unequip: unequip,
            name: "Steady Syringe",
            description: "Increase heal amount by 0.5.",
            icon: 'SteadySyringe'
        })
    };
})
