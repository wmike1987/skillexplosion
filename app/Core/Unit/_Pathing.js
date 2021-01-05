import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Command from '@core/Unit/Command.js'
import {globals} from '@core/Fundamental/GlobalState.js'

/*
 * This is for an individual unit
 */
var _unitMixin = {
    initPathing: function() {

    },
}

/*
 * This is behavior at the game level
 */
var PathingSystem = function(options) {
    this.gridSize = options.gridSize || 20;
    this.grid = [];
    this.unitIsBlockingPredicate = function(unit) {
        return unit.isMoving == true;
    }
    this.init = function() {
        this.playableSize = gameUtils.getPlayableWidth();

        //establish timer
        this.updateTimer = globals.currentGame.addTimer({
            name: 'pathingGridUpdateTimer',
            gogogo: true,
            timeLimit: 32,
            callback: function() {
                this.updateGrid();
            }.bind(this)
        })
    }

    this.updateGrid = function() {
        this.grid = [];
        // var now = performance.now();
        var bodies = Matter.Composite.allBodies(globals.currentGame.engine.world);
        bodies.forEach((body) => {
            if(!body.isCollisionBody) return;
            var unitPosition = body.unit.position;
            var xLoc = Math.floor(unitPosition.x/this.gridSize);
            var yLoc = Math.floor(unitPosition.y/this.gridSize);
            if(!this.grid[xLoc]) {
                this.grid[xLoc] = [];
            }
            if(!this.grid[xLoc][yLoc]) {
                this.grid[xLoc][yLoc] = [];
            }
            this.grid[xLoc][yLoc].push(body);
            // this.display();
        })
        // var after = performance.now();
        // console.info(after-now);
    }

    this.display = function() {


        console.clear();
        var rowStrings = [];
        for(var x = 0; x < gameUtils.getPlayableWidth()/this.gridSize; x++) {
            for(var y = 0; y < gameUtils.getPlayableHeight()/this.gridSize; y++) {
                var empty = '_ ';
                var present = 'X ';
                var chosen = '';
                if(!this.grid[x]) {
                    chosen = empty;
                } else if(!this.grid[x][y]) {
                    chosen = empty;
                } else {
                    chosen = present;
                }
                if(!rowStrings[y]) {
                    rowStrings[y] = y + ': ';
                }
                rowStrings[y] = rowStrings[y] + chosen;
            }
        }

        rowStrings.forEach((row) => {
            console.info(row);
        })
    }
}

export {_unitMixin, PathingSystem};
