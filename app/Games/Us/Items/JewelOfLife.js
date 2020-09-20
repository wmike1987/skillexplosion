import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    maxHealth: 10,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Jewel Of Life",
        description: "Add +10 to maximum health.",
        icon: 'JewelOfLife'
    })
};
