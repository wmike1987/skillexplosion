define(['utils/Heap'], function(Heap) {

    // A Tile is represented by its leftmost and topmost sides.
    function Tile(i, j, sideLen, walkable) {
        // Make 'new' operator optional
        if (!(this instanceof Tile)) {
            return new Tile(i, j, sideLen, walkable);
        }

        this.x = j * sideLen;
        this.y = i * sideLen;
        this.sideLen = sideLen;
        this.walkable = (walkable === undefined) ? true : walkable;
    }

    // Return the position at the center of a Tile.
    Tile.prototype.center = function() {
        return {x: this.x + this.sideLen / 2, y: this.y + this.sideLen / 2};
    };

    // A Grid represents the layout of Tiles. Pass in width and height of the game
    // map, and optionally a 2d grid of booleans to signify walkable tiles.
    function Grid(width, height, sideLen, grid) {
        // Make 'new' operator optional
        if (!(this instanceof Grid)) {
            return new Grid(width, height, sideLen, grid);
        }

        this.width = width;
        this.height = height;
        this.sideLen = sideLen;
        this.tiles = [];

        for (var i = 0; i < this.height / this.sideLen; ++i) {
            this.tiles[i] = [];
            for (var j = 0; j < this.width / this.sideLen; ++j) {
                this.tiles[i][j] = new Tile(i, j, this.sideLen, grid ? grid[i][j] : null);
            }
        }
    };

    // Return tile at the given position if it's on the grid.
    Grid.prototype.tileAt = function(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        var i = Math.floor(y / this.sideLen), j = Math.floor(x / this.sideLen);
        return this.tiles[i][j];
    }

    // Return a list of tile's neighbors.
    Grid.prototype.neighbors = function(tile, allowDiagonal) {
        var neighbors = [];
        var x = tile.x, y = tile.y, sideLen = this.sideLen;
        var up, left, right, down;

        up = this.tileAt(x, y - sideLen);
        if (up && up.walkable) {
            neighbors.push(up);
        }

        left = this.tileAt(x - sideLen, y);
        if (left && left.walkable) {
            neighbors.push(left);
        }

        right = this.tileAt(x + sideLen, y);
        if (right && right.walkable) {
            neighbors.push(right);
        }

        down = this.tileAt(x, y + sideLen);
        if (down && down.walkable) {
            neighbors.push(down);
        }

        if (allowDiagonal) {
            var upLeft, upRight, downLeft, downRight;

            upLeft = this.tileAt(x - sideLen, y - sideLen);
            if (upLeft && upLeft.walkable) {
                neighbors.push(upLeft);
            }

            upRight = this.tileAt(x + sideLen, y - sideLen);
            if (upRight && upRight.walkable) {
                neighbors.push(upRight);
            }

            downLeft = this.tileAt(x - sideLen, y + sideLen);
            if (downLeft && downLeft.walkable) {
                neighbors.push(downLeft);
            }

            downRight = this.tileAt(x + sideLen, y + sideLen);
            if (downRight && downRight.walkable) {
                neighbors.push(downRight);
            }
        }

        return neighbors;
    };

    // Return a deep copy of a Grid.
    Grid.prototype.clone = function() {
        // Create a new grid.
        var grid = new Grid(this.width, this.height, this.sideLen);

        // Copy walkable data into tiles.
        for (var i = 0; i < this.height / this.sideLen; ++i) {
            for (var j = 0; j < this.width / this.sideLen; ++j) {
                grid.tiles[i][j].walkable = this.tiles[i][j].walkable;
            }
        }

        return grid;
    };

    // Add an obstacle to grid by marking all tiles it occupies as unwalkable.
    // Obstacle is an array of tile coordinates of the form [{x, y}, ...].
    Grid.prototype.addObstacle = function(obstacle) {
        for (var i = 0; i < obstacle.length; ++i) {
            this.tiles[obstacle[i].y][obstacle[i].x].walkable = false;
        }
    };

    // AStar path finding algorithm.
    // Options are allowDiagonal, weight, and heuristic.
    // FIXME: Setting allowDiagonal to true breaks the algorithm.
    var AStar = function(options) {
        // Make 'new' operator optional.
        if (!(this instanceof AStar)) {
            return new AStar(options);
        }

        options = options || {};
        this.allowDiagonal = (options.allowDiagonal === undefined)
            ? false : options.allowDiagonal;

        // Adjusting the weight can tune the speed of the algorithm.
        // See http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
        this.weight = (options.weight === undefined) ? 1 : options.weight;

        // Possible values for options.heuristic are 'manhattan', 'octile', and 'euclidean'.
        switch (options.heuristic) {
        case "manhattan":
            this.heuristic = this.manhattanDistance;
            break;
        case "octile":
            this.heuristic = this.octileDistance;
            break;
        case "euclidean":
            this.heuristic = this.euclideanDistance;
            break;
        default:
            this.heuristic = this.allowDiagonal ? this.octileDistance : this.manhattanDistance;
            break;
        };

        // Manhattan distance should only be used if diagonal moves are prohibited.
        if (this.allowDiagonal && this.heuristic == this.manhattanDistance) {
            console.warn("WARNING: heuristic 'manhattan' should only be used when diagonal moves are prohibited.");
        }
    };

    // Return a list of tiles that correspond to the shortest possible path. Does not include the starting tile.
    AStar.prototype.findPath = function(startX, startY, endX, endY, grid) {
        var openList = new Heap(function(tileA, tileB) {
            return tileA.f - tileB.f;
        });
        var start = grid.tileAt(startX, startY);
        var destination = grid.tileAt(endX, endY);
        var current, neighbors, neighbor, newScore;

        // Score the start node.
        start.g = 0;
        start.f = 0;

        // Add current tile to open list
        openList.push(start);
        start.opened = true;

        while (!openList.empty()) {
            // Get tile with lowest score and close it.
            current = openList.pop();
            current.closed = true;

            // If the current tile is the destination, stop.
            if (current === destination) {
                return this.constructPath(destination);
            }

            // Get all neighboring tiles.
            neighbors = grid.neighbors(current, this.allowDiagonal);

            // Evaluate neighboring tiles.
            for (var i = 0; i < neighbors.length; ++i) {
                neighbor = neighbors[i];

                // If neighbor is closed, ignore it.
                if (neighbor.closed) {
                    continue;
                }

                // Diagonal moves cost a a little bit more than lateral moves.
                newScore = current.g +
                    (neighbor.x - current.x === 0 || neighbor.y - current.y === 0) ? 1 : Math.SQRT2;

                if (!neighbor.opened || newScore < neighbor.g) {
                    neighbor.g = newScore;
                    neighbor.h = (neighbor.h === undefined) ?
                        this.weight * this.heuristic(neighbor, destination) : neighbor.h;
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.cameFrom = current;

                    if (!neighbor.opened) {
                        openList.push(neighbor);
                        neighbor.opened = true;
                    } else {
                        // The neighbor can be reached by a better path.
                        openList.update(neighbor);
                    }
                }
            }
        }

        // Unable to construct a path.
        return [];
    };

    // Construct a path from tile's cameFrom property.
    AStar.prototype.constructPath = function(tile) {
        var cur = tile, path = [];

        // Follow each tile's cameFrom property until the first tile is found.
        while (cur.cameFrom) {
            path.push(cur);
            cur = cur.cameFrom;
        }

        // The resulting list starts with the destination, so reverse it here.
        path.reverse();

        return path;
    };

    AStar.prototype.manhattanDistance = function(start, destination) {
        var dx = Math.abs(start.x - destination.x);
        var dy = Math.abs(start.y - destination.y);
        return dx + dy;
    };

    AStar.prototype.octileDistance = function(start, destination) {
        var F = Math.SQRT2 - 1;
        var dx = Math.abs(start.x - destination.x);
        var dy = Math.abs(start.y - destination.y);
        return (dx < dy) ? F * dx + dy : F * dy + dx;
    };

    AStar.prototype.euclideanDistance = function(start, destination) {
        var dx = Math.abs(start.x - destination.x);
        var dy = Math.abs(start.y - destination.y);
        return Math.sqrt(dx * dx + dy * dy);
    };

    return {
        Tile: Tile,
        Grid: Grid,
        AStar: AStar,
    };
});
