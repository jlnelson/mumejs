var util = require('util');
var Stream = require('stream').Transform;
util.inherits(ActionStream, Transform);

function ActionStream() {
    Transform.call(this, options);
}

ActionStream.prototype._transform = function(chunk, encoding, done) {
    this.push(chunk);
    done();
}

module.exports = new ActionStream();
