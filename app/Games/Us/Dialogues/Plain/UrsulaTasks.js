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
    var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Ursula.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a2 = new Dialogue({actor: "Task", text: "Right click to move Ursula to the beacon.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a3a = new Dialogue({actor: "Task", text: "Hover over your heal ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a3b = new Dialogue({actor: "Task", text: "Press 'A' then left click near (or on) Shane to heal him.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a4a = new Dialogue({actor: "Task", text: "Hover over your secret-step ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a4b = new Dialogue({actor: "Task", text: "Press 'D' then left click on the beacon to secret-step to that point.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a5a = new Dialogue({actor: "Task", text: "Hover over your mine ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a5b = new Dialogue({actor: "Task", text: "Press 'F' to lay a mine.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a6 = new Dialogue({actor: "Task", text: "Lay a mine then trigger it by making Shane throw a knife at it.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});

    var chain = new DialogueChain([a1, a2, a3a, a3b, a4a, a4b, a5a, a5b, a6], {startDelay: 200, done: function() {
        chain.cleanUp();
    }});

    var pauseAfterCompleteTime = 750;
    var moveBeaconLocation = {x: 1000, y: 550};

    a1.onStart = function() {
        var arrow = graphicsUtils.pointToSomethingWithArrow(globals.currentGame.ursula, -20, 0.5);
        gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
            if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Ursula') {
                achieve.play();
                graphicsUtils.removeSomethingFromRenderer(arrow);

                gameUtils.doSomethingAfterDuration(() => {
                    a1.preventAutoEnd = false;
                }, pauseAfterCompleteTime);
            }
        });
    };

    a2.onStart = function() {
        var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
        graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 8});
        gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'destinationReached', (event) => {
            var destination = event.destination;
            if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
            achieve.play();
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});

            gameUtils.doSomethingAfterDuration(() => {
                a2.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    a3a.onStart = function() {
        var healAbility = globals.currentGame.ursula.getAbilityByName('Heal');
        var arrow = graphicsUtils.pointToSomethingWithArrow(healAbility.icon, -30, 0.75);
        gameUtils.matterOnce(healAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            gameUtils.doSomethingAfterDuration(() => {
                a3a.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    var allHealed = false;
    a3b.onStart = function() {
        gameUtils.matterOnce(globals.currentGame.ursula, 'performHeal', (event) => {
            globals.currentGame.shane.ignoreHealthRegeneration = false;
            var healme = gameUtils.matterOnce(globals.currentGame.shane, 'healedFully', (event) => {
                if(!allHealed) {
                    achieve.play();
                    allHealed = true;
                    gameUtils.doSomethingAfterDuration(() => {
                        a3b.preventAutoEnd = false;
                    }, pauseAfterCompleteTime);
                }
            });

            //safety net
            gameUtils.doSomethingAfterDuration(() => {
                if(!allHealed) {
                    achieve.play();
                    allHealed = true;
                    healme.removeHandler();
                    a3b.preventAutoEnd = false;
                }
            }, 15000);
        });
    };

    a4a.onStart = function() {
        var ssAbility = globals.currentGame.ursula.getAbilityByName('Secret Step');
        var arrow = graphicsUtils.pointToSomethingWithArrow(ssAbility.icon, -30, 0.75);
        gameUtils.matterOnce(ssAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            gameUtils.doSomethingAfterDuration(() => {
                a4a.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    a4b.onStart = function() {
        var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
        graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 8});
        gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'secretStepLand', (event) => {
            var destination = event.destination;
            if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});
            achieve.play();
            gameUtils.doSomethingAfterDuration(() => {
                a4b.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
            return true;
        });
    };

    a5a.onStart = function() {
        var mineAbility = globals.currentGame.ursula.getAbilityByName('Mine');
        var arrow = graphicsUtils.pointToSomethingWithArrow(mineAbility.icon, -30, 0.75);
        gameUtils.matterOnce(mineAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            gameUtils.doSomethingAfterDuration(() => {
                a5a.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    a5b.onStart = function() {
        gameUtils.matterOnce(globals.currentGame.ursula, 'layMine', (event) => {
            achieve.play();
            gameUtils.matterOnce(globals.currentGame.ursula, 'mineExplode', (event) => {
                gameUtils.doSomethingAfterDuration(() => {
                    a5b.preventAutoEnd = false;
                }, pauseAfterCompleteTime);
            });
        });
    };

    a6.onStart = function() {
        gameUtils.matterOnce(globals.currentGame.shane, 'knifeMine', (event) => {
            achieve.play();
            chain.cleanUp();
        });
    };

    scene.addCleanUpTask(() => {
        achieve.unload();
    });

    return chain;
};

export {
    UrsulaTasks
};
