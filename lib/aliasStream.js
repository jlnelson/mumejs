var util = require('util'),
    Transform = require('stream').Transform;

util.inherits(AliasStream, Transform);

function AliasStream() {
    Transform.call(this);
}

AliasStream.prototype._transform = function(chunk, encoding, done) {
    this.push(chunk);
    done();
}

module.exports = new AliasStream();
