var util = require('util'),
    Transform = require('stream').Transform;

util.inherits(ActionStream, Transform);

function ActionStream() {
    Transform.call(this);
}

ActionStream.prototype._transform = function(chunk, encoding, done) {
    this.push(chunk);
    done();
}

module.exports = new ActionStream();
