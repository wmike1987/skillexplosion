define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker', 'units/IsoSpriteManager'], 
function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Iso) {
    
	/*
	 *	This function creates a physics body and extends the basic unit functionality, moveable (optional), and attacking (optional) behavior and returns the body
	 */
	
	var _UnitBase = {
		isUnit: true,
		isoManaged: true,
		health: 20,
		energy: 0,
		isSelectable: true,
		isAttackable: true,
		team: 4,
		sufferAttack: function(damage) {
			this.health -= damage;
			if(this.health <= 0) {
				this.death();
			}
		},
	}
	
	/*
	 * options contains:
	 * unit {}
	 * moveable {}
	 * attacker {}
	 */
	function UnitConstructor(options) {
		
		var newUnit = $.extend(options.objToUse || {}, _UnitBase, options.unit);
		
		//create body
		var body = Matter.Bodies.circle(0, 0, options.radius, { restitution: .95, frictionAir: 1});
		body.unit = newUnit; //reference to parent
		newUnit.body = body; //reference to body
		
		//we cycle through matter bodies rather than units, so lets setup getters on a couple things to reference back to the unit
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
		
		if(options.moveable) {
			$.extend(newUnit, Moveable);
			$.extend(newUnit, options.moveable);
			newUnit.moveableInit();
		}
		
		if(options.attacker) {
			$.extend(newUnit, Attacker);
			$.extend(newUnit, options.attacker);
			newUnit._initAttacker();
		}
		
		if(newUnit.isoManaged) {
			newUnit.isoManager = new Iso({unit: newUnit});
		}
		
		return newUnit;
	}

    return UnitConstructor;
})














