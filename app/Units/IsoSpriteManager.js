define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker'], function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker) {

	/*
	 * Manager which will handle playing animations at the right time.
	 * Assumes _Moveable and _Attacker
	 */
	function IsoSpriteManager(options) {
		this.unit = options.unit;
		
		//attach listeners (using the matter event system)
		if(this.unit.isMoveable) {
			Matter.Events.on(this.unit, 'move', function(event) {
				this.playAnimation(this.unit.walkAnimations[event.direction]);
			}.bind(this))
			
			Matter.Events.on(this.unit, 'pause', function(event) {
				if(this.unit.isMoving)
					this.currentAnimation.stop();
			}.bind(this))
			
			Matter.Events.on(this.unit, 'stop', function(event) {
				this.playAnimation(this.unit.walkAnimations.stand);
			}.bind(this))
		}
		
		if(this.unit.isAttacker) {
			Matter.Events.on(this.unit, 'attack', function(event) {
				var animation = this.unit.attackAnimations[event.direction];
				animation.onManyComplete = function() {
					animation.gotoAndStop(0);
					animation.currentPlayCount = animation.playThisManyTimes;
					this.playAnimation(this.unit.walkAnimations.stand);
				}.bind(this);
				this.playAnimation(this.unit.attackAnimations[event.direction]);
			}.bind(this))
		}
		
		this.playAnimation = function(animation) {
			//turn them all off, except those that intentionally avoid this manager
			$.each(this.unit.renderlings, function(name, sprite){
				if(!sprite.avoidIsoMgr)
					sprite.visible = false; 
			}.bind(this));
			
			//turn one on
			this.currentAnimation = animation;
			animation.visible = true;
			animation.play();
		}
	}

    return IsoSpriteManager;
})














