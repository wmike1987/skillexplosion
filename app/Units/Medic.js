define(['jquery', 'pixi', 'unitcore/UnitConstructor', 'matter-js', 'utils/GameUtils'], function($, PIXI, UC, Matter, utils) {

    return function Medic(options) {
        var options = options || {};

        //animation settings
        var walkSpeed = .9;
        var walkSpeedBonus = .25;
        var shootSpeed = 1;

        var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicN'].spineData);
        var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicS'].spineData);
        var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicW'].spineData);
        var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicW'].spineData);
        var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicSW'].spineData);
        var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicSW'].spineData);
        var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicNW'].spineData);
        var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicNW'].spineData);

        var walkAnimations = {
            up: utils.getSpineAnimation({
                spine: spineNorth,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upRight: utils.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            right: utils.getSpineAnimation({
                spine: spineEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downRight: utils.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            down: utils.getSpineAnimation({
                spine: spineSouth,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downLeft: utils.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            left: utils.getSpineAnimation({
                spine: spineWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upLeft: utils.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
        };

        var attackAnimSpeed = 4;
        var healAnimations = {
            up: utils.getSpineAnimation({
                spine: spineNorth,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
            upRight: utils.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
            right: utils.getSpineAnimation({
                spine: spineEast,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
            downRight: utils.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
            down: utils.getSpineAnimation({
                spine: spineSouth,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
            downLeft: utils.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
            left: utils.getSpineAnimation({
                spine: spineWest,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
            upLeft: utils.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'shoot',
                speed: attackAnimSpeed,
                times: 3,
            }),
        }

        var otherAnimations = {

        }

        var sc = {x: .35, y: .35};
        var adjustedUpDownsc = {x: .38, y: .38};
        var flipsc = {x: -1 * sc.x, y: sc.y};
        var yOffset = 22;
        var rc = [
        {
            id: 'selected',
            data: 'IsometricSelected',
            scale: {x: .8, y: .8},
            stage: 'StageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {x: 0, y: 22},
        },
        {
            id: 'selectionPending',
            data: 'IsometricSelectedPending',
            scale: {x: 1, y: 1},
            stage: 'StageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {x: 0, y: 22},
        },{
            id: 'left',
            data: spineWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset},
        },{
            id: 'right',
            data: spineEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'up',
            data: spineNorth,
            scale: adjustedUpDownsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'down',
            data: spineSouth,
            scale: adjustedUpDownsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'upLeft',
            data: spineNorthWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'upRight',
            data: spineNorthEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'downRight',
            data: spineSouthEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        }, {
            id: 'downLeft',
            data: spineSouthWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },{
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {x: .75, y: .75},
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "StageNTwo",
            offset: {x: 0, y: 22}}];

        var rad = options.radius || 20;
        var healsound = utils.getSound('healsound.wav', {volume: .006, rate: 1.3});
        return UC({
                renderChildren: rc,
                radius: rad,
                hitboxWidth: 28,
                hitboxHeight: 60,
                mass: options.mass || 8,
                mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
                slaves: [healsound],
                unit: {
                    unitType: 'Medic',
                    health: 25,
                    energy: 60,
                    portrait: utils.createDisplayObject('MedicGreenEyes'),
                    wireframe: utils.createDisplayObject('MedicGreenEyes'),
                    team: options.team || 4,
                    name: options.name,
                    heightAnimation: 'up',
                    death: function() {
                        var self = this;
                        var anim = utils.getAnimationB({
                            spritesheetName: 'deathAnimations',
                            animationName: 'bloodsplat',
                            speed: .3,
                            transform: [self.position.x, self.position.y, .3, .3]
                        });
                        utils.addSomethingToRenderer(anim);
                        anim.play();
                        currentGame.removeUnit(this);
                    }
                },
                moveable: {
                    moveSpeed: 2.15,
                    walkAnimations: walkAnimations,
                }, attacker: {
                    attackAnimations: healAnimations,
                    cooldown: 180,
                    honeRange: 300,
                    range: rad*2 + 10,
                    healAmount: 1,
                    attack: function(target) {
                        healsound.play();
                        //play animations
                        // var healBeamAnimation = utils.getAnimationB({
                        //     spritesheetName: 'bloodswipes1',
                        //     animationName: 'healbeam',
                        //     speed: 1,
                        //     transform: [this.position.x, this.position.y, 1, 1]
                        // });
                        // healBeamAnimation.play();
                        //
                        // var gunPosition = {x: 0, y: 0};
                        // $.each(this.renderlings[this.isoManager.currentDirection].stateData.skeletonData.slots, function(i, slot) {
                        //     if(slot.name == 'Gun Glow') {
                        //         gunPosition = Matter.Vector.add(this.position, {x: slot.boneData.x, y: slot.boneData.y});
                        //     }
                        // }.bind(this))
                        // healBeamAnimation.position = gunPosition ;
                        // healBeamAnimation.rotation = utils.pointInDirection(gunPosition, target.position, 'north');
                        // utils.addSomethingToRenderer(healBeamAnimation, 'StageOne');

                        var healAnimation = utils.getAnimationB({
                            spritesheetName: 'bloodswipes1',
                            animationName: 'heal',
                            speed: 1.5,
                            transform: [target.position.x + ((Math.random() * 20) - 10), target.position.y + ((Math.random() * 30) - 10), 1, 1]
                        });

                        healAnimation.alpha = Math.max(.7, Math.random());
                        healAnimation.play();
                        utils.addSomethingToRenderer(healAnimation, 'StageOne');
                        target.currentHealth += this.healAmount;
                        if(target.currentHealth >= target.maxHealth)
                            target.currentHealth = target.maxHealth;
                    },
                    attackHoneTeamPredicate: function(team) {
                        return this.team == team;
                    },
                    canTargetUnit: function(unit) {
                        if(unit.isAttackable && unit != this && unit.team == this.team) {
                            return unit.maxHealth - unit.currentHealth;
                        }
                        return false;
                    },
                },
        });
    }
})
