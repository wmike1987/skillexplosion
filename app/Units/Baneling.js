define(['jquery', 'pixi', 'units/UnitConstructor', 'utils/GameUtils'], function($, PIXI, UC, utils) {

	return function Baneling(options) {

		var options = options || {};

		var radius = options.radius || 16;
		var tint = options.tint || 0x00FF00;
		var selectionTint = 0x33FF45;
		var pendingSelectionTint = 0x70ff32;
		var highlightTint = 0xFFFFFF;
		var radius = 20;
		var rc = [
			{
    			    id: 'marble',
    			    data: 'GlassMarble',
    			    tint: options.tint || tint,
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
    			    tint: highlightTint,
    			    initialRotate: 'random'
    			}, {
    			    id: 'marbleHighlight',
    			    data: 'MarbleHighlight',
    			    scale: {x: radius*2/64, y: radius*2/64},
    			    rotate: 'none',
    			    initialRotate: 'none'
    			},
				{
		            id: 'shadow',
		            data: 'IsoShadowBlurred',
		            scale: {x: .75, y: .75},
		            visible: true,
		            avoidIsoMgr: true,
		            rotate: 'none',
		            stage: "stageZero",
		            offset: {x: 0, y: 22}
				}, {
    			    id: 'selected',
    			    data: 'MarbleSelected',
    			    scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
    			    tint: selectionTint,
    			    stage: 'stageOne',
    			    visible: false,
    			    rotate: 'none'
    			}, {
    			    id: 'selectionPending',
    			    data: 'MarbleSelectedPending',
    			    scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
    			    stage: 'stageOne',
    			    visible: false,
    			    tint: pendingSelectionTint,
    			    rotate: 'continuous'
    			}];

		var baneling = UC({
				renderChildren: rc,
				mainRenderSprite: 'marble',
				radius: radius,
				unit: {
					unitType: 'Baneling',
					isoManaged: false,
					health: 40,
					energy: 0,
					team: options.team || 4,
					isSelectable: options.isSelectable,
				},
				moveable: {
					moveSpeed: 1.8
				},
				attacker: {
					honeRange: 200,
					cooldown: 1,
					range: radius*2+10,
					damage: 50,
					attack: function() {

					}
		}});

		//create attack blast radius
		var blastRadius = radius*4;

		baneling.attack = function(target) {
			var deathAnim = utils.getAnimationB({
				spritesheetName: 'deathAnimations',
				animationName: 'bane',
				speed: .45,
				transform: [this.position.x, this.position.y, 1.3, 1.3]
			});
			deathAnim.play();
			utils.addSomethingToRenderer(deathAnim);
			var nextLevelGo = false;

			var bodiesToDamage = [];
			currentGame.applyToBodiesByTeam(function(team) {return baneling.team != team}, function(body) {
				return (utils.distanceBetweenBodies(this.body, body) <= blastRadius && body.isAttackable);
			}.bind(this), function(body) {
				body.unit.sufferAttack(baneling.damage);
			});
			this.alreadyAttacked = true;
			if(!this.alreadyDied)
				this.death();
		};

		baneling.death = function() {
			if(this.alreadyDied) return;
			var shard = utils.addSomethingToRenderer('glassShards', 'background', {position: baneling.position, scale: {x: .65, y: .65}, tint: tint, rotation: Math.random()*6});
				currentGame.addTimer({name: 'shardDisappear' + baneling.id, persists: true, timeLimit: 48, runs: 20, killsSelf: true, callback: function() {
					shard.alpha -= .05;
						}, totallyDoneCallback: function() {
							utils.removeSomethingFromRenderer(shard);
			}.bind(this)})

			currentGame.pop.play();
			currentGame.removeUnit(this);
			this.alreadyDied = true;
			if(!this.alreadyAttacked)
				this.attack();
		}

		return baneling;
	}
})
