define(['jquery', 'pixi', 'unitcore/UnitConstructor', 'utils/GameUtils'], function($, PIXI, UC, utils) {

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
		            stage: "stageNTwo",
		            offset: {x: 0, y: 22}
				}, {
    			    id: 'selected',
    			    data: 'MarbleSelected',
    			    scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
    			    tint: selectionTint,
    			    stage: 'stageNOne',
    			    visible: false,
    			    rotate: 'none'
    			}, {
    			    id: 'selectionPending',
    			    data: 'MarbleSelectedPending',
    			    scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
    			    stage: 'stageNOne',
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
				damage: 10,
				attack: function() {

				}
		}});

		//create attack blast radius
		var blastRadius = radius*4;

		baneling.attack = function(target) {
			var deathAnimation = utils.getAnimationB({
				spritesheetName: 'bloodswipes1',
				animationName: 'banedeath',
				speed: 2,
				transform: [this.position.x, this.position.y, 1.5, 1.5]
			});

			deathAnimation.rotation = Math.random() * Math.PI;
			deathAnimation.play();
			utils.addSomethingToRenderer(deathAnimation, 'stageOne');
			var nextLevelGo = false;

			var bodiesToDamage = [];
			utils.applyToUnitsByTeam(function(team) {return baneling.team != team}, function(unit) {
				return (utils.distanceBetweenBodies(this.body, unit.body) <= blastRadius && unit.isAttackable);
			}.bind(this), function(unit) {
				unit.sufferAttack(baneling.damage);
			});
			this.alreadyAttacked = true;
			if(!this.alreadyDied)
				this.sufferAttack(10000);
		};

		baneling.death = function() {
			if(this.alreadyDied) return;
			var shard = utils.addSomethingToRenderer('glassShards', 'stageNOne', {position: baneling.position, scale: {x: .65, y: .65}, tint: tint, rotation: Math.random()*6});
				currentGame.addTimer({name: 'shardDisappear' + baneling.unitId, persists: true, timeLimit: 48, runs: 20, killsSelf: true, callback: function() {
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
