import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import Scene from '@core/Scene.js';
import styles from '@utils/Styles.js';
import {
    DialogueScene
} from '@games/Us/Dialogues/DialogueScene.js';

var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});

var UrsulaTasks = function(scene) {
    var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Ursula.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a2 = new Dialogue({actor: "Task", text: "Right click to move Ursula to the beacon.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a3 = new Dialogue({actor: "Task", text: "Press 'A' then left click near (or on) Shane to heal him.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a4 = new Dialogue({actor: "Task", text: "Press 'D' then left click on the beacon to silent-step to that point.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a5 = new Dialogue({actor: "Task", text: "Press 'F' to lay a mine.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a6 = new Dialogue({actor: "Task", text: "Lay a mine then trigger it by making Shane throw a knife at it.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});

    var chain = new DialogueChain([a1, a2, a3, a4, a5, a6], {startDelay: 200, done: function() {
        chain.cleanUp();
    }});

    var pauseAfterCompleteTime = 750;
    gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
        if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Ursula') {
            achieve.play();
            gameUtils.doSomethingAfterDuration(() => {
                a1.withholdResolve = false;

                var moveBeaconLocation = {x: 1000, y: 450};
                var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
                gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'destinationReached', (event) => {
                    var destination = event.destination;
                    if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
                    achieve.play();
                    graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});
                    gameUtils.doSomethingAfterDuration(() => {
                        a2.withholdResolve = false;
                        gameUtils.matterOnce(globals.currentGame.ursula, 'performHeal', (event) => {
                            globals.currentGame.shane.ignoreHealthRegeneration = false;
                            gameUtils.matterOnce(globals.currentGame.shane, 'healedFully', (event) => {
                                achieve.play();
                                a3.withholdResolve = false;
                                var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
                                gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'secretStepLand', (event) => {
                                    var destination = event.destination;
                                    if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
                                    graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});
                                    achieve.play();
                                    gameUtils.doSomethingAfterDuration(() => {
                                        a4.withholdResolve = false;
                                        gameUtils.matterOnce(globals.currentGame.ursula, 'layMine', (event) => {
                                            achieve.play();
                                            gameUtils.matterOnce(globals.currentGame.ursula, 'mineExplode', (event) => {
                                                gameUtils.doSomethingAfterDuration(() => {
                                                    a5.withholdResolve = false;
                                                    gameUtils.matterOnce(globals.currentGame.shane, 'knifeMine', (event) => {
                                                        achieve.play();
                                                        chain.cleanUp();
                                                    });
                                                });
                                            }, pauseAfterCompleteTime);
                                        });
                                    }, pauseAfterCompleteTime);
                                    return true;
                                });
                            });
                        });
                    }, pauseAfterCompleteTime);
                    return true;
                });
            }, pauseAfterCompleteTime);
            return true;
        }
    });

    scene.addCleanUpTask(() => {
        achieve.unload();
    });

    return chain;
};

export {
    UrsulaTasks
};
