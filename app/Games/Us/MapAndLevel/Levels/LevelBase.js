import * as $ from 'jquery';
import * as Matter from 'matter-js';
import {
    globals,
    keyStates,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import TileMapper from '@core/TileMapper.js';
import {
    Doodad
} from '@utils/Doodad.js';
import levelNamer from '@games/Us/Worlds/LevelNamer.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import styles from '@utils/Styles.js';
import {
    Scene
} from '@core/Scene.js';
import UnitSpawner from '@games/Us/UnitSpawner.js';
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js';
import Tooltip from '@core/Tooltip.js';

var levelAugments = {
    enraged: {
        action: function(enemy) {
            enemy.enrage({duration: 99999, amount: 4});
        },
        tint: 0x550f0f,
        getSystemMessage: () => {
            return {text: 'Enraged', style: 'systemMessageTextAugment', tint: 0xbd1515};
        }
    },
    armored: {
        action: function(enemy) {
            enemy.applyDefenseBuff({duration: 99999, amount: 3});
        },
        tint: 0x3d3d3d,
        getSystemMessage: () => {
            return {text: 'Armored', style: 'systemMessageTextAugment', tint: 0x7b759f};
        }
    },
    infested: {
        init: function(level) {
            level.worldSpecs.infestLevel(level);
        },
        action: function(enemy) {
            // enemy.enrage();
        },
        getSystemMessage: () => {
            return {text: 'Infested', style: 'systemMessageTextAugment', tint: 0x8147b8};
        }
    },
    norevive: {
        action: function(enemy) {
            // enemy.enrage();
        },
        label: 'No Revive'
    },
    slippery: {
        action: function(enemy) {
            enemy.applyDodgeBuff({duration: 99999, amount: 25});
        },
        tint: 0x144614,
        getSystemMessage: () => {
            return {text: 'Slippery', style: 'systemMessageTextAugment', tint: 0x0d853d};
        }
    },
    hardened: {
        action: function(enemy) {
            enemy.giveGritDodge(true);
            enemy.grit = 1;
        },
        tint: 0x674501,
        getSystemMessage: () => {
            return {text: 'Hardened', style: 'systemMessageTextAugment', tint: 0xa67b29};
        }
    },
    vitalityBoss: {
        init: function(level) {
            level._isBossLevel = true;
            level.entrySound = mathArrayUtils.getRandomElementOfArray([globals.currentGame.soundPool.growl1, globals.currentGame.soundPool.growl2, globals.currentGame.soundPool.growl3, globals.currentGame.soundPool.growl4]);
        },
        tint: 0x3f064b,
        action: function(enemy) {
            enemy.applyVitalityBuff({duration: 999999, amount: 250});

            if(true) {
                enemy.enrage({duration: 999999, amount: 6});
            }
        },
        getSystemMessage: () => {
            return {text: 'Ultra', style: 'systemMessageTextAugment', tint: 0x9c2674};
        }
    }
};

var levelBase = {
    resetLevel: function() {
        this.enemySets.forEach(set => {
            set.fulfilled = false;
        });
    },

    enterLevel: function(options) {
        options = Object.assign({
            enteredByTraveling: false
        }, options);

        this.enteredState = {
            enteredByTraveling: options.enteredByTraveling
        };

        if (options.keepCurrentCollector) {
            this.enteredState.startNewCollector = false;
        }

        //set our random seed for terrain decoration
        mathArrayUtils.setRandomizerSeed(this.seed || null);

        //possible hijack the entry
        if (this.hijackEntry) {
            var res = this.hijackEntry();
            if (res) return;
        }

        //create the scene
        var scene = new Scene();
        this.scene = scene;

        this.scene.addCleanUpTask(() => {
            this.tileMap = null;
        });

        //transition to our new scene
        globals.currentGame.currentScene.transitionToScene({
            newScene: scene,
            centerPoint: this.mapNode.position,
            mode: options.mode || null,
            transitionLength: options.transitionLength || null,
            leftToRight: options.leftToRight
        });

        //fill the scene
        this.fillLevelScene(scene);

        Matter.Events.trigger(globals.currentGame, 'EnterLevel', {
            level: this
        });

        //upon entering a new level, remove any level local entities
        globals.currentGame.removeAllLevelLocalEntities();

        //call a totally custom entry method, or call a prebaked entry method
        if (options.customEnterLevel) {
            options.customEnterLevel(this);
        } else {
            this.mode.enter.call(this, scene, this.enteredState);
        }

        if (this.enterLevelExtension) {
            this.enterLevelExtension(scene);
        }

        mathArrayUtils.setRandomToTrueRandom();
    },

    startHeartbeat: function(options) {
        options = options || {};
        options = Object.assign({
            startNewCollector: true
        }, options);
        var level = this;
        var game = globals.currentGame;

        //reset level
        this.resetLevel();

        //create the initial unit set
        level.spawner.createInitialUnitSet();

        //create augment listener
        this._applyLevelAugments();

        //create unit notifiers
        this._applyUnitNotifiers();

        //show heart beats
        gameUtils.doSomethingAfterDuration(() => {
            graphicsUtils.floatText('.', gameUtils.getPlayableCenterPlus({
                y: 20
            }), {
                duration: 1000,
                style: styles.titleOneStyle
            });
            game.unitSystem.unpause();
            game.heartbeat.play();
            game.battleInProgress = true;

            //show the current enemy set
            globals.currentGame.unitSystem.unitPanel.clearEnemyIcons();
        }, 800);
        gameUtils.doSomethingAfterDuration(() => {
            graphicsUtils.floatText('.', gameUtils.getPlayableCenterPlus({
                y: 20
            }), {
                duration: 1000,
                style: styles.titleOneStyle
            });
            game.heartbeat.play();
            gameUtils.setCursorStyle('Main');
        }, 1600);

        var textDuration = 3000;
        gameUtils.doSomethingAfterDuration(() => {
            //start enemy spawnage
            level.spawner.start();
            let levelTitleText = graphicsUtils.floatText(level.nodeTitle, gameUtils.getPlayableCenterPlus({
                y: 20
            }), {
                duration: textDuration,
                style: styles.titleOneStyle
            });
            graphicsUtils.fadeSpriteInQuickly(levelTitleText, 500);
            graphicsUtils.flashSprite({
                sprite: levelTitleText
            });

            let additionalPropertiesText = this.getAugmentSystemMessages();
            additionalPropertiesText.forEach((augment, index) => {
                let augmentText = graphicsUtils.floatText(augment.text, gameUtils.getPlayableCenterPlus({
                    y: 60 + (index * 20)
                }), {
                    duration: textDuration,
                    style: styles.levelTextAugment
                });
                augmentText.tint = augment.tint;
                graphicsUtils.fadeSpriteInQuickly(augmentText, 500);
            });

            game.heartbeat.play();

            //show new enemy sets
            globals.currentGame.unitSystem.unitPanel.addEnemyIcons(this, additionalPropertiesText.length * 20);

            if (!options.continuation) {
                Matter.Events.trigger(globals.currentGame, 'BeginLevel', {
                    level: level
                });
            }
            level.initializeWinLossCondition();
        }, 2400);
    },

    startPooling: function() {
        if(!this.isBattleLevel()) {
            return;
        }
        this.spawner = new UnitSpawner({
            enemySets: this.enemySets,
            createOneShotUnit: this.createOneShotUnit,
            seed: this.seed
        });
        this.spawner.startPooling();
    },

    getEntrySound: function() {
        return this.entrySound;
    },
    enemySets: [],

    init: function(type, worldSpecs, options) {
        //combine default options and passed in options
        Object.assign(this, {
            type: type,
            possibleModes: modes,
            mode: modes.SPAWN,
            outer: false,
            mapRef: options.mapRef,
            campLikeActive: false,
            entrySound: worldSpecs.entrySound,
            worldSpecs: Object.assign({}, worldSpecs),
            seed: Math.random(),
            itemClass: 'lightStimulant',
            itemType: 'item',
            _incursTravelFatigue: true,
            isSupplyDropEligible: true,
            specificAugment: null,
            levelAugments: [],
            createOneShotUnit: mathArrayUtils.flipCoin() || mathArrayUtils.flipCoin(),
        }, options.levelOptions || {});

        //default no zones
        this.noZones = [{
            center: globals.currentGame.augmentRackPosition,
            radius: 40
        }, {
            center: globals.currentGame.mapTablePosition,
            radius: 60
        }, {
            center: globals.currentGame.flagPosition,
            radius: 60
        }, {
            center: gameUtils.getPlayableCenter(),
            radius: 120
        }];

        //convenience... for now. Will redo this
        if(this.randomAugment) {
            this.levelAugments = mathArrayUtils.getRandomElementOfArray(['enraged', 'armored', 'slippery', 'hardened', 'infested']);
        } else if(this.specificAugment) {
            mathArrayUtils.convertToArray(this.specificAugment);
            this.levelAugments = this.specificAugment;
        }

        //set the level augment
        let tempAugments = [];
        this.levelAugments = mathArrayUtils.convertToArray(this.levelAugments);
        this.levelAugments.forEach((aug) => {
            tempAugments.push(levelAugments[aug]);
        });
        this.levelAugments = tempAugments;

        //set the tile tint
        this.tintIndex = this.outer ? mathArrayUtils.getRandomElementOfArray(worldSpecs.outerTintIndexes) : mathArrayUtils.getRandomElementOfArray(worldSpecs.innerTintIndexes);
        this.tileTint = options.levelOptions.tileTint || (this.outer ? worldSpecs.acceptableTileTints[this.tintIndex] : worldSpecs.acceptableTileTints[this.tintIndex]);

        //set the enemy def (deep copy)
        this.enemyDefs = $.extend(true, {}, worldSpecs.enemyDefs[type]);

        //generate camp name
        let noun = this.levelNounOverride || this.enemyDefs.noun || 'Enemy';
        let levelStrength = this.levelStrengthOverride || this.enemyDefs.strength || 'basic';
        this.nodeTitle = this.levelTitleOverride || levelNamer.getName({noun: noun, type: levelStrength});

        //pre node init
        if (this.preNodeInit) {
            this.preNodeInit(type, worldSpecs, options);
        }

        //init augments
        this.levelAugments.forEach((aug) => {
            if(aug.init) {
                aug.init(this);
            }
        });

        //fulfill enemy sets
        if (this.enemyDefs) {
            this.enemySets = EnemySetSpecifier.create(this.enemyDefs);
        }

        this.totalEnemies = this.enemySets.reduce((tally, current) => {
            if (!current.trivial) {
                return tally + current.spawn.total;
            } else {
                return tally;
            }
        }, 0);

        //create the map node
        if (!options.mapNodeOptions.bypassNodeCreation) {
            var mapNode = this.createMapNode(options.mapNodeOptions);
            this.mapNode = mapNode;
            var position = options.mapNodeOptions.position;
            if (this.manualNodePosition) {
                var returnedPosition = this.manualNodePosition(position);
                if (returnedPosition) {
                    mapNode.setPosition(returnedPosition);
                }
            } else {
                mapNode.setPosition(position);
            }
        }

        if (this.initExtension) {
            this.initExtension(type, worldSpecs, options);
        }

        if (this.manualAddToGraph) {
            this.manualAddToGraph(this.mapRef.graph);
        }
    },

    isLevelConfigurable: function() {
        return this.campLikeActive;
    },

    isBattleLevel: function() {
        return (!this.isCompleted && this.enemySets.length > 0);
    },

    isBossLevel: function() {
        return this._isBossLevel;
    },

    isAugmented: function() {
        return this.levelAugments.length > 0;
    },

    isOutingReady: function() {
        return this.isBattleLevel() && !this.trainingLevel;
    },

    incursTravelFatigue: function() {
        return this._incursTravelFatigue;
    },

    fillLevelScene: function(scene) {
        //set the random seed

        //fill everything
        this.tileMap = TileMapper.produceTileMap({
            possibleTextures: this.worldSpecs.levelTiles,
            tileWidth: this.worldSpecs.tileSize,
            tileTint: this.tileTint
        });
        scene.add(this.tileMap);

        if (this.worldSpecs.decorateTerrain) {
            this.worldSpecs.decorateTerrain.call(this, scene, this.tileTint);
        }

        if (this.fillLevelSceneExtension) {
            this.fillLevelSceneExtension(scene);
        }
    },

    createMapNode: function(options) {
        options.levelDetails = this;
        return new MapNode(options);
    },

    createMapTable: function(scene, options) {
        options = options || {};

        this.mapTableSprite = graphicsUtils.createDisplayObject('mapbox');
        var mapTable = new Doodad({
            drawWire: false,
            collides: true,
            autoAdd: false,
            radius: 20,
            texture: [this.mapTableSprite],
            stage: 'stage',
            scale: {
                x: 1.0,
                y: 1.0
            },
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred',
            shadowScale: {
                x: 1.0,
                y: 1.0
            },
            shadowOffset: {
                x: 0,
                y: 18
            },
            position: options.position || globals.currentGame.mapTablePosition
        });
        this.mapTable = mapTable;
        scene.add(mapTable);

        var mapHoverTick = globals.currentGame.addTickCallback(function(event) {
            if (!this.mapTableActive) return;
            if (Matter.Vertices.contains(mapTable.body.vertices, mousePosition)) {
                this.mapTableSprite.tint = 0xff33cc;
            } else {
                this.mapTableSprite.tint = 0xFFFFFF;
            }
        }.bind(this));

        var self = this;
        //Establish map click listeners
        var mapClickListener = globals.currentGame.addPriorityMouseDownEvent(function(event) {
            if (event.which == 3) return; //don't allow right clicks
            if (!self.mapTableActive) return;
            var canvasPoint = mathArrayUtils.clonePosition(mousePosition);

            if (Matter.Vertices.contains(mapTable.body.vertices, canvasPoint) && !this.mapActive) {
                this.unitSystem.pause();
                this.map.show();
                this.mapActive = true;
            }
        }.bind(globals.currentGame));

        scene.add(function() {
            $('body').on('keydown.map', function(event) {
                var key = event.key.toLowerCase();
                if (key == 'escape' && this.mapActive && this.map.keyEventsAllowed && !this.map.isOnActiveTravelToken()) {
                    this.closeMap({forceClose: false});
                }
            }.bind(globals.currentGame));
        });

        scene.addCleanUpTask(() => {
            globals.currentGame.removePriorityMouseDownEvent(mapClickListener);
            globals.currentGame.removeTickCallback(mapHoverTick);
            this.mapTableSprite = null;
            $('body').off('keydown.map');
        });

        return this.mapTable;
    },

    _onLevelPlayable: function(scene) {
        Matter.Events.trigger(globals.currentGame, "onLevelPlayable");
        if(this.entrySound) {
            gameUtils.doSomethingAfterDuration(() => {
                this.entrySound.play();
            }, 250);
        }
        if (this.onLevelPlayable) {
            this.onLevelPlayable(scene);
        }
    },

    _applyLevelAugments: function() {
        var level = this;
        this.augmentListener = Matter.Events.on(globals.currentGame, 'UnitPostEnteredPlayable', (event) => {
            let unit = event.unit;

            //establish exceptions
            if(unit.hazard || unit.team != globals.currentGame.enemyTeam || unit.immuneToAugment) {
                return;
            }

            //apply the augment if the unit passed
            level.levelAugments.forEach((aug) => {
                aug.action(unit);
            });
        });
    },

    _applyUnitNotifiers: function() {
        var level = this;
        this.unitNotifierListener = Matter.Events.on(globals.currentGame, 'UnitSpawnerAddedUnit', (event) => {
            let unit = event.unit;

            //establish exceptions
            if(unit.hazard || unit.team != globals.currentGame.enemyTeam || unit.immuneToAugment) {
                return;
            }

            let notifierArrow = graphicsUtils.addSomethingToRenderer('UnitNotifierArrow', {where: 'hudTwo', alpha: 0.8, scale: {x: 0.75, y: 0.75}, tint: 0xffffff});

            graphicsUtils.flashSprite(notifierArrow);
            graphicsUtils.flashSprite({
                sprite: notifierArrow,
                duration: 75,
                times: 12,
                toColor: 0xff2424
            });
            let offset = 20;
            var unitNotifierTick = globals.currentGame.addTickCallback(() => {
                notifierArrow.position = mathArrayUtils.clonePosition(unit.position);
                if(notifierArrow.position.x > gameUtils.getPlayableWidth()) {
                    notifierArrow.position.x = gameUtils.getPlayableWidth()-offset;
                }

                if(notifierArrow.position.x < 0) {
                    notifierArrow.position.x = offset;
                }

                if(notifierArrow.position.y > gameUtils.getPlayableHeight()) {
                    notifierArrow.position.y = gameUtils.getPlayableHeight()-offset;
                }

                if(notifierArrow.position.y < 0) {
                    notifierArrow.position.y = offset;
                }
                notifierArrow.rotation = mathArrayUtils.pointInDirection(notifierArrow.position, unit.position);
            }, {runImmediately: true});

            gameUtils.deathPact(unit, notifierArrow);
            gameUtils.deathPact(unit, unitNotifierTick);

            unit.unitNotifierTick = unitNotifierTick;

            Matter.Events.on(unit, 'UnitPreEnteredPlayable', () => {
                graphicsUtils.removeSomethingFromRenderer(notifierArrow);
                globals.currentGame.removeTickCallback(unitNotifierTick);
            });
        });
    },

    _removeLevelAugmentListener: function() {
        Matter.Events.off(globals.currentGame, 'UnitPostEnteredPlayable', this.augmentListener);
    },

    _removeUnitNotifierListener: function() {
        Matter.Events.off(globals.currentGame, 'UnitSpawnerAddedUnit', this.unitNotifierListener);
    },

    getAugmentSystemMessages: function() {
        var messages = [];
        this.levelAugments.forEach((aug) => {
            messages.push(aug.getSystemMessage());
        });

        return messages;
    },

    cleanUp: function() {

    },

    showAdrenalineReward: function(options) {
        var onDone = options.onDone;
        var onAdrenalineAdd = options.onAdrenalineAdd;
        var artificialWait = options.artificialWait || 1000;
        var endAfter = options.endAfter;

        //default to +1 adrenaline
        var adrenalineIsFull = globals.currentGame.map.isAdrenalineFull();
        var addedAdrenaline = 1;
        var rewardText = null;
        var t = '+1 adrenaline!';

        //check for +2 reward
        if (globals.currentGame.rewardManager.checkExtraAdrenalineReward()) {
            addedAdrenaline = 2;
            rewardText = 'Efficient clearance!';
            t = '+2 adrenaline!';
        }

        //create text chain
        var textChain = graphicsUtils.createFloatingTextChain({
            onDone: onDone
        });

        //show reward (efficient clearance)
        if (rewardText) {
            textChain.add({
                text: rewardText,
                position: gameUtils.getPlayableCenterPlus({
                    y: 300
                }),
                additionalOptions: {
                    where: 'hudTwo',
                    fadeIn: true,
                    style: styles.adrenalineTextLarge,
                    speed: 6,
                    duration: 1800,
                    startNextAfter: 1000,
                    onStart: (myText) => {
                        globals.currentGame.soundPool.positiveSoundFast.play();
                        graphicsUtils.addGleamToSprite({
                            sprite: myText,
                            gleamWidth: 50,
                            duration: 500
                        });
                    }
                }
            });
        }

        //add the adrenaline text
        if (!adrenalineIsFull) {
            textChain.add({
                text: t,
                position: gameUtils.getPlayableCenterPlus({
                    y: 300
                }),
                additionalOptions: {
                    where: 'hudTwo',
                    fadeIn: true,
                    style: styles.adrenalineTextLarge,
                    speed: 6,
                    duration: 1800,
                    startNextAfter: 1000,
                    onStart: (myText) => {
                        var actualAdrenalineAdded = globals.currentGame.map.addAdrenalineBlock(addedAdrenaline);
                        if (options.onAdrenalineAdd) {
                            options.onAdrenalineAdd(actualAdrenalineAdded);
                        }
                        globals.currentGame.soundPool.positiveSoundFast.play();
                        graphicsUtils.addGleamToSprite({
                            sprite: myText,
                            gleamWidth: 50,
                            duration: 500
                        });
                    }
                }
            });
        }
        // else {
        //     textChain.add({
        //         text: 'Excellent',
        //         position: gameUtils.getPlayableCenterPlus({
        //             y: 300
        //         }),
        //         additionalOptions: {
        //             where: 'hudTwo',
        //             fadeIn: true,
        //             style: styles.adrenalineTextLarge,
        //             speed: 6,
        //             duration: 1800,
        //             startNextAfter: 1000,
        //             onStart: (myText) => {
        //                 globals.currentGame.soundPool.positiveSoundFast.play();
        //                 graphicsUtils.addGleamToSprite({
        //                     sprite: myText,
        //                     gleamWidth: 50,
        //                     duration: 500
        //                 });
        //             }
        //         }
        //     });
        // }

        var fatiguePenalty = currentGame.map.fatigueIncrement;
        if(rewardText) {
            fatiguePenalty = 2;
        }
        currentGame.map.startingFatigue += fatiguePenalty;

        textChain.add({
            text: '+ ' + fatiguePenalty + ' starting fatigue',
            position: gameUtils.getPlayableCenterPlus({
                y: 300
            }),
            additionalOptions: {
                where: 'hudTwo',
                style: styles.fatigueTextLarge,
                speed: 6,
                duration: 1800,
                endAfter: endAfter,
                onStart: (myText) => {
                    globals.currentGame.soundPool.negativeSound.play();
                    graphicsUtils.addGleamToSprite({
                        sprite: myText,
                        gleamWidth: 80,
                        duration: 500
                    });
                }
            }
        });

        gameUtils.doSomethingAfterDuration(() => {
            textChain.play();
        }, artificialWait);
    },

    initializeWinLossCondition: function() {
        var winResult = 'victory';
        var lossResult = 'loss';
        var game = globals.currentGame;

        var removeCurrentConditions = function() {
            game.removeTickCallback(winCondition);
            game.removeTickCallback(lossCondition);
        };

        //to-be called upon the win conditions being fulfilled
        var winAndContinueTasks = function(options) {

            //stop current collectors
            if (game.shaneCollector.isCollecting()) {
                game.shaneCollector.stopCurrentCollector();
                if (game.ursulaCollector) {
                    game.ursulaCollector.stopCurrentCollector();
                }
            }

            //mark us as 'won'
            this.isCompleted = true;

            //clean up spawner
            this.spawner.cleanUp();

            //wait a second then add space to continue button
            gameUtils.doSomethingAfterDuration(() => {
                this.spaceToContinue = graphicsUtils.addSomethingToRenderer("TEX+:Space to continue", {
                    where: 'hudText',
                    style: styles.escapeToContinueStyle,
                    anchor: {
                        x: 0.5,
                        y: 1
                    },
                    position: {
                        x: gameUtils.getPlayableWidth() - 210,
                        y: gameUtils.getPlayableHeight() - 20
                    }
                });
                this.spaceFlashTimer = graphicsUtils.graduallyTint(this.spaceToContinue, 0xFFFFFF, 0x3183fe, 120, null, false, 3);
                game.currentScene.add(this.spaceToContinue);
                game.soundPool.positiveSound.play();

                //add space listener
                $('body').on('keydown.levelkeydown', function(event) {
                    var key = event.key.toLowerCase();
                    if (key == ' ') {
                        //clear the unit panel enemy count
                        globals.currentGame.unitSystem.unitPanel.clearEnemyIcons();

                        $('body').off('keydown.levelkeydown');
                        game.soundPool.sceneContinue.play();
                        this.spaceFlashTimer.invalidate();
                        graphicsUtils.graduallyTint(this.spaceToContinue, 0xFFFFFF, 0x6175ff, 60, null, false, 3, function() {
                            this.spaceToContinue.visible = false;
                            options.onContinue();
                        }.bind(this));
                    }
                }.bind(this));
            }, 1000);
        }.bind(this);

        //to-be called upon the win/loss conditions being fulfilled
        var commonLossTasks = function() {
            this._removeLevelAugmentListener();
            this._removeUnitNotifierListener();
            globals.currentGame.itemSystem.removeAllItemsOnGround(true);
            globals.currentGame.unitSystem.pause();
            removeCurrentConditions.call(this);
            gameUtils.setCursorStyle('None');
            game.unitsInPlay.forEach((unit) => {
                unit.isSelectable = false;
                globals.currentGame.unitSystem.deselectUnit(unit);
            });
            // unitUtils.prepareUnitsForStationaryDraw();
            game.shaneCollector.stopCurrentCollector();
            game.ursulaCollector.stopCurrentCollector();

            //clear the unit panel enemy count
            globals.currentGame.unitSystem.unitPanel.clearEnemyIcons();
        }.bind(this);

        /*
         * Win condition listener
         */
        this.endDelayInProgress = false;
        var winCondition = game.addTickCallback(function() {

            //See if our enemy sets have been fulfilled
            var fulfilled = this.enemySets.every((eset) => {
                return eset.fulfilled || eset.trivial;
            });

            //if they have been fulfilled, see if enemy units still exist
            var unitsOfOpposingTeamExist = false;

            //manual win flag for debugging
            if (!globals.currentGame.manualWin) {
                if (!fulfilled) return;

                if (game.unitsByTeam[game.enemyTeam]) {
                    unitsOfOpposingTeamExist = game.unitsByTeam[game.enemyTeam].some(function(unit) {
                        return !unit.hazard;
                    });
                }
            }

            //win condition
            let winConditional = function() {
                return globals.currentGame.manualWin ||
                    (!this.endDelayInProgress &&
                        !unitsOfOpposingTeamExist &&
                        game.itemSystem.itemsOnGround.length == 0 &&
                        game.itemSystem.getDroppingItems().length == 0);
            }.bind(this);

            //if the win condition is met...
            if (winConditional()) {
                globals.currentGame.manualWin = false;
                this.endDelayInProgress = true;
                game.battleInProgress = false;
                Matter.Events.trigger(globals.currentGame, "CurrentLevelWinConditionMet");

                //remove hazard units when we're transitioning to the next scene
                gameUtils.matterOnce(globals.currentGame.currentScene, 'sceneFadeOutBegin', function() {
                    let enemies = unitUtils.getUnitEnemies(game.shane);
                    enemies.forEach((enemy) => {
                        if (enemy.hazard) {
                            this.spawner.cleanUp();
                            game.removeUnit(enemy);
                        }
                    });
                }.bind(this));

                //remove level augment listener
                this._removeLevelAugmentListener();
                this._removeUnitNotifierListener();

                //remove win/loss condition
                removeCurrentConditions();

                if (this.customWinBehavior) {
                    // totally custom win behavior
                    this.customWinBehavior();
                } else if(this.semiCustomWinBehavior) {
                    //basically the same as above, but we also want to mark the level as completed
                    this.isCompleted = true;
                    this.semiCustomWinBehavior();
                } else if (this.gotoMapOnWin) { //else goto map upon win
                    winAndContinueTasks({
                        onContinue: function() {
                            gameUtils.doSomethingAfterDuration(() => {
                                Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                                    result: winResult
                                });
                                Matter.Events.trigger(this, 'endLevelActions');
                                var sc = game.transitionToBlankScene();
                                game.map.show({
                                    backgroundAlpha: 1.0,
                                    backgroundTint: 0x000d07
                                });

                                //move shane/urs off screen
                                game.unitsInPlay.forEach((unit) => {
                                    unitUtils.moveUnitOffScreen(unit);
                                });

                                //remove level local entities
                                game.removeAllLevelLocalEntities();
                            }, 32);
                        }.bind(this)
                    });
                } else { //else do the default win behavior
                    this.showAdrenalineReward({
                        onDone: () => {
                            winAndContinueTasks({
                                onContinue: function() {
                                    gameUtils.doSomethingAfterDuration(() => {
                                        Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                                            result: winResult
                                        });

                                        var sc = game.gotoEndLevelScreen({
                                            result: winResult
                                        });

                                        Matter.Events.trigger(this, 'endLevelActions', {
                                            endLevelScene: sc
                                        });
                                    }, 0);
                                }.bind(this)
                            });
                        },
                        endAfter: 1
                    });
                }
            }
        }.bind(this));

        /*
         * Loss condition
         */
        var lossCondition = game.addTickCallback(function() {
            if (!this.endDelayInProgress) {
                var stillAlive = game.unitsInPlay.some((unit) => {
                    return !unit.isDead;
                });
                if (stillAlive) return;
                this.endDelayInProgress = true;

                commonLossTasks();

                gameUtils.doSomethingAfterDuration(() => {
                    if (this.gotoMapOnWin) {
                        gameUtils.setCursorStyle('Main');
                        Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                            result: lossResult
                        });
                        game.map.revertHeadToPreviousLocationDueToDefeat();
                        game.removeAllLevelLocalEntities();
                        let enemies = unitUtils.getUnitEnemies(game.shane);
                        enemies.forEach((enemy) => {
                            game.removeUnit(enemy);
                        });
                        game.map.show({
                            backgroundAlpha: 1.0,
                            backgroundTint: 0x000d07
                        });
                    } else {
                        this.scene.addCleanUpTask(() => {
                            this.spawner.cleanUp();
                            let game = globals.currentGame;
                            let enemies = unitUtils.getUnitEnemies(game.shane);
                            enemies.forEach((enemy) => {
                                game.removeUnit(enemy);
                            });
                        });
                        game.unitsInPlay.forEach((unit) => {
                            unit.endLevelPosition = mathArrayUtils.clonePosition(unit.isDead ? unit.deathPosition : unit.position);
                        });
                        Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                            result: lossResult
                        });
                        game.map.revertHeadToPreviousLocationDueToDefeat();
                        var sc = game.gotoEndLevelScreen({
                            result: lossResult,
                        });
                    }
                }, 750);
            }
        }.bind(this));
    }
};

