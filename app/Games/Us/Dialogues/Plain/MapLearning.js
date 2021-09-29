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
import UnitMenu from '@games/Us/UnitMenu.js';
import ItemUtils from '@core/Unit/ItemUtils.js';

var completeTaskAndRelease = function(dialogue) {
    if(dialogue.isTask) {
        dialogue.completeTask();
    }
};

var MapLearning = function(scene) {

    var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});

    var a1 = new Dialogue({actor: "Ursula", text: "Look at all the enemy camps in our territory... Let's view our intel.", letterSpeed: 40, isTask: false, backgroundBox: true});
    var a2 = new Dialogue({actor: "Task", text: "Hover over an enemy camp for more details.", isTask: true, backgroundBox: true });
    var a3 = new Dialogue({actor: "Ursula", text: "This map is how we'll embark on outings.", isTask: false, letterSpeed: 40, backgroundBox: true, delayAfterEnd: 1000});
    var a4 = new Dialogue({actor: "Ursula", text: "After finishing an outing, we'll receive a supply drop from HQ.", isTask: false, backgroundBox: true, delayAfterEnd: 1000});
    var a5 = new Dialogue({actor: "Ursula", text: "We'll also gain one point of adrenaline after each camp.", continuation: true, backgroundBox: true});
    var a6 = new Dialogue({actor: "Info", text: "Adrenaline is shown in the lower left of the map.", isInfo: true, backgroundBox: true, delayAfterEnd: 2500});
    var a7 = new Dialogue({actor: "Shane", text: "...What? Adrenaline?", pauseAfterWord: {word: 'What?', duration: 750}, newBreak: true, isTask: false, backgroundBox: true});
    var a8 = new Dialogue({actor: "Ursula", text: "Traveling causes fatigue, making long treks difficult.", backgroundBox: true});
    var a9 = new Dialogue({actor: "Ursula", text: "Adrenaline reduces the amount of fatigue we'll accumulate while traveling.", letterSpeed: 40, continuation: true, backgroundBox: true});
    var a10 = new Dialogue({actor: "Info", text: "Returning to camp resets fatigue, but also resets adrenaline.", isInfo: true, backgroundBox: true});
    var a11 = new Dialogue({actor: "Ursula", text: "You'll get the hang of it.", backgroundBox: true});


    var a12 = new Dialogue({actor: "Shane", text: "And what exactly is an outing?", newBreak: true, isTask: false, backgroundBox: true});
    var a13 = new Dialogue({actor: "Ursula", text: "An outing a series of enemy camps that we will hit back-to-back.", letterSpeed: 40, backgroundBox: true});
    var a14 = new Dialogue({actor: "Info", text: "Outings can be up to three camps long.", isInfo: true, backgroundBox: true});
    var a15 = new Dialogue({actor: "Ursula", text: "Longer outings can be risky since we can't reconfigure between each camp.", letterSpeed: 40, backgroundBox: true, delayAfterEnd: 0});
    var a16 = new Dialogue({actor: "Ursula", text: "But they'll increase our supply options from HQ.", continuation: true, backgroundBox: true});

    var a17 = new Dialogue({actor: "Ursula", text: "Let's get going.",  newBreak: true, continuation: false, backgroundBox: true});

    var chain = new DialogueChain([a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17], {cleanUpOnDone: true, startDelay: 200});

    a2.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame, 'tooltipShown', function(event) {
            var tooltip = event.tooltip;
            if(tooltip.isNodeTooltip) {
                achieve.play();
                completeTaskAndRelease(a2);
                return true;
            }
        });
    };

    scene.addCleanUpTask(() => {
        achieve.unload();
        chain.cleanUp();
    });

    return chain;
};

export {
    MapLearning
};
