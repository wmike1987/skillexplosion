import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    maxHealth: 12,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Rugged Canteen",
        description: "Add +" + manipulations.maxHealth + " to maximum health.",
        icon: 'RuggedCanteen'
    })
};
