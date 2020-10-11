import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import utils from '@utils/GameUtils.js'
import unitMenu from '@games/Us/UnitMenu.js'
import EnemySetSpecifier from '@games/Us/EnemySetSpecifier.js'
import {globals} from '@core/Fundamental/GlobalState.js'

var levelSpecifier = {
    create: function(type, seed) {
        var levelDetails = {
            type: type,
            tileSize: 225,
            enemySets: [],
            possibleTiles: [],
            resetLevel: function() {
                this.enemySets.forEach(set => {
                    set.fulfilled = false;
                })
            }
        }

        //enemy set
        levelDetails.enemySets = (EnemySetSpecifier.create(type));

        //Terrain specification
        for(var i = 1; i <= 6; i++) {
            levelDetails.possibleTiles.push('FrollGround/Twilight'+i);
        }

        return levelDetails;
    }
}

export default levelSpecifier;
