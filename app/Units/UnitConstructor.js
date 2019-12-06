define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker', 'units/IsoSpriteManager'], 

	function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Iso) {

		//default unit attributes
		var _UnitBase = {
			isUnit: true,
			isoManaged: true,
			maxHealth: 20,
			currentHealth: 20,
			maxEnergy: 0,
			currentEnergy: 0,
			isSelectable: true,
			isAttackable: true,
			team: 4,
			sufferAttack: function(damage) {
				this.currentHealth -= damage;
				if(this.currentHealth <= 0) {
					this.death();
				}
				Matter.Events.trigger(this, 'sufferedAttack', damage);
			},
			
			initUnit: function() {
				
				Matter.Events.on(this, 'addUnit', function() {
					
					//start unit as idling upon add
					if(this.isoManaged)
						this.isoManager.idle();
					
					//establish the height of the unit
					if(this.heightAnimation)
						this.unitHeight = this.renderlings[this.heightAnimation].height;
					else
						this.unitHeight = this.body.circleRadius*2;
					
					//create health bar
					var backgroundScaleX = 2.5;
					var barScaleXMultiplier = .96;
					if(this.health && this.isAttackable) {
						this.renderChildren.push({
							id: 'healthbarbackground',
							data: 'HealthEnergyBackground',
							scale: {x: backgroundScaleX, y: .3},
							offset: {x: -32*backgroundScaleX/2, y: -this.unitHeight/2-13},
							anchor: {x: 0, y: .5},
							stage: 'foreground',
							rotate: 'none',
							tint: 0x000000,
							avoidIsoMgr: true
						}, {
							id: 'healthbar',
							data: 'HealthEnergyBackground',
							scale: {x: backgroundScaleX*barScaleXMultiplier, y: .2},
							offset: {x: -32*backgroundScaleX/2 + 32*backgroundScaleX*(1-barScaleXMultiplier)/2, y: -this.unitHeight/2-13},
							anchor: {x: 0, y: .5},
							stage: 'foreground',
							rotate: 'none',
							avoidIsoMgr: true,
							tint: 0x99CC00
						});
						
						var updateHealthTick = currentGame.addTickCallback(function() {
							if(this.renderlings['healthbar']) {
								this.renderlings['healthbar'].scale = {x: backgroundScaleX*barScaleXMultiplier * (this.currentHealth/this.maxHealth), y: .2};
							}
						}.bind(this))
						
						currentGame.deathPact(this, updateHealthTick);
						
					}
					}.bind(this));
					
								
					//create energy bar
					if(this.energy) {
						
				}
			}
		}
			
		/*
		 *	This function creates a physics body and extends the basic unit functionality, moveable (optional), and attacking (optional) behavior and returns the body
		 *
		 * options contains:
		 * unit {}
		 * moveable {}
		 * attacker {}
		 */
		function UnitConstructor(options) {
			
			var newUnit = $.extend({}, _UnitBase, options.unit);
			
			// setup health and energy
			if(this.health) {
				this.maxHealth = this.health;
				this.currentHealth = this.health;
			}
			
			if(this.energy) {
				this.maxEnergy = this.energy;
				this.currentEnergy = this.energy;
			}
			
			// create body
			var body = Matter.Bodies.circle(0, 0, options.radius, { restitution: .95, frictionAir: 1});
			body.unit = newUnit; //reference to parent
			newUnit.body = body; //reference to body
			
			/* 
			 * We cycle through matter bodies rather than units in many places (PixiRenderer mainly), 
			 * so let's setup getters on a couple things to reference back to the unit so that we can effectively
			 * access these from the body.
			 */
			Object.defineProperty(body, 'isSelectable', {get: function() {return this.unit.isSelectable;}});
			Object.defineProperty(body, 'isAttacker', {get: function() {return this.unit.isAttacker;}});
			Object.defineProperty(body, 'isAttackable', {get: function() {return this.unit.isAttacker;}});
			Object.defineProperty(body, 'isMoveable', {get: function() {return this.unit.isMoveable;}});
			Object.defineProperty(body, 'isMoving', {get: function() {return this.unit.isMoving;}});
			Object.defineProperty(body, 'renderlings', {get: function() {return this.unit.renderlings;}, set: function(v) {this.unit.renderlings = v}});
			Object.defineProperty(body, 'renderChildren', {get: function() {return this.unit.renderChildren;}});
			Object.defineProperty(body, 'destination', {get: function() {return this.unit.destination;}});
			Object.defineProperty(body, 'isSoloMover', {set: function(v) {this.unit.isSoloMover = v;}});
			Object.defineProperty(body, 'team', {get: function() {return this.unit.team;}});
			Object.defineProperty(newUnit, 'position', {get: function() {return this.body.position;}});
			Object.defineProperty(newUnit, 'id', {get: function() {return this.body.id;}});
			
			if(options.renderChildren)
				newUnit.renderChildren = options.renderChildren;
			
			// mixin moveable and its given properties
			if(options.moveable) {
				$.extend(newUnit, Moveable);
				$.extend(newUnit, options.moveable);
				newUnit.moveableInit();
			}
			
			// mixin attacker and its given properties
			if(options.attacker) {
				$.extend(newUnit, Attacker);
				$.extend(newUnit, options.attacker);
				newUnit._initAttacker();
			}
			
			// associate an iso manager if desired
			if(newUnit.isoManaged) {
				newUnit.isoManager = new Iso({unit: newUnit});
			}
			
			//initialize any starting behavior
			newUnit.initUnit();
			
			return newUnit;
		}

		return UnitConstructor;
	}
)














