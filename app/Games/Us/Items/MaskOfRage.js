import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    damage: 5,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Mask Of Rage",
        description: "Add +5 to base damage.",
        icon: 'MaskOfRage'
    })
};
