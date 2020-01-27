define(function() {

    var defaultCompare = function(a, b) {
        return a - b;
    };

    // Creates a new binary heap with fcmp as the comparison function.
    // Fcmp must take two items, a and b, and return a
    //    negative number when a < b.
    //                  0 when a == b.
    //    positive number when a > b.
    var Heap = function(fcmp) {
        if (!(this instanceof Heap)) {
            return new Heap(fcmp);
        }
        this.fcmp = fcmp || defaultCompare;
        this.data = [];
        this.length = 0;
    };

    Heap.prototype.push = function(item) {
        // Add item to the bottom of the heap.
        this.data.push(item);
        this.length++;
        this._siftup(this.length - 1);
    };

    Heap.prototype.pop = function() {
        if (this.empty()) {
            return undefined;
        }

        var top = this.data[0];

        // Get the bottom of the heap.
        var bottom = this.data.pop();
        this.length--;

        // If empty, return the only item left.
        if (this.empty()) {
            return top;
        }

        // Move the bottom to the top and sift down.
        this.data[0] = bottom;
        this._siftdown(0);

        return top;
    }

    // Update an item's place in the heap by removing it and adding it back.
    // Return the updated item or null if it's not contained in the heap.
    // NOTE: This might be inefficient. Check here for performance gains.
    Heap.prototype.update = function(item) {
        var removed = null;

        for (var i = 0; i < this.length; ++i) {
            if (item === this.data[i]) {
                removed = this.data.splice(i, 1)[0];
                --this.length;
            }
        }

        if (removed) {
            this.push(removed);
        }

        return removed;
    };

    Heap.prototype.peek = function() {
        console.log(this.data);
        return this.data[0];
    }

    Heap.prototype.empty = function() {
        return this.length == 0;
    }

    Heap.prototype._siftup = function(pos) {
        while (pos > 0) {
            var current = this.data[pos];

            // Compare the current item with its parent.
            var pi = (pos - 1) >> 1;
            var parent = this.data[pi];

            // If they are in the correct order, stop.
            if (this.fcmp(current, parent) >= 0) {
                break;
            }

            // Swap the element with its parent.
            this.data[pos] = parent;
            this.data[pi] = current;

            pos = pi;
        }
    };

    Heap.prototype._siftdown = function(pos) {
        var halflen = this.length >> 1;
        while (pos < halflen) {
            var current = this.data[pos];

            // Compare the current item with its children.
            var li = (pos << 1) + 1;
            var left = this.data[li];
            var ri = li + 1;
            var right = this.data[ri];

            // If the right child is better than the left, use it instead.
            var bi = li;
            var best = left;
            if (ri < this.length && this.fcmp(right, best) < 0) {
                bi = ri;
                best = right;
            }

            // If they are in the correct order, stop.
            if (this.fcmp(current, best) < 0) {
                break;
            }

            // Swap the element with its child.
            this.data[pos] = best;
            this.data[bi] = current;

            pos = bi;
        }
    };

    return Heap;
});
