import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    healAmount: function(isEquipping) {
        if(isEquipping) {
            this.getAbilityByName('Heal').healAmount += .5;
        } else {
            this.getAbilityByName('Heal').healAmount -= .5;
        }
    }
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Steady Syringe",
        description: "Increase heal amount by 0.5.",
        icon: 'SteadySyringe',
        type: 'Medic'
    })
};
