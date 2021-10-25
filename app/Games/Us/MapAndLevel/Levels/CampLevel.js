import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    globals,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import Tooltip from '@core/Tooltip.js';
import TileMapper from '@core/TileMapper.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import {Doodad} from '@utils/Doodad.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import styles from '@utils/Styles.js';
import UnitMenu from '@games/Us/UnitMenu.js';

var entrySound = gameUtils.getSound('enterairdrop1.wav', {
    volume: 0.04,
    rate: 1
});
var airDropClickTokenSound = gameUtils.getSound('clickairdroptoken1.wav', {
    volume: 0.03,
    rate: 1
});

var campLevel = function() {
    this.initExtension = function(type, worldSpecs, options) {
        this.isCampProper = true;
        this.campLikeActive = true;
        this.mapTableActive = true;
        this.camp = options.levelOptions.camp;
        this.position = gameUtils.getPlayableCenter();
        this.mode = this.possibleModes.CUSTOM;
        this.isSupplyDropEligible = false;

        if (this.camp.initExtension) {
            this.camp.initExtension.call(this);
        }
    };

    this.fillLevelSceneExtension = function(scene) {
        //Init camp objects
        this.camp.getCampObjects().forEach((obj) => {
            scene.add(obj);
        });

        //Init camp sounds
        this.camp.initSounds();

        //Init trees/doodads
        var possibleTrees = this.camp.getPossibleTrees();
        var treeOptions = {};
        treeOptions.start = {
            x: 0,
            y: 0
        };

        var trees = [];
        if(!this.treeCache) {
            this.treeCache = [];
            treeOptions.width = 150;
            treeOptions.height = gameUtils.getPlayableHeight() + 50;
            treeOptions.density = 0.15;
            treeOptions.possibleTrees = possibleTrees;
            this.treeCache = this.treeCache.concat(SceneryUtils.fillAreaWithTrees(treeOptions));

            treeOptions.start = {
                x: gameUtils.getPlayableWidth() - 200,
                y: 0
            };
            this.treeCache = this.treeCache.concat(SceneryUtils.fillAreaWithTrees(treeOptions));
            trees = this.treeCache;
        } else {
            this.treeCache.forEach((tr) => {
                trees.push(tr.rebuild());
            });
        }

        scene.add(trees);

        //Init common doodads
        var flag = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'wflag',
            speed: 0.2,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flag.play();
        var flagD = new Doodad({
            collides: true,
            autoAdd: false,
            radius: 20,
            texture: [flag],
            stage: 'stage',
            scale: {
                x: 1,
                y: 1
            },
            shadowOffset: {
                x: 0,
                y: 30
            },
            shadowScale: {
                x: 0.7,
                y: 0.7
            },
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 35,
            position: {
                x: gameUtils.getCanvasCenter().x + 50,
                y: gameUtils.getCanvasCenter().y - 175
            }
        });
        scene.add(flagD);

        var fireAnimation = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'campfire',
            speed: 0.75,
            loop: true,
            transform: [0, 0, 1.2, 1.3]
        });
        fireAnimation.alpha = 0.0;
        fireAnimation.where = 'stage';
        fireAnimation.play();
        var campfire = new Doodad({
            collides: true,
            autoAdd: false,
            radius: 40,
            bodyScale: {
                y: 0.5
            },
            texture: [fireAnimation, {
                doodadData: 'Logs',
                offset: {
                    x: 2,
                    y: 0
                }
            }],
            stage: 'stage',
            scale: {
                x: 1.4,
                y: 1.4
            },
            shadowOffset: {
                x: 0,
                y: 25
            },
            shadowScale: {
                x: 1.3,
                y: 1.3
            },
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 35,
            position: {
                x: gameUtils.getCanvasCenter().x,
                y: gameUtils.getCanvasCenter().y - 40
            }
        });
        scene.add(campfire);
        this.campfire = campfire;

        this.createMapTable(scene);

        //Setup light
        this.lightPower = 0.0;
        this.lightDirection = 1;
        this.lightRadius = 700;

        var backgroundRed = 4.0;
        this.backgroundLightShader = new PIXI.Filter(null, campfireShader, {
            lightOnePosition: {
                x: gameUtils.getCanvasCenter().x,
                y: gameUtils.getPlayableHeight() / 2 + 30
            },
            flameVariation: 0.0,
            yOffset: 0.0,
            red: backgroundRed,
            green: 1.0,
            blue: 1.0,
            lightPower: 2.0,
            progress: 0.5
        });

        var stageRed = 3.4;
        this.stageLightShader = new PIXI.Filter(null, campfireShader, {
            lightOnePosition: {
                x: gameUtils.getCanvasCenter().x,
                y: gameUtils.getPlayableHeight() / 2 + 30
            },
            flameVariation: 0.0,
            yOffset: 60.0,
            red: stageRed,
            green: 1.5,
            blue: 1.0,
            lightPower: 2.0,
            progress: 0.5
        });
        this.treeShader = new PIXI.Filter(null, valueShader, {
            colors: [0.4, 0.4, 2.0],
            progress: 0.5
        });
        this.treeShader.myName = 'treeShader';
        this.backgroundLightShader.myName = 'campfire';
        this.backgroundLightShader.uniforms.lightRadius = this.lightRadius;
        var flameTimer = null;
        var progressTimer = null;
        if (true) {
            var initLight = function() {
                globals.currentGame.renderer.layers.background.filters = [this.backgroundLightShader];
                globals.currentGame.renderer.layers.backgroundOne.filters = [this.backgroundLightShader];
                globals.currentGame.renderer.layers.stage.filters = [this.stageLightShader];
                globals.currentGame.renderer.layers.stageTrees.filters = [this.treeShader];
                flameTimer = globals.currentGame.addTimer({
                    name: 'flame',
                    gogogo: true,
                    timeLimit: 90,
                    callback: function() {
                        //Reverse light direction over time
                        if (!this.lightPower)
                            this.lightPower = 0.0;
                        this.lightPower += (0.02 + Math.random() * 0.045) * this.lightDirection;
                        if (this.lightPower < 0.0) {
                            this.lightDirection = 1;
                        } else if (this.lightPower > 2.5) {
                            this.lightDirection = -1;
                        }

                        this.backgroundLightShader.uniforms.flameVariation = this.lightPower;
                        this.stageLightShader.uniforms.flameVariation = this.lightPower;
                        this.backgroundLightShader.uniforms.red = backgroundRed + this.lightPower / 2;
                        this.stageLightShader.uniforms.red = stageRed + this.lightPower * 1.05;
                    }.bind(this)
                });

                var self = this;
                //if we've entered by traveling, fade to night
                if(this.enteredState.enteredByTraveling && this.alreadyIntrod) {
                    progressTimer = globals.currentGame.addTimer({
                        name: 'lightProgressTimer',
                        runs: 1,
                        timeLimit: 3000,
                        tickCallback: function(deltaTime) {
                            self.backgroundLightShader.uniforms.progress = this.percentDone;
                            self.stageLightShader.uniforms.progress = this.percentDone;
                            self.treeShader.uniforms.progress = this.percentDone;
                            fireAnimation.alpha = this.percentDone;
                        }
                    });
                } else {
                    self.backgroundLightShader.uniforms.progress = 1;
                    self.stageLightShader.uniforms.progress = 1;
                    self.treeShader.uniforms.progress = 1;
                    fireAnimation.alpha = 1;
                }

                this.backgroundLightShader.uniforms.lightRadius = this.lightRadius;
                this.stageLightShader.uniforms.lightRadius = this.lightRadius;
            }.bind(this);
            scene.add(initLight);
        }

        Matter.Events.on(scene, 'sceneFadeInBegin', function() {
            gameUtils.playAsMusic(this.enterMusic, {fadeDuration: 50});
        }.bind(this));

        scene._clearExtension = function() {
            var game = globals.currentGame;
            game.invalidateTimer(flameTimer);
            game.invalidateTimer(progressTimer);
            game.renderer.layers.background.filters = [];
            game.renderer.layers.backgroundOne.filters = [];
            game.renderer.layers.stage.filters = [];
            game.renderer.layers.stageTrees.filters = [];
            game.map.hide();
            this.camp.cleanUpSounds();
            $('body').off('mousedown.map');
            $('body').off('keydown.map');
        }.bind(this);

        var nextLevelInitiated = false;
    };

    //used to play an opening dialogue scene
    this.hijackEntry = function() {
        var self = this;
        if (!this.alreadyIntrod && this.camp.intro) {
            var campIntro = new this.camp.intro({
                done: () => {
                    self.enterLevel();
                }
            });
            globals.currentGame.currentScene.transitionToScene(campIntro.scene);
            campIntro.play();
            this.alreadyIntrod = true;

            return true;
        } else {
            return false;
        }
    };

    this.onLevelPlayable = function(scene) {

        var game = globals.currentGame;

        //unit tester
        var unitTest = false;
        if(unitTest) {
            var unitT = UnitMenu.createUnit('Rammian', {
                team: game.playerTeam,
                idleCancel: false
            });

            unitT.position = {x: 500, y: 400};
            globals.currentGame.addUnit(unitT);
            globals.currentGame.newUnitTest = unitT;
        }

        game.setUnit(game.shane, {
            position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                x: -40,
                y: 40
            })
        });
        game.setUnit(game.ursula, {
            position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                x: 40,
                y: 40
            })
        });

        if (this.camp.onLevelPlayable) {
            this.camp.onLevelPlayable.call(this, scene);
        }

        //Only reset stuff if we enter by traveling
        if(!this.enteredState.enteredByTraveling || this.oneTimeNoResetIndicator) {
            this.oneTimeNoResetIndicator = false;
            return;
        }

        //reset adrenaline indicator
        gameUtils.doSomethingAfterDuration(() => {
            var adrText = graphicsUtils.floatText('Adrenaline reset', gameUtils.getPlayableCenterPlus({
                y: 300
            }), {
                where: 'hudThree',
                style: styles.adrenalineTextLarge,
                speed: 4,
                duration: 4000
            });
            scene.add(adrText);
        }, 2500);

        //reset fatigue indicator
        gameUtils.doSomethingAfterDuration(() => {
            var fatigueText = graphicsUtils.floatText('Fatigue reset', gameUtils.getPlayableCenterPlus({
                y: 300
            }), {
                where: 'hudThree',
                style: styles.fatigueTextLarge,
                speed: 4,
                duration: 4000
            });
            scene.add(fatigueText);
        }, 4000);
    };

    this.manualNodePosition = function() {
        return this.position;
    };

    this.createMapNode = function(options) {
        var node = new MapNode(Object.assign({}, options, {
            levelDetails: this,
            tokenSize: 50,
            largeTokenSize: 55,
            travelPredicate: function() {
                if(this.manualDisable) {
                    return false;
                }
                if(this.manualEnable) {
                    return true;
                }
                return this.nightsLeft;
                // return true;
            },
            hoverCallback: function() {
                return this.travelPredicate();
            },
            unhoverCallback: function() {
                // this.availabilityText.visible = false;
                return this.travelPredicate();
            },
            manualTokens: function() {
                var regularToken = graphicsUtils.createDisplayObject('CampfireToken', {
                    where: 'hudNTwo'
                });
                var specialToken = graphicsUtils.createDisplayObject('CampfireTokenGleam', {
                    where: 'hudNTwo'
                });
                Matter.Events.on(this.mapRef, 'showMap', function() {
                    if (this.travelPredicate()) {
                        regularToken.visible = true;
                        specialToken.visible = true;
                        if (!this.gleamTimer) {
                            this.gleamTimer = graphicsUtils.fadeBetweenSprites(regularToken, specialToken, 500, 900, 0);
                            Matter.Events.on(regularToken, 'destroy', () => {
                                this.gleamTimer.invalidate();
                            });
                        }
                        regularToken.tint = 0xFFFFFF;
                        specialToken.tint = 0xFFFFFF;
                        regularToken.visible = true;
                        specialToken.visible = true;
                        this.gleamTimer.reset();
                    } else {
                        if (this.mapRef.currentNode == this) {
                            regularToken.alpha = 1;
                            regularToken.tint = 0xFFFFFF;
                        } else {
                            regularToken.alpha = 1;
                            regularToken.tint = 0x7c7c7c;
                        }
                        regularToken.visible = true;
                        specialToken.visible = false;
                        if (this.gleamTimer) {
                            this.gleamTimer.paused = true;
                        }
                    }
                }.bind(this));
                return [regularToken, specialToken];
            },
            enterSelfBehavior: function() {
                globals.currentGame.closeMap();
            },
            init: function() {
                this.nightsLeft = 1;
                Matter.Events.on(globals.currentGame, 'TravelStarted', function(event) {
                    if (event.node == this) {
                        this.nightsLeft -= 1;
                    }
                }.bind(this));

                Matter.Events.on(this, 'ArrivedAtNode', function() {
                    this.mapRef.startingFatigue = 0;
                    this.mapRef.clearAllAdrenalineBlocks();
                }.bind(this));

                Matter.Events.on(this.mapRef, 'showMap', function() {
                    var availabilityText = 'Available now. (' + this.nightsLeft + ' nights available)';
                    if (this.mapRef.currentNode != this && !this.travelPredicate()) {
                        availabilityText = 'Camp unavailable.';
                    } else if (this.mapRef.currentNode == this) {
                        availabilityText = 'Currently in camp.';
                    }
                    availabilityText = (this.activeCampTooltipOverride && this.travelPredicate()) ? this.activeCampTooltipOverride : availabilityText;
                    this.setCampTooltip(availabilityText);
                }.bind(this));
            },
            setCampTooltip: function(text) {
                this.displayObject.tooltipObj.setMainDescription(text);
            },
            cleanUpExtension: function() {

            },
            tooltipTitle: 'Camp Noir',
            tooltipDescription: '',
        }));
        return node;
    };
};

campLevel.prototype = levelBase;

export {
    campLevel
};
