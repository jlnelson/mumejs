var util = require('util');
var Stream = require('stream').Transform;
util.inherits(AliasStream, Transform);

function AliasStream() {
    Transform.call(this, options);
}

AliasStream.prototype._transform = function(chunk, encoding, done) {
    this.push(chunk);
    done();
}

module.exports = new AliasStream();
