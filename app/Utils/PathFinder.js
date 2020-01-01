define(['utils/Heap'], function(Heap) {

    function Tile(y, x, walkable) {
        // Make 'new' operator optional
        if (!(this instanceof Tile)) {
            return new Tile(x, y);
        }

        this.y = y
        this.x = x
        this.walkable = walkable || true;
    }

    // Determine whether a neighboring tile is at a diagonal to this tile.
    // NOTE: neighbor must be a neighboring tile for this to work.
    Tile.prototype.isDiagonalTo = function(neighbor) {
        return this.x != neighbor.x && this.y != neighbor.y;
    };

    // Return a Grid of width * height tiles.
    // TODO: pass in an array of booleans for a grid of walkable/unwalkable tiles.
    function Grid(width, height) {
        // Make 'new' operator optional
        if (!(this instanceof Grid)) {
            return new Grid(options);
        }

        this.width = width;
        this.height = height;

        this.tiles = [];

        for (var y = 0; y < this.height; ++y) {
            this.tiles[y] = [];
            for (var x = 0; x < this.width; ++x) {
                this.tiles[y][x] = new Tile(y, x);
            }
        }
    };

    // Return tile at indices x and y, or null if off grid.
    Grid.prototype.tileAt = function(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y][x];
    }

    // Return a list of tile's neighbors.
    Grid.prototype.neighbors = function(tile, allowDiagonal) {
        var neighbors = [];
        var x = tile.x, y = tile.y;
        var up, left, right, down;

        up = this.tileAt(x, y - 1);
        if (up && up.walkable) {
            neighbors.push(up);
        }

        left = this.tileAt(x - 1, y);
        if (left && left.walkable) {
            neighbors.push(left);
        }

        right = this.tileAt(x + 1, y);
        if (right && right.walkable) {
            neighbors.push(right);
        }

        down = this.tileAt(x, y + 1);
        if (down && down.walkable) {
            neighbors.push(down);
        }

        if (allowDiagonal) {
            var upLeft, upRight, downLeft, downRight;

            upLeft = this.tileAt(x - 1, y - 1);
            if (upLeft && upLeft.walkable) {
                neighbors.push(upLeft);
            }

            upRight = this.tileAt(x + 1, y - 1);
            if (upRight && upRight.walkable) {
                neighbors.push(upRight);
            }

            downLeft = this.tileAt(x - 1, y + 1);
            if (downLeft && downLeft.walkable) {
                neighbors.push(downLeft);
            }

            downRight = this.tileAt(x + 1, y + 1);
            if (downRight && downRight.walkable) {
                neighbors.push(downRight);
            }
        }

        return neighbors;
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
    var AStar = function(options) {
        // Make 'new' operator optional.
        if (!(this instanceof AStar)) {
            return new AStar(options);
        }

        options = options || {};
        this.allowDiagonal = options.allowDiagonal || false;

        // Adjusting the weight can tune the speed of the algorithm.
        // See http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
        this.weight = options.weight || 1;

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
                newScore = current.g + (neighbor.isDiagonalTo(current)) ? Math.SQRT2 : 1;

                if (!neighbor.opened || newScore < neighbor.g) {
                    neighbor.g = newScore;
                    neighbor.h = neighbor.h || this.weight * this.heuristic(neighbor, destination);
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

    AStar.prototype.constructPath = function(tile) {
        var cur = tile, path = [];

        while (cur) {
            path.push(cur);
            cur = cur.cameFrom;
        }

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
