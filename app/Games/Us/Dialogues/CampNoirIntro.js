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

//Create the air drop base
var CampNoirIntro = function(options) {
    this.escape = options.done;
    this.createChain = function() {
        var ds = [];
        ds.push(new Dialogue({
            blinkLastLetter: false,
            title: true,
            text: "Camp Noir",
            delayAfterEnd: 1200
        }));
        ds.push(new Dialogue({
            actor: "Shane",
            text: "Knock knock...",
        }));
        ds.push(new Dialogue({
            actor: "Ursula",
            text: "Who's there?",
        }));
        ds.push(new Dialogue({
            actor: "Shane",
            text: "A cursed man.",
        }));
        ds.push(new Dialogue({
            actor: "Ursula",
            text: "Don't be so dramatic, Mac said you were coming.",
        }));
        ds.push(new Dialogue({
            actor: "Ursula",
            continuation: true,
            text: "You're looking a little weary, let me fix you up.",
        }));

        var chain = new DialogueChain(ds, {
            startDelay: 2000
        });

        return chain;
    };

    this.initialize();
};

CampNoirIntro.prototype = DialogueScene;

export {
    CampNoirIntro
};
