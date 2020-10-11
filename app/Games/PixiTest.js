import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import utils from '@utils/GameUtils.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'

var targetScore = 1;

var game = {

	assets: [{name: "Terrain0", target: "Textures/Us/Terrain-0.json"}],

	gameName: 'SimpleTargets',
	ball: null,
	victoryCondition: {type: 'lives', limit: 3},
	hideScore: true,
	noClickIndicator: false,
	hideEndCondition: true,
	noClickIndicator: true,

	initExtension: function() {
	},

	play: function(options) {

		// utils.addSomethingToRenderer("Logs", {position: {x: 100, y: 100}});
		const container = new PIXI.Container();

		var dirt1 = utils.createDisplayObject("FrollGround/Dirt1", {position: {x: 50, y: 50}});
		container.addChild(dirt1);
		container.x = 100;
		container.y = 100;

		const rt = new PIXI.RenderTexture.create(600, 600);
		const sprite = new PIXI.Sprite(rt);
		sprite.x = 500;
		sprite.y = 250;
		this.renderer.pixiApp.stage.addChild(sprite);
		this.renderer.pixiApp.stage.addChild(container);0

		this.renderer.pixiApp.renderer.render(container, rt);

	},
}

/*
 * Options to for the game starter
 */
game.worldOptions = {
		// background: {image: 'TransparentSquare', scale: {x: 1.334, y: 1.334}},
	        width: 1200,
	        height: 600,
	       };

export default $.extend({}, CommonGameMixin, game);
