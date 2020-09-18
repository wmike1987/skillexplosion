var zone = function(x, y, width, height, xBuffer, yBuffer) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.xBuffer = xBuffer;
	this.yBuffer = yBuffer;
	this.lastLocation = {};
	this.giveMeLocation = function() {
		var x = (Math.random() * (this.width-2*this.xBuffer)) + this.xBuffer + this.x;
		var y = (Math.random() * (this.height-2*this.yBuffer)) + this.yBuffer + this.y;
		this.lastLocation = {x: x, y: y};
		return {x: x, y: y};
	};
}

export default zone;
