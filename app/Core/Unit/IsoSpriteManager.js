import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Moveable from '@core/Unit/_Moveable.js'
import Attacker from '@core/Unit/_Attacker.js'
import {globals} from '@core/Fundamental/GlobalState.js'

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
				isoManager.currentAnimation.alpha = mathArrayUtils.isFalseNotZero(value) ? 1 : value;
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
			if(this.currentMoveAnimation != this.unit.walkAnimations[event.direction]) {
				if(this.currentMoveAnimation)
					this.currentMoveAnimation.stop();
				this.switchAnimation(this.unit.walkAnimations[event.direction]);
				this.currentDirection = event.direction;
				this.currentMoveAnimation = this.unit.walkAnimations[event.direction];
			}
		}.bind(this))

		//turn on idle
		Matter.Events.on(this.unit, 'stop', function() {
			if(this.currentMoveAnimation)
				this.currentMoveAnimation.stop();
			this.stopCurrentAnimation();
			this.currentMoveAnimation = null;
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

	this.playSpecifiedAnimation = function(animationName, direction, options) {
		if(!this.unit[animationName+'Animations']) return;
		var playAnimation = false;
		if(options.movePrecedence && this.currentDirection == direction && this.unit.isMoving) {
			playAnimation = true;
		}

		if(!this.unit.isMoving) {
			playAnimation = true;
		}

		if(options.force) {
			playAnimation = true;
		}

		if(playAnimation) {
			this.switchAnimation(this.unit[animationName+'Animations'][direction])
			this.currentDirection = direction;
		}
	}

	this.stopCurrentAnimation = function() {
		if(this.currentAnimation)
			this.currentAnimation.stop();
		this.currentAnimation = null;
		if(!this.idleTimer)
			this.idle();
	}

	this.switchAnimation = function(animation, options) {
		options = options || {};

		//if we're no longer idling, kill idler
		if(!options.idle) {
			globals.currentGame.invalidateTimer(this.idleTimer);
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
		animation.visible = true; //this triggers the spine obj to become visible too

		if(options.stop) {
			animation.stop();
		} else {
			animation.play();
		}

		//ensure the current animation has the current iso properties
		animation.alpha = mathArrayUtils.isFalseNotZero(this.unit.isoManagedAlpha) ? 1 : this.unit.isoManagedAlpha;
		animation.tint = this.unit.isoManagedTint || 0xFFFFFF;
	}

	this.idle = function() {
		if(this.unit.noIdle) return;

		var self = this;
		var index = mathArrayUtils.getRandomIntInclusive(0, Object.keys(self.unit.walkAnimations).length-1)
		var randomAnimation = self.unit.walkAnimations[Object.keys(self.unit.walkAnimations)[index]];
		self.switchAnimation(randomAnimation, {stop: true});

		randomAnimation.spine.state.clearTrack(0);
        randomAnimation.spine.lastTime = null;
        randomAnimation.spine.skeleton.setToSetupPose()

		this.idleTimer = globals.currentGame.addTimer({name: 'idleTimer' + this.unit.unitId, gogogo: true, timeLimit: 2000, callback: function() {
			this.timeLimit = 2000 + Math.random() * 2000;
			if(self.unit.idleCancel) {
				return;
			}
			var index = mathArrayUtils.getRandomIntInclusive(0, Object.keys(self.unit.walkAnimations).length-1)
			self.switchAnimation(self.unit.walkAnimations[Object.keys(self.unit.walkAnimations)[index]], {stop: true, idle: true});
		}})
		gameUtils.deathPact(this.unit, this.idleTimer, this.idleTimer.name);
	}
}

export default IsoSpriteManager;