var modes = {
    SPAWN: {
        enter: function(scene, options) {
            options = options || {};
            var game = globals.currentGame;
            var level = this;
            //create new scene
            game.closeMap();
            Matter.Events.on(scene, 'initialize', function() {
                game.unitSystem.pause();
                gameUtils.setCursorStyle('None');
                var shaneStart = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                    x: -20
                });
                var ursulaStart = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                    x: 20
                });
                game.setUnit(game.shane, {
                    position: mathArrayUtils.clonePosition(shaneStart, game.offscreenStartLocation),
                    moveToCenter: true,
                    applyFatigue: true
                });
                game.setUnit(game.ursula, {
                    position: mathArrayUtils.clonePosition(ursulaStart, game.offscreenStartLocation),
                    moveToCenter: true,
                    applyFatigue: true
                });
                level.startHeartbeat(options);
                level._onLevelPlayable(scene);
            });

            gameUtils.doSomethingAfterDuration(() => {
                Matter.Events.trigger(globals.currentGame, 'EarlyEnterBattleLevel');
            }, 1000);

            game.level += 1;
        }
    },
    CUSTOM: {
        enter: function(scene) {
            var game = globals.currentGame;
            var level = this;
            game.currentLevel = level;

            if (this.completeUponEntry) {
                level.mapNode.complete();
                gameUtils.matterOnce(game.map, 'showMap', () => {
                    level.mapNode.playCompleteAnimation(level.lesserSpin);
                });
            }
            game.closeMap();
            Matter.Events.on(scene, 'initialize', function() {
                level._onLevelPlayable(scene);
            });
        }
    },
};

export default levelBase;
