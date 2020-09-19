import * as PIXI from 'pixi.js'
import * as $ from 'jquery'
import UC from '@core/Unit/UnitConstructor.js'

export default function Marble(options) {

	var options = options || {};

	var radius = options.radius || 20;
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
		stage: "stageNTwo",
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
		stage: "stageNTwo",
		offset: {x: 12, y: 12}
	}, {
		id: 'selected',
		data: 'MarbleSelected',
		scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
		tint: options.selectionTint,
		stage: 'stageNOne',
		visible: false,
		rotate: 'none'
	}, {
		id: 'selectionPending',
		data: 'MarbleSelectedPending',
		scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
		stage: 'stageNOne',
		visible: false,
		tint: options.pendingSelectionTint,
		rotate: 'continuous'
	}];

	var unitProperties = $.extend({
		unitType: 'Marble',
		team: options.team || 4,
		priority: 10,
		isoManaged: false,
		name: options.name,
	}, options);

	return UC({
			renderChildren: rc,
			radius: radius,
			hitboxWidth: 30,
			hitboxHeight: 30,
			hitboxYOffset: 0,
			unit: unitProperties,
			moveable: {
				moveSpeed: 4.5
			}});
}
