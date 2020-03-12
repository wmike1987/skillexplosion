define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var equip = function(unit) {
        unit.damage += 8;
    };

    var unequip = function(unit) {
        unit.damage -= 8;
    };

    return function() {
        return ic({
            equip: equip,
            unequip: unequip,
            name: "Mask Of Rage",
            description: "Add 8 to base damage.",
            icon: 'MaskOfRage'
        })
    };
})
