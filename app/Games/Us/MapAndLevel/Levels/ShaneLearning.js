import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import Tooltip from '@core/Tooltip.js';
import TileMapper from '@core/TileMapper.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import Doodad from '@utils/Doodad.js';
import {Dialogue, DialogueChain} from '@core/Dialogue.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import UnitMenu from '@games/Us/UnitMenu.js';

var shaneLearning = function(options) {
    var enter = gameUtils.getSound('entershanelearn.wav', {volume: 0.14, rate: 1.0});
    var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});

    this.initExtension = function() {
        this.completeUponEntry = true;
        this.mode = this.possibleModes.CUSTOM;
    };

    this.fillLevelSceneExtension = function(scene) {
        var podDoodad = new Doodad({drawWire: false, autoAdd: false, radius: 130, texture: ['LandingPod'], stage: 'stage',
        scale: {x: 0.6, y: 0.6}, bodyScale: {y: 0.65}, offset: {x: 0, y: 30}, sortYOffset: 10,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.0, y: 1.0}, shadowOffset: {x: 0, y: 18},
        position: {x: gameUtils.getCanvasCenter().x-200, y: gameUtils.getPlayableHeight()-500}});
        scene.add(podDoodad);

        this.box = UnitMenu.createUnit('DestructibleBox', {team: this.neutralTeam, isTargetable: false});
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.box, immortal: true});
        globals.currentGame.addUnit(this.box);
        this.box.position = {x: 750, y: 300};

        this.createMapTable(scene, {position: mathArrayUtils.clonePosition(podDoodad.body.position, {x: -80, y: 100})});
    };

    this.onLevelPlayable = function(scene) {
        var pauseAfterCompleteTime = 750;

        globals.currentGame.setUnit(globals.currentGame.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter()), moveToCenter: false});
        enter.play();
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Mega", delayAfterEnd: 1750});
        var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Shane.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a2 = new Dialogue({actor: "Task", text: "Right click to move Shane to the beacon.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a3 = new Dialogue({actor: "Task", text: "Press 'A' then left click on the box to attack it.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a4 = new Dialogue({actor: "Task", text: "Right click on the item to pick it up.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a5 = new Dialogue({actor: "Task", text: "Press 'A' then left click near the enemies to attack-move to them.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a6 = new Dialogue({actor: "Task", text: "Press 'D' then left click to perform a dash in that direction.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a7 = new Dialogue({actor: "Task", text: "Press 'F' then left click to throw a knife in that direction.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a8 = new Dialogue({actor: "Task", text: "Kill a critter by throwing a knife at it.", fadeOutAfterDone: true, backgroundBox: true, isTask: true, letterSpeed: 30, withholdResolve: true});
        var self = this;
        this.mapTableActive = true;
        var chain = new DialogueChain([title, a1, a2, a3, a4, a5, a6, a7, a8], {startDelay: 200, done: function() {
            chain.cleanUp();
            this.mapTableActive = true;
            var b1 = new Dialogue({actor: "Task", text: "Click on the satellite computer to open the map.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
            var b2 = new Dialogue({actor: "Task", text: "Click on a token to travel to it, make your way to camp.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
            var bchain = new DialogueChain([b1, b2], {startDelay: 1000, done: function() {
                bchain.cleanUp();
            }});
            gameUtils.matterOnce(globals.currentGame, 'showMap', () => {
                achieve.play();
                gameUtils.doSomethingAfterDuration(() => {
                    b1.withholdResolve = false;
                    gameUtils.matterOnce(globals.currentGame, 'travelStarted', () => {
                        achieve.play();
                        b2.withholdResolve = false;
                    });
                }, pauseAfterCompleteTime);
            });
            bchain.play();
        }.bind(this)});

        //First dialogue chain
        var moveBeaconLocation = {x: 200, y: 400};
        gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
            if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Shane') {
                achieve.play();
                gameUtils.doSomethingAfterDuration(() => {
                    a1.withholdResolve = false;

                    var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
                    graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 8});
                    gameUtils.matterConditionalOnce(globals.currentGame.shane, 'destinationReached', (event) => {
                        var destination = event.destination;
                        if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
                        graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});
                        achieve.play();
                        this.box.isTargetable = true;
                        gameUtils.doSomethingAfterDuration(() => {
                            a2.withholdResolve = false;

                            gameUtils.matterConditionalOnce(this.box, 'death',(event) => {
                                achieve.play();
                                gameUtils.doSomethingAfterDuration(() => {
                                    a3.withholdResolve = false;

                                    gameUtils.matterConditionalOnce(globals.currentGame.shane, 'pickupItem', (event) => {
                                        achieve.play();
                                        gameUtils.doSomethingAfterDuration(() => {
                                            a4.withholdResolve = false;
                                            var critter1 = UnitMenu.createUnit('Critter', {team: globals.currentGame.enemyTeam, noWall: true});
                                            var critter2 = UnitMenu.createUnit('Critter', {team: globals.currentGame.enemyTeam, noWall: true});
                                            globals.currentGame.addUnit(critter1);
                                            globals.currentGame.addUnit(critter2);
                                            critter1.position = {x: 1600, y: 200};
                                            critter2.position = {x: 1600, y: 600};
                                            critter1.move({x: 1300, y: 200});
                                            critter2.move({x: 1300, y: 600});
                                            critter1.honeRange = 200;
                                            critter2.honeRange = 200;

                                            var done = function() {
                                                achieve.play();
                                                gameUtils.doSomethingAfterDuration(() => {
                                                    a5.withholdResolve = false;
                                                    gameUtils.matterConditionalOnce(globals.currentGame.shane, 'dash', (event) => {
                                                        achieve.play();
                                                        gameUtils.doSomethingAfterDuration(() => {
                                                            a6.withholdResolve = false;
                                                            gameUtils.matterConditionalOnce(globals.currentGame.shane, 'knifeThrow',(event) => {
                                                                achieve.play();
                                                                gameUtils.doSomethingAfterDuration(() => {
                                                                    a7.withholdResolve = false;
                                                                    var critter1 = UnitMenu.createUnit('Critter', {team: globals.currentGame.enemyTeam, noWall: true});
                                                                    globals.currentGame.addUnit(critter1);
                                                                    critter1.position = {x: -50, y: 500};
                                                                    critter1.move({x: 200, y: 500});
                                                                    critter1.honeRange = 200;
                                                                    gameUtils.matterOnce(globals.currentGame.shane, 'knifeKill', (event) => {
                                                                        achieve.play();
                                                                        gameUtils.doSomethingAfterDuration(() => {
                                                                            a8.withholdResolve = false;
                                                                        }, pauseAfterCompleteTime);
                                                                    });
                                                                }, pauseAfterCompleteTime);
                                                                return true;
                                                            });
                                                        }, pauseAfterCompleteTime);
                                                        return true;
                                                    });
                                                }, pauseAfterCompleteTime);
                                            };

                                            var crittersKilled = 0;
                                            gameUtils.matterConditionalOnce(critter1, 'death', (event) => {
                                                crittersKilled++;
                                                if(crittersKilled == 2) {
                                                    done();
                                                }
                                                return true;
                                            });

                                            gameUtils.matterConditionalOnce(critter2, 'death', (event) => {
                                                crittersKilled++;
                                                if(crittersKilled == 2) {
                                                    done();
                                                }
                                                return true;
                                            });
                                        });
                                        return true;
                                    });
                                }, pauseAfterCompleteTime);
                                return true;
                            });
                        }, pauseAfterCompleteTime);
                        return true;
                    });
                }, pauseAfterCompleteTime);
                return true;
            }
        });
        scene.add(chain);
        scene.addCleanUpTask(() => {
            enter.unload();
            achieve.unload();
        });
        gameUtils.doSomethingAfterDuration(chain.play.bind(chain), 2000);
    };
};
shaneLearning.prototype = levelBase;

export {shaneLearning};
