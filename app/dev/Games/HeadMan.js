define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'utils/TargetSpawnZone'], function($, Matter, PIXI, CommonGameMixin, zone) {
	
	var targetScore = 1;
	
	var numberStyle = new PIXI.TextStyle({
        fill: "#49c59f",
        fillGradientType: 1,
        fontFamily: "Times New Roman",
        fontSize: 55,
        fontVariant: "small-caps",
        lineJoin: "bevel"
    });
	
	var game = {
		gameName: 'HeadMan',
		ball: null,
		showSubLevel: true,
		victoryCondition: {type: 'lives', limit: 3},
		bulletSpeed: 7,
		
		initExtension: function() {

		},
		
		play: function(options) {
		    //create player
		    this.player = Matter.Bodies.rectangle(100, 0, 25, 50, { restitution: 0, friction: 0, frictionAir: 0});
		    this.player.collisionFilter.group = 1;
		    this.player.collisionFilter.category = 0x0001;
		    this.player.hasJump = false;
		    this.addBody(this.player);
		    this.bullets = [];
		    
		    //fire, ice, earth
		    this.currentHead = 'fire';
		    
		    //do stuff every tick
			this.addTickCallback(function() {
			    Matter.Body.setAngle(this.player, 0);
			    Matter.Body.setAngularVelocity(this.player, 0);
			    Matter.Body.setVelocity(this.player, {x: this.player.xVelocity || 0, y: this.player.velocity.y});
			    this.bullets = $.grep(this.bullets, function(bullet, i) {
			        if(this.bodyRanOffStage(bullet)) {
			            this.removeBody(bullet);
			            return false;
			        }
		            Matter.Body.setPosition(bullet, {x: bullet.position.x, y: bullet.originalPosition});
			        Matter.Body.setVelocity(bullet, {x: bullet.originalVelocity.x, y: bullet.originalVelocity.y});
		            return true;
			    }.bind(this))
			}.bind(this), false, 'afterUpdate');
		    
		    //create platforms
		    var ground1 = Matter.Bodies.rectangle(this.canvas.width/2-200, 500, 300, 15, { isStatic: true})
	        ground1.renderChildren = [{
    			    id: 'bullet',
    			    data: this.texture('BlueTransparency'),
    			    scale: {x: 300, y: 15},
    			}]
		    ground1.ground = true;
		    
		    var ground2 = Matter.Bodies.rectangle(this.canvas.width/2, 400, 400, 15, { isStatic: true})
	        ground2.renderChildren = [{
    			    id: 'bullet',
    			    data: this.texture('BlueTransparency'),
    			    scale: {x: 400, y: 15},
    			}]
		    ground2.ground = true;
		    
		    var ground3 = Matter.Bodies.rectangle(this.canvas.width/2-100, 300, 300, 15, { isStatic: true})
	        ground3.renderChildren = [{
    			    id: 'bullet',
    			    data: this.texture('BlueTransparency'),
    			    scale: {x: 300, y: 15},
    			}]
		    ground3.ground = true;
		    
		    var ground4 = Matter.Bodies.rectangle(this.canvas.width/2+100, 200, 250, 15, { isStatic: true})
	        ground4.renderChildren = [{
    			    id: 'bullet',
    			    data: this.texture('BlueTransparency'),
    			    scale: {x: 250, y: 15},
    			}]
		    ground4.ground = true;
		  //  var ground5 = Matter.Bodies.rectangle(this.canvas.width/2-200, 500, this.canvas.width, 20, { isStatic: true})
		  //  ground5.ground = true;
		    
		    this.addBodies([ground1, ground2, ground3, ground4]);
		    
		    //create jump collision listener
		    Matter.Events.on(this.player, 'onCollideActive', function(pair) {
			        var otherBody = pair.pair.bodyA == this.player ? pair.pair.bodyB : pair.pair.bodyA;
			        if(otherBody.ground && this.player.bounds.max.y <= otherBody.bounds.min.y+1) {
			            this.player.hasJump = true;
			        }
			    }.bind(this));
			    
		    //create jump collision listener
		    Matter.Events.on(this.player, 'onCollideEnd', function(pair) {
			        var otherBody = pair.pair.bodyA == this.player ? pair.pair.bodyB : pair.pair.bodyA;
			        if(otherBody.ground) {
			            this.player.hasJump = false;
			        }
		    }.bind(this));
		    
		    //create key listeners
		    $('body').on('keypress.headman', function( event ) {
		        
		        //left and right
		        var currentXVel = this.player.velocity.x;
		        var currentYVel = this.player.velocity.y;
		        this[event.key + 'Down'] = true;
		        if(event.key == 'd') {
		            this.player.facing = 'right';
		            this.player.movingRight = true;
		            this.player.xVelocity = 3;
		        } else if (event.key == 'a') {
		            this.player.facing = 'left';
		            this.player.movingLeft = true;
		            this.player.xVelocity = -3;
		        }
		        
		        //jump
		        if((event.key == "w" || event.key == " ") && this.player.hasJump) {
		            Matter.Body.setVelocity(this.player, {x: currentXVel, y: -11});
		            this.player.hasJump = false;
		        }
		        
		    }.bind(this))
		    
		    $('body').on('keyup.headman', function( event ) {
		        var currentXVel = this.player.velocity.x;
		        var currentYVel = this.player.velocity.y;
		        this[event.key + 'Down'] = false;
		        if(event.key == 'a') {
		            this.player.movingLeft = false;
		            if(this.player.movingRight) {
		                this.player.facing = 'right';
		                this.player.xVelocity = 3;
		            } else {
		                this.player.facing = 'left';
		                this.player.xVelocity = 0;
		            }
		        }
		        if(event.key == 'd') {
		            this.player.movingRight = false;
		            if(this.player.movingLeft) {
		                this.player.facing = 'left';
		                this.player.xVelocity = -3;
		            } else {
		                this.player.facing = 'right';
		                this.player.xVelocity = 0;
		            }
		        }
		        if(event.key == "w" || event.key == " ") {
		            if(currentYVel < 0)
		                Matter.Body.setVelocity(this.player, {x: currentXVel, y: 0});
		        }
		    }.bind(this))
		    
		    
		    //left click listener
		    $('body').on('mousedown.headman', function( event ) {
		        this.spawnBullet();
		    }.bind(this))
		    
		    //right click listener
		    $('body').on('rightdown.headman', function( event ) {
		        this.spawnBullet();
		    }.bind(this))
		    
		    $(window).blur(function(){
		            this.player.xVelocity = 0;
                this.aDown = false;
                this.dDown = false;
            }.bind(this));
		},
		
		endGameExtension: function() {
		},
		
		spawnBullet: function() {
		    if(this.currentHead == 'fire') {
		        var bullet = Matter.Bodies.rectangle(this.player.position.x, this.player.position.y, 5, 2, { restitution: 0, friction: 0, frictionAir: 0});
		        bullet.renderChildren = [{
    			    id: 'bullet',
    			    data: this.texture('GlassMarble'),
    			    scale: {x: .2, y: .2},
    			}]
		        bullet.originalPosition = this.player.position.y;
		        bullet.collisionFilter.group = 2;
		        bullet.collisionFilter.category = 0x0002;
                bullet.collisionFilter.mask = 0x0000;
		        Matter.Body.setMass(bullet, 0.0000000000001);
		        this.addBody(bullet);
		        this.bullets.push(bullet);
		        
		        if(this.player.facing == 'left') {
		            Matter.Body.setVelocity(bullet, {x: -this.bulletSpeed, y: 0})
		            bullet.originalVelocity = {x: -this.bulletSpeed, y: 0};
		        } else {
		            Matter.Body.setVelocity(bullet, {x: this.bulletSpeed, y: 0})
		            bullet.originalVelocity = {x: this.bulletSpeed, y: 0};
		        }
		    }
		}
	}
	
	/*
	 * Options to for the game starter
	 */ 
	game.worldOptions = {
			background: {image: 'Cork', scale: {x: 1.334, y: 1.334}},
		        width: 800, 
		        height: 600, 
		        gravity: 1.8,
		       };
	
	return $.extend({}, CommonGameMixin, game);
})














