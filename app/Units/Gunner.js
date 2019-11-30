define(['jquery', 'pixi', 'units/UnitConstructor'], function($, PIXI, UC) {

	return function Gunner(options) {
		
		var radius = 19;
		var gunner = {};
		var options = options || {};
		var walkSpeed = .65;
		var walkSpeedBonus = .25;
		var shootSpeed = .45;
		
		var walkAnimations = {
			up: currentGame.getAnimation('MarineN/Walk/skeleton3-walk_', [-1000, -1000], walkSpeed, null, -1, null, null, 30, 0, true),
			upRight: currentGame.getAnimation('MarineNW/Walk/skeleton-walk_', [-1000, -1000], walkSpeed+walkSpeedBonus, null, -1, null, null, 30, 0, true),
			right: currentGame.getAnimation('MarineW/Walk/skeleton5-walk_', [-1000, -1000], walkSpeed+walkSpeedBonus, null, -1, null, null, 30, 0, true),
			downRight: currentGame.getAnimation('MarineSW/Walk/skeleton4-walk_', [-1000, -1000], walkSpeed+walkSpeedBonus, null, -1, null, null, 30, 0, true),
			down: currentGame.getAnimation('MarineS/Walk/skeleton2-walk_', [-1000, -1000], walkSpeed, null, -1, null, null, 30, 0, true),
			downLeft: currentGame.getAnimation('MarineSW/Walk/skeleton4-walk_', [-1000, -1000], walkSpeed+walkSpeedBonus, null, -1, null, null, 30, 0, true),
			left: currentGame.getAnimation('MarineW/Walk/skeleton5-walk_', [-1000, -1000], walkSpeed+walkSpeedBonus, null, -1, null, null, 30, 0, true),
			upLeft: currentGame.getAnimation('MarineNW/Walk/skeleton-walk_', [-1000, -1000], walkSpeed+walkSpeedBonus, null, -1, null, null, 30, 0, true)
		}
		
		var attackAnimations = {
			up: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineN/Action/skeleton3-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
			upRight: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineNW/Action/skeleton-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
			right: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineW/Action/skeleton5-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
			downRight: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineSW/Action/skeleton4-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
			down: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineS/Action/skeleton2-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
			downLeft: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineSW/Action/skeleton4-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
			left: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineW/Action/skeleton5-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
			upLeft: currentGame.getAnimationB({
				spritesheetName: 'marine0',
				animationName: 'MarineNW/Action/skeleton-shoot',
				speed: shootSpeed,
				playThisManyTimes: 1,
			}),
		}
		
		var otherAnimations = {
		}
    			
		var sc = {x: .35, y: .35};
		var flipsc = {x: -1 * sc.x, y: sc.y};
		var rc = [{
			id: 'selected',
			data: currentGame.texture('IsometricSelected'),
			scale: {x: .8, y: .8},
			stage: 'stageOne',
			visible: false,
			avoidIsoMgr: true,
			rotate: 'none',
			offset: {x: 0, y: 26},
		}, {
			id: 'selectionPending',
			data: currentGame.texture('IsometricSelectedPending'),
			scale: {x: 1, y: 1},
			stage: 'stageOne',
			visible: false,
			avoidIsoMgr: true,
			rotate: 'none',
			offset: {x: 0, y: 26},
		},{
			id: 'walkLeft',
			data: walkAnimations.left,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: -2, y: 0}
		}, {
			id: 'attackLeft',
			data: attackAnimations.left,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: -34, y: -11}
		}, {
			id: 'walkRight',
			data: walkAnimations.right,
			scale: flipsc,
			rotate: 'none',
			visible: false,
			offset: {x: 2, y: 0}
		}, {
			id: 'attackRight',
			data: attackAnimations.right,
			scale: flipsc,
			rotate: 'none',
			visible: false,
			offset: {x: 34, y: -11}
		}, {
			id: 'walkUp',
			data: walkAnimations.up,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: 2, y: 0}
		}, {
			id: 'attackUp',
			data: attackAnimations.up,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: 4, y: -12}
		},{
			id: 'walkDown',
			data: walkAnimations.down,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: -4, y: 0}
		},{
			id: 'attackDown',
			data: attackAnimations.down,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: -7, y: 2}
		}, {
			id: 'walkUpLeft',
			data: walkAnimations.upLeft,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: -4, y: 0}
		}, {
			id: 'attackUpLeft',
			data: attackAnimations.upLeft,
			scale: sc,
			rotate: 'none',
			visible: false,
			offset: {x: -19, y: -14}
		},{
			id: 'walkUpRight',
			data: walkAnimations.upRight,
			scale: flipsc,
			rotate: 'none',
			visible: false,
			offset: {x: 4, y: 0}
		}, {
			id: 'attackUpRight',
			data: attackAnimations.upRight,
			scale: flipsc,
			rotate: 'none',
			visible: false,
			offset: {x: 19, y: -14}
		},{
			id: 'walkDownRight',
			data: walkAnimations.downRight,
			scale: flipsc,
			rotate: 'none',
			visible: false,
			offset: {x: 6, y: 0}
		}, {
			id: 'attackDownRight',
			data: attackAnimations.downRight,
			scale: flipsc,
			rotate: 'none',
			visible: false,
			offset: {x: 16, y: 1}
		},{
			id: 'walkDownLeft',
			data: walkAnimations.downLeft,
			scale: sc,
			rotate: 'none',
			visible: false,
			visible: false,
			offset: {x: -5, y: 0}
		}, {
			id: 'attackDownLeft',
			data: attackAnimations.downLeft,
			scale: sc,
			rotate: 'none',
			visible: false,
			visible: false,
			offset: {x: -16, y: 1}
		},{
			id: 'shadow',
			data: currentGame.texture('IsoShadow'),
			scale: {x: .75, y: .75},
			visible: false,
			avoidIsoMgr: true,
			rotate: 'none',
			stage: "stageZero",
			offset: {x: 0, y: 26}}];
			
		var fireSound = currentGame.getSound('machinegun.wav', {volume: .002, rate: 3});
	
		return UC({
				objToUse: gunner,
				renderChildren: rc,
				radius: radius,
				unit: {
					unitType: 'Gunner',
					health: 45,
					energy: 45,
					team: options.team || 4
				}, 
				moveable: {
					moveSpeed: 2.65,
					walkAnimations: walkAnimations,
				}, attacker: {
					attackAnimations: attackAnimations,
					cooldown: 1000,
					range: 175,
					damage: 18,
					attack: function(target) {
						target.sufferAttack(this.damage);
						fireSound.play();
					},
				}
		});
	}
})














