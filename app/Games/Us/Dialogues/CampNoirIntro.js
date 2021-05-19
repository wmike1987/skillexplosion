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

var blackBox = null;
var me = null;
var CampNoirIntro = function(options) {
    this.escape = options.done;
    this.createChain = function(scene) {
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
            // picture: "UrsShaneNoir",
            pictureOffset: {x: -500, y: 75},
            pictureSize: {x: 374, y: 400},
            onStart: function() {
                // blackBox = graphicsUtils.addSomethingToRenderer('TintableSquare', {where: 'hudText', sortYOffset: 500, position: mathArrayUtils.clonePosition(this.realizedPicture.position), anchor: {x: 0, y: 0.5}});
                // graphicsUtils.makeSpriteSize(blackBox, {x: this.realizedPicture.width+2, y: this.realizedPicture.height+2});
                // this.realizedPictureBorder.position.x -= 187.5;
                // blackBox.tint = 0x000000;
                // me = this;
            },
            pictureFadeSpeed: 25
        }));
        ds.push(new Dialogue({
            actor: "Shane",
            text: "A dead man.",
            onStart: function() {
                // graphicsUtils.fadeSpriteOverTime(blackBox, 1000);
                // me.realizedPictureBorder.position.x += 187.5;
                // graphicsUtils.makeSpriteSize(me.realizedPictureBorder, {x: me.realizedPicture.width, y: me.realizedPicture.height});
            }
        }));
        ds.push(new Dialogue({
            actor: "Ursula",
            text: "Don't be so dramatic, Mac said you were coming.",
            delayAfterEnd: 750
        }));
        ds.push(new Dialogue({
            actor: "Ursula",
            continuation: true,
            text: "You're looking a little weary, let me fix you up.",
        }));

        var chain = new DialogueChain(ds, {
            startDelay: 2000
        });

        scene.addCleanUpTask(() => {
            graphicsUtils.removeSomethingFromRenderer(blackBox);
        });

        return chain;
    };

    this.initialize();
};

CampNoirIntro.prototype = DialogueScene;

export {
    CampNoirIntro
};
