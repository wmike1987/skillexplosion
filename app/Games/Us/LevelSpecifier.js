import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import EnemySetSpecifier from '@games/Us/EnemySetSpecifier.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import TileMapper from '@core/TileMapper.js'

var levelSpecifier = {
    create: function(type, options) {
        var tileTint = mathArrayUtils.getRandomElementOfArray(options.acceptableTileTints);
        var levelDetails = {
            type: type,
            tileSize: 225,
            enemySets: [],
            createTerrain: function(scene) {
                var tileMap = TileMapper.produceTileMap({possibleTextures: options.getLevelTiles(), tileWidth: options.tileSize, tileTint: tileTint});
                scene.add(tileMap);

                if(options.levelTileExtension) {
                    options.levelTileExtension(scene, tileTint);
                }
            },

            resetLevel: function() {
                this.enemySets.forEach(set => {
                    set.fulfilled = false;
                })
            }
        };

        //enemy set
        levelDetails.enemySets = EnemySetSpecifier.create({type: type, possibleEnemies: options.enemySets});

        return levelDetails;
    }
}

export default levelSpecifier;
