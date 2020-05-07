define(['jquery', 'matter-js', 'pixi', 'unitcore/_Moveable', 'unitcore/_Attacker', 'utils/GameUtils'],
function($, Matter, PIXI, Moveable, Attacker, utils) {

	/*
	 * Manager which will handle playing animations at the right time.
	 * Assumes _Moveable and _Attacker
	 */
	function IsoSpriteManager(options) {
		this.unit = options.unit;
		this.currentDirection = null;

		var isoManager = this;
		Object.defineProperty(this.unit, 'isoManagedAlpha', {
			get: function() {
				return this._isoManagedAlpha;
			},
			set: function(value) {
				this._isoManagedAlpha = value;
				if(isoManager.currentAnimation) {
					isoManager.currentAnimation.alpha = value || 1;
				}
			},
			configurable: true
		});

		Object.defineProperty(this.unit, 'isoManagedTint', {
			get: function() {
				return this._isoManagedTint;
			},
			set: function(value) {
				this._isoManagedTint = value;
				if(isoManager.currentAnimation) {
					isoManager.currentAnimation.tint = value || 0xFFFFFF;
				}
			},
			configurable: true
		});

		//attach listeners (using the matter event system)
		if(this.unit.isMoveable) {
			Matter.Events.on(this.unit, 'move', function(event) {
				this.switchAnimation(this.unit.walkAnimations[event.direction]);
				this.currentDirection = event.direction;
			}.bind(this))

			//turn on idle
			Matter.Events.on(this.unit, 'stop', function(event) {
				if(!this.idleTimer)
					this.idle();
			}.bind(this))
		}

		if(this.unit.isAttacker) {
			Matter.Events.on(this.unit, 'attack', function(event) {
				var animation = this.unit.attackAnimations[event.direction];
				this.switchAnimation(this.unit.attackAnimations[event.direction]);
				this.currentDirection = event.direction;
			}.bind(this))
		}

		this.playSpecifiedAnimation = function(animationName, direction) {
			if(this.unit[animationName+'Animations']) {
				this.switchAnimation(this.unit.throwAnimations[direction])
				this.currentDirection = direction;
			} else {
				return;
			}
		}

		this.switchAnimation = function(animation, options) {
			options = options || {};

			//if we're no longer idling, kill idler
			if(!options.idle) {
				currentGame.invalidateTimer(this.idleTimer);
				this.idleTimer = null;
			}

			//turn them all off, except those that intentionally avoid this manager
			$.each(this.unit.renderlings, function(name, renderling){
				if(!renderling.avoidIsoMgr)
					renderling.visible = false;
			}.bind(this));

			//turn one on
			this.currentAnimation = animation;
			animation.isStopped = false;
			animation.visible = true;
			if(options.stop) {
				animation.stop();
			} else {
				animation.play();
			}

			//ensure the current animation has the current iso properties
			animation.alpha = this.unit.isoManagedAlpha || 1;
			animation.tint = this.unit.isoManagedTint || 0xFFFFFF;
		}

		this.idle = function() {
			var self = this;
			var index = utils.getRandomIntInclusive(0, Object.keys(self.unit.walkAnimations).length-1)
			var randomAnimation = self.unit.walkAnimations[Object.keys(self.unit.walkAnimations)[index]];
			self.switchAnimation(randomAnimation, {stop: true});

			randomAnimation.spine.state.clearTrack(0);
            randomAnimation.spine.lastTime = null;
            randomAnimation.spine.skeleton.setToSetupPose()

			this.idleTimer = currentGame.addTimer({name: 'idleTimer' + this.unit.unitId, gogogo: true, timeLimit: 2000, callback: function() {
				this.timeLimit = 2000 + Math.random() * 2000;
				var index = utils.getRandomIntInclusive(0, Object.keys(self.unit.walkAnimations).length-1)
				self.switchAnimation(self.unit.walkAnimations[Object.keys(self.unit.walkAnimations)[index]], {stop: true, idle: true});
			}})
			utils.deathPact(this.unit, this.idleTimer, this.idleTimer.name);
		}
	}

    return IsoSpriteManager;
})
