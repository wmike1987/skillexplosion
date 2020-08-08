define(['jquery', 'matter-js', 'pixi', 'utils/GameUtils', 'games/Us/UnitMenu', 'games/Us/EnemySetSpecifier', 'core/Tooltip',],
function($, Matter, PIXI, utils, unitMenu, EnemySetSpecifier, Tooltip) {

    //Token Mappings
    var typeTokenMappings = {
        singles: 'MapGoldBattleToken',
        triplets: 'MapRedBattleToken',
        boss: 'MapRedBattleToken',
        norevives: 'MapRedBattleToken',
        mobs: 'MapRedBattleToken',
    }

    //Define node object
    var mapLevelNode = function(levelDetails) {
        this.levelDetails = levelDetails;
        this.displayObject = utils.createDisplayObject(typeTokenMappings[levelDetails.type], {scale: {x: .75, y: .75}});
        this.displayObject.interactive = true;

        var enemyDescriptions = [];
        var enemyIcons = [];
        levelDetails.enemySets.forEach(set => {
            enemyDescriptions.push(' x ' + set.spawn.total);
            enemyIcons.push(set.icon);
        })
        Tooltip.makeTooltippable(this.displayObject, {
            title: levelDetails.type,
            description: enemyDescriptions,
            descriptionIcons: enemyIcons,
            noDelay: true});

        var self = this;

        this.displayObject.on('mouseover', function(event) {
            if(!this.isCompleted)
                this.displayObject.tint = 0x20cd2c;
        }.bind(this))
        this.displayObject.on('mouseout', function(event) {
            if(!this.isCompleted)
                this.displayObject.tint = 0xFFFFFF;
        }.bind(this))
        this.displayObject.on('mousedown', function(event) {
            if(!self.isCompleted) {
                currentGame.nextLevel(self);
            }
        })

        this.setPosition = function(position) {
            this.displayObject.position = position;
            this.position = position;
        }
    }

    var levelSpecifier = {
        create: function(type, seed) {
            var levelDetails = {
                type: type,
                enemySets: [],
                possibleTiles: [],
                realTileWidth: 370,
                resetLevel: function() {
                    this.enemySets.forEach(set => {
                        set.fulfilled = false;
                    })
                }
            }

            //enemy set
            levelDetails.enemySets = (EnemySetSpecifier.create(type));

            //Terrain specification
            var gType = utils.getRandomElementOfArray(["Red", "Orange", "Yellow"]);
            for(var i = 1; i < 7; i++) {
                levelDetails.possibleTiles.push('LushGrass1/'+gType+'Grass'+i);
            }

            return new mapLevelNode(levelDetails);
        }
    }

    return levelSpecifier;
})
