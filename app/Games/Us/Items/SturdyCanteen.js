import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    maxHealth: 6,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Sturdy Canteen",
        description: "Add +" + manipulations.maxHealth + " to maximum health.",
        icon: 'SturdyCanteen'
    })
};
