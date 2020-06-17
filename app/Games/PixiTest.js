define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin', 'howler', 'utils/GameUtils', 'shaders/ColorShader', 'shaders/AlphaShader'],
function($, Matter, PIXI, CommonGameMixin, h, utils, colorshader, alphaShader) {

	var targetScore = 1;

	var game = {
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
			utils.addSomethingToRenderer("GrassAndRock1/Dirt/dirt_base", {position: {x: 200, y: 100}, scale: {x: .1, y: .1}});
			var icon = utils.addSomethingToRenderer("DeathWish", {position: {x: 200, y: 101}, scale: {x: 1, y: 1}});
			var sh = new PIXI.Filter(null, colorshader, null);
			var ash = new PIXI.Filter(null, alphaShader, null);
			this.renderer.stages.stage.filters = [ash];

			currentGame.addTickCallback(function() {
				icon.position = utils.getRandomPlacementWithinCanvasBounds();
			})
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

	return $.extend({}, CommonGameMixin, game);
})
