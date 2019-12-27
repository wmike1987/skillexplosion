define(['jquery', 'pixi', 'units/UnitConstructor'], function($, PIXI, UC) {

	return function Marble(options) {

		var options = options || {};

		var radius = 20;
		var rc = [{
			id: 'marble',
			data: 'GlassMarble',
			tint: options.tint,
			scale: {x: radius*2/64, y: radius*2/64},
			rotate: 'none',
		}, {
			id: 'marbleBodyHighlight',
			data: 'MarbleBodyHighlights',
			scale: {x: radius*2/64, y: radius*2/64},
			rotate: 'random',
			rotatePredicate: function() {
				return this.isMoving;
			},
			tint: options.highlightTint,
			initialRotate: 'random'
		}, {
			id: 'marbleHighlight',
			data: 'MarbleHighlight',
			scale: {x: radius*2/64, y: radius*2/64},
			rotate: 'none',
			initialRotate: 'none'
		}, {
			id: 'marbleShadow',
			data: 'MarbleShadow',
			scale: {x: radius*2.5/256, y: radius*2.5/256},
			visible: true,
			rotate: 'none',
			tint: options.tint,
			stage: "stageZero",
			offset: {x: 12, y: 12},
		}, {
			id: 'marbleShadowHighlights',
			data: 'MarbleShadowHighlight',
			scale: {x: radius*1.6/256, y: radius*1.6/256},
			visible: false,
			rotate: 'random',
			rotatePredicate: function() {
				return this.isMoving;
			},
			initialRotate: 'random',
			tint: options.highlightTint,
			stage: "stageZero",
			offset: {x: 12, y: 12}
		}, {
			id: 'selected',
			data: 'MarbleSelected',
			scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
			tint: options.selectionTint,
			stage: 'stageOne',
			visible: false,
			rotate: 'none'
		}, {
			id: 'selectionPending',
			data: 'MarbleSelectedPending',
			scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
			stage: 'stageOne',
			visible: false,
			tint: options.pendingSelectionTint,
			rotate: 'continuous'
		}];

		return UC({
				renderChildren: rc,
				radius: radius,
				unit: {
					unitType: 'Marble',
					isoManaged: false,
					health: 45,
					energy: 45,
					team: options.team || 4
				},
				moveable: {
					moveSpeed: 4.5
				}});
	}
})
